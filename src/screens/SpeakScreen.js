/**
 * Speak Screen — Voice Query Input
 * Backend mode:     MediaRecorder → WAV → Sarvam Saaras v3 (auto language detect)
 * Client-side mode: Web Speech API → text → client-side keyword search
 */
import { Header, initHeader } from '../components/Header.js';
import { MicButton } from '../components/MicButton.js';
import { Button } from '../components/Button.js';
import { navigate } from '../router.js';
import { setState, getState } from '../state.js';
import { transcribeAudio, USE_BACKEND } from '../ai.js';
import { WavRecorder } from '../utils/wavRecorder.js';
import { getLocalLabel } from '../utils/labels.js';

// Module-level references
let recognition   = null;   // Web Speech API (client-side mode)
let wavRecorder   = null;   // WavRecorder (backend mode)

/**
 * Check if Web Speech API is supported
 */
function isSpeechSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

export function SpeakScreen() {
  const hasSpeech = USE_BACKEND ? true : isSpeechSupported();
  const { detectedLanguageCode, selectedLanguage } = getState();
  const langCode = detectedLanguageCode || (selectedLanguage ? `${selectedLanguage}-IN` : 'en-IN');

  return `
    <div class="screen speak-screen">
      ${Header({ showLanguageToggle: true })}
      
      <div class="screen-content screen-center">
        <div class="speak-content animate-fadeIn">
          <h1 class="speak-title">${getLocalLabel('speak_in_your_language', langCode)}</h1>
          <p class="speak-example">
            ${getLocalLabel('try_asking', langCode)} <em>'Ghar ke liye sarkari madad kaise milegi?'</em>
          </p>
          
          <div class="speak-mic">
            ${MicButton({ size: 'lg', id: 'main-mic-btn' })}
          </div>

          <p class="speak-tap-hint">${getLocalLabel('tap_mic_to_start', langCode)}</p>

          ${!hasSpeech && !USE_BACKEND ? `
            <div class="speak-no-voice-note">
              🎙️ ${getLocalLabel('type_instead', langCode)}
            </div>
          ` : ''}

          <div class="speak-examples-row">
            <p class="speak-examples-label">${getLocalLabel('or_try_these', langCode)}</p>
            <div class="speak-example-chips">
              <button class="type-chip" data-query="PM Kisan scheme kya hai">PM Kisan</button>
              <button class="type-chip" data-query="Pradhan Mantri Awas Yojana Urban housing">PMAY</button>
              <button class="type-chip" data-query="Ayushman Bharat health insurance benefits">Ayushman</button>
              <button class="type-chip" data-query="ration card nfsa food scheme">Ration Card</button>
            </div>
          </div>
          
          <div class="speak-alternative">
            ${Button({
    text: getLocalLabel('type_instead', langCode),
    icon: 'keyboard',
    variant: 'ghost',
    id: 'type-btn'
  })}
          </div>
        </div>
      </div>
      
      <footer class="speak-footer">
        <p class="speak-footer-text">${getLocalLabel('powered_by', langCode)}</p>
      </footer>
    </div>
  `;
}

export function initSpeakScreen() {
  initHeader();

  const micBtn = document.getElementById('main-mic-btn');
  const typeBtn = document.getElementById('type-btn');

  if (micBtn) {
    micBtn.addEventListener('click', async () => {
      if (USE_BACKEND) {
        // ── Backend mode: WavRecorder → Saaras v3 ────────────────────────
        // WavRecorder strictly captures 16-bit PCM WAV to guarantee compatibility
        // with Sarvam AI requirements across all browsers.
        try {
          wavRecorder = new WavRecorder();
          await wavRecorder.start();

          // Store recorder reference so ListeningScreen can stop it
          window._saralaiWavRecorder = wavRecorder;
          window._saralaiRecognition = null;   // Not using Web Speech API in backend mode
          
          navigate('listening');

        } catch (err) {
          console.error('Microphone access denied:', err);
          // Fallback: go to type screen if mic unavailable
          navigate('type');
        }

      } else if (isSpeechSupported()) {
        // ── Client-side mode: Web Speech API ───────────────────────────────
        const SpeechRecognition = getSpeechRecognition();
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN,en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        window._saralaiRecognition    = recognition;
        window._saralaiWavRecorder    = null;
        window._saralaiAudioBlob      = null;

        recognition.start();
        navigate('listening');
      } else {
        navigate('type');
      }
    });
  }

  if (typeBtn) {
    typeBtn.addEventListener('click', () => navigate('type'));
  }

  // Example chips — set query and go to processing
  document.querySelectorAll('.speak-example-chips .type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (query) {
        setState({ currentQuery: query });
        navigate('processing');
      }
    });
  });
}



export const speakStyles = `
.speak-screen {
  background-color: transparent;
}

.speak-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8) var(--space-4);
  max-width: 500px;
  width: 100%;
}

.speak-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.speak-example {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
}

.speak-example em {
  color: var(--color-text-primary);
  font-style: normal;
  font-weight: var(--font-weight-medium);
}

.speak-mic {
  margin-bottom: var(--space-4);
}

.speak-tap-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
}

.speak-no-voice-note {
  padding: var(--space-3) var(--space-4);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
  text-align: center;
}

.speak-examples-row {
  width: 100%;
  margin-bottom: var(--space-4);
}

.speak-examples-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.speak-example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}

.speak-example-chips .type-chip {
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-primary-bg);
  border: 1px solid var(--color-primary-ring);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.speak-example-chips .type-chip:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.speak-alternative {
  margin-top: var(--space-2);
}

.speak-footer {
  padding: var(--space-4);
  text-align: center;
}

.speak-footer-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
`;
