// src/components/SentenceDisplay.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { MaskedSentence } from "../types";

interface Props {
  maskedSentence: MaskedSentence;
  onComplete: (userInputs: Map<number, string>) => void;
  revealed: Set<number>;
  disabled: boolean;
}

export function SentenceDisplay({
  maskedSentence,
  onComplete,
  revealed,
  disabled,
}: Props) {
  const [userInputs, setUserInputs] = useState<Map<number, string>>(new Map());
  const [letterInputs, setLetterInputs] = useState<Map<string, string>>(new Map());
  const [activeMaskIndex, setActiveMaskIndex] = useState(0);
  const [activeLetterIndex, setActiveLetterIndex] = useState<number | null>(null);

  // Refs: key = "${maskIndex}" for word mode, "${maskIndex}-${i}" for letter mode
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const blankWordIndices = useMemo(
    () => maskedSentence.tokens.filter((t) => t.type === "masked").map((t) => t.index),
    [maskedSentence.tokens]
  );

  const maskedTokens = useMemo(
    () => maskedSentence.tokens.filter((t) => t.type === "masked"),
    [maskedSentence.tokens]
  );

  const focusInput = useCallback((maskIdx: number, letterIdx: number | null) => {
    const key = letterIdx !== null ? `${maskIdx}-${letterIdx}` : `${maskIdx}`;
    const el = inputRefs.current.get(key);
    if (el) el.focus();
  }, []);

  // Auto-focus first input on mount
  useEffect(() => {
    if (disabled || blankWordIndices.length === 0) return;
    const firstTarget = maskedSentence.targets[0];
    const letterIdx = firstTarget?.mode === "letter" ? 0 : null;
    const key = letterIdx !== null ? `0-${letterIdx}` : "0";
    const el = inputRefs.current.get(key);
    if (el) requestAnimationFrame(() => el.focus());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconstruct full clean word by replacing each "_" in token.text with user input
  const buildFullWord = useCallback(
    (maskIndex: number) => {
      const target = maskedSentence.targets[maskIndex];
      if (!target || target.mode === "word") return userInputs.get(target.wordIndex) ?? "";
      const token = maskedTokens[maskIndex];
      if (!token) return userInputs.get(target.wordIndex) ?? "";
      let li = 0;
      const reconstructed = [...token.text]
        .map((ch) =>
          ch === "_" ? (letterInputs.get(`${maskIndex}-${li++}`) ?? "_") : ch
        )
        .join("");
      return reconstructed.replace(/[^a-zA-Z-]/g, "");
    },
    [maskedSentence.targets, maskedTokens, userInputs, letterInputs]
  );

  const allBlanksFilled = () => {
    for (let mi = 0; mi < maskedSentence.targets.length; mi++) {
      const target = maskedSentence.targets[mi];
      if (target.mode === "word") {
        if ((userInputs.get(target.wordIndex) ?? "").trim().length === 0) return false;
      } else {
        const allLettersFilled = Array.from(
          { length: target.maskCount },
          (_, i) => letterInputs.get(`${mi}-${i}`) ?? ""
        ).every((c) => c !== "");
        if (!allLettersFilled) return false;
      }
    }
    return true;
  };

  const trySubmit = () => {
    if (allBlanksFilled()) {
      // Build final userInputs map with all current values
      const final = new Map(userInputs);
      for (let mi = 0; mi < maskedSentence.targets.length; mi++) {
        const target = maskedSentence.targets[mi];
        if (target.mode === "letter") {
          final.set(target.wordIndex, buildFullWord(mi));
        }
      }
      onComplete(final);
    }
  };

  const moveToNext = (maskIndex: number) => {
    if (maskIndex < blankWordIndices.length - 1) {
      const nextTarget = maskedSentence.targets[maskIndex + 1];
      const letterIdx = nextTarget?.mode === "letter" ? 0 : null;
      setActiveMaskIndex(maskIndex + 1);
      setActiveLetterIndex(letterIdx);
      setTimeout(() => focusInput(maskIndex + 1, letterIdx), 0);
    } else {
      trySubmit();
    }
  };

  const moveToPrevBlank = (maskIndex: number) => {
    if (maskIndex > 0) {
      const prevTarget = maskedSentence.targets[maskIndex - 1];
      const letterIdx = prevTarget?.mode === "letter" ? prevTarget.maskCount - 1 : null;
      setActiveMaskIndex(maskIndex - 1);
      setActiveLetterIndex(letterIdx);
      setTimeout(() => focusInput(maskIndex - 1, letterIdx), 0);
    }
  };

  // ── Letter-mode handlers ──

  const handleLetterChange = (
    maskIndex: number,
    letterIndex: number,
    wordIndex: number,
    target: typeof maskedSentence.targets[0],
    char: string
  ) => {
    const single = char.slice(-1);
    const newLetters = new Map(letterInputs);
    newLetters.set(`${maskIndex}-${letterIndex}`, single);
    setLetterInputs(newLetters);

    // Rebuild full word by replacing underscores in token.text with letter inputs
    const token = maskedTokens[maskIndex];
    let li = 0;
    const full = token
      ? [...token.text]
          .map((ch) => {
            if (ch === "_") {
              const letter = li === letterIndex ? single : (letterInputs.get(`${maskIndex}-${li}`) ?? "");
              li++;
              return letter;
            }
            return ch;
          })
          .join("")
          .replace(/[^a-zA-Z-]/g, "")
      : single;
    const next = new Map(userInputs);
    next.set(wordIndex, full);
    setUserInputs(next);

    // Auto-advance to next letter
    if (single && letterIndex < target.maskCount - 1) {
      setActiveLetterIndex(letterIndex + 1);
      focusInput(maskIndex, letterIndex + 1);
    }
  };

  const handleLetterKeyDown = (
    maskIndex: number,
    letterIndex: number,
    e: React.KeyboardEvent
  ) => {
    const target = maskedSentence.targets[maskIndex];

    if (e.key === "Backspace") {
      const currentVal = letterInputs.get(`${maskIndex}-${letterIndex}`) ?? "";
      if (!currentVal) {
        e.preventDefault();
        if (letterIndex > 0) {
          setActiveLetterIndex(letterIndex - 1);
          focusInput(maskIndex, letterIndex - 1);
        } else {
          moveToPrevBlank(maskIndex);
        }
      }
      return;
    }

    if (e.key === "ArrowLeft" && letterIndex > 0) {
      e.preventDefault();
      setActiveLetterIndex(letterIndex - 1);
      focusInput(maskIndex, letterIndex - 1);
      return;
    }

    if (e.key === "ArrowRight" && letterIndex < target.maskCount - 1) {
      e.preventDefault();
      setActiveLetterIndex(letterIndex + 1);
      focusInput(maskIndex, letterIndex + 1);
      return;
    }

    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (letterIndex < target.maskCount - 1) {
        setActiveLetterIndex(letterIndex + 1);
        focusInput(maskIndex, letterIndex + 1);
      } else {
        moveToNext(maskIndex);
      }
    }
  };

  // ── Word-mode handlers ──

  const handleWordChange = (wordIndex: number, value: string) => {
    const next = new Map(userInputs);
    next.set(wordIndex, value);
    setUserInputs(next);
  };

  const handleWordKeyDown = (maskIndex: number, wordIndex: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      moveToNext(maskIndex);
    }
    if (e.key === "Backspace" && !(userInputs.get(wordIndex) ?? "")) {
      e.preventDefault();
      moveToPrevBlank(maskIndex);
    }
  };

  // ── Render ──

  let maskIndex = -1;

  return (
    <div className="sentence-display">
      {maskedSentence.tokens.map((token) => {
        if (token.type === "normal") {
          return (
            <span key={token.index} className="normal-word">
              {token.text}
            </span>
          );
        }

        maskIndex++;
        const mi = maskIndex;
        const wordIdx = token.index;
        const target = maskedSentence.targets[mi];
        const isRevealed = revealed.has(mi);

        if (isRevealed) {
          return (
            <span key={token.index} className="revealed-word">
              {token.original}{" "}
            </span>
          );
        }

        // ── Letter mode: parse text, replace "_" with single-char inputs ──
        if (target.mode === "letter") {
          let letterIdx = 0;

          return (
            <span
              key={token.index}
              className="inline-blank letter-blank"
              onClick={() => {
                setActiveMaskIndex(mi);
                setActiveLetterIndex(0);
              }}
            >
              {[...token.text].map((ch, ci) => {
                if (ch === "_") {
                  const li = letterIdx++;
                  const letterKey = `${mi}-${li}`;
                  const letterVal = letterInputs.get(letterKey) ?? "";
                  const isActiveLetter =
                    activeMaskIndex === mi && activeLetterIndex === li;

                  return (
                    <input
                      key={ci}
                      ref={(el) => {
                        if (el) inputRefs.current.set(letterKey, el);
                        else inputRefs.current.delete(letterKey);
                      }}
                      type="text"
                      value={letterVal}
                      onChange={(e) =>
                        handleLetterChange(mi, li, wordIdx, target, e.target.value)
                      }
                      onKeyDown={(e) => handleLetterKeyDown(mi, li, e)}
                      onFocus={() => {
                        setActiveMaskIndex(mi);
                        setActiveLetterIndex(li);
                      }}
                      disabled={disabled}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className={`letter-input${isActiveLetter ? " active" : ""}`}
                      maxLength={1}
                    />
                  );
                }
                return (
                  <span key={ci} className="blank-affix">
                    {ch}
                  </span>
                );
              })}
            </span>
          );
        }

        // ── Word mode: single input with clear boundaries ──
        const wordVal = userInputs.get(wordIdx) ?? "";
        const isActiveWord = activeMaskIndex === mi && activeLetterIndex === null;
        const originalLen = token.original?.length ?? 5;

        return (
          <span
            key={token.index}
            className={`inline-blank word-blank${isActiveWord ? " active" : ""}`}
            onClick={() => {
              setActiveMaskIndex(mi);
              setActiveLetterIndex(null);
              inputRefs.current.get(`${mi}`)?.focus();
            }}
          >
            <input
              ref={(el) => {
                if (el) inputRefs.current.set(`${mi}`, el);
                else inputRefs.current.delete(`${mi}`);
              }}
              type="text"
              value={wordVal}
              onChange={(e) => handleWordChange(wordIdx, e.target.value)}
              onKeyDown={(e) => handleWordKeyDown(mi, wordIdx, e)}
              onFocus={() => {
                setActiveMaskIndex(mi);
                setActiveLetterIndex(null);
              }}
              disabled={disabled}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="word-input"
              style={{ width: `${Math.max(originalLen, 3)}ch` }}
              maxLength={originalLen + 2}
            />
            {" "}
          </span>
        );
      })}
    </div>
  );
}
