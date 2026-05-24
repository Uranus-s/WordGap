import { useEffect } from "react";
import type { MaskedSentence } from "../types";
import { speak } from "../tts/speak";
import { GrammarPanel } from "./GrammarPanel";
import { AnswerComparison } from "./AnswerComparison";

interface Props {
  fullSentence: string;
  sentenceId: string;
  isCorrect: boolean;
  correctCount: number;
  incorrectCount: number;
  onNext: () => void;
  translation: string;
  userAnswer: Map<number, string> | string | null;
  masked: MaskedSentence | null;
}

export function PostExercise({
  fullSentence,
  sentenceId,
  isCorrect,
  correctCount,
  incorrectCount,
  onNext,
  translation,
  userAnswer,
  masked,
}: Props) {
  useEffect(() => {
    speak(fullSentence);
  }, [fullSentence]);

  const emoji = isCorrect ? "✅" : "❌";
  const message = isCorrect ? "太棒了！" : "再试一次！";

  return (
    <div className={`post-exercise ${isCorrect ? "correct" : "incorrect"}`}>
      <div className="result-emoji">{emoji}</div>
      <div className="result-message">{message}</div>
      <div className="result-stats">
        <span className="stat-correct">✓ {correctCount}</span>
        <span className="stat-incorrect">✗ {incorrectCount}</span>
      </div>
      <AnswerComparison
        fullSentence={fullSentence}
        translation={translation}
        isCorrect={isCorrect}
        userAnswer={userAnswer}
        masked={masked}
      />
      <GrammarPanel sentenceId={sentenceId} sentence={fullSentence} />
      <button className="next-btn" onClick={onNext} autoFocus>
        下一题 →
      </button>
    </div>
  );
}
