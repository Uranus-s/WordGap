// src/sources/tatoeba.ts
import type { OnlineSentenceSource } from "./types";
import type { Sentence } from "../types";

const TATOEBA_SEARCH = "/api/tatoeba/en/sentences/search";

export const tatoebaSource: OnlineSentenceSource = {
  meta: {
    name: "tatoeba",
    version: "1.0.0",
    url: "https://tatoeba.org",
  },

  async fetchOnline(query) {
    const limit = query.limit ?? 50;
    const searchQuery = query.search ?? "";
    const tag = query.tags?.[0] ?? "";

    // Map Chinese tags / free text to English search terms for Tatoeba
    const queryString = searchQuery || tagToEnglishSearch(tag) || randomSearchWord();
    const params = new URLSearchParams({
      query: queryString,
      from: "eng",
      to: "cmn",
      sort: "relevance",
    });

    const url = `${TATOEBA_SEARCH}?${params.toString()}`;
    console.log("[Tatoeba] Fetching:", url);

    try {
      const response = await fetch(url);
      console.log("[Tatoeba] Response status:", response.status, response.ok);

      if (!response.ok) {
        throw new Error(`Tatoeba API returned ${response.status}`);
      }

      const html = await response.text();
      console.log("[Tatoeba] HTML length:", html.length);
      console.log("[Tatoeba] vm.init count:", (html.match(/vm\.init/g) || []).length);

      const sentences = parseTatoebaHtml(html, limit);
      console.log("[Tatoeba] Parsed sentences:", sentences.length);
      return sentences;
    } catch (error) {
      console.error("[Tatoeba] Fetch failed:", error);
      return [];
    }
  },

  async fetch(query) {
    const { getSentencesBySource } = await import("../db/queries");
    let sentences = await getSentencesBySource("tatoeba");

    if (query.tags && query.tags.length > 0) {
      sentences = sentences.filter((s) =>
        s.tags.some((t) => query.tags!.includes(t))
      );
    }
    if (query.difficulty) {
      sentences = sentences.filter((s) => s.difficulty === query.difficulty);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      sentences = sentences.filter(
        (s) =>
          s.english.toLowerCase().includes(q) ||
          s.chinese.includes(q)
      );
    }

    const offset = query.offset ?? 0;
    const limit = query.limit ?? sentences.length;
    return sentences.slice(offset, offset + limit);
  },
};

// Extracts sentences from Tatoeba HTML by parsing ng-init JSON data.
// Tatoeba server-renders AngularJS templates; the real data is
// embedded in ng-init attributes, not in visible DOM text nodes.
const NG_INIT_RE = /ng-init="vm\.init\((.*)\)"/g;

function decodeEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function splitTopLevelArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (ch === "\\" && i + 1 < s.length) { i++; continue; }
      if (ch === stringChar) { inString = false; }
      continue;
    }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
    if (ch === "[" || ch === "{") { depth++; continue; }
    if (ch === "]" || ch === "}") { depth--; continue; }
    if (ch === "," && depth === 0) {
      args.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  args.push(s.slice(start).trim());
  return args;
}

export function parseTatoebaHtml(html: string, limit: number): Sentence[] {
  const sentences: Sentence[] = [];
  let count = 0;

  for (const match of html.matchAll(NG_INIT_RE)) {
    if (count >= limit) break;

    try {
      const content = match[1];
      const args = splitTopLevelArgs(content);

      // vm.init([], sentenceJson, translationsArray, 'cmn')
      // args[0] = [] (unused), args[1] = sentence object, args[2] = translations, args[3] = language
      const sentenceJson = JSON.parse(decodeEntities(args[1]));
      const translationsArray = JSON.parse(decodeEntities(args[2]));

      const english = sentenceJson.text?.trim();
      // translationsArray is wrapped: [[{...}, {...}]] or [[[...], [...]]]
      const innerTranslations = Array.isArray(translationsArray[0]) ? translationsArray[0] : translationsArray;
      const chinese = innerTranslations[0]?.text?.trim();

      if (!english || !chinese) continue;
      if (english.split(/\s+/).length < 3 || english.length > 200) continue;

      const difficulty = estimateDifficulty(english);

      sentences.push({
        id: `tatoeba-${Date.now()}-${count}`,
        english,
        chinese,
        source: { type: "tatoeba", sentenceId: `tatoeba-${count}` },
        difficulty,
        tags: guessTags(english, chinese),
        words: [],
      });

      count++;
    } catch {
      // Skip malformed ng-init data
    }
  }

  return sentences;
}

function estimateDifficulty(english: string): Sentence["difficulty"] {
  const words = english.split(/\s+/);
  const avgLength =
    words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const longWords = words.filter((w) => w.length > 7).length;

  if (avgLength < 4 && longWords === 0) return 1;
  if (avgLength < 4.5 && longWords <= 1) return 2;
  if (avgLength < 5.5 && longWords <= 2) return 3;
  if (avgLength < 6.5 && longWords <= 3) return 4;
  return 5;
}

export function guessTags(english: string, _chinese: string): string[] {
  const tags: string[] = [];
  const academicWords = [
    "research", "theory", "analysis", "hypothesis", "significant",
    "concept", "principle", "phenomenon", "mechanism", "literature",
  ];
  const businessWords = [
    "company", "market", "investment", "revenue", "strategy",
    "negotiation", "budget", "client", "contract", "profit",
  ];

  const text = english.toLowerCase();
  if (academicWords.some((w) => text.includes(w))) tags.push("学术");
  if (businessWords.some((w) => text.includes(w))) tags.push("商务");
  if (tags.length === 0) tags.push("生活");

  return tags;
}

// Map user-facing Chinese categories to English search terms for Tatoeba
function tagToEnglishSearch(tag: string): string | null {
  const map: Record<string, string> = {
    "生活": "everyday family travel food",
    "学术": "research theory science knowledge",
    "商务": "business company market economy",
  };
  return map[tag] ?? null;
}

// Pick a random common English word so each fetch returns different results
function randomSearchWord(): string {
  const words = [
    "beautiful", "important", "remember", "different", "together",
    "believe", "problem", "question", "experience", "possible",
    "understand", "consider", "happen", "sometimes", "usually",
  ];
  return words[Math.floor(Math.random() * words.length)];
}
