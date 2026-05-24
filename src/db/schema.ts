import Dexie, { type Table } from "dexie";
import type { Sentence, Progress, Vocabulary, GrammarAnalysis } from "../types";

export class WordGapDB extends Dexie {
  sentences!: Table<Sentence, string>;
  progress!: Table<Progress, number>;
  vocabulary!: Table<Vocabulary, string>;
  grammar!: Table<GrammarAnalysis, string>;

  constructor() {
    super("WordGapDB");
    this.version(1).stores({
      sentences: "id, source.type, difficulty, *tags",
      progress: "++id, sentenceId, date",
      vocabulary: "word, mastery, nextReview",
    });
    this.version(2).stores({
      sentences: "id, source.type, difficulty, *tags",
      progress: "++id, sentenceId, date",
      vocabulary: "word, mastery, nextReview",
      grammar: "&sentenceId, createdAt",
    });
  }
}

export const db = new WordGapDB();
