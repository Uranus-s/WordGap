import { useState, useEffect } from "react";
import { GrammarDisplay } from "./GrammarDisplay";
import { analyzeGrammar, hasApiKey } from "../services/grammar";
import type { GrammarAnalysis } from "../types";

interface Props {
  sentenceId: string;
  sentence: string;
}

export function GrammarPanel({ sentenceId, sentence }: Props) {
  const [analysis, setAnalysis] = useState<GrammarAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKeyMissing = !hasApiKey();

  useEffect(() => {
    if (apiKeyMissing) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setLoading(true);
    setError(null);
    analyzeGrammar(sentenceId, sentence)
      .then((result) => { if (!cancelled) setAnalysis(result); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "语法分析失败"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sentenceId, sentence, apiKeyMissing]);

  return (
    <div className="grammar-panel">
      {apiKeyMissing && (
        <div className="grammar-error">请先配置 DeepSeek API Key（在首页设置）</div>
      )}
      {loading && <div className="grammar-loading">正在分析语法结构...</div>}
      {error && <div className="grammar-error">{error}</div>}
      {analysis && <GrammarDisplay analysis={analysis} />}
    </div>
  );
}
