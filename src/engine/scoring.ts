// src/engine/scoring.ts

export interface ScoreResult {
  points: number;
  correct: boolean;
  hintsUsed: number;
  timeSpent: number;
}

export function calculateScore(
  correct: boolean,
  hintsUsed: number,
  timeSpent: number
): ScoreResult {
  if (!correct) {
    return { points: 0, correct: false, hintsUsed, timeSpent };
  }

  let points = 100;

  // Hint penalty
  if (hintsUsed === 1) points -= 30;
  if (hintsUsed === 2) points -= 60;

  // Time penalty (over 30s)
  if (timeSpent > 30) {
    points -= Math.min(20, Math.floor((timeSpent - 30) / 3));
  }

  // Speed bonus (under 10s)
  if (timeSpent < 10) {
    points += 10;
  }

  return { points: Math.max(10, points), correct, hintsUsed, timeSpent };
}
