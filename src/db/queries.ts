import { db } from "./schema";
import type { Difficulty, Sentence, Progress, Vocabulary, GrammarAnalysis } from "../types";

// Sentences
export async function getAllSentences(): Promise<Sentence[]> {
  return db.sentences.toArray();
}

export async function getSentencesByDifficulty(
  difficulty: Difficulty
): Promise<Sentence[]> {
  return db.sentences.where("difficulty").equals(difficulty).toArray();
}

export async function getSentencesByTag(tag: string): Promise<Sentence[]> {
  return db.sentences.where("*tags").equals(tag).toArray();
}

export async function getSentencesBySource(
  sourceType: string
): Promise<Sentence[]> {
  return db.sentences.where("source.type").equals(sourceType).toArray();
}

export async function bulkInsertSentences(
  sentences: Sentence[]
): Promise<void> {
  await db.sentences.bulkPut(sentences);
}

export async function countSentences(): Promise<number> {
  return db.sentences.count();
}

export async function deleteSentence(id: string): Promise<void> {
  await db.sentences.delete(id);
}

export async function deleteSentences(ids: string[]): Promise<void> {
  await db.sentences.bulkDelete(ids);
}

// Progress
export async function saveProgress(progress: Progress): Promise<number> {
  return db.progress.add(progress);
}

export async function getProgressForSentence(
  sentenceId: string
): Promise<Progress[]> {
  return db.progress.where("sentenceId").equals(sentenceId).toArray();
}

export async function getTodayProgress(): Promise<Progress[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return db.progress.where("date").aboveOrEqual(today).toArray();
}

export async function getTotalProgressCount(): Promise<number> {
  return db.progress.count();
}

// Vocabulary
export async function upsertVocabulary(vocab: Vocabulary): Promise<void> {
  await db.vocabulary.put(vocab);
}

export async function getVocabulary(word: string): Promise<Vocabulary | undefined> {
  return db.vocabulary.get(word);
}

export async function getAllVocabulary(): Promise<Vocabulary[]> {
  return db.vocabulary.toArray();
}

export async function getDueForReview(): Promise<Vocabulary[]> {
  const now = new Date();
  return db.vocabulary.where("nextReview").belowOrEqual(now).toArray();
}

export async function getVocabularyByMastery(): Promise<Vocabulary[]> {
  return db.vocabulary.orderBy("mastery").reverse().toArray();
}

// Grammar
export async function getGrammarAnalysis(
  sentenceId: string
): Promise<GrammarAnalysis | undefined> {
  return db.grammar.get(sentenceId);
}

export async function saveGrammarAnalysis(
  analysis: GrammarAnalysis
): Promise<void> {
  await db.grammar.put(analysis);
}
