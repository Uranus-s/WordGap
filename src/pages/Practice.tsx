import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { SentenceDisplay } from "../components/SentenceDisplay";
import { Timer } from "../components/Timer";
import { HintBar } from "../components/HintBar";
import { SpeakButton } from "../components/SpeakButton";
import { PostExercise } from "../components/PostExercise";
import { KeyboardHints } from "../components/KeyboardHints";
import { speak } from "../tts/speak";
import { RATES } from "../tts/rates";
import { generateMask, checkAnswer } from "../engine/maskGenerator";
import { updateVocabularyEntry, createVocabularyEntry } from "../spaced-repetition/scheduler";
import { fetchFromAllSources } from "../sources/registry";
import { saveProgress, upsertVocabulary, getVocabulary } from "../db/queries";
import type { Sentence, MaskedSentence, Progress, FillMode } from "../types";

function normalizeSentence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function Practice() {
  const [searchParams] = useSearchParams();
  const level = searchParams.get("level");
  const tag = searchParams.get("tag");
  const mode = searchParams.get("mode") as FillMode | null;

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [masked, setMasked] = useState<MaskedSentence | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"exercise" | "result">("exercise");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sentenceInput, setSentenceInput] = useState("");
  const [lastUserAnswer, setLastUserAnswer] = useState<Map<number, string> | string | null>(null);
  const [rateIndex, setRateIndex] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const justSubmittedRef = useRef(false);

  // Load sentences
  useEffect(() => {
    async function load() {
      setLoading(true);
      const query: Record<string, unknown> = { limit: 50 };
      if (level) query.difficulty = parseInt(level.replace("L", ""));
      if (tag) query.tags = [tag];

      const results = await fetchFromAllSources(query);
      results.sort(() => Math.random() - 0.5);
      setSentences(results);
      setLoading(false);
    }
    load();
  }, [level, tag]);

  // Generate mask for current sentence
  useEffect(() => {
    if (sentences.length > 0 && currentIndex < sentences.length) {
      if (mode !== "sentence") {
        const modeOverride = mode === "letter" || mode === "word" ? mode : undefined;
        const m = generateMask(sentences[currentIndex], modeOverride);
        setMasked(m); // eslint-disable-line react-hooks/set-state-in-effect
      } else {
        setMasked(null);
      }
      setShowTranslation(false);
      setShowAnswer(false);
      setRevealed(new Set());
      justSubmittedRef.current = false;
      setPhase("exercise");
      setTimerSeconds(0);
      setTimerRunning(true);
      setHintsUsed(0);
      setLastCorrect(null);
      setSentenceInput("");
      setLastUserAnswer(null);
    }
  }, [sentences, currentIndex, mode]);

  // Timer
  useEffect(() => {
    if (timerRunning && phase === "exercise") {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, phase]);

  const finishExercise = useCallback(
    async (correct: boolean, usedHints: number) => {
      if (!sentences[currentIndex]) return;

      setLastCorrect(correct);
      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setIncorrectCount((c) => c + 1);
      }
      justSubmittedRef.current = true;
      setPhase("result");

      const sentence = sentences[currentIndex];
      const progressEntry: Progress = {
        sentenceId: sentence.id,
        date: new Date(),
        correct,
        timeSpent: timerSeconds,
        hintsUsed: usedHints,
        mode: mode ?? masked?.targets[0]?.mode ?? "word",
      };
      await saveProgress(progressEntry);

      if (mode === "sentence") {
        const words = sentence.english.split(/\s+/).map(w => w.replace(/[^a-zA-Z-]/g, "").toLowerCase()).filter(w => w.length >= 3);
        for (const word of words) {
          const existing = await getVocabulary(word);
          if (existing) {
            await upsertVocabulary(updateVocabularyEntry(existing, correct));
          } else {
            await upsertVocabulary(createVocabularyEntry(word, correct));
          }
        }
      } else if (masked) {
        for (const target of masked.targets) {
          const existing = await getVocabulary(target.text.toLowerCase());
          if (existing) {
            await upsertVocabulary(updateVocabularyEntry(existing, correct));
          } else {
            await upsertVocabulary(createVocabularyEntry(target.text.toLowerCase(), correct));
          }
        }
      }
    },
    [masked, sentences, currentIndex, timerSeconds, mode]
  );

  const handleComplete = (userInputs: Map<number, string>) => {
    if (!masked) return;
    setTimerRunning(false);
    setLastUserAnswer(new Map(userInputs));
    const correct = checkAnswer(userInputs, masked.targets);
    finishExercise(correct, hintsUsed);
  };

  const handleSentenceSubmit = () => {
    if (!sentences[currentIndex] || !sentenceInput.trim()) return;
    setTimerRunning(false);
    setLastUserAnswer(sentenceInput.trim());
    const correct = normalizeSentence(sentenceInput) === normalizeSentence(sentences[currentIndex].english);
    finishExercise(correct, hintsUsed);
  };

  const handle30s = useCallback(() => {
    setShowTranslation(true);
    setHintsUsed((h) => Math.max(h, 1));
  }, []);

  const handle60s = useCallback(() => {
    setShowTranslation(true);
    setShowAnswer(true);
    if (mode === "sentence") {
      setHintsUsed(2);
      setTimerRunning(false);
      setTimeout(() => finishExercise(false, 2), 2000);
    } else {
      const count = masked?.targets.length ?? 0;
      setRevealed(new Set(Array.from({ length: count }, (_, i) => i)));
      setHintsUsed(2);
      setTimerRunning(false);
      setTimeout(() => finishExercise(false, 2), 2000);
    }
  }, [masked, finishExercise, mode]);

  const handleShowHint = useCallback(() => {
    if (mode === "sentence") {
      const firstWord = sentences[currentIndex]?.english.split(/\s+/)[0] ?? "";
      setSentenceInput((prev) => prev || firstWord);
      setHintsUsed(1);
    } else {
      setShowTranslation(true);
      setHintsUsed(1);
    }
  }, [mode, sentences, currentIndex]);

  const handleShowAnswer = useCallback(() => {
    setShowAnswer(true);
    if (mode === "sentence") {
      setSentenceInput(sentences[currentIndex]?.english ?? "");
      setHintsUsed(2);
      setTimerRunning(false);
      setTimeout(() => finishExercise(false, 2), 2000);
    } else {
      const count = masked?.targets.length ?? 0;
      setRevealed(new Set(Array.from({ length: count }, (_, i) => i)));
      setHintsUsed(2);
      setTimerRunning(false);
      setTimeout(() => finishExercise(false, 2), 2000);
    }
  }, [mode, sentences, currentIndex, masked, finishExercise]);

  const handleNext = useCallback(() => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSentences([...sentences].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    }
  }, [currentIndex, sentences]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === "exercise") {
        if (!e.altKey) return;
        switch (e.key) {
          case "h":
            e.preventDefault();
            handleShowHint();
            break;
          case "j":
            e.preventDefault();
            handleShowAnswer();
            break;
          case "p":
            e.preventDefault();
            speak(sentences[currentIndex]?.english ?? "", RATES[rateIndex]);
            break;
          case "ArrowUp":
            e.preventDefault();
            setRateIndex((i) => Math.min(i + 1, RATES.length - 1));
            break;
          case "ArrowDown":
            e.preventDefault();
            setRateIndex((i) => Math.max(i - 1, 0));
            break;
          case "k":
            e.preventDefault();
            handleShowAnswer();
            break;
        }
      } else if (phase === "result") {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        switch (e.key) {
          case "n":
          case "N":
          case "Enter":
            e.preventDefault();
            if (justSubmittedRef.current) {
              justSubmittedRef.current = false;
              break;
            }
            handleNext();
            break;
          case "p":
          case "P":
            e.preventDefault();
            speak(sentences[currentIndex]?.english ?? "", RATES[rateIndex]);
            break;
          case "ArrowUp":
            e.preventDefault();
            setRateIndex((i) => Math.min(i + 1, RATES.length - 1));
            break;
          case "ArrowDown":
            e.preventDefault();
            setRateIndex((i) => Math.max(i - 1, 0));
            break;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [phase, sentences, currentIndex, rateIndex, handleShowHint, handleShowAnswer, handleNext]);

  if (loading) {
    return (
      <div className="page practice-page">
        <div className="loading">加载题目中...</div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="page practice-page">
        <div className="empty">
          <p>题库为空</p>
          <p>请先去题库管理页面添加句子</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page practice-page">
      <div className="practice-header">
        <div className="progress-indicator">
          第 {currentIndex + 1} / {sentences.length} 题
        </div>
        <Timer
          seconds={timerSeconds}
          running={timerRunning}
          on30s={handle30s}
          on60s={handle60s}
        />
      </div>

      {phase === "exercise" && mode === "sentence" && (
        <div className="exercise-area">
          <div className="sentence-chinese-prompt">
            {sentences[currentIndex].chinese}
          </div>

          <div className="sentence-input-area">
            <textarea
              className="sentence-input"
              value={sentenceInput}
              onChange={(e) => setSentenceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSentenceSubmit();
                }
              }}
              placeholder="请输入完整英文句子..."
              disabled={showAnswer}
            />
          </div>

          <button
            className="sentence-submit-btn"
            onClick={handleSentenceSubmit}
            disabled={!sentenceInput.trim() || showAnswer}
          >
            提交
          </button>

          <div className="hint-bar">
            {showAnswer && (
              <div className="hint answer-hint">
                <span className="hint-label">🔑 答案:</span>
                <span className="answer-text">{sentences[currentIndex].english}</span>
              </div>
            )}
            <div className="hint-actions">
              {!showAnswer && hintsUsed === 0 && (
                <button className="hint-btn" onClick={handleShowHint}>
                  💡 首词提示
                </button>
              )}
              {!showAnswer && hintsUsed >= 1 && (
                <button className="hint-btn reveal-btn" onClick={handleShowAnswer}>
                  🔑 显示答案
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "exercise" && mode !== "sentence" && masked && (
        <div className="exercise-area">
          <div className="sentence-card-wrapper">
            <SentenceDisplay
              key={sentences[currentIndex]?.id}
              maskedSentence={masked}
              onComplete={handleComplete}
              revealed={revealed}
              disabled={showAnswer}
            />
            <SpeakButton text={sentences[currentIndex].english} rateIndex={rateIndex} onRateChange={setRateIndex} />
          </div>

          <HintBar
            translation={sentences[currentIndex].chinese}
            answer={masked.targets.map((t) => t.text).join(", ")}
            showTranslation={showTranslation}
            showAnswer={showAnswer}
            onShowHint={handleShowHint}
            onShowAnswer={handleShowAnswer}
          />
        </div>
      )}

      {phase === "result" && lastCorrect !== null && (
        <PostExercise
          fullSentence={sentences[currentIndex].english}
          sentenceId={sentences[currentIndex].id}
          isCorrect={lastCorrect}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          onNext={handleNext}
          translation={sentences[currentIndex].chinese}
          userAnswer={lastUserAnswer}
          masked={masked}
        />
      )}

      <KeyboardHints phase={phase} />
    </div>
  );
}
