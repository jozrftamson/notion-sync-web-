const outputBox = document.querySelector("#output-box");
const stateIndicator = document.querySelector("#state-indicator");
const commandName = document.querySelector("#command-name");
const form = document.querySelector("#sync-form");
const loadExampleButton = document.querySelector("#load-example");
const clearFormButton = document.querySelector("#clear-form");
const loadGithubButton = document.querySelector("#load-github");

function renderResult(payload) {
  if (payload.url) {
    return `${JSON.stringify(payload, null, 2)}\n\nOpen page: ${payload.url}`;
  }
  return JSON.stringify(payload, null, 2);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  stateIndicator.textContent = "Sending";
  commandName.textContent = "sync";

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
    });

    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error);
    }

    outputBox.textContent = renderResult(payload);
    stateIndicator.textContent = "Done";
  } catch (error) {
    const message = error.message || String(error);
    outputBox.textContent = message;
    stateIndicator.textContent = "Error";
  }
});

loadExampleButton.addEventListener("click", () => {
  form.title.value = `Daily Terminal Report ${new Date().toISOString().slice(0, 10)}`;
  form.userLabel.value = "example-user";
  form.source.value = "Codex CLI + local terminal";
  form.summary.value = "Investigated deployment, updated local sync tooling, and captured shell output.";
  form.codexText.value = "User asked for a Vercel-compatible version. Assistant proposed a serverless intake flow.";
  form.terminalText.value = "$ npm run build\nBuild completed successfully.\n$ git push\nEverything up-to-date.";
  form.shellText.value = "npm run build\ngit status\ngit push";
  form.githubOwner.value = "jozrftamson";
  form.githubRepo.value = "notion-sync";
  outputBox.textContent = "Example data loaded. Add your Notion token and database ID, then submit.";
  stateIndicator.textContent = "Ready";
  commandName.textContent = "example";
});

clearFormButton.addEventListener("click", () => {
  form.reset();
  outputBox.textContent = "Form cleared.";
  stateIndicator.textContent = "Ready";
  commandName.textContent = "idle";
});

loadGithubButton.addEventListener("click", async () => {
  stateIndicator.textContent = "Sending";
  commandName.textContent = "github";

  try {
    const response = await fetch("/api/github", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
    });

    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error);
    }

    outputBox.textContent = renderResult(payload);
    stateIndicator.textContent = "Done";
  } catch (error) {
    const message = error.message || String(error);
    outputBox.textContent = message;
    stateIndicator.textContent = "Error";
  }
});
