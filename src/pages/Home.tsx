import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTodayProgress, countSentences } from "../db/queries";
import type { FillMode } from "../types";

interface ModeOption {
  mode: FillMode;
  icon: string;
  title: string;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: "letter", icon: "🔤", title: "字母填空", description: "单词缺少部分字母，补全即可" },
  { mode: "word", icon: "📝", title: "单词填空", description: "句子中缺少整个单词" },
  { mode: "sentence", icon: "✍️", title: "整句翻译", description: "只看中文，写出完整英文句子" },
];

function DifficultyModal({ onSelect, onClose }: { onSelect: (mode: FillMode) => void; onClose: () => void }) {
  return (
    <div className="difficulty-modal-overlay" onClick={onClose}>
      <div className="difficulty-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="difficulty-modal-title">选择练习模式</h2>
        <div className="mode-cards">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              className="mode-card"
              onClick={() => onSelect(opt.mode)}
            >
              <span className="mode-card-icon">{opt.icon}</span>
              <div className="mode-card-content">
                <div className="mode-card-title">{opt.title}</div>
                <div className="mode-card-desc">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
        <button className="difficulty-modal-cancel" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [todayCorrect, setTodayCorrect] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      const [today, total] = await Promise.all([
        getTodayProgress(),
        countSentences(),
      ]);
      setTodayCount(today.length);
      setTodayCorrect(today.filter((p) => p.correct).length);
      setTotalSentences(total);

      const { getDueForReview } = await import("../db/queries");
      const due = await getDueForReview();
      setDueCount(due.length);
    }
    load();
  }, []);

  const handleModeSelect = (mode: FillMode) => {
    setShowModal(false);
    navigate(`/practice?mode=${mode}`);
  };

  return (
    <div className="page home-page">
      <div className="home-hero">
        <h1 className="app-title">WordGap</h1>
        <p className="app-subtitle">单词填空 · 轻松记忆</p>

        {todayCount > 0 && (
          <div className="today-summary">
            今日已练 {todayCount} 题
            {todayCount > 0 && ` · 正确率 ${Math.round((todayCorrect / todayCount) * 100)}%`}
            {dueCount > 0 && ` · ${dueCount} 个单词待复习`}
          </div>
        )}

        <div className="start-btn-wrapper">
          <button
            className="start-btn"
            onClick={() => setShowModal(true)}
          >
            ▶ 开始练习
          </button>
        </div>
      </div>

      <div className="home-cards">
        <div className="home-card" onClick={() => navigate("/library")}>
          <div className="card-icon">📚</div>
          <div className="card-title">题库管理</div>
          <div className="card-desc">{totalSentences} 句 · 3 个来源</div>
        </div>

        <div className="home-card" onClick={() => navigate("/stats")}>
          <div className="card-icon">📊</div>
          <div className="card-title">学习统计</div>
          <div className="card-desc">掌握度 · 历史 · 复习</div>
        </div>
      </div>

      <div className="api-key-section">
        <h3>语法分析设置</h3>
        <label className="api-key-label">
          DeepSeek API Key
          <input
            type="password"
            className="api-key-input"
            defaultValue={localStorage.getItem("deepseek-api-key") || ""}
            placeholder="sk-..."
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val) {
                localStorage.setItem("deepseek-api-key", val);
              } else {
                localStorage.removeItem("deepseek-api-key");
              }
            }}
          />
        </label>
        <p className="api-key-hint">
          用于语法分析功能。
          <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">
            获取 API Key →
          </a>
        </p>
        <label className="api-key-label" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            defaultChecked={localStorage.getItem("deepseek-phonetics") === "true"}
            onChange={(e) => {
              localStorage.setItem("deepseek-phonetics", String(e.target.checked));
            }}
          />
          使用 DeepSeek 获取音标（更完整，消耗少量额外 token）
        </label>
      </div>

      {showModal && (
        <DifficultyModal
          onSelect={handleModeSelect}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
