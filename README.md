<p align="right">
  <a href="README.md">English</a> | <a href="README_CN.md">中文</a>
</p>

<p align="center">
  <h1 align="center">WordGap</h1>
  <p align="center"><strong>Stop memorizing. Start remembering.</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/react-19-61dafb" alt="React 19">
  <img src="https://img.shields.io/badge/typescript-6-3178c6" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/offline--first-Dexie.js-ff69b4" alt="Offline-first">
</p>

WordGap is a fill-in-the-blank English vocabulary trainer that makes words stick — not through flashcards, but through contextual sentence practice. Each word you learn appears **inside real sentences**, so your brain encodes it with meaning, not just memorization.

### Why WordGap?

Most vocabulary tools show you a word and its translation. You swipe. You forget. WordGap flips the approach: **you fill in missing words from real sentences**, building recall strength through context. Add AI-powered grammar breakdowns, phonetics, and an Ebbinghaus scheduler that brings words back just before you forget them — and you've got a system that actually works.

### The Three Modes

| Mode | What you do | Best for |
|---|---|---|
| **Letter-fill** | Type each letter of the missing word | Spelling mastery |
| **Word-fill** | Recall and type the full word | Word recognition |
| **Sentence dictation** | Reconstruct the whole sentence from a Chinese hint | Active recall + grammar |

As you improve, the difficulty scales: more words get masked, function words stop being excluded, and the scheduler spaces reviews further apart.

### Features

- **Context-driven learning** — every word is practiced inside a real sentence, not in isolation
- **Three input modes** — spelling, word recall, or full sentence reconstruction — choose what challenges you
- **Ebbinghaus spaced repetition** — [1, 2, 4, 7, 15, 30]-day intervals, auto-scheduled
- **AI grammar analysis** — DeepSeek breaks down sentence structure so you understand *why*, not just *what*
- **IPA phonetics** — built-in dictionary for common words + Free Dictionary API fallback
- **TTS pronunciation** — Web Speech API with speed control, hear sentences spoken naturally
- **Pluggable sentence sources** — built-in library, Tatoeba search, or import your own via JSON/CSV
- **Offline-first** — Dexie.js + IndexedDB; all your data lives locally, works without internet
- **Full keyboard control** — Alt shortcuts for every action; no mouse needed during practice
- **Claymorphism UI** — soft 3D aesthetic that's pleasant to stare at for hours of study

### Screenshots

> *Coming soon — screenshots of Practice, Library, and Stats pages*

## Quick Start

```bash
git clone https://github.com/Uranus-s/wordgap.git
cd wordgap
npm install
npm run dev        # → http://localhost:5173
```

You're ready to practice. Browse the **Library** to explore sentences, or jump straight to **Practice** from the homepage.

### Setting up AI Grammar Analysis

WordGap uses DeepSeek for grammar breakdowns — it's optional but highly recommended:

1. Get a free API key at [platform.deepseek.com](https://platform.deepseek.com/)
2. Paste it on the homepage (stored in `localStorage`, never leaves your browser)
3. After each practice round, you'll see a full grammar analysis of every sentence

Without an API key, everything else still works — practice, phonetics, TTS, and spaced repetition.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 + TypeScript 6 | Type safety, hooks, modern ecosystem |
| Build | Vite 8 | Sub-second HMR, native ESM |
| Routing | React Router DOM 7 | Client-side routing, URL-based mode selection |
| Storage | Dexie.js 4 | Promise-based IndexedDB wrapper, offline-first |
| AI | DeepSeek API | Affordable grammar analysis with caching |
| TTS | Web Speech API | Zero-dependency browser-native speech |
| Testing | Vitest 4 | Vite-native, fast, compatible with Jest assertions |

## Project Structure

```
src/
├── pages/              # Home, Practice, Library, Stats
├── components/         # SentenceDisplay, PostExercise, GrammarPanel, Timer, etc.
├── db/                 # Dexie.js schema, queries, seed data
├── engine/             # Mask generation, difficulty rules, answer checking
├── services/             # DeepSeek grammar API, phonetics service
├── sources/            # Pluggable data sources (builtin, tatoeba, user-import)
├── spaced-repetition/  # Ebbinghaus scheduler (mastery ±15/-10 per attempt)
├── tts/                # Web Speech API wrapper with voice selection
├── styles/             # Claymorphism design system via CSS custom properties
└── types.ts            # Shared TypeScript definitions
```

## License

MIT — use it, fork it, ship it.

---

<p align="center">
  <sub>Built for learners who want words to actually stick.</sub>
</p>
