/**
 * Processing Screen — Real Query Execution
 * Runs the user's query through the AI engine and navigates to the result.
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { getState, setState } from '../state.js';
import { processQuery } from '../ai.js';

/**
 * Render processing screen
 * @returns {string} Screen HTML
 */
export function ProcessingScreen() {
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
          
          <h1 class="processing-title">Samajh raha hoon…</h1>
          <p class="processing-subtitle" id="processing-status">Finding the best information for you</p>
          
          <div class="processing-query-badge" id="processing-query-badge" style="display:none">
            <span class="processing-query-text" id="processing-query-text"></span>
          </div>

          <div class="processing-action">
            ${Button({
    text: 'Cancel',
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
  const statusEl = document.getElementById('processing-status');
  const queryBadge = document.getElementById('processing-query-badge');
  const queryText = document.getElementById('processing-query-text');

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

    // Simulate slight processing time for natural feel
    setTimeout(() => {
      if (cancelled) return;

      const query = getState().currentQuery;

      if (!query || query.trim().length < 2) {
        navigate('clarification');
        return;
      }

      try {
        const { result, confidence, topMatches } = processQuery(query);

        // Save full match list for clarification screen
        setState({ topMatches });

        if (confidence < 0.05 || !result) {
          // Can't confidently match — ask for clarification
          navigate('clarification');
          return;
        }

        // Find the top scheme object
        const topScheme = topMatches[0]?.scheme || null;

        // Save to state for downstream screens
        setState({
          currentScheme: topScheme,
          currentIntent: result.intent,
          currentExplanation: result,
          queryHistory: [...getState().queryHistory, query]
        });

        if (statusEl) statusEl.textContent = 'Found it! Preparing explanation…';

        setTimeout(() => {
          if (!cancelled) navigate('explanation');
        }, 400);

      } catch (err) {
        console.error('Query processing error:', err);
        navigate('clarification');
      }
    }, 800);
  }, 600);
}

// Processing screen styles
export const processingStyles = `
.processing-screen {
  background-color: var(--color-bg);
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
