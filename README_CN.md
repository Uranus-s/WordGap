<p align="right">
  <a href="README.md">English</a> | <a href="README_CN.md">中文</a>
</p>

<p align="center">
  <h1 align="center">WordGap</h1>
  <p align="center"><strong>不只是背单词，让单词长在脑子里。</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/react-19-61dafb" alt="React 19">
  <img src="https://img.shields.io/badge/typescript-6-3178c6" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/offline--first-Dexie.js-ff69b4" alt="Offline-first">
</p>

WordGap 是一款基于填空模式的英语词汇训练工具。它不靠闪卡死记硬背，而是把每个单词放在**真实语境**中让你回忆——你的大脑自然会因为上下文而记住它。

### 为什么是 WordGap？

市面上的背单词工具大多让你看单词、看翻译、划一下——转头就忘。WordGap 的思路相反：**让你从真实句子中补全缺失的单词**，通过语境建立深层记忆。再加上 AI 语法拆解、音标朗读、以及刚好在你快忘记时把单词送回来的艾宾浩斯调度器——这才是一个真正有效的学习闭环。

### 三种练习模式，逐级进阶

| 模式 | 你在做什么 | 适合场景 |
|---|---|---|
| **字母填空** | 逐字母拼出缺失单词 | 练拼写、熟悉词形 |
| **单词填空** | 回忆并输入完整单词 | 词汇识别和主动回忆 |
| **整句默写** | 看中文翻译，写出完整英文句子 | 语法+词汇综合输出 |

难度会随你的进步自动升级：更多单词被挖空、功能词也开始参与填空、复习间隔逐步拉长。

### 功能亮点

- **语境学习** — 每个单词都出现在真实句子中，不是在卡片上孤立记忆
- **三种输入模式** — 从拼写提示到全文默写，按你的水平选择难度
- **艾宾浩斯间隔复习** — [1, 2, 4, 7, 15, 30] 天自动排期，正确+15分，错误-10分
- **AI 语法分析** — DeepSeek 拆解句子成分，让你知道*为什么*这么用，而不只是*是什么*
- **IPA 音标** — 内置高频词典 + Free Dictionary API 在线补全
- **TTS 发音** — 浏览器原生 Web Speech API，支持语速调节
- **多数据源** — 内置题库、Tatoeba 在线搜索、JSON/CSV 自定义导入，自由扩展
- **离线优先** — Dexie.js + IndexedDB，全部数据本地存储，没网也能刷题
- **全键盘操作** — Alt 组合键覆盖所有操作，练习中不用碰鼠标
- **Claymorphism 设计** — 柔和 3D 质感，长时间盯着也不累

### 界面截图

> *即将补充 — Practice、Library、Stats 页面截图*

## 快速开始

```bash
git clone https://github.com/Uranus-s/wordgap.git
cd wordgap
npm install
npm run dev        # → http://localhost:5173
```

打开浏览器就能用。先去**题库**逛逛内置句子，或者直接回首页开始**练习**。

### 配置 AI 语法分析

语法分析用的是 DeepSeek，不配置也能用，但强烈建议加上：

1. 去 [platform.deepseek.com](https://platform.deepseek.com/) 免费注册拿 API Key
2. 在首页粘贴（存 `localStorage`，不出浏览器）
3. 每轮练习结束后自动展示句子语法拆解

不配 API Key 的话，练习、音标、TTS、间隔复习这些全部正常运作，只是没有语法分析。

## 技术栈

| 层级 | 选型 | 理由 |
|---|---|---|
| UI | React 19 + TypeScript 6 | 类型安全、Hooks 生态、现代化 |
| 构建 | Vite 8 | 毫秒级热更新，原生 ESM |
| 路由 | React Router DOM 7 | 客户端路由，URL 参数控制模式 |
| 存储 | Dexie.js 4 | Promise 风格的 IndexedDB 封装 |
| AI | DeepSeek API | 性价比高的语法分析，本地缓存结果 |
| TTS | Web Speech API | 零依赖浏览器原生能力 |
| 测试 | Vitest 4 | Vite 原生，和 Jest 断言兼容 |

## 项目结构

```
src/
├── pages/              # Home, Practice, Library, Stats 四大页面
├── components/         # SentenceDisplay, PostExercise, GrammarPanel, Timer 等组件
├── db/                 # Dexie.js 表结构（sentences/progress/vocabulary/grammar）
├── engine/             # 填空遮罩生成、难度规则、答案判分
├── services/             # DeepSeek 语法 API、音标查询服务
├── sources/            # 可插拔数据源（内置、Tatoeba、用户导入）
├── spaced-repetition/  # 艾宾浩斯调度器（掌握度每轮 ±15/-10）
├── tts/                # Web Speech API 封装 + 语音选择
├── styles/             # Claymorphism 风格 CSS 变量体系
└── types.ts            # 全局 TypeScript 类型定义
```

## 许可证

MIT — 随便用，随便改，随便分发。

---

<p align="center">
  <sub>为想要真正记住单词的人而建。</sub>
</p>
