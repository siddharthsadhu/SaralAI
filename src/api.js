/**
 * src/api.js — Frontend API Client
 * ----------------------------------
 * Replaces the client-side ai.js keyword engine with real backend calls.
 *
 * Usage:
 *   import { queryScheme, transcribeAudio, speakText } from './api.js';
 *
 * The VITE_API_URL env var switches between local and production:
 *   - Local dev:  http://localhost:8000
 *   - Production: https://your-railway-app.up.railway.app
 *
 * To enable backend mode, set in .env.local:
 *   VITE_API_URL=http://localhost:8000
 *   VITE_USE_BACKEND=true
 */

// Base URL — reads from Vite env vars (prefixed VITE_ to be exposed to browser)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generic fetch wrapper with error handling.
 * Throws a typed Error if the response is not OK.
 */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return res;
}

// ─── Main Query ───────────────────────────────────────────────────────────────

/**
 * POST /api/query — Send a text question, get back a scheme explanation.
 *
 * @param {string} query  - The user's question
 * @param {string} language - Language code: 'hi', 'en', 'bn', etc.
 * @param {string|null} sessionId - Optional anonymous session ID
 *
 * @returns {Promise<{
 *   type: 'explanation'|'clarification',
 *   intent: string,
 *   confidence: number,
 *   scheme_id: string,
 *   content: object,
 *   clarification_options: Array,
 *   gemini_used: boolean,
 * }>}
 */
export async function queryScheme(query, language = 'hi', sessionId = null) {
  const res = await apiFetch('/api/query', {
    method: 'POST',
    body: JSON.stringify({
      query,
      language,
      session_id: sessionId,
      use_ai: true,
    }),
  });
  return res.json();
}

// ─── Speech to Text ───────────────────────────────────────────────────────────

/**
 * POST /api/speech/transcribe — Upload audio, get text back.
 *
 * @param {Blob} audioBlob - Raw audio blob from MediaRecorder
 * @param {string} language - Language code
 *
 * @returns {Promise<{ transcript: string, confidence: number, language_detected: string }>}
 */
export async function transcribeAudio(audioBlob, language = 'hi') {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);

  const res = await apiFetch('/api/speech/transcribe', {
    method: 'POST',
    // Don't set Content-Type here — browser sets it with the boundary for multipart
    headers: {},
    body: formData,
  });
  return res.json();
}

// ─── Text to Speech ───────────────────────────────────────────────────────────

/**
 * POST /api/tts/speak — Get MP3 audio for a piece of text.
 *
 * @param {string} text - Text to speak
 * @param {string} language - Language code
 *
 * @returns {Promise<string>} - Object URL pointing to the MP3 audio blob
 */
export async function speakText(text, language = 'hi') {
  // Don't use apiFetch — we need the raw binary response, not JSON
  const res = await fetch(`${API_BASE}/api/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language, voice_gender: 'FEMALE' }),
  });

  if (!res.ok) throw new Error(`TTS failed: HTTP ${res.status}`);

  const blob = await res.blob();
  // Create a temporary URL that the <audio> element can play
  return URL.createObjectURL(blob);
}

// ─── Scheme Utilities ─────────────────────────────────────────────────────────

/**
 * GET /api/schemes — List all scheme summaries.
 */
export async function listSchemes() {
  const res = await apiFetch('/api/schemes');
  return res.json();
}

/**
 * GET /api/scheme/:id — Get full scheme data.
 */
export async function getScheme(schemeId) {
  const res = await apiFetch(`/api/scheme/${schemeId}`);
  return res.json();
}

// ─── Health check ─────────────────────────────────────────────────────────────
/**
 * GET /api/health — Check if backend is alive.
 * Returns true if backend is reachable and healthy, false otherwise.
 */
export async function checkHealth() {
  try {
    const res = await apiFetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Authentication ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/google — Login with Google OAuth credential.
 */
export async function signInWithGoogle(credential) {
  const res = await apiFetch('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  return res.json();
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export async function submitFeedback(userId, userEmail, text) {
  const res = await apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, user_email: userEmail, text }),
  });
  return res.json();
}

// ─── Feature Flag ─────────────────────────────────────────────────────────────

/**
 * Returns true if the backend is configured and should be used.
 * When false, the app falls back to the client-side ai.js engine.
 */
export function isBackendEnabled() {
  return USE_BACKEND;
}
