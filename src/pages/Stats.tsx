// src/pages/Stats.tsx
import { useState, useEffect } from "react";
import { getTotalProgressCount, getTodayProgress, getAllVocabulary, getDueForReview } from "../db/queries";
import type { Vocabulary } from "../types";

export function Stats() {
  const [totalExercises, setTotalExercises] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [todayCorrect, setTodayCorrect] = useState(0);
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [dueReview, setDueReview] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [total, today, vocab, due] = await Promise.all([
        getTotalProgressCount(),
        getTodayProgress(),
        getAllVocabulary(),
        getDueForReview(),
      ]);

      setTotalExercises(total);
      setTodayCount(today.length);
      setTodayCorrect(today.filter((p) => p.correct).length);
      setVocabList(vocab);
      setDueReview(due);
      setLoading(false);
    }
    load();
  }, []);

  const todayAccuracy = todayCount > 0
    ? Math.round((todayCorrect / todayCount) * 100)
    : 0;

  const mastered = vocabList.filter((v) => v.mastery >= 80).length;

  // Mastery distribution: 0-20%, 20-40%, 40-60%, 60-80%, 80-100%
  const distribution = [0, 0, 0, 0, 0];
  for (const v of vocabList) {
    const bucket = Math.min(Math.floor(v.mastery / 20), 4);
    distribution[bucket]++;
  }
  const maxDist = Math.max(...distribution, 1);

  if (loading) return <div className="page stats-page"><div className="loading">加载中...</div></div>;

  return (
    <div className="page stats-page">
      <h2>学习统计</h2>

      <div className="summary-cards">
        <div className="stat-card blue">
          <div className="stat-value">{totalExercises}</div>
          <div className="stat-label">总练习次数</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{todayAccuracy}%</div>
          <div className="stat-label">今日正确率</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-value">{mastered}</div>
          <div className="stat-label">已掌握单词</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{dueReview.length}</div>
          <div className="stat-label">待复习</div>
        </div>
      </div>

      <h3>掌握度分布</h3>
      <div className="mastery-chart">
        <div className="chart-bars">
          {distribution.map((count, i) => (
            <div
              key={i}
              className="chart-bar"
              style={{ height: `${(count / maxDist) * 100}%` }}
            />
          ))}
        </div>
        <div className="chart-labels">
          <span>0-20%</span>
          <span>20-40%</span>
          <span>40-60%</span>
          <span>60-80%</span>
          <span>80-100%</span>
        </div>
      </div>

      <h3>待复习（艾宾浩斯排期）</h3>
      {dueReview.length === 0 ? (
        <div className="empty">暂无待复习单词</div>
      ) : (
        <table className="review-table">
          <thead>
            <tr>
              <th>单词</th>
              <th>掌握度</th>
              <th>练习次数</th>
              <th>上次练习</th>
              <th>下次复习</th>
            </tr>
          </thead>
          <tbody>
            {dueReview.slice(0, 20).map((v) => (
              <tr key={v.word}>
                <td className="word-cell">{v.word}</td>
                <td>
                  <span className="mastery-dots">
                    {"●".repeat(Math.ceil(v.mastery / 20))}
                    {"○".repeat(5 - Math.ceil(v.mastery / 20))}
                  </span>
                </td>
                <td>{v.attempts}</td>
                <td>{formatDate(v.lastSeen)}</td>
                <td>
                  <span className={`review-badge ${isToday(v.nextReview) ? "today" : ""}`}>
                    {formatDate(v.nextReview)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "明天";
  if (diffDays === -1) return "昨天";
  if (diffDays < 0) return `${-diffDays}天前`;
  return `${diffDays}天后`;
}

function isToday(date: Date): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}
