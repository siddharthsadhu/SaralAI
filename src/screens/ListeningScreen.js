/**
 * Listening Screen — Real-time speech recognition feedback
 */
import { Header, initHeader } from '../components/Header.js';
import { MicButton } from '../components/MicButton.js';
import { Button } from '../components/Button.js';
import { navigate } from '../router.js';
import { setState, getState } from '../state.js';
import { getLocalLabel } from '../utils/labels.js';

export function ListeningScreen() {
  const { detectedLanguageCode, selectedLanguage } = getState();
  const langCode = detectedLanguageCode || (selectedLanguage ? `${selectedLanguage}-IN` : 'en-IN');

  return `
    <div class="screen listening-screen">
      ${Header({})}
      
      <div class="screen-content screen-center">
        <div class="listening-content animate-fadeIn">
          <div class="listening-mic">
            ${MicButton({ size: 'lg', isListening: true, id: 'listening-mic-btn' })}
          </div>
          
          <h1 class="listening-title">${getLocalLabel('listening', langCode).replace('…', '')}</h1>
          <p class="listening-subtitle" id="listening-status">${getLocalLabel('listening', langCode)}</p>

          <div class="listening-transcript" id="listening-transcript" style="display:none">
            <div class="listening-transcript-text" id="listening-transcript-text"></div>
          </div>
          
          <div class="listening-action">
            ${Button({
    text: getLocalLabel('stop', langCode),
    icon: 'stop',
    variant: 'ghost',
    size: 'lg',
    id: 'stop-btn'
  })}
          </div>
        </div>
      </div>
      
      <footer class="listening-footer">
        <p class="listening-footer-text">${getLocalLabel('speak_clearly', langCode)}</p>
      </footer>
    </div>
  `;
}

export function initListeningScreen() {
  initHeader();

  const stopBtn      = document.getElementById('stop-btn');
  const statusEl     = document.getElementById('listening-status');
  const transcriptBox  = document.getElementById('listening-transcript');
  const transcriptText = document.getElementById('listening-transcript-text');

  const recognition   = window._saralaiRecognition;    // Web Speech API (client-side mode)
  const wavRecorder   = window._saralaiWavRecorder;    // WavRecorder (backend mode)
  let isNavigating = false;
  let isProcessing = false;

  function goToProcessing(query, detectedLangCode = null) {
    if (isNavigating) return;
    isNavigating = true;
    setState({
      currentQuery:        query || '',
      detectedLanguageCode: detectedLangCode,   // BCP-47 from Saaras, null in client-side mode
    });
    navigate('processing');
  }

  // ── Backend mode: WavRecorder + Saaras v3 ────────────────────────────────
  if (wavRecorder) {
    // Stop recording after 10 seconds max (auto-stop)
    const autoStopTimer = setTimeout(async () => {
      if (!isNavigating && !isProcessing) {
        await handleStop(autoStopTimer);
      }
    }, 10000);

    const handleStop = async (timer) => {
      if (isNavigating || isProcessing) return;
      isProcessing = true;
      clearTimeout(timer);

      if (statusEl) statusEl.textContent = 'Sending to Sarvam AI…';
      
      const audioBlob = await wavRecorder.stop();
      window._saralaiWavRecorder = null;

      if (!audioBlob || audioBlob.size === 0) {
        if (statusEl) statusEl.textContent = 'Could not hear clearly. Please try again.';
        setTimeout(() => { if (!isNavigating) { isNavigating = true; navigate('speak'); } }, 2000);
        return;
      }

      try {
        const { transcript, languageCode } = await import('../ai.js').then(m =>
          m.transcribeAudio(audioBlob)
        );

        if (!transcript) {
          if (statusEl) statusEl.textContent = 'Could not hear clearly. Please try again.';
          setTimeout(() => { if (!isNavigating) { isNavigating = true; navigate('speak'); } }, 2000);
          return;
        }

        if (statusEl) statusEl.textContent = 'Got it!';
        if (transcriptText) transcriptText.textContent = `"${transcript}"`;
        if (transcriptBox) transcriptBox.style.display = 'block';

        setTimeout(() => goToProcessing(transcript, languageCode), 700);

      } catch (err) {
        console.error('[Saaras] Transcription failed:', err);
        if (statusEl) statusEl.textContent = 'Could not process audio. Please try again.';
        setTimeout(() => { if (!isNavigating) { isNavigating = true; navigate('speak'); } }, 2000);
      }
    }; // end handleStop

    if (stopBtn) {
      stopBtn.addEventListener('click', async () => {
        if (!isNavigating && !isProcessing) {
          await handleStop(autoStopTimer);
        }
      });
    }

  // ── Client-side mode: Web Speech API ──────────────────────────────────────
  } else if (recognition) {
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (statusEl) statusEl.textContent = 'Got it!';
      if (transcriptText) transcriptText.textContent = `"${transcript}"`;
      if (transcriptBox) transcriptBox.style.display = 'block';
      setTimeout(() => goToProcessing(transcript, null), 700);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (statusEl) statusEl.textContent = 'Could not hear clearly. Please try again.';
      setTimeout(() => {
        if (!isNavigating) { isNavigating = true; navigate('speak'); }
      }, 2000);
    };

    recognition.onend = () => {
      if (!isNavigating) {
        setTimeout(() => {
          if (!isNavigating) { isNavigating = true; navigate('type'); }
        }, 500);
      }
    };

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        isNavigating = true;
        try { recognition.stop(); } catch (e) { /* ignore */ }
        window._saralaiRecognition = null;
        navigate('speak');
      });
    }

  } else {
    // No recognition active — demo / fallback
    if (statusEl) statusEl.textContent = 'No active recording. Return to Speak screen.';
    setTimeout(() => {
      if (!isNavigating && window.location.hash === '#listening') {
        isNavigating = true;
        navigate('speak');
      }
    }, 2500);
  }
}

export const listeningStyles = `
.listening-screen {
  background-color: transparent;
}

.listening-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8);
}

.listening-mic {
  margin-bottom: var(--space-8);
}

.listening-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.listening-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
  transition: color 0.3s ease;
}

.listening-transcript {
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-primary-ring);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-6);
  max-width: 360px;
  margin-bottom: var(--space-6);
  animation: fadeIn 0.3s ease forwards;
}

.listening-transcript-text {
  font-size: var(--font-size-base);
  color: var(--color-primary);
  font-style: italic;
  font-weight: var(--font-weight-medium);
}

.listening-action {
  margin-top: var(--space-4);
}

.listening-footer {
  padding: var(--space-4);
  text-align: center;
}

.listening-footer-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
`;
