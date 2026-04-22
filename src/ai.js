/**
 * SaralAI — AI Query Engine (Dual Mode)
 * ──────────────────────────────────────
 * Mode 1 (VITE_USE_BACKEND=false): Client-side keyword search using Schemes.json
 * Mode 2 (VITE_USE_BACKEND=true):  Full Sarvam AI backend pipeline
 *   STT  → Saaras v3  (POST /api/speech/transcribe)
 *   LLM  → sarvam-m   (POST /api/query)
 *   TTS  → Bulbul v3  (POST /api/tts/speak) ← ON-DEMAND ONLY (user taps Listen)
 *   Note: Translation (Mayura v1) runs server-side inside /api/query
 *
 * TTS API Credit Conservation:
 *   TTS is NEVER called automatically. The backend returns translated text only.
 *   TTS is only requested when the user explicitly taps the 🔊 Listen button.
 */

import schemes from './Schemes.json';

// ─── Environment ──────────────────────────────────────────────────────────────

const USE_BACKEND  = import.meta.env.VITE_USE_BACKEND === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Keyword Intent Maps ─────────────────────────────────────────────────────

const INTENT_KEYWORDS = {
     DOCUMENTS: [
          'document', 'documents', 'papers', 'paper', 'proof', 'certificate',
          'kya chahiye', 'kaunse', 'kaagaz', 'kaagzat', 'dastavez',
          'required', 'need', 'bring', 'carry', 'submit', 'upload',
          'aadhaar', 'voter', 'ration card', 'birth certificate'
     ],
     STEPS: [
          'apply', 'application', 'process', 'how to', 'kaise', 'step', 'steps',
          'procedure', 'process', 'register', 'registration', 'fill', 'form',
          'where to go', 'kahan', 'aavedan', 'apply karna', 'kya karna', 'karna hai'
     ],
     ELIGIBILITY: [
          'eligible', 'eligibility', 'who can', 'qualify', 'criteria', 'condition',
          'paatra', 'paatrata', 'kaun', 'milega', 'mil sakta', 'who gets',
          'can i apply', 'am i eligible', 'requirements', 'income'
     ],
     OVERVIEW: [
          'what is', 'kya hai', 'tell me', 'explain', 'about', 'details', 'info',
          'information', 'bataiye', 'batao', 'janakari', 'samjhaiye', 'overview',
          'scheme', 'yojana', 'help', 'benefit', 'faida', 'labh'
     ]
};

// ─── Scheme Search Keywords ───────────────────────────────────────────────────

