// src/spaced-repetition/scheduler.ts
import type { Vocabulary } from "../types";

const EBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30]; // days

export function calculateNextReview(
  vocab: Vocabulary | undefined,
  correct: boolean
): Date {
  const now = new Date();

  if (!vocab || !correct) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  const consecutiveCorrect = countConsecutiveCorrect(vocab.history);

  const intervalIndex = Math.min(
    consecutiveCorrect,
    EBINGHAUS_INTERVALS.length - 1
  );
  const days = EBINGHAUS_INTERVALS[intervalIndex];

  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return next;
}

function countConsecutiveCorrect(
  history: { date: Date; correct: boolean }[]
): number {
  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let count = 0;
  for (const entry of sorted) {
    if (entry.correct) count++;
    else break;
  }
  return count;
}

export function updateMastery(
  vocab: Vocabulary | undefined,
  correct: boolean
): number {
  if (!vocab) {
    return correct ? 30 : 10;
  }

  if (correct) {
    return Math.min(100, vocab.mastery + 15);
  } else {
    return Math.max(0, vocab.mastery - 10);
  }
}

export function createVocabularyEntry(
  word: string,
  correct: boolean
): Vocabulary {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    word,
    mastery: correct ? 30 : 10,
    attempts: 1,
    correct: correct ? 1 : 0,
    lastSeen: now,
    nextReview: tomorrow,
    history: [{ date: now, correct }],
  };
}

export function updateVocabularyEntry(
  vocab: Vocabulary,
  correct: boolean
): Vocabulary {
  const now = new Date();

  return {
    ...vocab,
    mastery: updateMastery(vocab, correct),
    attempts: vocab.attempts + 1,
    correct: vocab.correct + (correct ? 1 : 0),
    lastSeen: now,
    nextReview: calculateNextReview(vocab, correct),
    history: [...vocab.history, { date: now, correct }],
  };
}
