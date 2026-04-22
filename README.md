# SaralAI 🇮🇳

**SaralAI** is a voice-first AI assistant designed to help Indian citizens understand and access government schemes in their own local language. It translates complex government documentation into simple, actionable steps using state-of-the-art AI.

![SaralAI Logo](public/logo.png)

## 🚀 Key Features

- **Multilingual Support**: Available in 11 Indian languages (Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, and English).
- **Voice-First Interface**: Ask questions naturally using your voice.
- **Smart Summarization**: Breaks down scheme details into Benefits, Eligibility, and Documents Needed.
- **Step-by-Step Guidance**: Clear instructions on how to actually apply for each scheme.
- **Official Grounding**: All information is grounded in verified government data sources.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vanilla JS / Vite (High performance, near-zero overhead)
- **Styling**: Modern CSS3 with Custom Properties (Glassmorphism design)
- **State Management**: Reactive local state system
- **Authentication**: Google OAuth 2.0

### Backend
- **Framework**: FastAPI (Python)
- **AI Stack (Sarvam AI)**:
  - **Saaras v3**: Robust LLM for Indian context.
  - **Mayura v1**: High-accuracy translation.
  - **Bulbul v3**: Natural-sounding multi-lingual Text-to-Speech.
- **AI Stack (Google)**:
  - **Gemini 1.5 Flash**: Lightning-fast intent classification and context retrieval.
- **Database**: PostgreSQL

## 📦 Project Structure

```text
SaralAI/
├── src/                # Frontend source code
│   ├── components/     # UI components (Header, Buttons, etc.)
│   ├── screens/        # App screens (Speak, Explanation, etc.)
│   └── utils/          # Localisation and helpers
├── backend/            # FastAPI Backend
│   ├── routers/        # API endpoints
│   ├── services/       # AI & Translation services
│   └── models/         # Database schemas
├── public/             # Static assets
└── index.html          # App entry point
```

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL
- API Keys for Sarvam AI and Google AI Studio

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/USER_NAME/SaralAI.git
   cd SaralAI
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   # Setup your .env file
   python main.py
   ```

3. **Frontend Setup**
   ```bash
   # In a new terminal (root directory)
   npm install
   npm run dev
   ```

## 📜 Disclaimer
SaralAI provides simplified guidance based on AI models. Users should always verify information on official government portals before making decisions.

---
Built with ❤️ for India.
