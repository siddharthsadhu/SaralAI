/**
 * Audio Player Component — Sarvam AI TTS (Bulbul v3) Integration
 * ---------------------------------------------------------------
 * Renders the "Listen" button on the Explanation screen.
 *
 * ⚠️  ON-DEMAND ONLY: TTS API is called ONLY when the user clicks the play
 *     button. It is NEVER triggered automatically. This conserves Bulbul v3
 *     API credits — users who only need to read the answer don't cost TTS quota.
 *
 * Flow when user taps Listen:
 *   1. Button shows loading spinner
 *   2. POST /api/tts/speak → Bulbul v3 returns WAV bytes
 *   3. WAV is decoded into a blob URL
 *   4. <audio> element plays the WAV
 *   5. Button switches to "Stop" while playing, "Listen again" when done
 *
 * Falls back gracefully if backend is unavailable or USE_BACKEND=false.
 */
import { getIcon } from '../icons.js';
import { requestTTS, USE_BACKEND } from '../ai.js';
import { getState } from '../state.js';

/**
 * Create an audio player with live Sarvam TTS integration.
 *
 * @param {object} options
 * @param {string} options.title       - Player title text
 * @param {string} options.subtitle    - Player subtitle text
 * @param {string} options.id          - Player element ID
 * @returns {string} Audio player HTML
 */
export function AudioPlayer(options = {}) {
     const {
          title    = 'Listen to explanation',
          subtitle = 'Tap to hear this in your language',
          id       = 'audio-player'
     } = options;

     return `
    <div class="audio-player" id="${id}">
      <button class="audio-player-btn" id="${id}-play" aria-label="Listen to explanation">
        ${getIcon('play', 'icon icon-lg')}
      </button>
      <div class="audio-player-content">
        <div class="audio-player-info">
          <span class="audio-player-title">${title}</span>
          <span class="audio-player-subtitle" id="${id}-subtitle">${subtitle}</span>
        </div>
        <div class="audio-player-wave" id="${id}-wave">
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
        </div>
      </div>
      <!-- Hidden native audio element — plays WAV from Bulbul v3 -->
      <audio id="${id}-audio" style="display:none"></audio>
    </div>
  `;
}

/**
 * Initialize audio player TTS behaviour.
 * Call this after AudioPlayer HTML is inserted into the DOM.
 *
 * @param {string} playerId - The id passed to AudioPlayer() (default: 'audio-player')
 */
export function initAudioPlayer(playerId = 'audio-player') {
     const playBtn    = document.getElementById(`${playerId}-play`);
     const subtitleEl = document.getElementById(`${playerId}-subtitle`);
     const waveEl     = document.getElementById(`${playerId}-wave`);
     const audioEl    = document.getElementById(`${playerId}-audio`);

     if (!playBtn || !audioEl) return;

     let audioObjectUrl = null;   // Revoke after use to free memory
     let isLoading      = false;

     playBtn.addEventListener('click', async () => {
          // If already playing, stop it
          if (!audioEl.paused) {
               audioEl.pause();
               audioEl.currentTime = 0;
               resetPlayerUI();
               return;
          }

          // If audio already loaded (user tapped Listen again), just replay
          if (audioObjectUrl && audioEl.src) {
               audioEl.play();
               setPlayingUI();
               return;
          }

          if (isLoading) return;   // Prevent double-tap

          // ── Check if TTS is available ───────────────────────────────────────
          if (!USE_BACKEND) {
               if (subtitleEl) subtitleEl.textContent = 'Enable backend mode for voice playback';
               return;
          }

          const { translatedSummary, detectedLanguageCode, ttsAvailable } = getState();

          if (!ttsAvailable || !translatedSummary) {
               if (subtitleEl) subtitleEl.textContent = 'No audio available for this answer';
               return;
          }

          // ── Request TTS from Bulbul v3 (ON DEMAND) ─────────────────────────
          setLoadingUI();
          isLoading = true;

          try {
               const langCode = detectedLanguageCode || 'hi-IN';
               audioObjectUrl = await requestTTS(translatedSummary, langCode);

               audioEl.src = audioObjectUrl;
               audioEl.load();
               await audioEl.play();

               setPlayingUI();

               // When audio ends — reset button
               audioEl.onended = () => {
                    resetPlayerUI();
                    // Keep audioObjectUrl so user can tap Listen again without another API call
               };

          } catch (err) {
               console.error('[AudioPlayer] TTS request failed:', err);
               if (subtitleEl) subtitleEl.textContent = 'Could not load audio. Try again.';
               resetPlayerUI();
               audioObjectUrl = null;
          } finally {
               isLoading = false;
          }
     });

     function setLoadingUI() {
          playBtn.innerHTML = `<svg class="icon icon-lg audio-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;
          playBtn.disabled = true;
          if (subtitleEl) subtitleEl.textContent = 'Generating audio…';
          if (waveEl) waveEl.style.opacity = '0.3';
     }

     function setPlayingUI() {
          playBtn.innerHTML = getIcon('stop', 'icon icon-lg');
          playBtn.disabled = false;
          if (subtitleEl) subtitleEl.textContent = 'Playing • Tap to stop';
          if (waveEl) waveEl.style.opacity = '1';
     }

     function resetPlayerUI() {
          playBtn.innerHTML = getIcon('play', 'icon icon-lg');
          playBtn.disabled = false;
          if (subtitleEl) subtitleEl.textContent = audioObjectUrl ? 'Tap to listen again' : 'Tap to hear this in your language';
          if (waveEl) waveEl.style.opacity = '0.6';
     }
}

// Audio player styles
export const audioPlayerStyles = `
.audio-player {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.audio-player-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-full);
  color: var(--color-text-inverse);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.audio-player-btn:hover {
  background-color: var(--color-primary-dark);
  transform: scale(1.05);
}

.audio-player-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.audio-player-btn .icon {
  width: 20px;
  height: 20px;
}

.audio-spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.audio-player-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.audio-player-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.audio-player-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.audio-player-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  transition: color 0.2s;
}

.audio-player-wave {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 20px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.wave-bar {
  width: 3px;
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 2px;
  animation: wave-animation 1s ease-in-out infinite;
}

.wave-bar:nth-child(1)  { height: 40%; animation-delay: 0s; }
.wave-bar:nth-child(2)  { height: 70%; animation-delay: 0.1s; }
.wave-bar:nth-child(3)  { height: 50%; animation-delay: 0.2s; }
.wave-bar:nth-child(4)  { height: 90%; animation-delay: 0.3s; }
.wave-bar:nth-child(5)  { height: 60%; animation-delay: 0.4s; }
.wave-bar:nth-child(6)  { height: 80%; animation-delay: 0.5s; }
.wave-bar:nth-child(7)  { height: 40%; animation-delay: 0.6s; }
.wave-bar:nth-child(8)  { height: 70%; animation-delay: 0.7s; }
.wave-bar:nth-child(9)  { height: 30%; animation-delay: 0.8s; }
.wave-bar:nth-child(10) { height: 50%; animation-delay: 0.9s; }
.wave-bar:nth-child(11) { height: 20%; animation-delay: 1s; }
.wave-bar:nth-child(12) { height: 30%; animation-delay: 1.1s; }

@keyframes wave-animation {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@media (max-width: 480px) {
  .audio-player {
    flex-wrap: wrap;
  }
}
`;
