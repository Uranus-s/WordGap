// src/engine/difficulty.ts
import type { Difficulty, FillMode } from "../types";

export function getFillMode(level: Difficulty): FillMode {
  return level <= 2 ? "letter" : level >= 4 ? "word" : Math.random() > 0.5 ? "letter" : "word";
}

export function getMaskPercentage(level: Difficulty): number {
  const ranges: Record<Difficulty, [number, number]> = {
    1: [0.2, 0.35],
    2: [0.25, 0.45],
    3: [0.35, 0.55],
    4: [0.45, 0.65],
    5: [0.55, 0.85],
  };
  const [min, max] = ranges[level];
  return min + Math.random() * (max - min);
}

export function getTargetCount(
  level: Difficulty,
  sentenceLength: number
): number {
  if (sentenceLength < 5) return 1;
  if (level <= 2) return 1;
  if (level === 3) return Math.min(2, sentenceLength - 3);
  if (level === 4) return Math.min(3, sentenceLength - 3);
  return Math.min(4, sentenceLength - 3);
}

export function shouldMaskWord(
  word: string,
  _index: number,
  _sentenceLength: number
): boolean {
  const functionWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been",
    "am", "of", "in", "on", "at", "to", "for", "with", "by",
    "and", "or", "but", "if", "so", "as", "it", "its", "this",
    "that", "these", "those", "he", "she", "they", "we", "i", "you",
    "my", "your", "his", "her", "our", "their", "me", "him", "us",
  ]);

  const clean = word.replace(/[^a-zA-Z-]/g, "").toLowerCase();
  if (functionWords.has(clean) && clean.length <= 3) return false;
  if (clean.length < 3) return false;
  return true;
}