const SCHEME_KEYWORDS = {
     PMAY_U: [
          'pmay', 'awas', 'housing', 'urban', 'city', 'shahar', 'ghar', 'house',
          'home', 'pradhan mantri awas', 'pmay-u', 'makan', 'residential',
          'flat', 'apartment', 'slum', 'pucca'
     ],
     PMAY_G: [
          'pmay', 'awas', 'housing', 'rural', 'gaon', 'village', 'gram', 'ghar',
          'house', 'home', 'pradhan mantri awas', 'pmay-g', 'gramin', 'makan',
          'kutcha', 'kachcha', 'pucca', 'panchayat'
     ],
     PM_KISAN: [
          'kisan', 'farmer', 'farm', 'kheti', 'agriculture', 'kisaan', 'krishi',
          'pm kisan', 'samman nidhi', 'kisan samman', 'income support', 'land',
          'kheti badi', 'instalment', 'money farmer'
     ],
     PM_JAY: [
          'ayushman', 'health', 'hospital', 'medical', 'insurance', 'jan arogya',
          'pmjay', 'treatment', 'cashless', 'sehat', 'bimari', 'ilaaj',
          'ab-pmjay', 'ayushman bharat', 'health card', 'e-card', 'swasthya'
     ],
     NFSA_PDS: [
          'ration', 'ration card', 'food', 'grain', 'pds', 'nfsa', 'anaj', 'chawal',
          'gehu', 'wheat', 'rice', 'fair price shop', 'rasan', 'antyodaya',
          'national food', 'subsidised', 'bhoj', 'khana'
     ],
     PMJDY: [
          'jan dhan', 'jandhan', 'bank', 'account', 'banking', 'khata', 'bank account',
          'savings', 'zero balance', 'rupay', 'financial', 'money', 'banking',
          'unbanked', 'pmjdy', 'khaata', 'dbt'
     ],
     SSY: [
          'sukanya', 'girl', 'daughter', 'beti', 'samriddhi', 'savings', 'child',
          'ladki', 'bachi', 'female', 'women', 'education', 'marriage',
          'tax', '80c', 'post office', 'bachan'
     ],
     PMUY: [
          'ujjwala', 'lpg', 'gas', 'cylinder', 'cooking', 'kitchen', 'chulha',
          'rasoi', 'gas connection', 'pmuy', 'women', 'mahila', 'fuel', 'clean cooking',
          'smoke', 'gas stove', 'connection'
     ],
     NSAP: [
          'pension', 'old age', 'widow', 'disability', 'nsap', 'elderly', 'senior',
          'budhapa', 'vidhwa', 'viklang', 'handicapped', 'social assistance',
          'bujurg', 'monthly', 'allowance', 'ignoaps', 'ignwps', 'retir'
     ],
     PMKVY: [
          'skill', 'training', 'job', 'employment', 'kaushal', 'pmkvy', 'course',
          'certificate', 'certification', 'youth', 'yuva', 'rojgar', 'naukri',
          'work', 'learn', 'trade', 'rozgar', 'siksha', 'padhai', 'sector'
     ],
     NSP: [
          'scholarship', 'nsp', 'student', 'education', 'college', 'university',
          'school', 'study', 'scholarship portal', 'national scholarship', 'padhai',
          'fee', 'stipend', 'sc', 'st', 'obc', 'minority', 'competitive marks'
     ]
};

// ─── Client-Side Helpers ──────────────────────────────────────────────────────

function normalize(text) {
     return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreScheme(query, schemeId, scheme) {
     const keywords = SCHEME_KEYWORDS[schemeId] || [];
     let score = 0;
     let totalWeight = 0;

     for (const kw of keywords) {
          totalWeight += 1;
          if (query.includes(normalize(kw))) score += 1;
     }

     const schemeName = normalize(scheme.scheme_name);
     const queryWords = query.split(' ').filter(w => w.length > 2);
     for (const word of queryWords) {
          if (schemeName.includes(word)) { score += 0.5; totalWeight += 0.5; }
     }

     const category = normalize(scheme.category || '');
     for (const word of queryWords) {
          if (category.includes(word)) { score += 0.3; totalWeight += 0.3; }
     }

     return totalWeight > 0 ? score / totalWeight : 0;
}

export function searchSchemes(query) {
     const normalizedQuery = normalize(query);
     const scored = schemes.map(scheme => ({
          scheme,
          confidence: scoreScheme(normalizedQuery, scheme.scheme_id, scheme)
     }));
     scored.sort((a, b) => b.confidence - a.confidence);
     return scored;
}

export function detectIntent(query) {
     const normalizedQuery = normalize(query);
     const scores = {};
     for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
          scores[intent] = keywords.filter(kw => normalizedQuery.includes(normalize(kw))).length;
     }
     const topIntent = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
     return topIntent[1] > 0 ? topIntent[0] : 'OVERVIEW';
}

