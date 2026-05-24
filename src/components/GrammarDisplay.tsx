import type { GrammarAnalysis } from "../types";

const POS_COLORS: Record<string, string> = {
  noun: "#3498db",
  verb: "#27ae60",
  adj: "#f39c12",
  adv: "#e67e22",
  prep: "#9b59b6",
  art: "#e74c3c",
  pron: "#1abc9c",
  conj: "#95a5a6",
  det: "#e74c3c",
  modal: "#27ae60",
  aux: "#27ae60",
  num: "#f39c12",
  interj: "#e67e22",
};

const ROLE_COLORS: Record<string, string> = {
  subject: "#e74c3c",
  predicate: "#27ae60",
  object: "#3498db",
  attributive: "#f39c12",
  adverbial: "#9b59b6",
  complement: "#1abc9c",
};

interface Props {
  analysis: GrammarAnalysis;
}

export function GrammarDisplay({ analysis }: Props) {
  const { words, components } = analysis;

  return (
    <div className="grammar-display">
      <div className="grammar-groups">
        {components.map((comp, i) => {
          const groupWords = words.slice(comp.startIndex, comp.endIndex + 1);
          const color = ROLE_COLORS[comp.role] || "#999";
          return (
            <div key={i} className="grammar-group" style={{ borderColor: color }}>
              <div className="grammar-group-label" style={{ color }}>
                {comp.roleLabel}
              </div>
              <div className="grammar-group-words">
                {groupWords.map((word, j) => (
                  <div key={j} className="grammar-word-item">
                    <div className="grammar-word-text">{word.word}</div>
                    <div className="grammar-word-phonetic">
                      {word.phonetic || " "}
                    </div>
                    <div
                      className="grammar-word-pos"
                      style={{
                        backgroundColor: `${POS_COLORS[word.pos] || "#999"}18`,
                        color: POS_COLORS[word.pos] || "#999",
                      }}
                    >
                      {word.posLabel}
                    </div>
                    <div className="grammar-word-meaning">{word.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
