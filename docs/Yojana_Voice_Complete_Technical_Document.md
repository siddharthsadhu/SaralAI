# Yojana Voice — Complete Technical Reference Document
### *Government Scheme Assistant powered by Sarvam AI*

---

> **Purpose of this document**
> This document is a complete, self-contained technical reference for the **Yojana Voice** project. It is written so that any developer or AI agent can fully understand the software architecture, every data flow, every API integration, and every design decision — and then re-implement the same **Sarvam AI tech-stack** inside a different frontend or backend structure without needing to read a single line of the original source code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Software Architecture](#3-software-architecture)
4. [File Structure](#4-file-structure)
5. [The Four-Stage AI Pipeline](#5-the-four-stage-ai-pipeline)
   - 5.1 [Stage 0 — Wikipedia Grounding (Free, No Key)](#51-stage-0--wikipedia-grounding-free-no-key)
   - 5.2 [Stage 1 — Speech-to-Text · Saaras v3](#52-stage-1--speech-to-text--saaras-v3)
   - 5.3 [Stage 2 — LLM Summarisation · sarvam-m](#53-stage-2--llm-summarisation--sarvam-m)
   - 5.4 [Stage 3 — Translation · Mayura v1](#54-stage-3--translation--mayura-v1)
   - 5.5 [Stage 4 — Text-to-Speech · Bulbul v3](#55-stage-4--text-to-speech--bulbul-v3)
6. [Complete Data Flow Diagram](#6-complete-data-flow-diagram)
7. [API Reference — All Endpoints](#7-api-reference--all-endpoints)
8. [Services Layer — Full Implementation Details](#8-services-layer--full-implementation-details)
9. [UI Layer — App Structure & Session State](#9-ui-layer--app-structure--session-state)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Text Processing Utilities](#11-text-processing-utilities)
12. [Language & Speaker Configuration](#12-language--speaker-configuration)
13. [Scheme Category System](#13-scheme-category-system)
14. [Configuration & Environment](#14-configuration--environment)
15. [Dependencies & Installation](#15-dependencies--installation)
16. [Key Design Decisions](#16-key-design-decisions)
17. [What the Next Project Should Replicate](#17-what-the-next-project-should-replicate)

---

## 1. Project Overview

**Yojana Voice** is a multilingual voice-first web application that helps Indian citizens — farmers, daily wage workers, homemakers, and elderly people — understand government schemes in their own language.

### Core User Journey
1. A user **speaks** a scheme name in any Indian language (e.g., "PM Kisan" in Hindi) **OR types** it in English.
2. The app **transcribes** the speech and **auto-detects** the user's language.
3. It **fetches verified data** from Wikipedia and **generates** a warm, conversational explanation using an LLM.
4. The explanation is **translated** into the user's detected/chosen language.
5. On demand, the translated text is **read aloud** in the user's language with a natural-sounding voice.

### Problem It Solves
- Government scheme information is complex, jargon-heavy, and only available in English.
- Rural and semi-urban citizens cannot access or understand official government portals.
- LLMs tend to hallucinate scheme details (wrong amounts, wrong eligibility). This project solves that with a **Wikipedia-grounding strategy**.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **UI / Frontend** | Streamlit | ≥ 1.31.0 |
| **Language** | Python | 3.10+ |
| **HTTP Client** | `requests` | ≥ 2.31.0 |
| **Config** | `python-dotenv` | ≥ 1.0.0 |
| **STT API** | Sarvam AI — Saaras v3 | Latest |
| **LLM API** | Sarvam AI — sarvam-m | Latest |
| **Translation API** | Sarvam AI — Mayura v1 | Latest |
| **TTS API** | Sarvam AI — Bulbul v3 | Latest |
| **Knowledge Source** | Wikipedia REST API | Free |
| **Fonts** | Google Fonts — Inter | 400–800 |

---

## 3. Software Architecture

The application follows a **strict two-layer architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│                       app.py                             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Hero UI  │  │ Speak Tab│  │ Type Tab │  │Results │  │
│  │ Header   │  │ (Voice)  │  │ (Text)   │  │Section │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                          │
│         Session State (st.session_state)                 │
│  transcript · detected_lang · english_summary            │
│  translated_summary · tts_audio_bytes                    │
│  source_url · source_type                                │
└───────────────────────┬─────────────────────────────────┘
                        │ function calls
┌───────────────────────▼─────────────────────────────────┐
│                    SERVICES LAYER                        │
│                     services.py                          │
│                                                          │
│  fetch_scheme_from_wikipedia()  ← Wikipedia API (free)  │
│  transcribe_audio()             ← Saaras v3 (STT)       │
│  summarize_scheme()             ← sarvam-m (LLM)         │
│  translate_summary()            ← Mayura v1 (NMT)        │
│  text_to_speech()               ← Bulbul v3 (TTS)        │
│  clean_llm_output()             ← Text utility           │
│  clean_text_for_tts()           ← Text utility           │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS REST calls
          ┌─────────────┼─────────────────┐
          ▼             ▼                 ▼
   Wikipedia API   Sarvam AI APIs     (all external)
```

### Architecture Principles
- **No shared global mutable state** — all results flow through Streamlit's `st.session_state` dictionary.
- **Zero API cost for data fetching** — Wikipedia is queried with no API key.
- **TTS is always on-demand** — it's never called automatically; only when the user explicitly clicks "Listen".
- **Single API Key** — all Sarvam AI services use one key (`SARVAM_API_KEY`).
- **Stateless services** — `services.py` contains pure functions; no class instances, no persistent connections.

---

## 4. File Structure

```
Sarvam/
├── .env                        # API key (never committed to git)
│   └── SARVAM_API_KEY=sk_...
│
├── requirements.txt             # Python dependencies (3 packages)
│   ├── requests>=2.31.0
│   ├── python-dotenv>=1.0.0
│   └── streamlit>=1.31.0
│
├── govt_scheme_summarizer.py    # V1 prototype / standalone script
│   └── (Original exploration: LLM + translation only, no STT/TTS/Wikipedia)
│
└── services.py                  # V2 Production services layer
    + app.py                     # V2 Production Streamlit UI
```

> **Note on `govt_scheme_summarizer.py`**: This is the original v1 prototype that only covered LLM summarisation and translation (no STT, no TTS, no Wikipedia grounding). It is useful as a minimal standalone script to demonstrate the core LLM + Translation pattern. `services.py` and `app.py` are the full production implementation (v2).

---

## 5. The Four-Stage AI Pipeline

The pipeline has **4 sequential stages** with a **0th stage** (Wikipedia fetch) that runs before the LLM.

### 5.1 Stage 0 — Wikipedia Grounding (Free, No Key)

**Purpose**: Fetch a verified, authoritative article about the scheme so the LLM has zero opportunity to hallucinate.

**Function**: `fetch_scheme_from_wikipedia(scheme_name: str) -> dict | None`

**How it works** (two-step Wikipedia API call):

**Step 1 — Search:**
```
GET https://en.wikipedia.org/w/api.php
  ?action=query
  &list=search
  &srsearch={scheme_name} India government scheme
  &srlimit=5
  &format=json
  &utf8=1
```
Returns up to 5 search results with `pageid` and `title`.

**Step 2 — Fetch Extract:**
For each result (up to 3 tried), fetch the plain-text article content:
```
GET https://en.wikipedia.org/w/api.php
  ?action=query
  &prop=extracts
  &pageids={pageid}
  &explaintext=True
  &exlimit=1
  &format=json
```

**Quality Guards:**
- Skip pages with `(disambiguation)` in the title.
- Skip pages with content shorter than 250 characters.
- Skip pages whose first 300 chars contain "may refer to" (disambiguation text).
- Truncate article to first **4000 characters** before passing to LLM (to stay within context limits).

**Return Value:**
```python
{
    "title":   str,   # Wikipedia article title
    "content": str,   # Plain-text extract (max 4000 chars)
    "url":     str,   # Full Wikipedia URL for attribution
}
# Returns None if no valid article found
```

**Fallback behaviour**: If `None` is returned, `summarize_scheme()` falls back to using sarvam-m's built-in training knowledge (with `wiki_grounding=True` and a strict honesty prompt).

---

### 5.2 Stage 1 — Speech-to-Text · Saaras v3

**Purpose**: Convert the user's voice recording into text and detect their language.

**Function**: `transcribe_audio(audio_bytes: bytes, api_key: str) -> dict`

**Endpoint**: `POST https://api.sarvam.ai/speech-to-text`

**Request (multipart/form-data):**
```
Headers:
  api-subscription-key: {api_key}

Form fields:
  file  = ("audio.wav", BytesIO(audio_bytes), "audio/wav")
  model = "saaras:v3"
  mode  = "transcribe"
```

**Response:**
```json
{
  "transcript": "पीएम किसान के बारे में बताइए",
  "language_code": "hi-IN"
}
```

**Return Value:**
```python
{
    "transcript":    str,   # Transcribed text
    "language_code": str,   # BCP-47 code, e.g. "hi-IN". Defaults to "en-IN" if missing.
}
```

**Key Detail**: The `language_code` returned by Saaras v3 is directly used as the target language for **all subsequent pipeline stages** (translation + TTS). This is how language is auto-detected — Saaras is the source of truth.

**Failure modes handled:**
- Empty `audio_bytes` → raises `AudioError` before API call.
- Empty `transcript` in response → raises `AudioError("No speech detected")`.
- HTTP 403 → `InvalidKeyError`.
- HTTP 429 → `QuotaExceededError`.

---

### 5.3 Stage 2 — LLM Summarisation · sarvam-m

**Purpose**: Generate a warm, conversational, factually-grounded English explanation of the scheme.

**Function**: `summarize_scheme(scheme_name: str, api_key: str, category: str = "") -> dict`

**Endpoint**: `POST https://api.sarvam.ai/v1/chat/completions`

**This function uses two different strategies depending on Stage 0's result:**

#### Strategy A — Wikipedia-Grounded (Primary Path)

Used when `fetch_scheme_from_wikipedia()` returns a valid article.

**Request Payload:**
```json
{
    "model": "sarvam-m",
    "wiki_grounding": false,
    "messages": [
        {
            "role": "system",
            "content": "[_SYSTEM_PROMPT_WIKI — see below]"
        },
        {
            "role": "user",
            "content": "Please explain the government scheme 'PM Kisan' based ONLY on the Wikipedia article below. Do not add anything not written in this article.\n\nWikipedia Article: Pradhan Mantri Kisan Samman Nidhi\n────────────────────────────────────────────────────────────\n[article content up to 4000 chars]\n────────────────────────────────────────────────────────────"
        }
    ]
}
```

> **Critical flag**: `wiki_grounding: false` — This disables the model's internal grounding because we are supplying our OWN Wikipedia context directly. Allowing both would create conflicts.

#### Strategy B — Training Knowledge Fallback

Used when Wikipedia returns nothing.

**Request Payload:**
```json
{
    "model": "sarvam-m",
    "wiki_grounding": true,
    "messages": [
        {
            "role": "system",
            "content": "[_SYSTEM_PROMPT_FALLBACK — strict honesty]"
        },
        {
            "role": "user",
            "content": "Please explain the Indian government scheme 'MGNREGA' in a warm, conversational way. Only mention facts you are absolutely certain about."
        }
    ]
}
```

**Authentication Header:**
```
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Response parsing:**
```python
raw = response.json()["choices"][0]["message"]["content"]
clean = clean_llm_output(raw)  # Strip <think> blocks
```

**Return Value:**
```python
{
    "summary":     str,        # Clean English narrative (250-320 words)
    "source_url":  str | None, # Wikipedia URL or None
    "source_type": str,        # "wikipedia" | "training_knowledge"
}
```

#### The System Prompts (Full Text)

**`_SYSTEM_PROMPT_WIKI`** (used with Wikipedia context):
```
You are a kind, patient government helper sitting with ordinary Indian citizens — farmers, 
daily wage workers, homemakers, and elderly people — in their village. These are honest, 
hardworking people who may not have studied much but absolutely deserve to know their rights 
and the benefits they are entitled to.

Your job is to explain the given government scheme in simple, warm, conversational English — 
the way a caring elder would explain it to a younger family member.

Follow these rules carefully:
- Write in flowing paragraphs, exactly like spoken words — DO NOT use bullet points, dashes, 
  asterisks, or any markdown
- DO NOT use abbreviations — write "Pradhan Mantri" not "PM", write "rupees" not "₹"
- State amounts clearly and relatably: say "six thousand rupees every year" not "₹6,000 p.a."
- Use warm, simple words. If there is an eligibility rule, explain it like: "So, for example, 
  if you are a farmer who owns land in your family's name..."
- End with a helpful, encouraging sentence about how to apply or where to get help
- DO NOT include any website URLs or links in the body of the text
- Write between 250 and 320 words — enough to be informative but easy to listen to

MOST IMPORTANT RULE: You MUST use ONLY the information in the Wikipedia article provided. 
Do not add, guess, assume, or invent ANY detail that is not written in that article. 
If something is not mentioned, do not mention it.
```

**`_SYSTEM_PROMPT_FALLBACK`** (used without Wikipedia context):
```
You are a kind, patient government helper explaining a government scheme to ordinary Indian 
citizens — farmers, daily wage workers, and elderly people.

Explain in simple, warm, conversational English — like a caring elder speaking to family. 
No bullet points, no markdown, no rupee symbols, no URLs.

IMPORTANT HONESTY RULE: Only mention facts you are absolutely certain about. If you are 
unsure of any specific detail — amounts, dates, eligibility numbers — do NOT mention it. 
If you are not confident the scheme exists or have limited information, say so plainly and 
with kindness. It is better to say less accurately than more incorrectly.
```

---

### 5.4 Stage 3 — Translation · Mayura v1

**Purpose**: Translate the English summary into the user's native Indian language.

**Function**: `translate_summary(summary: str, target_lang_code: str, api_key: str) -> str`

**Endpoint**: `POST https://api.sarvam.ai/translate`

**Key implementation detail — Text Chunking**:
The Mayura v1 API has a per-request character limit. The implementation splits the summary into chunks of max **1000 characters** at word boundaries before translating each chunk separately, then rejoins with newlines.

**Chunking algorithm** (`_chunk_text`):
```python
def _chunk_text(text: str, max_length: int = 1000) -> list[str]:
    chunks = []
    remaining = text
    while len(remaining) > max_length:
        split_at = remaining.rfind(" ", 0, max_length)  # split at last space
        if split_at == -1:
            split_at = max_length                        # force split if no space
        chunks.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].strip()
    if remaining:
        chunks.append(remaining)
    return chunks
```

**Request Payload (per chunk):**
```json
{
    "input":                "The Pradhan Mantri Kisan Samman Nidhi scheme...",
    "source_language_code": "en-IN",
    "target_language_code": "hi-IN",
    "speaker_gender":       "Female",
    "mode":                 "classic-colloquial",
    "model":                "mayura:v1",
    "enable_preprocessing": false
}
```

**Authentication Header:**
```
api-subscription-key: {api_key}
Content-Type: application/json
```

**Short-circuit**: If `target_lang_code == "en-IN"`, the function returns the original text immediately without any API call.

**Response:** `response.json()["translated_text"]`

---

### 5.5 Stage 4 — Text-to-Speech · Bulbul v3

**Purpose**: Convert the translated text to natural-sounding speech in the user's language.

**Function**: `text_to_speech(text: str, language_code: str, api_key: str) -> bytes`

**Endpoint**: `POST https://api.sarvam.ai/text-to-speech`

**On-Demand Only**: TTS is **never called automatically**. It is only called when the user explicitly clicks the "🔊 Listen" button. This prevents unnecessary API credit usage.

**Text limit**: Max **2500 characters** (`_TTS_MAX_CHARS`). Text longer than this is truncated with `"..."` appended.

**Speaker selection** — per language, a verified Bulbul v3 speaker is assigned:

| Language Code | Speaker | Gender |
|---|---|---|
| `hi-IN` | `priya` | Female |
| `ta-IN` | `kavitha` | Female |
| `te-IN` | `vijay` | Male |
| `bn-IN` | `anand` | Male |
| `ml-IN` | `mani` | Male |
| `kn-IN` | `gokul` | Male |
| `mr-IN` | `ishita` | Female |
| `gu-IN` | `manan` | Male |
| `pa-IN` | `simran` | Female |
| `or-IN` | `roopa` | Female |
| `en-IN` | `shubh` | Male |

Fallback speaker: `"shubh"` (English) if language code is unknown.

**Pre-processing before TTS**: Before calling `text_to_speech()`, the app always calls `clean_text_for_tts()` on the translated text to strip markdown symbols that would be read aloud literally.

**Request Payload:**
```json
{
    "target_language_code": "hi-IN",
    "text":                  "प्रधानमंत्री किसान सम्मान निधि एक बहुत महत्वपूर्ण...",
    "model":                 "bulbul:v3",
    "speaker":               "priya"
}
```

**Authentication Header:**
```
api-subscription-key: {api_key}
Content-Type: application/json
```

**Response parsing:**
```python
audio_bytes = base64.b64decode(response.json()["audios"][0])
```
The response contains a list `"audios"` where each item is a base64-encoded WAV audio string. The implementation decodes the first item to get raw WAV bytes.

**Return Value**: Raw WAV bytes (`bytes`) ready to be played by `st.audio()` or downloaded.

---

## 6. Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        USER INPUT                            │
│                                                              │
│   VOICE PATH                    TEXT PATH                    │
│   ─────────                     ─────────                    │
│   User records audio            User types scheme name       │
│   (Streamlit audio_input)       (Streamlit text_input)       │
└──────────┬───────────────────────────────┬───────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐       ┌───────────────────────────────┐
│  STAGE 1: STT        │       │  User selects output language │
│  Saaras v3           │       │  (from dropdown, 11 options)  │
│                      │       └───────────────┬───────────────┘
│  Input : WAV bytes   │                       │
│  Output: transcript  │                       │
│          lang_code   │                       │
└──────────┬───────────┘                       │
           │                                   │
           └─────────────────┬─────────────────┘
                             │ scheme_name + lang_code + category
                             ▼
┌────────────────────────────────────────────────────────────┐
│             STAGE 0: WIKIPEDIA FETCH (free)                │
│             fetch_scheme_from_wikipedia()                  │
│                                                            │
│  Search Wikipedia → Fetch extract → Quality checks         │
│                                                            │
│  Found?  ──YES──►  wiki dict {title, content, url}         │
│            │                                               │
│           NO                                               │
│            ▼                                               │
│        None (triggers fallback path)                       │
└──────────────────────────┬─────────────────────────────────┘
                           │
           ┌───────────────┴────────────────┐
           ▼                                ▼
    Wikipedia Found                   Not Found
           │                                │
    wiki_grounding=False             wiki_grounding=True
    _SYSTEM_PROMPT_WIKI              _SYSTEM_PROMPT_FALLBACK
    source_type="wikipedia"          source_type="training_knowledge"
           │                                │
           └───────────────┬────────────────┘
                           ▼
┌────────────────────────────────────────────────────────────┐
│           STAGE 2: LLM — sarvam-m                          │
│           summarize_scheme()                               │
│                                                            │
│  Input : system_prompt + user_content (with wiki article)  │
│  Output: raw LLM text                                      │
│                                                            │
│  Post-process: clean_llm_output() strips <think> blocks    │
│  Output: english_summary (250-320 words, no markdown)      │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│           STAGE 3: TRANSLATION — Mayura v1                 │
│           translate_summary()                              │
│                                                            │
│  Input : english_summary + target_lang_code                │
│  Chunk : split into ≤1000 char segments at word boundary   │
│  Translate each chunk via Mayura v1                        │
│  Join   : "\n".join(translations)                          │
│                                                            │
│  Special: if lang_code == "en-IN", skip (return as-is)     │
│  Output: translated_summary                                │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│           RESULTS DISPLAYED IN UI                          │
│                                                            │
│  • Language badge (auto-detected / selected)              │
│  • Source attribution (Wikipedia link or fallback warning) │
│  • Transcript/query echo                                  │
│  • Translated summary (in result-card)                    │
│  • English summary (collapsible expander)                 │
│  • "Listen" button (TTS on demand)                         │
└──────────────────────────┬─────────────────────────────────┘
                           │ User clicks "Listen"
                           ▼
┌────────────────────────────────────────────────────────────┐
│           STAGE 4: TTS — Bulbul v3  (ON DEMAND)            │
│           text_to_speech()                                 │
│                                                            │
│  Pre-process: clean_text_for_tts() strips markdown/URLs    │
│  Truncate  : to 2500 chars if needed                       │
│  Select    : speaker based on language_code                │
│  API call  : POST to Bulbul v3                             │
│  Decode    : base64 → WAV bytes                            │
│                                                            │
│  Output: WAV bytes → st.audio() player + download button   │
└────────────────────────────────────────────────────────────┘
```

---

## 7. API Reference — All Endpoints

### Summary Table

| Service | Endpoint | Method | Auth Header |
|---|---|---|---|
| STT (Saaras v3) | `https://api.sarvam.ai/speech-to-text` | POST | `api-subscription-key: {key}` |
| LLM (sarvam-m) | `https://api.sarvam.ai/v1/chat/completions` | POST | `Authorization: Bearer {key}` |
| Translate (Mayura v1) | `https://api.sarvam.ai/translate` | POST | `api-subscription-key: {key}` |
| TTS (Bulbul v3) | `https://api.sarvam.ai/text-to-speech` | POST | `api-subscription-key: {key}` |
| Wikipedia | `https://en.wikipedia.org/w/api.php` | GET | None |

> **Important**: STT and LLM use **different authentication header formats**:
> - STT, Translation, TTS → `api-subscription-key: {key}` (in headers)
> - LLM → `Authorization: Bearer {key}` (standard Bearer token)

### All Request/Response Shapes

#### STT — Saaras v3
```
Request: multipart/form-data
  file  → BytesIO(wav_bytes), filename="audio.wav", content-type="audio/wav"
  model → "saaras:v3"
  mode  → "transcribe"

Response: application/json
  {
    "transcript":    "string",
    "language_code": "hi-IN"
  }
```

#### LLM — sarvam-m
```
Request: application/json
  {
    "model":          "sarvam-m",
    "wiki_grounding": true | false,
    "messages": [
      {"role": "system", "content": "..."},
      {"role": "user",   "content": "..."}
    ]
  }

Response: application/json (OpenAI-compatible)
  {
    "choices": [
      {
        "message": {
          "content": "string (may contain <think>...</think> blocks)"
        }
      }
    ]
  }
```

#### Translation — Mayura v1
```
Request: application/json
  {
    "input":                "string (max 1000 chars per call)",
    "source_language_code": "en-IN",
    "target_language_code": "hi-IN",
    "speaker_gender":       "Female",
    "mode":                 "classic-colloquial",
    "model":                "mayura:v1",
    "enable_preprocessing": false
  }

Response: application/json
  {
    "translated_text": "string"
  }
```

#### TTS — Bulbul v3
```
Request: application/json
  {
    "target_language_code": "hi-IN",
    "text":                 "string (max 2500 chars)",
    "model":                "bulbul:v3",
    "speaker":              "priya"
  }

Response: application/json
  {
    "audios": ["base64_encoded_wav_string"]
  }

Decode: base64.b64decode(response["audios"][0]) → raw WAV bytes
```

---

## 8. Services Layer — Full Implementation Details

`services.py` is a pure-function module with **no class instances**, **no global state**, and **no startup side effects**. All functions accept API key as a parameter.

### Module-Level Constants

```python
# API endpoints
_STT_URL   = "https://api.sarvam.ai/speech-to-text"
_CHAT_URL  = "https://api.sarvam.ai/v1/chat/completions"
_TRANS_URL = "https://api.sarvam.ai/translate"
_TTS_URL   = "https://api.sarvam.ai/text-to-speech"
_WIKI_BASE = "https://en.wikipedia.org/w/api.php"

# Wikipedia headers (required for respectful bot usage)
_WIKI_HEADERS = {"User-Agent": "YojanaVoice/2.0 (educational; contact: dev@yojanav.in)"}

# TTS character limit
_TTS_MAX_CHARS = 2500
```

### Exception Hierarchy

```python
SarvamAPIError          # Base class — any Sarvam API failure
├── QuotaExceededError  # HTTP 429 — credits exhausted
├── InvalidKeyError     # HTTP 403 — bad/missing API key
└── AudioError          # No speech detected / empty audio
```

### Exported Constants (used by `app.py`)

```python
SUPPORTED_LANGUAGES: list[dict]  # 11 languages with code/name/native fields
CODE_TO_NAME: dict[str, str]     # {"hi-IN": "Hindi", ...}
SCHEME_CATEGORIES: list[str]     # 9 categories + "Auto-detect"
```

---

## 9. UI Layer — App Structure & Session State

`app.py` is the Streamlit frontend. It is structured in this order:

```
1. Module docstring + imports
2. .env loading (pathlib-based, same directory as script)
3. st.set_page_config()
4. Custom CSS injection (st.markdown with unsafe_allow_html=True)
5. Session state initialisation
6. API key guard (st.stop() if missing)
7. Helper functions:
   - _reset()              : clears all session state keys
   - _show_error()         : maps exceptions to user-friendly messages
   - _pipeline_pills()     : renders status row with done/pending pills
   - _run_llm_and_translation()  : orchestrates stages 2+3 together
8. Hero header (HTML with tricolor gradient text)
9. Pipeline status row (shown after first query)
10. Tab container: "🎙️ Speak" + "⌨️ Type"
    - Voice tab: audio_input widget + category dropdown + submit button
    - Text tab: text_input + category dropdown + language dropdown + submit button
11. Results section (only shown when session state has data)
    - Language badge
    - Source attribution / warning
    - Transcript echo
    - Translated summary card
    - English summary expander
    - TTS section with Listen + New Query buttons
    - Audio player + download button
12. Footer
```

### Session State Keys

| Key | Type | Description |
|---|---|---|
| `transcript` | `str \| None` | The scheme name from voice or text |
| `detected_lang` | `str \| None` | BCP-47 language code, e.g. `"hi-IN"` |
| `english_summary` | `str \| None` | LLM-generated English narration |
| `translated_summary` | `str \| None` | Translated to user's language |
| `tts_audio_bytes` | `bytes \| None` | WAV audio from Bulbul v3 |
| `source_url` | `str \| None` | Wikipedia article URL |
| `source_type` | `str \| None` | `"wikipedia"` or `"training_knowledge"` |

**Initialisation**: All keys are set to `None` at startup (if not already in session state). This means the results section conditionally renders only when data is present.

**Reset**: `_reset()` sets all keys back to `None`. Called before each new query and when the user clicks "New Query".

### `_run_llm_and_translation()` — The Core Orchestrator

```python
def _run_llm_and_translation(
    scheme_name: str, lang_code: str, category: str
) -> bool:
    # Step 2: Wikipedia + LLM
    with st.spinner("..."):
        result = services.summarize_scheme(scheme_name, api_key, category)
        st.session_state.english_summary = result["summary"]
        st.session_state.source_url      = result["source_url"]
        st.session_state.source_type     = result["source_type"]

    # Step 3: Translation
    with st.spinner("..."):
        st.session_state.translated_summary = services.translate_summary(
            st.session_state.english_summary, lang_code, api_key
        )
        st.session_state.detected_lang = lang_code

    return True  # or False on any exception
```

This function is called by both the Voice tab flow and the Text tab flow, ensuring identical pipeline behaviour regardless of input mode.

---

## 10. Error Handling Strategy

```python
def _show_error(exc: Exception) -> None:
    if isinstance(exc, services.QuotaExceededError):
        # → st.error with link to Sarvam dashboard
    elif isinstance(exc, services.InvalidKeyError):
        # → st.error about checking .env file
    elif isinstance(exc, services.AudioError):
        # → st.warning (softer tone — it's a user mistake)
    else:
        # → st.error with exception message
```

### HTTP Error Mapping (`_raise_for_status`)

```python
def _raise_for_status(response: requests.Response) -> None:
    # Parse error body from JSON if possible
    if response.status_code == 403:
        raise InvalidKeyError(...)
    elif response.status_code == 429:
        raise QuotaExceededError(...)
    else:
        raise SarvamAPIError(f"API error {response.status_code}")
```

### Timeout values

| Stage | Timeout |
|---|---|
| Wikipedia Search | 10 seconds |
| Wikipedia Extract | 10 seconds |
| STT (Saaras v3) | 30 seconds |
| LLM (sarvam-m) | 60 seconds |
| Translation (Mayura v1) | 30 seconds |
| TTS (Bulbul v3) | 60 seconds |

---

## 11. Text Processing Utilities

These two functions are the text-cleaning backbone of the pipeline.

### `clean_llm_output(text: str) -> str`

Strips internal model reasoning from sarvam-m output. The model sometimes emits `<think>...</think>` blocks before the final answer (a behaviour from reasoning models).

```python
# Patterns removed:
re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
re.sub(r"<सोचिए>.*?</think>", "", text, flags=re.DOTALL)   # Hindi variant
re.sub(r"</?think>", "", text, flags=re.IGNORECASE)
re.sub(r"</?सोचिए>", "", text)
re.sub(r"\n{3,}", "\n\n", text)  # Collapse blank lines
```

### `clean_text_for_tts(text: str) -> str`

Prepares translated text for Bulbul v3. TTS engines read everything literally, so markdown symbols must be removed first.

```python
# Transformations applied:
[visible text](url)  →  visible text       # markdown links
https://...          →  (removed)          # bare URLs
**bold** / *italic*  →  bold / italic      # markdown emphasis
__underline__        →  underline
# Heading            →  Heading            # markdown headers
- bullet / • bullet  →  (bullet removed)
₹                    →  "rupees "
`backtick`           →  backtick           # backtick removed
Multiple spaces      →  single space
3+ blank lines       →  2 blank lines
```

---

## 12. Language & Speaker Configuration

### Supported Languages (11 total)

```python
SUPPORTED_LANGUAGES = [
    {"code": "hi-IN", "name": "Hindi",     "native": "हिन्दी"},
    {"code": "ta-IN", "name": "Tamil",     "native": "தமிழ்"},
    {"code": "te-IN", "name": "Telugu",    "native": "తెలుగు"},
    {"code": "bn-IN", "name": "Bengali",   "native": "বাংলা"},
    {"code": "ml-IN", "name": "Malayalam", "native": "മലയാളം"},
    {"code": "kn-IN", "name": "Kannada",   "native": "ಕನ್ನಡ"},
    {"code": "mr-IN", "name": "Marathi",   "native": "मराठी"},
    {"code": "gu-IN", "name": "Gujarati",  "native": "ગુજરાતી"},
    {"code": "pa-IN", "name": "Punjabi",   "native": "ਪੰਜਾਬੀ"},
    {"code": "or-IN", "name": "Odia",      "native": "ଓଡ଼ିଆ"},
    {"code": "en-IN", "name": "English",   "native": "English"},
]
```

### Language Code Source of Truth

- **Voice path**: Language code comes from **Saaras v3 response** (auto-detected from speech).
- **Text path**: Language code comes from **user's dropdown selection**.
- Both paths converge at the same `lang_code` variable passed into `_run_llm_and_translation()`.

---

## 13. Scheme Category System

Categories are used to guide the LLM's persona and focus area. They are optional — the default is "Auto-detect" (empty string).

```python
SCHEME_CATEGORIES = [
    "Auto-detect",
    "Agriculture & Farmers",
    "Education",
    "Health & Wellness",
    "Women & Child Development",
    "Financial Inclusion",
    "Social Welfare & Empowerment",
    "Housing",
    "Employment & Skill Development",
]
```

When a non-"Auto-detect" category is selected, it is appended to the system prompt:
```
Note: This scheme falls under the 'Agriculture & Farmers' category.
```

---

## 14. Configuration & Environment

### `.env` file (single key):
```
SARVAM_API_KEY=sk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Loading (in `app.py`):
```python
import pathlib
from dotenv import load_dotenv

_HERE = pathlib.Path(__file__).parent
load_dotenv(dotenv_path=_HERE / ".env")
_api_key = os.getenv("SARVAM_API_KEY", "").strip()
```

Using `pathlib.Path(__file__).parent` ensures the `.env` is always loaded from the directory containing `app.py`, regardless of where Streamlit is launched from.

### API Key Guard:
```python
if not _api_key:
    st.error("🔑 API key not found. Please set SARVAM_API_KEY in .env")
    st.stop()  # Halts all further rendering
```

---

## 15. Dependencies & Installation

### `requirements.txt`
```
requests>=2.31.0
python-dotenv>=1.0.0
streamlit>=1.31.0
```

### Setup Commands
```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py
```

The app runs at `http://localhost:8501` by default.

---

## 16. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Wikipedia grounding before LLM** | Prevents hallucination of scheme amounts, dates, eligibility rules — the #1 failure mode of LLMs on government data |
| **`wiki_grounding=False` when supplying own context** | Avoids double-grounding conflict; the provided article IS the grounding |
| **TTS is on-demand only** | Saves API credits; not every user needs audio; avoids latency on page load |
| **`clean_llm_output()` before storing summary** | Reasoning models emit `<think>` blocks that must be stripped before display or translation |
| **`clean_text_for_tts()` before TTS** | Markdown symbols (**, *, #, ₹, URLs) are read literally by TTS engines; cleaning produces natural speech |
| **Text chunking at 1000 chars for translation** | Mayura v1 API has per-request character limits |
| **Session state for all results** | Allows Streamlit to re-render without re-calling APIs; TTS button state preserved |
| **`st.stop()` in voice tab on STT failure** | If transcription fails, there's no scheme name to proceed with |
| **Language code from Saaras as truth for TTS** | Ensures the voice output matches the detected language, not a mismatch |
| **`"en-IN"` short-circuit in translation** | Avoids unnecessary API call when output is already English |
| **Inter font + tricolor gradient title** | India-themed aesthetic; creates cultural connection for target users |
| **Source attribution badge** | Users can verify information; transparency builds trust |

---

## 17. What the Next Project Should Replicate

This section is specifically for an AI agent or developer who will implement the **same Sarvam AI tech-stack** in a different frontend or backend project.

### Core Tech Stack to Port

1. **All 4 Sarvam AI API integrations** (exact models and endpoints above) — these are the heart of the system.
2. **Wikipedia grounding strategy** — query Wikipedia first, inject article as LLM context, disable `wiki_grounding` flag.
3. **The two system prompts** — the exact wording matters; it controls the tone and accuracy contract with the LLM.
4. **`clean_llm_output()`** — always post-process sarvam-m output to strip `<think>` blocks.
5. **`clean_text_for_tts()`** — always pre-process text before sending to Bulbul v3.
6. **Text chunking for translation** — Mayura v1 requires ≤1000 chars per request.
7. **TTS character limit** — Bulbul v3 requires ≤2500 chars per request.
8. **Speaker mapping** — use the verified speaker-to-language mapping.
9. **Language list + BCP-47 codes** — use the exact 11-language set with their codes.
10. **Error hierarchy** — `QuotaExceededError`, `InvalidKeyError`, `AudioError` as distinct types.

### What Can Be Replaced (UI-Specific)

- Streamlit UI → can be replaced with React, Vue, Next.js, or any other frontend.
- `st.session_state` → can be replaced with React state, Redux, or a backend database.
- `st.audio()` → replace with `<audio>` HTML element.
- `st.audio_input()` → replace with Web Audio API / MediaRecorder for voice capture.
- CSS styling → can be fully redesigned.
- `st.spinner()` → replace with loading states in frontend.

### Recommended Backend Architecture (for non-Streamlit projects)

```
Frontend (any)
     │
     ▼ REST API
FastAPI / Express Backend
     │
     ├── POST /api/transcribe      → calls Saaras v3
     ├── POST /api/summarize       → calls Wikipedia + sarvam-m
     ├── POST /api/translate       → calls Mayura v1 (with chunking)
     └── POST /api/tts             → calls Bulbul v3 (with text cleaning)
```

Each backend endpoint mirrors one function from `services.py`. The Wikipedia fetch can happen inside `/api/summarize` before calling the LLM.

### Environment Variable to Preserve

```
SARVAM_API_KEY=sk_...
```
This is the only configuration needed for all four Sarvam AI services.

---

## Appendix — Government Scheme Examples

Tested scheme names that produce high-quality results (Wikipedia articles exist):

| Query | Wikipedia Article Title |
|---|---|
| PM Kisan | Pradhan Mantri Kisan Samman Nidhi |
| Ayushman Bharat | Ayushman Bharat Pradhan Mantri Jan Arogya Yojana |
| Ujjwala Yojana | Pradhan Mantri Ujjwala Yojana |
| Jan Dhan Yojana | Pradhan Mantri Jan Dhan Yojana |
| PMGSY | Pradhan Mantri Gram Sadak Yojana |
| MGNREGA | Mahatma Gandhi National Rural Employment Guarantee Act |
| Mudra Yojana | Pradhan Mantri Mudra Yojana |
| Beti Bachao Beti Padhao | Beti Bachao, Beti Padhao |

---

*Document generated: April 2026 | Project: Yojana Voice | Stack: Sarvam AI (Saaras v3 + sarvam-m + Mayura v1 + Bulbul v3)*
