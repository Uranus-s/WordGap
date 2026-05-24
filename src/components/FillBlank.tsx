// src/components/FillBlank.tsx
import { useRef, useEffect } from "react";

interface Props {
  targetWord: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function FillBlank({
  value,
  onChange,
  onSubmit,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onSubmit();
    }
    if (e.key === "ArrowDown" || e.key === "Tab") {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="fill-blank">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="输入缺失的单词或字母..."
        className="fill-input"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || value.length === 0}
        className="submit-btn"
      >
        提交
      </button>
    </div>
  );
}
