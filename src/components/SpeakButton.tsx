// src/components/SpeakButton.tsx
import { useState, useCallback, useRef, useEffect } from "react";
import { speak } from "../tts/speak";
import { RATES } from "../tts/rates";

interface Props {
  text: string;
  rateIndex?: number;
  onRateChange?: (index: number) => void;
}

export function SpeakButton({ text, rateIndex: rateIndexProp, onRateChange }: Props) {
  const [rateIndexInternal, setRateIndexInternal] = useState(1); // default 1x = index 1
  const rateIndex = rateIndexProp !== undefined ? rateIndexProp : rateIndexInternal;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const abortedRef = useRef(false);

  useEffect(() => {
    abortedRef.current = false;
    return () => {
      abortedRef.current = true;
    };
  }, []);

  const rate = RATES[rateIndex];

  const handleSpeak = useCallback(async () => {
    if (speakingRef.current || !text) return;
    speakingRef.current = true;
    setIsSpeaking(true);
    try {
      await speak(text, rate);
    } finally {
      if (!abortedRef.current) {
        speakingRef.current = false;
        setIsSpeaking(false);
      }
    }
  }, [text, rate]);

  const cycleRate = () => {
    const next = (rateIndex + 1) % RATES.length;
    if (onRateChange) {
      onRateChange(next);
    } else {
      setRateIndexInternal(next);
    }
  };

  return (
    <div className="speak-button-group">
      <button
        className={`speak-btn${isSpeaking ? " speaking" : ""}`}
        onClick={handleSpeak}
        aria-label="播放句子发音"
        title="播放发音"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {rate >= 1 && (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          )}
        </svg>
      </button>
      <button
        className="rate-badge"
        onClick={cycleRate}
        aria-label={`当前倍速 ${rate}x，点击切换`}
        title={`播放倍速 ${rate}x`}
      >
        {rate}x
      </button>
    </div>
  );
}
