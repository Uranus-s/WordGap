// src/components/Timer.tsx
import { useEffect, useRef } from "react";

interface Props {
  seconds: number;
  running: boolean;
  on30s: () => void;
  on60s: () => void;
}

export function Timer({ seconds, running, on30s, on60s }: Props) {
  const fired30 = useRef(false);
  const fired60 = useRef(false);

  useEffect(() => {
    fired30.current = false;
    fired60.current = false;
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (seconds >= 30 && !fired30.current) {
      fired30.current = true;
      on30s();
    }
    if (seconds >= 60 && !fired60.current) {
      fired60.current = true;
      on60s();
    }
  }, [seconds, running, on30s, on60s]);

  const isWarning = seconds >= 20 && seconds < 30;
  const isDanger = seconds >= 30;

  return (
    <div className={`timer ${isWarning ? "warning" : ""} ${isDanger ? "danger" : ""}`}>
      <span className="timer-icon">⏱</span>
      <span className="timer-value">{seconds}s</span>
    </div>
  );
}
