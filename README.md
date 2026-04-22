# 🏛️ SaralAI

**SaralAI** is a premium, localized voice-first AI assistant designed to help Indian citizens understand and apply for government schemes effortlessly. By combining **Sarvam AI** for multilingual voice processing and **Google Gemini** for intelligent reasoning, it breaks down complex government jargon into simple, actionable steps in **11 Indian languages**.

![SaralAI Banner](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Vite-blue?style=for-the-badge)

## 🌟 Key Features

- **🗣️ Multilingual Voice Support**: Speak naturally in Hindi, Bengali, Gujarati, Tamil, and 7 other languages.
- **📄 Document Assistant**: Smartly identifies exactly which documents you need for specific schemes.
- **🗺️ Step-by-Step Guidance**: Converts complex application processes into easy tutorials.
- **🔒 Secure Authentication**: Integrated with Google OAuth for personalized assistance.
- **💎 Premium UI**: Modern, glassmorphic design optimized for mobile and web.

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Vanilla CSS (Premium Design System)
- **Backend**: FastAPI (Python 3.9+)
- **AI Engine**: 
  - **Sarvam AI**: STT (Saaras), TTS (Bulbul), Translation (Mayura)
  - **Google Gemini**: Intent detection and intelligent summarization
- **Database**: PostgreSQL (via SQLAlchemy)
- **Auth**: Google Cloud OAuth 2.0

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/SaralAI.git
cd SaralAI
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 3. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` folder:
```env
GOOGLE_API_KEY=your_gemini_key
SARVAM_API_KEY=your_sarvam_key
DATABASE_URL=postgresql://user:pass@localhost:5432/saralai
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
```

## 📦 Deployment Guide

### Backend (Render/Railway)
1. Use the provided `backend/Dockerfile`.
2. Connect your GitHub and set root directory to `backend/`.
3. Add Environment Variables in the dashboard.

### Frontend (Vercel)
1. Build Command: `npm run build`
2. Output Directory: `dist`
3. Add `VITE_BACKEND_URL` pointing to your deployed API.

---
*Built with ❤️ for Indian Citizens by Siddharth Sadhu*
