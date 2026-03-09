/**
 * Listening Screen — Real-time speech recognition feedback
 */
import { Header, initHeader } from '../components/Header.js';
import { MicButton } from '../components/MicButton.js';
import { Button } from '../components/Button.js';
import { navigate } from '../router.js';
import { setState } from '../state.js';

export function ListeningScreen() {
  return `
    <div class="screen listening-screen">
      ${Header({})}
      
      <div class="screen-content screen-center">
        <div class="listening-content animate-fadeIn">
          <div class="listening-mic">
            ${MicButton({ size: 'lg', isListening: true, id: 'listening-mic-btn' })}
          </div>
          
          <h1 class="listening-title">Sun raha hoon…</h1>
          <p class="listening-subtitle" id="listening-status">Listening…</p>

          <div class="listening-transcript" id="listening-transcript" style="display:none">
            <div class="listening-transcript-text" id="listening-transcript-text"></div>
          </div>
          
          <div class="listening-action">
            ${Button({
    text: 'Stop',
    icon: 'stop',
    variant: 'ghost',
    size: 'lg',
    id: 'stop-btn'
  })}
          </div>
        </div>
      </div>
      
      <footer class="listening-footer">
        <p class="listening-footer-text">Speak clearly in your preferred language</p>
      </footer>
    </div>
  `;
}

export function initListeningScreen() {
  initHeader();

  const stopBtn = document.getElementById('stop-btn');
  const statusEl = document.getElementById('listening-status');
  const transcriptBox = document.getElementById('listening-transcript');
  const transcriptText = document.getElementById('listening-transcript-text');

  // Get recognition instance started by SpeakScreen
  const recognition = window._saralaiRecognition;
  let stopped = false;

  function goToProcessing(query) {
    if (stopped) return;
    stopped = true;
    setState({ currentQuery: query || '' });
    navigate('processing');
  }

  if (recognition) {
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (statusEl) statusEl.textContent = 'Got it!';
      if (transcriptText) transcriptText.textContent = `"${transcript}"`;
      if (transcriptBox) transcriptBox.style.display = 'block';

      // Brief pause to show transcript, then proceed
      setTimeout(() => goToProcessing(transcript), 700);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (statusEl) statusEl.textContent = 'Could not hear clearly. Please try again.';
      // Auto-navigate back to speak screen after error
      setTimeout(() => {
        if (!stopped) {
          stopped = true;
          navigate('speak');
        }
      }, 2000);
    };

    recognition.onend = () => {
      if (!stopped) {
        // Recognition ended without result — navigate to type screen
        setTimeout(() => {
          if (!stopped) {
            stopped = true;
            navigate('type');
          }
        }, 500);
      }
    };
  } else {
    // No recognition — demo mode: auto-transition after 3s
    if (statusEl) statusEl.textContent = 'Demo mode — voice not started from Speak screen';
    setTimeout(() => {
      if (!stopped && window.location.hash === '#listening') {
        stopped = true;
        navigate('speak');
      }
    }, 3000);
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      stopped = true;
      if (recognition) {
        try { recognition.stop(); } catch (e) { /* ignore */ }
      }
      window._saralaiRecognition = null;
      navigate('speak');
    });
  }
}

export const listeningStyles = `
.listening-screen {
  background-color: var(--color-bg);
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
