interface Env {
  readonly SITE_PASSWORD: string;
  readonly COOKIE_SECRET: string;
}

interface MiddlewareContext {
  readonly request: Request;
  readonly env: Env;
  readonly next: () => Promise<Response>;
}

type Middleware = (context: MiddlewareContext) => Promise<Response>;

const COOKIE_NAME = "dtt_session";
const LOGIN_PATH = "/__login";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

const importHmacKey = async (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

const toBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const fromBase64Url = (input: string): Uint8Array => {
  const padded =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const signValue = async (value: string, secret: string): Promise<string> => {
  const key = await importHmacKey(secret);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(mac);
};

const verifyValue = async (
  value: string,
  signature: string,
  secret: string,
): Promise<boolean> => {
  const key = await importHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature),
    encoder.encode(value),
  );
};

const readCookie = (header: string | null, name: string): string | null => {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return rest.join("=");
  }
  return null;
};

const isSessionValid = async (
  cookie: string,
  secret: string,
): Promise<boolean> => {
  const dot = cookie.indexOf(".");
  if (dot < 0) return false;
  const expiry = cookie.slice(0, dot);
  const signature = cookie.slice(dot + 1);
  const expiryNum = Number(expiry);
  if (!Number.isFinite(expiryNum)) return false;
  if (Math.floor(Date.now() / 1000) > expiryNum) return false;
  return verifyValue(expiry, signature, secret);
};

const mintSession = async (secret: string): Promise<string> => {
  const expiry = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS;
  const signature = await signValue(String(expiry), secret);
  return `${expiry}.${signature}`;
};

const sanitizeNext = (next: string | null): string => {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderLoginPage = (next: string, failed: boolean): Response => {
  const safeNext = escapeHtml(next);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Data Team Tarot</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:dark;--bg:#262624;--fg:#faf9f5;--accent:#b87333}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:1rem system-ui,sans-serif}
form{display:grid;gap:1rem;padding:2rem;border:0.0625rem solid var(--accent);border-radius:0.5rem;min-width:18rem}
h1{margin:0;font-size:1.25rem}
label{display:grid;gap:0.25rem}
input,button{font:inherit;padding:0.5rem;border-radius:0.25rem;border:0.0625rem solid var(--accent);background:var(--bg);color:var(--fg)}
button{background:var(--accent);color:var(--bg);cursor:pointer}
.err{color:var(--accent);margin:0}
</style>
</head>
<body>
<form method="POST" action="${LOGIN_PATH}">
<h1>Data Team Tarot</h1>
${failed ? '<p class="err">Wrong password.</p>' : ""}
<input type="hidden" name="next" value="${safeNext}">
<label>Password <input type="password" name="password" autofocus required></label>
<button type="submit">Enter</button>
</form>
</body>
</html>`;
  return new Response(html, {
    status: failed ? 401 : 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};

const handleLogin: Middleware = async ({ request, env }) => {
  const form = await request.formData();
  const password = form.get("password");
  const next = sanitizeNext(form.get("next")?.toString() ?? null);
  if (typeof password !== "string" || password !== env.SITE_PASSWORD) {
    return renderLoginPage(next, true);
  }
  const session = await mintSession(env.COOKIE_SECRET);
  return new Response(null, {
    status: 303,
    headers: {
      Location: next,
      "Set-Cookie": `${COOKIE_NAME}=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    },
  });
};

const authenticate: Middleware = async (context) => {
  const { request, env, next } = context;
  if (!env.SITE_PASSWORD || !env.COOKIE_SECRET) {
    return new Response("Auth not configured", { status: 500 });
  }
  const url = new URL(request.url);
  if (url.pathname === LOGIN_PATH && request.method === "POST") {
    return handleLogin(context);
  }
  const cookie = readCookie(request.headers.get("Cookie"), COOKIE_NAME);
  if (cookie && (await isSessionValid(cookie, env.COOKIE_SECRET))) {
    return next();
  }
  return renderLoginPage(url.pathname + url.search, false);
};

export const onRequest = authenticate;
