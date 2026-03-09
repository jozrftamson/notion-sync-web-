# Terminal Docs to Notion

Terminal Docs to Notion is a Vercel-ready intake app for turning terminal activity, Codex sessions, and shell notes into clean Notion documentation.

It works well for:
- teams that want a shared browser-based intake workflow
- individuals who want a clean Notion page from pasted session notes
- hybrid setups where a local CLI posts into a hosted central API

This repo also includes an optional GitHub API helper endpoint for repository metadata checks.

## Live app

- `https://skill-deploy-4bubl7vj6c.vercel.app`

## Highlights

- Vercel-compatible static UI plus serverless API routes
- direct Notion page creation via `/api/sync`
- optional GitHub metadata lookup via `/api/github`
- secret masking before content is written to Notion
- compatible with the local `notion-sync` CLI remote mode

## How it works

- The browser form collects report title, user label, summary, terminal logs, shell history, and optional Codex text.
- The serverless API at `api/sync.js` sanitizes common secrets and creates a Notion page.
- The serverless API at `api/github.js` uses server-side `GITHUB_TOKEN` and optionally returns repository metadata.
- Users can either:
  - provide their own `NOTION_TOKEN` and `NOTION_DATABASE_ID` in the form, or
  - rely on project-level Vercel environment variables.

## Local structure

- `public/index.html`: browser UI
- `public/app.js`: form submission logic
- `public/styles.css`: UI styling
- `api/sync.js`: Notion page creation API
- `api/github.js`: GitHub API proxy for user/repository info
- `api/health.js`: health endpoint
- `scripts/local-sync.js`: local CLI uploader for shell history or other local files
- `vercel.json`: Vercel config

## Quickstart

### Browser intake

1. Open the deployed app
2. Fill in title, user label, summary, and log content
3. Provide a Notion token and database ID, or rely on server-side env vars
4. Submit to create a page in Notion

### Local development

```bash
cd notion-sync-web
vercel dev
```

Then open:

```text
http://127.0.0.1:3000
```

## Deploy to Vercel

1. Push this folder to GitHub.
2. In Vercel, import the repository.
3. Set the project root directory to `notion-sync-web` if this folder is inside a larger repo.
4. Optional env vars:
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`
   - `NOTION_TITLE_PROPERTY`
   - `GITHUB_TOKEN`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
5. Deploy.

Repository:
- `https://github.com/jozrftamson/notion-sync-web-`

## Important limits

- Vercel cannot read a user's local `.codex` or terminal files directly.
- Each user must paste or upload their own content, or use a separate local collector that posts to this app.
- If you want true automated per-user collection, the next step is a small local uploader app that sends data to this Vercel API.

## Local CLI sync

You can post local shell history or logs directly to the running app:

```bash
cd /home/josef/notion-sync-web
NOTION_TOKEN=ntn_xxx NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx npm run sync:local
```

Optional flags:

```bash
npm run sync:local -- \
  --endpoint http://127.0.0.1:3000/api/sync \
  --shellFile ~/.bash_history \
  --terminalFile /path/to/terminal.log \
  --codexFile /path/to/codex.txt \
  --title "Local History Sync" \
  --userLabel josef
```

If you run the app locally with `vercel dev`, use `http://127.0.0.1:3000/api/sync` unless you configured a different port.

To send directly to your deployed app, pass the production or preview URL:

```bash
npm run sync:local -- \
  --endpoint https://your-project.vercel.app/api/sync
```

## Screenshots

Suggested screenshots for the repository:
- landing page with intake form
- successful sync result panel
- GitHub API helper panel

Recommended asset paths:
- `docs/screenshots/web-home.png`
- `docs/screenshots/web-sync-result.png`
- `docs/screenshots/web-github-panel.png`

## Public repo safety

- Do not commit `.env` or any real Notion token.
- Do not expose real GitHub tokens in the browser or commit them to the repo.
- Do not commit private shell histories, Codex sessions, or terminal logs.
- Keep the repository limited to the app code, demo text, and deployment config.