export function generateExplanation(scheme, intent) {
     const eligibilityPoints = scheme.eligibility_criteria
          ? scheme.eligibility_criteria.map(c => c.condition)
          : [];
     const benefitPoints = scheme.benefits?.details || [scheme.benefits?.short || ''];
     const steps = scheme.application_process?.steps || [];
     const documents = scheme.required_documents
          ? scheme.required_documents.map(d => ({ name: d.document_name, mandatory: d.mandatory }))
          : [];

     let summary = '';
     let leadPoints = [];

     switch (intent) {
          case 'ELIGIBILITY':
               summary = `Eligibility criteria for ${scheme.scheme_name}`;
               leadPoints = eligibilityPoints.length > 0 ? eligibilityPoints : benefitPoints;
               break;
          case 'DOCUMENTS':
               summary = `Documents needed for ${scheme.scheme_name}`;
               leadPoints = documents.map(d => `${d.mandatory ? '(Required) ' : '(Optional) '}${d.name}`);
               break;
          case 'STEPS':
               summary = `How to apply for ${scheme.scheme_name}`;
               leadPoints = steps;
               break;
          default:
               summary = scheme.who_is_it_for?.short || scheme.scheme_name;
               leadPoints = benefitPoints;
     }

     return {
          schemeId: scheme.scheme_id,
          schemeName: scheme.scheme_name,
          category: scheme.category,
          intent,
          summary,
          leadPoints,
          eligibilityPoints,
          benefitPoints,
          steps,
          documents,
          confusions: scheme.common_confusions || [],
          limitations: (scheme.limitations_and_notes || []).slice(0, 2),
          officialSource: scheme.source_information?.official_website || '',
          applicationMode: scheme.application_process?.mode || '',
          disclaimer: 'This information is for guidance only. For official decisions, visit the government portal.'
     };
}

export function processQuery(query) {
     if (!query || query.trim().length < 2) {
          return { result: null, confidence: 0, topMatches: [] };
     }
     const ranked = searchSchemes(query);
     const topMatch = ranked[0];
     const confidence = topMatch?.confidence || 0;
     const topMatches = ranked.slice(0, 4);

     if (confidence < 0.05) return { result: null, confidence, topMatches };

     const intent = detectIntent(query);
     const result = generateExplanation(topMatch.scheme, intent);
     return { result, confidence, topMatches };
}

// ─── Backend API Helpers (Sarvam AI) ─────────────────────────────────────────

/**
 * Transcribe audio using Sarvam Saaras v3 via backend.
 * Saaras AUTO-DETECTS the language — no need to pass language.
 *
 * @param {Blob|ArrayBuffer} audioBlob — Audio data from MediaRecorder
 * @returns {Promise<{transcript: string, languageCode: string, confidence: number}>}
 */
export async function transcribeAudio(audioBlob) {
     const formData = new FormData();
     const isWav = audioBlob && audioBlob.type && audioBlob.type.includes('wav');
     const audioFile = audioBlob instanceof Blob
          ? audioBlob
          : new Blob([audioBlob], { type: isWav ? 'audio/wav' : 'audio/webm' });
     
     const filename = isWav ? 'recording.wav' : 'recording.webm';
     formData.append('audio', audioFile, filename);

     const response = await fetch(`${API_BASE_URL}/api/speech/transcribe`, {
          method: 'POST',
          body: formData,
          // Do NOT set Content-Type — fetch sets it automatically with boundary for FormData
     });

     if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || `STT failed: HTTP ${response.status}`);
     }

     const data = await response.json();
     return {
          transcript:    data.transcript,
          languageCode:  data.language_detected,  // BCP-47 e.g. "hi-IN"
          confidence:    data.confidence,
     };
}

/**
 * Send a text query to the backend Sarvam AI pipeline.
 * Backend runs: local DB search → sarvam-m LLM → Mayura v1 translation
 * Returns translated text ready to display — NO TTS is called here.
 *
 * @param {string} query          — User's question
 * @param {string} languageCode   — Short code ("hi") OR BCP-47 ("hi-IN")
 * @param {string} sessionId      — Optional session ID for analytics
 * @returns {Promise<object>}     — Full QueryResponse from backend
 */
