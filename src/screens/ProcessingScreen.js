/**
 * Processing Screen — Real Query Execution
 * Runs the user's query through the AI engine and navigates to the result.
 * Supports two modes:
 *   Backend mode (VITE_USE_BACKEND=true):  Sarvam AI pipeline via FastAPI
 *   Client-side mode (default):            Local keyword search via ai.js
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { getState, setState } from '../state.js';
import { processQuery, processQueryBackend, USE_BACKEND } from '../ai.js';
import { getLocalLabel } from '../utils/labels.js';

/**
 * Render processing screen
 * @returns {string} Screen HTML
 */
export function ProcessingScreen() {
  const { detectedLanguageCode, selectedLanguage } = getState();
  const langCode = detectedLanguageCode || (selectedLanguage ? `${selectedLanguage}-IN` : 'en-IN');

  return `
    <div class="screen processing-screen">
      ${Header({ showNav: true })}
      
      <div class="screen-content screen-center">
        <div class="processing-content animate-fadeIn">
          <div class="processing-animation">
            <div class="processing-rings">
              <div class="processing-ring processing-ring-1"></div>
              <div class="processing-ring processing-ring-2"></div>
              <div class="processing-ring processing-ring-3"></div>
            </div>
            <div class="processing-icon">
              ${getIcon('waves', 'icon icon-xl')}
            </div>
          </div>
          
          <h1 class="processing-title">${getLocalLabel('finding_info', langCode).split(' ').slice(0, 3).join(' ')}…</h1>
          <p class="processing-subtitle" id="processing-status">${getLocalLabel('finding_info', langCode)}</p>
          
          <div class="processing-query-badge" id="processing-query-badge" style="display:none">
            <span class="processing-query-text" id="processing-query-text"></span>
          </div>

          <div class="processing-action">
            ${Button({
    text: getLocalLabel('cancel', langCode),
    icon: 'x',
    variant: 'ghost',
    id: 'cancel-btn'
  })}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize processing screen — runs the actual query
 */
export function initProcessingScreen() {
  initHeader();

  const cancelBtn = document.getElementById('cancel-btn');
  const statusEl  = document.getElementById('processing-status');
  const queryBadge = document.getElementById('processing-query-badge');
  const queryText  = document.getElementById('processing-query-text');

  // Show current query
  const { currentQuery } = getState();
  if (currentQuery && queryBadge && queryText) {
    queryText.textContent = `"${currentQuery}"`;
    queryBadge.style.display = 'block';
  }

  let cancelled = false;

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      cancelled = true;
      navigate('speak');
    });
  }

  // Run query after a short visual delay for UX
  setTimeout(() => {
    if (cancelled) return;
    if (statusEl) statusEl.textContent = 'Searching scheme knowledge base…';

    setTimeout(async () => {
      if (cancelled) return;

      const { currentQuery: query, selectedLanguage, detectedLanguageCode } = getState();

      if (!query || query.trim().length < 2) {
        navigate('clarification');
        return;
      }

      try {
        if (USE_BACKEND) {
          // ── Backend mode: Sarvam AI pipeline (sarvam-m + Mayura) ──────────
          // Voice flow: use Saaras-detected BCP-47 language code
          // Text flow:  use manually selected language from LanguageScreen
          const langCode = detectedLanguageCode || selectedLanguage || 'hi';

          if (statusEl) statusEl.textContent = 'Calling Sarvam AI…';

          const { result, confidence, topMatches, apiResponse } =
            await processQueryBackend(query, langCode, null);

          if (cancelled) return;

          setState({ topMatches });

          if (confidence < 0.05 || !result) {
            navigate('clarification');
            return;
          }

          if (statusEl) statusEl.textContent = 'Translating your answer…';

          setState({
            currentScheme:        topMatches[0]?.scheme || null,
            currentIntent:        result.intent,
            currentExplanation:   result,
            apiResult:            apiResponse,
            translatedSummary:    result.summary,
            detectedLanguageCode: result.languageCode || langCode,
            ttsAvailable:         true,
            currentStep:          1,
            queryHistory:         [...getState().queryHistory, query],
          });

        } else {
          // ── Client-side mode: keyword search (no backend needed) ───────────
          const { result, confidence, topMatches } = processQuery(query);

          if (cancelled) return;
          setState({ topMatches });

          if (confidence < 0.05 || !result) {
            navigate('clarification');
            return;
          }

          setState({
            currentScheme:      topMatches[0]?.scheme || null,
            currentIntent:      result.intent,
            currentExplanation: result,
            ttsAvailable:       false,
            currentStep:        1,
            queryHistory:       [...getState().queryHistory, query],
          });
        }

        if (statusEl) statusEl.textContent = 'Found it! Preparing explanation…';
        setTimeout(() => { if (!cancelled) navigate('explanation'); }, 400);

      } catch (err) {
        console.error('Query processing error:', err);
        if (statusEl) statusEl.textContent = 'Something went wrong. Try again.';
        setTimeout(() => { if (!cancelled) navigate('clarification'); }, 1500);
      }
    }, 800);
  }, 600);
}

// Processing screen styles
export const processingStyles = `
.processing-screen {
  background-color: transparent;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8);
}

.processing-animation {
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-8);
}

.processing-rings {
  position: absolute;
  inset: 0;
}

.processing-ring {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary-ring);
  animation: processing-pulse 2s ease-out infinite;
}

.processing-ring-1 {
  animation-delay: 0s;
}

.processing-ring-2 {
  inset: 20px;
  animation-delay: 0.5s;
}

.processing-ring-3 {
  inset: 40px;
  animation-delay: 1s;
}

@keyframes processing-pulse {
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.1;
  }
}

.processing-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  z-index: 1;
}

.processing-icon .icon {
  color: var(--color-primary);
  animation: processing-wave 1s ease-in-out infinite;
}

@keyframes processing-wave {
  0%, 100% { transform: scaleY(0.8); }
  50% { transform: scaleY(1.2); }
}

.processing-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.processing-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
  transition: opacity 0.3s ease;
}

.processing-query-badge {
  display: inline-block;
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-ring);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-4);
  margin-bottom: var(--space-8);
}

.processing-query-text {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  font-style: italic;
}

.processing-action {
  margin-top: var(--space-4);
}
`;
