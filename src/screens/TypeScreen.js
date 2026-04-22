/**
 * Type Question Screen
 * Alternative to voice input - type your question
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { getState, setState } from '../state.js';
import { getLocalLabel } from '../utils/labels.js';

/**
 * Render type screen
 * @returns {string} Screen HTML
 */
export function TypeScreen() {
     const { detectedLanguageCode, selectedLanguage } = getState();
     const langCode = detectedLanguageCode || (selectedLanguage ? `${selectedLanguage}-IN` : 'en-IN');

     return `
    <div class="screen type-screen">
      ${Header({ showLanguageToggle: true })}
      
      <div class="screen-content">
        <div class="container">
          <div class="type-header animate-fadeIn">
            <h1 class="heading-2">${getLocalLabel('type_your_question', langCode)}</h1>
          </div>
          
          <div class="type-input-wrapper animate-slideUp">
            <div class="type-input-container">
              <div class="type-language-selector">
                <select id="language-dropdown" class="type-lang-select">
                  <option value="en-IN">English</option>
                  <option value="hi-IN" selected>हिंदी (Hindi)</option>
                  <option value="bn-IN">বাংলা (Bengali)</option>
                  <option value="te-IN">తెలుగు (Telugu)</option>
                  <option value="mr-IN">मराठी (Marathi)</option>
                  <option value="ta-IN">தமிழ் (Tamil)</option>
                  <option value="gu-IN">ગુજરાતી (Gujarati)</option>
                  <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>
              <textarea 
                class="type-input" 
                id="question-input" 
                rows="4"
              ></textarea>
              <div class="type-input-footer">
                <span class="type-char-count" id="char-count">0 / 500</span>
              </div>
            </div>
            
            <div class="type-examples">
              <p class="type-examples-title">${getLocalLabel('or_try_these', langCode)}</p>
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
          text: getLocalLabel('ask', langCode),
          icon: 'arrowRight',
          iconPosition: 'right',
          variant: 'primary',
          size: 'lg',
          fullWidth: true,
          id: 'ask-btn'
     })}
            
            <button class="type-voice-switch" id="voice-switch-btn">
              ${getIcon('mic', 'icon icon-sm')}
              <span>${getLocalLabel('speak_in_your_language', langCode)}</span>
            </button>
          </div>
        </div>
      </div>
      
      <footer class="type-footer">
        <p class="type-footer-text">${getLocalLabel('powered_by', langCode)}</p>
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

          const { typeScreenPrefill } = getState();
          if (typeScreenPrefill) {
               input.value = typeScreenPrefill;
               input.dispatchEvent(new Event('input'));
               setState({ typeScreenPrefill: null });
          }

          // Focus input on load
          setTimeout(() => input.focus(), 300);
     }

     if (askBtn) {
          askBtn.addEventListener('click', () => {
               const query = input?.value?.trim();
               if (query) {
                    const langSelect = document.getElementById('language-dropdown');
                    const lang = langSelect ? langSelect.value : 'hi-IN';
                    setState({ 
                         currentQuery: query,
                         detectedLanguageCode: lang 
                    });
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
  background-color: transparent;
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
  padding: var(--space-4) var(--space-5);
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

.type-language-selector {
  padding: var(--space-3) var(--space-5);
  background-color: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.type-lang-select {
  border: none;
  background: transparent;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  cursor: pointer;
  outline: none;
}

.type-input-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-2) var(--space-4);
  background-color: transparent;
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
