interface Env {
  readonly GITHUB_TOKEN: string;
  readonly GITHUB_REPO: string;
  readonly GITHUB_BRANCH?: string;
}

interface RequestContext {
  readonly request: Request;
  readonly env: Env;
}

interface FortuneEntry {
  readonly id: string;
  readonly text: string;
  readonly card: string;
}

interface CardEntry {
  readonly id: string;
}

interface SubmitPayload {
  readonly text: unknown;
  readonly card: unknown;
}

interface GitHubFile {
  readonly content: string;
  readonly sha: string;
}

type SubmitResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly status: number; readonly error: string };

const FORTUNES_PATH = "src/content/fortunes.json";
const CARDS_PATH = "src/content/cards.json";
const MAX_LEN = 500;
const MAX_RETRIES = 3;
const USER_AGENT = "data-team-tarot-pages-fn";

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const githubHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": USER_AGENT,
});

const decodeBase64Utf8 = (base64: string): string => {
  const cleaned = base64.replace(/\s/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

const encodeBase64Utf8 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
};

const fetchFile = async (
  repo: string,
  branch: string,
  path: string,
  token: string,
): Promise<GitHubFile> => {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (!res.ok) {
    throw new Error(`GitHub GET ${path} failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    readonly content: string;
    readonly sha: string;
  };
  return { content: decodeBase64Utf8(data.content), sha: data.sha };
};

const putFile = async (
  repo: string,
  branch: string,
  path: string,
  contentBase64: string,
  sha: string,
  message: string,
  token: string,
): Promise<Response> =>
  fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify({ message, content: contentBase64, sha, branch }),
  });

const nextId = (entries: readonly FortuneEntry[]): string => {
  const max = entries.reduce((acc, e) => {
    const match = e.id.match(/^fortune-(\d+)$/);
    const n = match ? Number(match[1]) : 0;
    return n > acc ? n : acc;
  }, 0);
  return `fortune-${String(max + 1).padStart(3, "0")}`;
};

const submitFortune = async (
  text: string,
  card: string,
  env: Env,
): Promise<SubmitResult> => {
  const branch = env.GITHUB_BRANCH ?? "main";

  const [cardsFile, fortunesFile] = await Promise.all([
    fetchFile(env.GITHUB_REPO, branch, CARDS_PATH, env.GITHUB_TOKEN),
    fetchFile(env.GITHUB_REPO, branch, FORTUNES_PATH, env.GITHUB_TOKEN),
  ]);

  const cards = JSON.parse(cardsFile.content) as readonly CardEntry[];
  const validSlugs = new Set(cards.map((c) => c.id));
  if (!validSlugs.has(card)) {
    return { ok: false, status: 400, error: "Unknown card" };
  }

  let currentFortunes = JSON.parse(fortunesFile.content) as readonly FortuneEntry[];
  let currentSha = fortunesFile.sha;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const id = nextId(currentFortunes);
    const updated: readonly FortuneEntry[] = [
      ...currentFortunes,
      { id, text, card },
    ];
    const body = `${JSON.stringify(updated, null, 2)}\n`;
    const res = await putFile(
      env.GITHUB_REPO,
      branch,
      FORTUNES_PATH,
      encodeBase64Utf8(body),
      currentSha,
      `Add ${id}`,
      env.GITHUB_TOKEN,
    );
    if (res.ok) {
      return { ok: true, id };
    }
    if (res.status === 409 || res.status === 422) {
      const refreshed = await fetchFile(
        env.GITHUB_REPO,
        branch,
        FORTUNES_PATH,
        env.GITHUB_TOKEN,
      );
      currentFortunes = JSON.parse(refreshed.content) as readonly FortuneEntry[];
      currentSha = refreshed.sha;
      continue;
    }
    const errBody = await res.text();
    return {
      ok: false,
      status: 502,
      error: `GitHub PUT failed: ${res.status} ${errBody.slice(0, 200)}`,
    };
  }

  return { ok: false, status: 503, error: "Conflict after retries" };
};

const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const { request, env } = context;
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return jsonResponse({ ok: false, error: "GitHub not configured" }, 500);
  }

  let payload: SubmitPayload;
  try {
    payload = (await request.json()) as SubmitPayload;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400);
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const card = typeof payload.card === "string" ? payload.card : "";

  if (text.length === 0) {
    return jsonResponse({ ok: false, error: "Fortune text is required" }, 400);
  }
  if (text.length > MAX_LEN) {
    return jsonResponse(
      { ok: false, error: `Fortune exceeds ${MAX_LEN} characters` },
      400,
    );
  }
  if (card === "") {
    return jsonResponse({ ok: false, error: "Card is required" }, 400);
  }

  try {
    const result = await submitFortune(text, card, env);
    if (result.ok) {
      return jsonResponse({ ok: true, id: result.id }, 200);
    }
    return jsonResponse({ ok: false, error: result.error }, result.status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ ok: false, error: message }, 502);
  }
};

export { onRequestPost };
