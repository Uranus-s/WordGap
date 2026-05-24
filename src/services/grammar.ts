import type { WordAnalysis, SentenceComponent, GrammarAnalysis } from "../types";
import { fetchPhonetics } from "./phonetics";
import { getGrammarAnalysis, saveGrammarAnalysis } from "../db/queries";

interface DeepSeekResponse {
  choices: { message: { content: string } }[];
}

interface ParsedGrammar {
  words: { word: string; pos: string; meaning: string; phonetic?: string }[];
  components: { role: string; startIndex: number; endIndex: number }[];
}

const POS_LABELS: Record<string, string> = {
  noun: "名词",
  verb: "动词",
  adj: "形容词",
  adv: "副词",
  prep: "介词",
  art: "冠词",
  pron: "代词",
  conj: "连词",
  det: "限定词",
  modal: "情态动词",
  aux: "助动词",
  num: "数词",
  interj: "感叹词",
};

const ROLE_LABELS: Record<string, string> = {
  subject: "主语",
  predicate: "谓语",
  object: "宾语",
  attributive: "定语",
  adverbial: "状语",
  complement: "补语",
};

function getApiKey(): string | null {
  return localStorage.getItem("deepseek-api-key");
}

function shouldFetchPhoneticsFromDeepSeek(): boolean {
  return localStorage.getItem("deepseek-phonetics") === "true";
}

async function callDeepSeek(sentence: string): Promise<ParsedGrammar> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("DeepSeek API Key 未配置");

  const includePhonetics = shouldFetchPhoneticsFromDeepSeek();
  const phoneticReq = includePhonetics
    ? "\n3. 每个词需要包含 phonetic 字段（IPA 音标，如 /kæt/）"
    : "";
  const phoneticFormat = includePhonetics
    ? ',"phonetic":"/.../"'
    : "";

  const prompt = `分析以下英文句子的语法结构，返回 JSON 格式：

句子："${sentence}"

要求：
1. words: 每个词的词性(pos)和中文释义(meaning)
2. components: 句子成分划分，每个成分包含 role 和对应的词索引范围(startIndex, endIndex，包含)${phoneticReq}

词性使用: noun, verb, adj, adv, prep, art, pron, conj, det, modal, aux, num, interj
句子成分使用: subject, predicate, object, attributive, adverbial, complement

返回纯 JSON，格式：{"words":[{"word":"...","pos":"...","meaning":"..."${phoneticFormat}}],"components":[{"role":"...","startIndex":0,"endIndex":1}]}`;

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API 错误: ${res.status}`);
  }

  const data: DeepSeekResponse = await res.json();
  const content = data.choices[0]?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("无法解析 API 返回的 JSON");

  return JSON.parse(jsonMatch[0]) as ParsedGrammar;
}

export async function analyzeGrammar(
  sentenceId: string,
  sentence: string
): Promise<GrammarAnalysis> {
  const cached = await getGrammarAnalysis(sentenceId);
  if (cached) return cached;

  const deepSeekPhonetics = shouldFetchPhoneticsFromDeepSeek();

  let parsed: ParsedGrammar;
  let phonetics: Map<string, string> | null = null;

  if (deepSeekPhonetics) {
    parsed = await callDeepSeek(sentence);
  } else {
    [parsed, phonetics] = await Promise.all([
      callDeepSeek(sentence),
      fetchPhonetics(sentence.split(/\s+/)),
    ]);
  }

  const words: WordAnalysis[] = parsed.words.map((w) => ({
    word: w.word,
    pos: w.pos,
    posLabel: POS_LABELS[w.pos] || w.pos,
    meaning: w.meaning,
    phonetic: deepSeekPhonetics
      ? w.phonetic
      : phonetics?.get(w.word.toLowerCase()),
  }));

  const components: SentenceComponent[] = parsed.components.map((c) => ({
    role: c.role,
    roleLabel: ROLE_LABELS[c.role] || c.role,
    startIndex: c.startIndex,
    endIndex: c.endIndex,
  }));

  const analysis: GrammarAnalysis = {
    sentenceId,
    words,
    components,
    createdAt: Date.now(),
  };

  await saveGrammarAnalysis(analysis);
  return analysis;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}
