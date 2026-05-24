import type { Sentence, Difficulty } from "../types";

export interface FetchQuery {
  tags?: string[];
  difficulty?: Difficulty;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface SentenceSource {
  readonly meta: { name: string; version: string; url?: string };
  fetch(query: FetchQuery): Promise<Sentence[]>;
}

export interface OnlineSentenceSource extends SentenceSource {
  fetchOnline(query: FetchQuery): Promise<Sentence[]>;
}
