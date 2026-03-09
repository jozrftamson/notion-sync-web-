const assert = require("assert");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

async function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "notion-sync-web-local-"));
  const shellFile = path.join(tempDir, "shell.txt");
  const terminalFile = path.join(tempDir, "terminal.log");
  const codexFile = path.join(tempDir, "codex.txt");

  fs.writeFileSync(shellFile, "npm test\n");
  fs.writeFileSync(terminalFile, "build ok\n");
  fs.writeFileSync(codexFile, "assistant: shipped\n");

  let receivedBody = null;
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      receivedBody = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, pageId: "page_local", url: "https://example.com/local" }));
    });
  });

  await new Promise((resolve) => server.listen(45232, "127.0.0.1", resolve));

  try {
    const stdout = await new Promise((resolve, reject) => {
      execFile(
        "node",
        [
          "scripts/local-sync.js",
          "--endpoint",
          "http://127.0.0.1:45232/api/sync",
          "--shellFile",
          shellFile,
          "--terminalFile",
          terminalFile,
          "--codexFile",
          codexFile,
          "--title",
          "Integration Sync",
          "--userLabel",
          "integration-user",
          "--source",
          "local-sync-test",
          "--notionToken",
          "ntn_demo",
          "--notionDatabaseId",
          "db_demo",
        ],
        { cwd: path.join(__dirname, "..") },
        (error, out, err) => {
          if (error) {
            reject(new Error(err || error.message));
            return;
          }
          resolve(out);
        }
      );
    });

    const response = JSON.parse(stdout);
    assert.equal(response.pageId, "page_local");
    assert.equal(receivedBody.title, "Integration Sync");
    assert.equal(receivedBody.userLabel, "integration-user");
    assert.equal(receivedBody.source, "local-sync-test");
    assert.match(receivedBody.shellText, /npm test/);
    assert.match(receivedBody.terminalText, /build ok/);
    assert.match(receivedBody.codexText, /assistant: shipped/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  console.log("local-sync.test.js passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
