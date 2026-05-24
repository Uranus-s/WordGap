// src/sources/builtin.ts
import type { SentenceSource } from "./types";
import type { Sentence } from "../types";
import builtinData from "../data/builtin-sentences.json";

export const builtinSource: SentenceSource = {
  meta: { name: "builtin", version: "1.0.0" },

  async fetch(query) {
    let sentences = (builtinData as Array<Record<string, unknown>>).map(
      (raw, i) => ({
        ...raw,
        id: `builtin-${i}`,
        source: { type: "builtin" as const, sentenceId: `builtin-${i}` },
      })
    ) as Sentence[];

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
