// src/engine/maskGenerator.ts
import type { Sentence, MaskedSentence, MaskedToken, TargetWord, FillMode } from "../types";
import {
  getFillMode,
  getMaskPercentage,
  getTargetCount,
  shouldMaskWord,
} from "./difficulty";

export function generateMask(sentence: Sentence, modeOverride?: "letter" | "word"): MaskedSentence {
  const words = sentence.english.split(/\s+/);
  const fillMode: FillMode = modeOverride ?? getFillMode(sentence.difficulty);

  const maskableIndices: number[] = [];
  for (let i = 0; i < words.length; i++) {
    if (shouldMaskWord(words[i], i, words.length)) {
      maskableIndices.push(i);
    }
  }

  const targetCount = Math.min(
    getTargetCount(sentence.difficulty, words.length),
    maskableIndices.length
  );

  // Shuffle and pick targets
  const shuffled = [...maskableIndices].sort(() => Math.random() - 0.5);
  const selectedIndices = new Set(shuffled.slice(0, targetCount));

  const targets: TargetWord[] = [];
  const tokens: MaskedToken[] = words.map((word, i) => {
    if (!selectedIndices.has(i)) {
      return { index: i, type: "normal", text: word + " " };
    }

    const clean = word.replace(/[^a-zA-Z-]/g, "");
    const punctuation = word.slice(clean.length);

    const mode: FillMode =
      fillMode === "letter" && clean.length >= 4 ? "letter" : "word";

    if (mode === "letter") {
      const maskCount = Math.max(
        1,
        Math.floor(clean.length * getMaskPercentage(sentence.difficulty))
      );
      const revealCount = clean.length - maskCount;

      // Keep first and optionally last letter visible when possible
      const prefixLen = Math.min(1, revealCount);
      const suffixLen =
        revealCount > prefixLen ? Math.min(1, revealCount - prefixLen) : 0;
      const middleReveal = revealCount - prefixLen - suffixLen;

      const prefix = clean.slice(0, prefixLen);
      const suffix = suffixLen > 0 ? clean.slice(-suffixLen) : "";

      let middleText: string;
      if (suffixLen > 0) {
        middleText = clean.slice(prefixLen, -suffixLen);
      } else {
        middleText = clean.slice(prefixLen);
      }

      const middleLetters = [...middleText];
      const revealedPositions = new Set(
        [...Array(middleLetters.length).keys()]
          .sort(() => Math.random() - 0.5)
          .slice(0, middleReveal)
      );

      let display = prefix;
      for (let j = 0; j < middleLetters.length; j++) {
        display += revealedPositions.has(j) ? middleLetters[j] : "_";
      }
      display += suffix + punctuation + " ";

      targets.push({
        wordIndex: i,
        text: clean,
        mode: "letter",
        maskCount: clean.length - revealCount,
      });

      return {
        index: i,
        type: "masked",
        text: display,
        original: clean,
        revealCount,
        prefix,
        suffix,
      };
    } else {
      // Word mode: full underscore
      const display = "_".repeat(clean.length) + punctuation + " ";

      targets.push({
        wordIndex: i,
        text: clean,
        mode: "word",
        maskCount: clean.length,
      });

      return {
        index: i,
        type: "masked",
        text: display,
        original: clean,
        revealCount: 0,
      };
    }
  });

  return { tokens, targets };
}

export function checkAnswer(
  userInputs: Map<number, string>,
  targets: TargetWord[]
): boolean {
  if (userInputs.size !== targets.length) return false;
  return targets.every(
    (t) => userInputs.get(t.wordIndex)?.toLowerCase() === t.text.toLowerCase()
  );
}
