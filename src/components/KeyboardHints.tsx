interface Props {
  phase: "exercise" | "result";
}

export function KeyboardHints({ phase }: Props) {
  return (
    <div className="keyboard-hints" aria-label="键盘快捷键提示">
      {phase === "exercise" ? (
        <>
          <span className="hint-item"><kbd>Alt+H</kbd> 提示</span>
          <span className="hint-sep" aria-hidden="true">|</span>
          <span className="hint-item"><kbd>Alt+J</kbd> 答案</span>
          <span className="hint-sep" aria-hidden="true">|</span>
          <span className="hint-item"><kbd>Alt+P</kbd> 发音</span>
          <span className="hint-sep" aria-hidden="true">|</span>
          <span className="hint-item"><kbd>Alt+↑↓</kbd> 语速</span>
          <span className="hint-sep" aria-hidden="true">|</span>
          <span className="hint-item"><kbd>Alt+K</kbd> 跳过</span>
        </>
      ) : (
        <>
          <span className="hint-item"><kbd>N</kbd> 下一题</span>
          <span className="hint-sep" aria-hidden="true">|</span>
          <span className="hint-item"><kbd>P</kbd> 发音</span>
          <span className="hint-sep" aria-hidden="true">|</span>
          <span className="hint-item"><kbd>↑↓</kbd> 语速</span>
        </>
      )}
    </div>
  );
}
