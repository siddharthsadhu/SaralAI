/**
 * Type Question Screen
 * Alternative to voice input - type your question
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { setState } from '../state.js';

/**
 * Render type screen
 * @returns {string} Screen HTML
 */
export function TypeScreen() {
     return `
    <div class="screen type-screen">
      ${Header({ showLanguageToggle: true })}
      
      <div class="screen-content">
        <div class="container">
          <div class="type-header animate-fadeIn">
            <h1 class="heading-2">Type your question</h1>
            <p class="text-body">Write in any language you're comfortable with.</p>
          </div>
          
          <div class="type-input-wrapper animate-slideUp">
            <div class="type-input-container">
              <textarea 
                class="type-input" 
                id="question-input" 
                placeholder="E.g., How can I apply for a ration card?"
                rows="4"
              ></textarea>
              <div class="type-input-footer">
                <span class="type-char-count" id="char-count">0 / 500</span>
              </div>
            </div>
            
            <div class="type-examples">
              <p class="type-examples-title">Try asking about:</p>
              <div class="type-example-chips">
                <button class="type-chip" data-query="How to apply for Aadhaar card?">
                  Aadhaar Card
                </button>
                <button class="type-chip" data-query="Pradhan Mantri Awas Yojana eligibility">
                  PM Awas Yojana
                </button>
                <button class="type-chip" data-query="How to get a ration card?">
                  Ration Card
                </button>
                <button class="type-chip" data-query="Senior citizen pension scheme">
                  Pension Scheme
                </button>
              </div>
            </div>
          </div>
          
          <div class="type-actions">
            ${Button({
          text: 'Ask',
          icon: 'arrowRight',
          iconPosition: 'right',
          variant: 'primary',
          size: 'lg',
          fullWidth: true,
          id: 'ask-btn'
     })}
            
            <button class="type-voice-switch" id="voice-switch-btn">
              ${getIcon('mic', 'icon icon-sm')}
              <span>Prefer to speak instead?</span>
            </button>
          </div>
        </div>
      </div>
      
      <footer class="type-footer">
        <p class="type-footer-text">Protected by Government Secure Services</p>
      </footer>
    </div>
  `;
}

/**
 * Initialize type screen events
 */
export function initTypeScreen() {
     initHeader();

     const input = document.getElementById('question-input');
     const charCount = document.getElementById('char-count');
     const askBtn = document.getElementById('ask-btn');

     if (input && charCount) {
          input.addEventListener('input', () => {
               const count = input.value.length;
               charCount.textContent = `${count} / 500`;

               if (count > 500) {
                    charCount.classList.add('type-char-count-error');
               } else {
                    charCount.classList.remove('type-char-count-error');
               }
          });

          // Focus input on load
          setTimeout(() => input.focus(), 300);
     }

     if (askBtn) {
          askBtn.addEventListener('click', () => {
               const query = input?.value?.trim();
               if (query) {
                    setState({ currentQuery: query });
                    navigate('processing');
               } else {
                    // Show toast if empty
                    if (window.SaralAI?.showToast) {
                         window.SaralAI.showToast('Please enter your question');
                    }
               }
          });
     }

     // Example chips
     document.querySelectorAll('.type-chip').forEach(chip => {
          chip.addEventListener('click', () => {
               const query = chip.dataset.query;
               if (input && query) {
                    input.value = query;
                    input.dispatchEvent(new Event('input'));
               }
          });
     });

     const voiceSwitchBtn = document.getElementById('voice-switch-btn');
     if (voiceSwitchBtn) {
          voiceSwitchBtn.addEventListener('click', () => {
               navigate('speak');
          });
     }
}

// Type screen styles
export const typeStyles = `
.type-screen {
  background-color: var(--color-bg);
}

.type-header {
  padding-top: var(--space-6);
  margin-bottom: var(--space-6);
}

.type-header h1 {
  margin-bottom: var(--space-2);
}

.type-input-wrapper {
  margin-bottom: var(--space-6);
}

.type-input-container {
  background-color: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.type-input-container:focus-within {
  border-color: var(--color-primary);
}

.type-input {
  width: 100%;
  padding: var(--space-5);
  border: none;
  background: transparent;
  font-family: var(--font-family);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  resize: none;
  line-height: var(--line-height-relaxed);
}

.type-input::placeholder {
  color: var(--color-text-muted);
}

.type-input:focus {
  outline: none;
}

.type-input-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border-light);
}

.type-char-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.type-char-count-error {
  color: var(--color-error);
}

.type-examples {
  margin-top: var(--space-6);
}

.type-examples-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.type-example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.type-chip {
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

.type-chip:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.type-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6) 0;
}

.type-voice-switch {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.type-voice-switch:hover {
  color: var(--color-primary);
}

.type-footer {
  padding: var(--space-4);
  text-align: center;
}

.type-footer-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .type-input {
    font-size: var(--font-size-base);
    padding: var(--space-4);
  }
  
  .type-example-chips {
    gap: var(--space-2);
  }
  
  .type-chip {
    font-size: var(--font-size-xs);
  }
}
`;
