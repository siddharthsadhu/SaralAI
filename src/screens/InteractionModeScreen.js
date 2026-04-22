/**
 * Interaction Mode Selection Screen
 * Screen 3: How would you like to ask your question?
 */
import { Header, initHeader } from '../components/Header.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { setState } from '../state.js';

/**
 * Render interaction mode screen
 * @returns {string} Screen HTML
 */
export function InteractionModeScreen() {
     return `
    <div class="screen interaction-mode-screen">
      ${Header({})}
      
      <div class="screen-content screen-center">
        <div class="container">
          <div class="interaction-header animate-fadeIn">
            <h1 class="heading-2">How would you like to ask your question?</h1>
            <p class="text-body">Choose the way that's most comfortable for you.</p>
          </div>
          
          <div class="interaction-options">
            <button class="interaction-card interaction-card-primary stagger-item" id="speak-option" style="animation-delay: 0.1s">
              <div class="interaction-card-icon">
                ${getIcon('mic', 'icon')}
              </div>
              <div class="interaction-card-content">
                <h3 class="interaction-card-title">Speak</h3>
                <p class="interaction-card-desc">Talk naturally in your language. Just say what you need help with.</p>
              </div>
              <div class="interaction-card-badge">Recommended</div>
              <div class="interaction-card-arrow">
                ${getIcon('arrowRight', 'icon')}
              </div>
            </button>
            
            <button class="interaction-card stagger-item" id="type-option" style="animation-delay: 0.2s">
              <div class="interaction-card-icon interaction-card-icon-secondary">
                ${getIcon('keyboard', 'icon')}
              </div>
              <div class="interaction-card-content">
                <h3 class="interaction-card-title">Type</h3>
                <p class="interaction-card-desc">Write your question if you prefer typing over speaking.</p>
              </div>
              <div class="interaction-card-arrow">
                ${getIcon('arrowRight', 'icon')}
              </div>
            </button>
          </div>
          
          <div class="interaction-footer animate-fadeIn" style="animation-delay: 0.3s">
            <p class="interaction-hint">
              ${getIcon('info', 'icon icon-sm')}
              <span>You can switch between modes anytime</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize interaction mode screen events
 */
export function initInteractionModeScreen() {
     initHeader();

     const speakOption = document.getElementById('speak-option');
     if (speakOption) {
          speakOption.addEventListener('click', () => {
               setState({ interactionMode: 'voice' });
               navigate('speak');
          });
     }

     const typeOption = document.getElementById('type-option');
     if (typeOption) {
          typeOption.addEventListener('click', () => {
               setState({ interactionMode: 'text' });
               navigate('type');
          });
     }
}

// Interaction mode screen styles
export const interactionModeStyles = `
.interaction-mode-screen {
  background: transparent;
}

.interaction-header {
  text-align: center;
  padding-top: var(--space-8);
  margin-bottom: var(--space-10);
}

.interaction-header h1 {
  margin-bottom: var(--space-3);
}

.interaction-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 500px;
  margin: 0 auto;
}

.interaction-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  background-color: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
  width: 100%;
}

.interaction-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.interaction-card:active {
  transform: translateY(0);
}

.interaction-card-primary {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(124, 58, 237, 0.12) 100%);
}

.interaction-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-lg);
  color: white;
  flex-shrink: 0;
}

.interaction-card-icon .icon {
  width: 28px;
  height: 28px;
}

.interaction-card-icon-secondary {
  background: linear-gradient(135deg, var(--color-text-secondary) 0%, var(--color-text-muted) 100%);
}

.interaction-card-content {
  flex: 1;
}

.interaction-card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.interaction-card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.interaction-card-badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  padding: var(--space-1) var(--space-2);
  background-color: var(--color-primary);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.interaction-card-arrow {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

.interaction-card:hover .interaction-card-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

.interaction-footer {
  text-align: center;
  margin-top: var(--space-10);
}

.interaction-hint {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.interaction-hint .icon {
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .interaction-card {
    padding: var(--space-4);
  }
  
  .interaction-card-icon {
    width: 48px;
    height: 48px;
  }
  
  .interaction-card-icon .icon {
    width: 24px;
    height: 24px;
  }
}
`;
