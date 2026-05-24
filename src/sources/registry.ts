// src/sources/registry.ts
import type { SentenceSource, FetchQuery } from "./types";
import type { Sentence } from "../types";

const sources = new Map<string, SentenceSource>();

export function registerSource(source: SentenceSource): void {
  sources.set(source.meta.name, source);
}

export function getSource(name: string): SentenceSource | undefined {
  return sources.get(name);
}

export function listSources(): { name: string; version: string }[] {
  return Array.from(sources.values()).map((s) => ({
    name: s.meta.name,
    version: s.meta.version,
  }));
}

export async function fetchFromAllSources(
  query: FetchQuery
): Promise<Sentence[]> {
  const results: Sentence[] = [];
  for (const source of sources.values()) {
    try {
      const sentences = await source.fetch(query);
      results.push(...sentences);
    } catch {
      // Skip sources that fail (e.g., offline online sources)
    }
  }
  return results;
}
