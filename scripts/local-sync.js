const fs = require("fs");
const os = require("os");
const path = require("path");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const endpoint = args.endpoint || process.env.SYNC_ENDPOINT || "http://127.0.0.1:4317/api/sync";
  const notionToken = args.notionToken || process.env.NOTION_TOKEN;
  const notionDatabaseId = args.notionDatabaseId || process.env.NOTION_DATABASE_ID;
  const notionTitleProperty = args.notionTitleProperty || process.env.NOTION_TITLE_PROPERTY || "Name";

  if (!notionToken || !notionDatabaseId) {
    throw new Error("Missing Notion credentials. Set NOTION_TOKEN and NOTION_DATABASE_ID or pass flags.");
  }

  const shellFile = resolveShellFile(args.shellFile);
  const shellText = readOptionalFile(shellFile);
  const terminalText = readOptionalFile(args.terminalFile);
  const codexText = readOptionalFile(args.codexFile);

  const body = {
    title: args.title || `Local History Sync ${new Date().toISOString().slice(0, 10)}`,
    userLabel: args.userLabel || os.userInfo().username,
    source: args.source || "local-sync-cli",
    summary: args.summary || "Automated local history sync from CLI.",
    shellText,
    terminalText,
    codexText,
    notionToken,
    notionDatabaseId,
    notionTitleProperty,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `Sync failed with HTTP ${response.status}`);
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) {
      continue;
    }

    const key = part.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : "true";
    args[key] = value;
  }

  return args;
}

function resolveShellFile(explicitPath) {
  if (explicitPath) {
    return explicitPath;
  }

  const home = os.homedir();
  const candidates = [
    ".bash_history",
    ".zsh_history",
    ".local/share/fish/fish_history",
  ].map((entry) => path.join(home, entry));

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function readOptionalFile(filePath) {
  if (!filePath) {
    return "";
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  return fs.readFileSync(absolutePath, "utf8");
}

main().catch((error) => {
  process.stderr.write(`${error.message || String(error)}\n`);
  process.exit(1);
});
