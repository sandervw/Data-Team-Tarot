import type { APIRoute } from "astro";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const prerender = false;

interface FortuneEntry {
  readonly id: string;
  readonly text: string;
  readonly card?: string;
}

interface CardEntry {
  readonly id: string;
}

interface SubmitPayload {
  readonly text: unknown;
  readonly card: unknown;
}

const FORTUNES_PATH = resolve("src/content/fortunes.json");
const CARDS_PATH = resolve("src/content/cards.json");
const MAX_LEN = 500;

const readJson = async <T>(path: string): Promise<readonly T[]> => {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as readonly T[];
};

const nextId = (entries: readonly FortuneEntry[]): string => {
  const max = entries.reduce((acc, e) => {
    const match = e.id.match(/^fortune-(\d+)$/);
    const n = match ? Number(match[1]) : 0;
    return n > acc ? n : acc;
  }, 0);
  return `fortune-${String(max + 1).padStart(3, "0")}`;
};

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
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
    return jsonResponse({ ok: false, error: `Fortune exceeds ${MAX_LEN} characters` }, 400);
  }

  const cards = await readJson<CardEntry>(CARDS_PATH);
  const validSlugs = new Set(cards.map((c) => c.id));
  if (!validSlugs.has(card)) {
    return jsonResponse({ ok: false, error: "Unknown card" }, 400);
  }

  const fortunes = await readJson<FortuneEntry>(FORTUNES_PATH);
  const id = nextId(fortunes);
  const updated: readonly FortuneEntry[] = [...fortunes, { id, text, card }];

  await writeFile(FORTUNES_PATH, `${JSON.stringify(updated, null, 2)}\n`, "utf8");

  return jsonResponse({ ok: true, id }, 200);
};