export async function queryBackend(query, languageCode = 'hi', sessionId = null) {
     // Normalise: accept both "hi-IN" and "hi" — backend QueryRequest uses short codes
     const shortCode = languageCode.includes('-')
          ? languageCode.split('-')[0]
          : languageCode;

     const payload = {
          query,
          language:   shortCode,
          session_id: sessionId,
          use_ai:     true,
     };

     const response = await fetch(`${API_BASE_URL}/api/query`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
     });

     if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || `Query failed: HTTP ${response.status}`);
     }

     return response.json();
}

/**
 * Request TTS audio from Sarvam Bulbul v3 via backend.
 *
 * ⚠️  CALL THIS ONLY WHEN USER TAPS THE LISTEN BUTTON.
 *     Never call automatically — it consumes Bulbul v3 API credits.
 *
 * @param {string} text         — Translated text to speak (from queryBackend response)
 * @param {string} languageCode — BCP-47 code (e.g. "hi-IN") from Saaras or state
 * @returns {Promise<string>}   — Object URL to play with <audio> element
 */
export async function requestTTS(text, languageCode = 'hi-IN') {
     // Normalise: if short code passed, convert to BCP-47
     const bcp47 = languageCode.includes('-')
          ? languageCode
          : `${languageCode}-IN`;

     const payload = { text, language: bcp47 };

     const response = await fetch(`${API_BASE_URL}/api/tts/speak`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
     });

     if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || `TTS failed: HTTP ${response.status}`);
     }

     // Convert WAV bytes to a blob URL the <audio> element can play
     const audioBlob = await response.blob();
     return URL.createObjectURL(audioBlob);
}

// ─── Full Query Pipeline (Backend Mode) ──────────────────────────────────────

/**
 * Full backend query pipeline.
 * Equivalent to processQuery() but calls the Sarvam AI backend.
 *
 * @param {string} query        — User's question
 * @param {string} languageCode — Language code (short or BCP-47)
 * @param {string} sessionId    — Optional session ID
 * @returns {Promise<object>}   — Processed result for state
 */
export async function processQueryBackend(query, languageCode = 'hi', sessionId = null) {
     const apiResponse = await queryBackend(query, languageCode, sessionId);

     if (apiResponse.type === 'clarification') {
          return {
               result:     null,
               confidence: apiResponse.confidence,
               topMatches: apiResponse.clarification_options.map(opt => ({
                    scheme: {
                         scheme_id:   opt.scheme_id,
                         scheme_name: opt.scheme_name,
                         category:    opt.category,
                         who_is_it_for: { short: opt.short_description },
                    },
                    confidence: 0,
               })),
               apiResponse,
          };
     }

     const content = apiResponse.content || {};

     // Map backend response to the same shape as generateExplanation()
     // so existing screens (ExplanationScreen, DocumentsScreen, etc.) work unchanged
     const result = {
          schemeId:          apiResponse.scheme_id || '',
          schemeName:        content.scheme_name || '',
          category:          content.category || '',
          intent:            apiResponse.intent || 'OVERVIEW',
          summary:           content.summary || '',       // Already translated by Mayura
          leadPoints:        content.key_points || [],
          eligibilityPoints: content.eligibility_points || [],
          benefitPoints:     content.benefit_points || [],
          steps:             content.steps || [],
          documents:         (content.documents || []).map(d => ({
               name:      d.name,
               mandatory: d.mandatory,
          })),
          confusions:        [],
          limitations:       [],
          officialSource:    content.official_source || '',
          applicationMode:   content.application_mode || '',
          disclaimer:        content.disclaimer || '',
          // Extra Sarvam-specific fields
          aiUsed:            apiResponse.ai_used,
          sourceType:        apiResponse.source_type,
          sourceUrl:         apiResponse.source_url,
          languageCode:      apiResponse.language_code,
     };

     return {
          result,
          confidence:  apiResponse.confidence,
          topMatches:  [],
          apiResponse,
     };
}

// ─── Export mode flag ─────────────────────────────────────────────────────────
export { USE_BACKEND };
