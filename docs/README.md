# 📚 SaralAI — Documentation

> **Voice-First Government Services Assistant for Indian Citizens**
> 
> This folder contains all planning, architecture, and learning documents for the SaralAI project. Store or publish this on GitHub for quick future reference.

---

## 📂 Documents in This Folder

| File | Description |
|------|-------------|
| [`01_Project_Status.md`](./01_Project_Status.md) | UI/UX flow overview — all 11 screens, routes, navigation map, design system |
| [`02_Complete_Document.md`](./02_Complete_Document.md) | Master technical reference — frontend breakdown, architecture, data flow, verification |
| [`03_Backend_Plan.md`](./03_Backend_Plan.md) | Full backend plan — FastAPI, Gemini, STT/TTS, PostgreSQL, Railway deployment |
| [`04_Learning_Book.md`](./04_Learning_Book.md) | Line-by-line Python & backend learning guide alongside the SaralAI codebase |

---

## 🚀 Quick Start (Frontend)

```bash
cd c:\Users\siddh\Desktop\SaralAI
npm run dev
```
Then open **http://localhost:5173** in your browser.

---

## 🗺️ Project Overview

**SaralAI (सरल AI)** — "Simple AI" in Hindi — is a voice-first AI assistant that helps Indian citizens understand government welfare schemes in plain, simple language.

### What's Built ✅

- **12 screens** — Full frontend (Vite + Vanilla JS)
- **Client-side AI engine** — Keyword-based scheme search + intent detection
- **11 government schemes** — Curated data in `src/Schemes.json`
- **Voice input** — Web Speech API integration
- **Navigation** — Hash-based router with full state management

### What's Planned 🔨

- **Backend API** — FastAPI (Python) with Gemini LLM
- **Real STT/TTS** — Google Cloud Speech for Indian languages
- **Database** — PostgreSQL on Railway
- **PWA + Deployment** — Vercel/Railway hosting

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + Vanilla JS |
| Styling | Pure CSS (design system with CSS variables) |
| Backend (planned) | FastAPI (Python) |
| AI (planned) | Google Gemini 1.5 Flash |
| STT (planned) | Google Cloud Speech-to-Text |
| TTS (planned) | Google Cloud Text-to-Speech |
| Database (planned) | PostgreSQL on Railway |

---

## 📌 Key Links

- **Scheme data**: [`src/Schemes.json`](../src/Schemes.json)
- **Frontend entry**: [`src/main.js`](../src/main.js)
- **Design system**: [`src/styles/index.css`](../src/styles/index.css)
- **AI engine**: [`src/ai.js`](../src/ai.js)

---

*Last updated: March 2026 · MVP Frontend Complete*
