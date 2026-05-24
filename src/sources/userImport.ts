// src/sources/userImport.ts
import type { SentenceSource } from "./types";

export const userImportSource: SentenceSource = {
  meta: { name: "user-import", version: "1.0.0" },

  async fetch(_query) {
    // Sentences are stored in IndexedDB filtered by source type
    const { getSentencesBySource } = await import("../db/queries");
    return getSentencesBySource("user-import");
  },
};
