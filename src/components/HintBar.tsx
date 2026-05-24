// src/components/HintBar.tsx

interface Props {
  translation: string;
  answer: string;
  showTranslation: boolean;
  showAnswer: boolean;
  onShowHint: () => void;
  onShowAnswer: () => void;
}

export function HintBar({
  translation,
  answer,
  showTranslation,
  showAnswer,
  onShowHint,
  onShowAnswer,
}: Props) {
  return (
    <div className="hint-bar">
      {showTranslation && (
        <div className="hint translation-hint">
          <span className="hint-label">💡 翻译提示:</span>
          <span>{translation}</span>
        </div>
      )}

      {showAnswer && (
        <div className="hint answer-hint">
          <span className="hint-label">🔑 答案:</span>
          <span className="answer-text">{answer}</span>
        </div>
      )}

      <div className="hint-actions">
        {!showTranslation && !showAnswer && (
          <button className="hint-btn" onClick={onShowHint}>
            💡 提示翻译
          </button>
        )}
        {showTranslation && !showAnswer && (
          <button className="hint-btn reveal-btn" onClick={onShowAnswer}>
            🔑 显示答案
          </button>
        )}
      </div>
    </div>
  );
}
