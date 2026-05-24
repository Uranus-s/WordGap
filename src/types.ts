export interface Sentence {
  id: string;
  english: string;
  chinese: string;
  source: {
    type: "builtin" | "tatoeba" | "user-import";
    sentenceId: string;
  };
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  words: WordInfo[];
}

export interface WordInfo {
  text: string;
  lemma: string;
  pos: string;
  difficulty: Difficulty;
}

export interface Progress {
  id?: number;
  sentenceId: string;
  date: Date;
  correct: boolean;
  timeSpent: number;
  hintsUsed: number;
  mode: FillMode;
}

export interface Vocabulary {
  word: string;
  mastery: number;
  attempts: number;
  correct: number;
  lastSeen: Date;
  nextReview: Date;
  history: { date: Date; correct: boolean }[];
}

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type FillMode = "letter" | "word" | "sentence";

export interface MaskedSentence {
  tokens: MaskedToken[];
  targets: TargetWord[];
}

export interface MaskedToken {
  index: number;
  type: "normal" | "masked";
  text: string;
  original?: string;
  revealCount?: number;
  prefix?: string;
  suffix?: string;
}

export interface TargetWord {
  wordIndex: number;
  text: string;
  mode: FillMode;
  maskCount: number;
}

export interface WordAnalysis {
  word: string;
  pos: string;
  posLabel: string;
  meaning: string;
  phonetic?: string;
}

export interface SentenceComponent {
  role: string;
  roleLabel: string;
  startIndex: number;
  endIndex: number;
}

export interface GrammarAnalysis {
  sentenceId: string;
  words: WordAnalysis[];
  components: SentenceComponent[];
  createdAt: number;
}
