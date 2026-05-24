interface DictionaryEntry {
  phonetic?: string;
  phonetics: { text?: string }[];
}

const COMMON_PHONETICS: Record<string, string> = {
  the: "/ðə/",
  a: "/ə/",
  an: "/ən/",
  is: "/ɪz/",
  are: "/ɑːr/",
  was: "/wɒz/",
  were: "/wɜːr/",
  be: "/biː/",
  been: "/biːn/",
  being: "/ˈbiːɪŋ/",
  have: "/hæv/",
  has: "/hæz/",
  had: "/hæd/",
  do: "/duː/",
  does: "/dʌz/",
  did: "/dɪd/",
  will: "/wɪl/",
  would: "/wʊd/",
  shall: "/ʃæl/",
  should: "/ʃʊd/",
  can: "/kæn/",
  could: "/kʊd/",
  may: "/meɪ/",
  might: "/maɪt/",
  must: "/mʌst/",
  i: "/aɪ/",
  you: "/juː/",
  he: "/hiː/",
  she: "/ʃiː/",
  it: "/ɪt/",
  we: "/wiː/",
  they: "/ðeɪ/",
  me: "/miː/",
  him: "/hɪm/",
  her: "/hɜːr/",
  us: "/ʌs/",
  them: "/ðem/",
  my: "/maɪ/",
  your: "/jɔːr/",
  his: "/hɪz/",
  its: "/ɪts/",
  our: "/aʊər/",
  their: "/ðer/",
  this: "/ðɪs/",
  that: "/ðæt/",
  these: "/ðiːz/",
  those: "/ðoʊz/",
  in: "/ɪn/",
  on: "/ɒn/",
  at: "/æt/",
  to: "/tuː/",
  for: "/fɔːr/",
  with: "/wɪð/",
  from: "/frɒm/",
  by: "/baɪ/",
  of: "/ɒv/",
  up: "/ʌp/",
  out: "/aʊt/",
  if: "/ɪf/",
  or: "/ɔːr/",
  and: "/ænd/",
  but: "/bʌt/",
  not: "/nɒt/",
  no: "/noʊ/",
  so: "/soʊ/",
  as: "/æz/",
  about: "/əˈbaʊt/",
  after: "/ˈæftər/",
  before: "/bɪˈfɔːr/",
  between: "/bɪˈtwiːn/",
  into: "/ˈɪntuː/",
  through: "/θruː/",
  during: "/ˈdjʊərɪŋ/",
  without: "/wɪˈðaʊt/",
  again: "/əˈɡen/",
  there: "/ðer/",
  here: "/hɪr/",
  where: "/wer/",
  when: "/wen/",
  what: "/wɒt/",
  which: "/wɪtʃ/",
  who: "/huː/",
  how: "/haʊ/",
  why: "/waɪ/",
  all: "/ɔːl/",
  each: "/iːtʃ/",
  every: "/ˈevri/",
  both: "/boʊθ/",
  few: "/fjuː/",
  more: "/mɔːr/",
  most: "/moʊst/",
  other: "/ˈʌðər/",
  some: "/sʌm/",
  any: "/ˈeni/",
  many: "/ˈmeni/",
  much: "/mʌtʃ/",
  very: "/ˈveri/",
  just: "/dʒʌst/",
  also: "/ˈɔːlsoʊ/",
  than: "/ðæn/",
  then: "/ðen/",
  now: "/naʊ/",
  only: "/ˈoʊnli/",
  still: "/stɪl/",
  too: "/tuː/",
  well: "/wel/",
};

export async function fetchPhonetic(word: string): Promise<string | undefined> {
  const lower = word.toLowerCase();
  if (COMMON_PHONETICS[lower]) return COMMON_PHONETICS[lower];

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lower)}`
    );
    if (!res.ok) return undefined;
    const data: DictionaryEntry[] = await res.json();
    const phonetic =
      data[0]?.phonetics?.find((p) => p.text)?.text || data[0]?.phonetic;
    return phonetic || undefined;
  } catch {
    return undefined;
  }
}

export async function fetchPhonetics(
  words: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(words.map((w) => w.toLowerCase()))];
  const results = new Map<string, string>();

  const toFetch: string[] = [];
  for (const word of unique) {
    if (COMMON_PHONETICS[word]) {
      results.set(word, COMMON_PHONETICS[word]);
    } else {
      toFetch.push(word);
    }
  }

  await Promise.allSettled(
    toFetch.map(async (word) => {
      const phonetic = await fetchPhonetic(word);
      if (phonetic) results.set(word, phonetic);
    })
  );

  return results;
}
