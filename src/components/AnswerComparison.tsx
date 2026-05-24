import type { MaskedSentence } from "../types";

interface Props {
  fullSentence: string;
  translation: string;
  isCorrect: boolean;
  userAnswer: Map<number, string> | string | null;
  masked: MaskedSentence | null;
}

export function AnswerComparison({
  fullSentence,
  translation,
  isCorrect,
  userAnswer,
  masked,
}: Props) {
  const renderWrongSentence = () => {
    if (!userAnswer) return null;

    if (typeof userAnswer === "string") {
      return (
        <div className="answer-line answer-wrong">
          <span className="answer-icon">❌</span>
          <span className="answer-text-wrong">{userAnswer}</span>
        </div>
      );
    }

    if (!masked) return null;

    const parts: React.ReactNode[] = [];
    for (const token of masked.tokens) {
      if (token.type === "normal") {
        parts.push(
          <span key={`n-${token.index}`} className="answer-word-normal">
            {token.text}
          </span>
        );
      } else {
        const userWord = userAnswer.get(token.index) ?? "";
        const target = masked.targets.find((t) => t.wordIndex === token.index);
        const correctWord = target?.text ?? "";
        const isWrong = userWord.toLowerCase() !== correctWord.toLowerCase();

        parts.push(
          <span
            key={`m-${token.index}`}
            className={isWrong ? "answer-word-wrong" : "answer-word-normal"}
          >
            {userWord || "___"}
          </span>
        );
      }
    }

    return (
      <div className="answer-line answer-wrong">
        <span className="answer-icon">❌</span>
        <span className="answer-text">{parts}</span>
      </div>
    );
  };

  const renderCorrectSentence = () => {
    if (isCorrect || !masked || typeof userAnswer === "string") {
      return (
        <div className="answer-line answer-correct">
          <span className="answer-icon">📖</span>
          <span className="answer-text">{fullSentence}</span>
        </div>
      );
    }

    const parts: React.ReactNode[] = [];
    for (const token of masked.tokens) {
      if (token.type === "normal") {
        parts.push(
          <span key={`cn-${token.index}`} className="answer-word-normal">
            {token.text}
          </span>
        );
      } else {
        const target = masked.targets.find((t) => t.wordIndex === token.index);
        const userWord = (userAnswer as Map<number, string>).get(token.index) ?? "";
        const correctWord = target?.text ?? "";
        const isWrong = userWord.toLowerCase() !== correctWord.toLowerCase();

        parts.push(
          <span
            key={`cm-${token.index}`}
            className={isWrong ? "answer-word-highlight" : "answer-word-normal"}
          >
            {correctWord}
          </span>
        );
      }
    }

    return (
      <div className="answer-line answer-correct">
        <span className="answer-icon">📖</span>
        <span className="answer-text">{parts}</span>
      </div>
    );
  };

  return (
    <div className="answer-comparison">
      {!isCorrect && renderWrongSentence()}
      {renderCorrectSentence()}
      <div className="answer-line answer-translation">
        <span className="answer-icon">🀄</span>
        <span className="answer-text">{translation}</span>
      </div>
    </div>
  );
}
