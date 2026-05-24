// src/pages/Library.tsx
import { useState, useEffect } from "react";
import type { Sentence } from "../types";
import { getAllSentences, bulkInsertSentences, getSentencesBySource, deleteSentence, deleteSentences } from "../db/queries";
import { registerSource } from "../sources/registry";
import { builtinSource } from "../sources/builtin";
import { tatoebaSource } from "../sources/tatoeba";
import { userImportSource } from "../sources/userImport";

registerSource(builtinSource);
registerSource(tatoebaSource);
registerSource(userImportSource);

export function Library() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchingTatoeba, setFetchingTatoeba] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSentences();
  }, []);

  async function loadSentences() {
    setLoading(true);
    const all = await getAllSentences();
    setSentences(all);
    setLoading(false);
  }

  const filtered = sentences.filter((s) => {
    if (search && !s.english.toLowerCase().includes(search.toLowerCase()) &&
        !s.chinese.includes(search)) return false;
    if (tagFilter && !s.tags.includes(tagFilter)) return false;
    if (difficultyFilter && s.difficulty !== parseInt(difficultyFilter)) return false;
    if (sourceFilter && s.source.type !== sourceFilter) return false;
    return true;
  });

  async function handleFetchTatoeba() {
    setFetchingTatoeba(true);
    try {
      const results = await tatoebaSource.fetchOnline({
        limit: 50,
        tags: tagFilter ? [tagFilter] : undefined,
      });
      if (results.length > 0) {
        // Deduplicate: skip sentences whose English text already exists
        const existing = await getSentencesBySource("tatoeba");
        const existingEnglish = new Set(existing.map((s) => s.english.toLowerCase()));
        const newSentences = results.filter(
          (s) => !existingEnglish.has(s.english.toLowerCase())
        );

        if (newSentences.length > 0) {
          await bulkInsertSentences(newSentences);
          await loadSentences();
          const skipped = results.length - newSentences.length;
          const msg = skipped > 0
            ? `成功获取 ${newSentences.length} 个新句子，跳过 ${skipped} 个重复`
            : `成功获取 ${newSentences.length} 个句子!`;
          alert(msg);
        } else {
          alert(`未获取到新句子，${results.length} 个句子均已存在`);
        }
      } else {
        alert("未能获取句子，请检查网络连接");
      }
    } catch (e) {
      alert("获取失败: " + (e as Error).message);
    }
    setFetchingTatoeba(false);
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      let imported: Partial<Sentence>[];

      if (file.name.endsWith(".csv")) {
        imported = parseCSV(text);
      } else {
        imported = JSON.parse(text);
      }

      const withIds: Sentence[] = imported.map((s, i) => ({
        id: `import-${Date.now()}-${i}`,
        english: s.english ?? "",
        chinese: s.chinese ?? "",
        source: { type: "user-import" as const, sentenceId: `import-${i}` },
        difficulty: (s.difficulty ?? 3) as Sentence["difficulty"],
        tags: s.tags ?? ["生活"],
        words: s.words ?? [],
      }));

      await bulkInsertSentences(withIds);
      await loadSentences();
      alert(`成功导入 ${withIds.length} 个句子!`);
    };
    input.click();
  }

  function handleExport() {
    const data = JSON.stringify(sentences, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wordgap-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  }

  async function handleDeleteOne(id: string) {
    if (!confirm("确定要删除这个句子吗？")) return;
    try {
      await deleteSentence(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadSentences();
    } catch (e) {
      alert("删除失败: " + (e as Error).message);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个句子吗？`)) return;
    try {
      await deleteSentences([...selectedIds]);
      setSelectedIds(new Set());
      await loadSentences();
    } catch (e) {
      alert("批量删除失败: " + (e as Error).message);
    }
  }

  const allTags = [...new Set(sentences.flatMap((s) => s.tags))];

  return (
    <div className="page library-page">
      <div className="library-header">
        <h2>题库管理</h2>
        <div className="library-stats">
          共 {sentences.length} 句
          {" · "}
          内置 {sentences.filter((s) => s.source.type === "builtin").length} 句
          {" · "}
          Tatoeba {sentences.filter((s) => s.source.type === "tatoeba").length} 句
          {" · "}
          导入 {sentences.filter((s) => s.source.type === "user-import").length} 句
        </div>
      </div>

      <div className="library-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="搜索单词或句子..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">全部分类</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
          <option value="">全部难度</option>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>L{d}</option>
          ))}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">全部来源</option>
          <option value="builtin">内置</option>
          <option value="tatoeba">Tatoeba</option>
          <option value="user-import">用户导入</option>
        </select>
      </div>

      <div className="library-actions">
        <button
          className="action-btn primary"
          onClick={handleFetchTatoeba}
          disabled={fetchingTatoeba}
        >
          {fetchingTatoeba ? "获取中..." : "🌐 从 Tatoeba 获取"}
        </button>
        <button className="action-btn" onClick={handleImport}>
          📥 导入文件
        </button>
        <button className="action-btn" onClick={handleExport}>
          📤 导出
        </button>
      </div>

      {selectedIds.size > 0 && (
        <button className="batch-delete-btn" onClick={handleDeleteSelected}>
          删除选中 ({selectedIds.size})
        </button>
      )}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <table className="sentence-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /></th>
              <th>#</th>
              <th>英文句子</th>
              <th>中文</th>
              <th>来源</th>
              <th className="col-difficulty">难度</th>
              <th className="col-tags">分类</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}>
                <td><input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                <td>{i + 1}</td>
                <td className="english-cell">{s.english}</td>
                <td className="chinese-cell">{s.chinese}</td>
                <td>
                  <span className={`source-badge ${s.source.type}`}>
                    {s.source.type === "builtin" ? "内置" :
                     s.source.type === "tatoeba" ? "Tatoeba" : "导入"}
                  </span>
                </td>
                <td className="col-difficulty">L{s.difficulty}</td>
                <td className="col-tags">{s.tags.join(", ")}</td>
                <td>
                  <button className="delete-row-btn" onClick={() => handleDeleteOne(s.id)} title="删除">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filtered.length === 0 && !loading && (
        <div className="empty">没有找到匹配的句子</div>
      )}
    </div>
  );
}

function parseCSV(text: string): Partial<Sentence>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const record: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (h === "difficulty") record[h] = parseInt(values[i]) || 3;
      else if (h === "tags") record[h] = values[i]?.split(";") ?? [];
      else record[h] = values[i] ?? "";
    });
    return record as Partial<Sentence>;
  });
}
