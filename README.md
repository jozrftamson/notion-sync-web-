# Terminal Docs to Notion + GitHub API

Vercel-compatible multi-user intake app for sending terminal and Codex documentation to Notion, with a small GitHub API helper endpoint for authenticated user and repository checks.

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
  --endpoint http://127.0.0.1:4317/api/sync \
  --shellFile ~/.bash_history \
  --terminalFile /path/to/terminal.log \
  --codexFile /path/to/codex.txt \
  --title "Local History Sync" \
  --userLabel josef
```

## Public repo safety

- Do not commit `.env` or any real Notion token.
- Do not expose real GitHub tokens in the browser or commit them to the repo.
- Do not commit private shell histories, Codex sessions, or terminal logs.
- Keep the repository limited to the app code, demo text, and deployment config.
