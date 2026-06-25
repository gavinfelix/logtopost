const GITHUB_API_VERSION = '2022-11-28';
const MAX_FILES = 30;
const MAX_LOG_LENGTH = 12000;

type GitHubCommitResponse = {
  sha?: unknown;
  html_url?: unknown;
  commit?: {
    message?: unknown;
    author?: { name?: unknown; date?: unknown } | null;
  } | null;
  author?: { login?: unknown } | null;
  stats?: { additions?: unknown; deletions?: unknown } | null;
  files?: Array<{
    filename?: unknown;
    status?: unknown;
    additions?: unknown;
    deletions?: unknown;
  }> | null;
};

function parseCommitUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  // Only github.com commit URLs are accepted so we never fetch arbitrary user-supplied hosts (SSRF).
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 4 || segments[2] !== 'commit') return null;

  const [owner, repository, , sha] = segments;
  const safeSegment = /^[A-Za-z0-9_.-]+$/;
  if (!safeSegment.test(owner) || !safeSegment.test(repository) || !/^[A-Fa-f0-9]{7,40}$/.test(sha)) {
    return null;
  }

  return { owner, repository, sha };
}

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function buildDevelopmentLog(
  data: GitHubCommitResponse,
  repositoryName: string,
  fallbackSha: string,
) {
  const message = asText(data.commit?.message).trim();
  if (!message) throw new Error('GitHub returned a commit without a message.');

  const sha = asText(data.sha, fallbackSha);
  const author = asText(data.author?.login) || asText(data.commit?.author?.name, 'Unknown author');
  const date = asText(data.commit?.author?.date);
  const additions = asNumber(data.stats?.additions);
  const deletions = asNumber(data.stats?.deletions);
  const files = Array.isArray(data.files) ? data.files : [];
  const visibleFiles = files.slice(0, MAX_FILES);

  const lines = [
    message,
    '',
    `Repository: ${repositoryName}`,
    `Commit: ${sha.slice(0, 7)}`,
    `Author: ${author}`,
  ];

  if (date) lines.push(`Date: ${date}`);
  lines.push(`Changes: +${additions} / -${deletions}`);

  if (visibleFiles.length > 0) {
    lines.push('', `Changed files (${visibleFiles.length} shown):`);
    for (const file of visibleFiles) {
      const filename = asText(file.filename, 'Unknown file');
      const status = asText(file.status, 'modified');
      lines.push(
        `- ${filename} (${status}, +${asNumber(file.additions)} / -${asNumber(file.deletions)})`,
      );
    }
    if (files.length > visibleFiles.length) {
      lines.push(`- …and ${files.length - visibleFiles.length} more files`);
    }
  }

  return lines.join('\n').slice(0, MAX_LOG_LENGTH);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const url = (body as { url?: unknown })?.url;
  if (typeof url !== 'string' || url.length > 500) {
    return Response.json({ error: 'A valid GitHub commit URL is required.' }, { status: 400 });
  }

  const commit = parseCommitUrl(url.trim());
  if (!commit) {
    return Response.json(
      { error: 'Use a public GitHub commit URL, for example github.com/owner/repo/commit/sha.' },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    'User-Agent': 'GitToPost.ai',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let response: Response;
  try {
    // Build the REST URL from validated segments instead of requesting the user-supplied URL.
    response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(commit.owner)}/${encodeURIComponent(commit.repository)}/commits/${encodeURIComponent(commit.sha)}`,
      { headers, cache: 'no-store' },
    );
  } catch {
    return Response.json({ error: 'Could not connect to GitHub. Please try again.' }, { status: 502 });
  }

  if (response.status === 404) {
    return Response.json(
      { error: 'Commit not found. The first version only supports public repositories.' },
      { status: 404 },
    );
  }
  if (response.status === 403 || response.status === 429) {
    return Response.json(
      { error: 'GitHub request limit reached. Please try again later.' },
      { status: 429 },
    );
  }
  if (!response.ok) {
    return Response.json({ error: 'GitHub could not return this commit.' }, { status: 502 });
  }

  const data = (await response.json()) as GitHubCommitResponse;
  try {
    return Response.json({
      log: buildDevelopmentLog(data, `${commit.owner}/${commit.repository}`, commit.sha),
      sourceUrl: asText(data.html_url, url.trim()),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'The GitHub response was invalid.' },
      { status: 502 },
    );
  }
}
