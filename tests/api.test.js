const assert = require("assert");

const syncHandler = require("../api/sync.js");
const githubHandler = require("../api/github.js");
const healthHandler = require("../api/health.js");

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return payload;
    },
  };
}

async function testHealth() {
  const res = createRes();
  await healthHandler({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
}

async function testSyncRejectsWrongMethod() {
  const res = createRes();
  await syncHandler({ method: "GET" }, res);
  assert.equal(res.statusCode, 405);
}

async function testSyncRejectsMissingCredentials() {
  const res = createRes();
  await syncHandler({ method: "POST", body: JSON.stringify({ title: "Empty" }) }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Missing Notion credentials/);
}

async function testSyncRejectsEmptyPayload() {
  const res = createRes();
  await syncHandler(
    {
      method: "POST",
      body: JSON.stringify({
        notionToken: "ntn_test",
        notionDatabaseId: "db_test",
        title: "Empty",
      }),
    },
    res
  );
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Nothing to sync/);
}

async function testGithubRejectsMissingToken() {
  const res = createRes();
  await githubHandler({ method: "POST", body: "{}" }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Missing GitHub token/);
}

async function run() {
  await testHealth();
  await testSyncRejectsWrongMethod();
  await testSyncRejectsMissingCredentials();
  await testSyncRejectsEmptyPayload();
  await testGithubRejectsMissingToken();
  console.log("api.test.js passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
