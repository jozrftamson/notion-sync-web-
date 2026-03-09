const MAX_CHARS = 12000;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = parseBody(req.body);
    const notionToken = body.notionToken || process.env.NOTION_TOKEN;
    const notionDatabaseId = body.notionDatabaseId || process.env.NOTION_DATABASE_ID;
    const titleProperty = body.notionTitleProperty || process.env.NOTION_TITLE_PROPERTY || "Name";

    if (!notionToken || !notionDatabaseId) {
      throw new Error("Missing Notion credentials. Provide token and database ID.");
    }

    const sanitized = {
      title: limit(body.title || `Terminal Report ${new Date().toISOString().slice(0, 10)}`, 120),
      userLabel: limit(body.userLabel || "Unknown user", 80),
      source: limit(body.source || "Manual upload", 80),
      summary: limit(body.summary || "", 500),
      codexText: sanitizeText(body.codexText || ""),
      terminalText: sanitizeText(body.terminalText || ""),
      shellText: sanitizeText(body.shellText || ""),
    };

    if (!sanitized.summary && !sanitized.codexText && !sanitized.terminalText && !sanitized.shellText) {
      throw new Error("Nothing to sync. Provide summary, Codex text, terminal logs, or shell history.");
    }

    const blocks = buildBlocks(sanitized);
    const page = await notionRequest("/v1/pages", notionToken, {
      method: "POST",
      body: {
        parent: {
          database_id: notionDatabaseId,
        },
        properties: {
          [titleProperty]: {
            title: [{ text: { content: sanitized.title } }],
          },
        },
      },
    });

    for (let index = 0; index < blocks.length; index += 50) {
      await notionRequest(`/v1/blocks/${page.id}/children`, notionToken, {
        method: "PATCH",
        body: {
          children: blocks.slice(index, index + 50),
        },
      });
    }

    return res.status(200).json({
      ok: true,
      pageId: page.id,
      url: getNotionPageUrl(page.id),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message || String(error),
    });
  }
};

function parseBody(body) {
  if (!body) {
    return {};
  }
  if (typeof body === "string") {
    return JSON.parse(body);
  }
  return body;
}

function buildBlocks(data) {
  return [
    heading("Overview"),
    paragraph(`User: ${data.userLabel}`),
    paragraph(`Source: ${data.source}`),
    paragraph(data.summary || "No summary provided."),
    heading("Codex History"),
    paragraph(data.codexText || "No Codex content provided."),
    heading("Terminal Logs"),
    paragraph(data.terminalText || "No terminal log content provided."),
    heading("Shell History"),
    paragraph(data.shellText || "No shell history provided."),
  ];
}

function heading(text) {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: [richText(text)],
    },
  };
}

function paragraph(text) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: chunkText(text, 1800).map(richText),
    },
  };
}

function richText(text) {
  return {
    type: "text",
    text: {
      content: text,
    },
  };
}

function chunkText(text, size) {
  const value = limit(text, MAX_CHARS);
  const chunks = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks.length ? chunks : [""];
}

function limit(text, size) {
  return String(text).slice(0, size);
}

function sanitizeText(text) {
  return limit(
    String(text)
      .replace(/ntn_[A-Za-z0-9]+/g, "[REDACTED]")
      .replace(/secret_[A-Za-z0-9]+/g, "[REDACTED]")
      .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED]")
      .replace(/ghp_[A-Za-z0-9]+/g, "[REDACTED]")
      .replace(/github_pat_[A-Za-z0-9_]+/g, "[REDACTED]")
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
      .replace(/[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ""),
    MAX_CHARS
  );
}

async function notionRequest(endpoint, token, options) {
  const response = await fetch(`https://api.notion.com${endpoint}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion request failed (${response.status}): ${text}`);
  }

  return response.json();
}

function getNotionPageUrl(pageId) {
  return `https://www.notion.so/${pageId.replace(/-/g, "")}`;
}
