module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = parseBody(req.body);
    const token = process.env.GITHUB_TOKEN;
    const owner = clean(body.githubOwner || process.env.GITHUB_OWNER);
    const repo = clean(body.githubRepo || process.env.GITHUB_REPO);

    if (!token) {
      throw new Error("Missing GitHub token. Set GITHUB_TOKEN on the server.");
    }

    const viewer = await githubRequest("/user", token);
    const payload = {
      ok: true,
      viewer: {
        login: viewer.login,
        name: viewer.name,
        url: viewer.html_url,
        publicRepos: viewer.public_repos,
      },
    };

    if (owner && repo) {
      const repository = await githubRequest(`/repos/${owner}/${repo}`, token);
      payload.repository = {
        name: repository.full_name,
        description: repository.description,
        private: repository.private,
        defaultBranch: repository.default_branch,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        openIssues: repository.open_issues_count,
        url: repository.html_url,
      };
    }

    return res.status(200).json(payload);
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

function clean(value) {
  return String(value || "").trim();
}


async function githubRequest(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "notion-sync-web",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub request failed (${response.status}): ${text}`);
  }

  return response.json();
}
