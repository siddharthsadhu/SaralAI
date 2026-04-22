/**
 * Language Selection Screen
 */
import { Header, initHeader } from '../components/Header.js';
import { LanguageGrid } from '../components/LanguageCard.js';
import { Button } from '../components/Button.js';
import { getState, setSelectedLanguage } from '../state.js';
import { navigate } from '../router.js';
import { getIcon } from '../icons.js';

/**
 * Render language selection screen
 * @returns {string} Screen HTML
 */
export function LanguageScreen() {
  const { languages, selectedLanguage } = getState();

  return `
    <div class="screen language-screen">
      ${Header({ showVoiceAssist: true })}
      
      <div class="screen-content">
        <div class="container">
          <div class="language-header animate-fadeIn">
            <h1 class="heading-2">Choose the language you are comfortable with</h1>
            <p class="text-body">Select one to proceed. You can change this later in settings.</p>
          </div>
          
          ${LanguageGrid(languages, selectedLanguage)}
          
          <div class="language-footer">
            ${Button({
    text: 'Continue',
    icon: 'arrowRight',
    iconPosition: 'right',
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'continue-btn'
  })}
            
            <p class="language-hint">
              ${getIcon('info', 'icon icon-sm')}
              <span>You can also say the name of the language.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize language screen events
 */
export function initLanguageScreen() {
  initHeader();

  // Language card selection
  document.querySelectorAll('.language-card').forEach(card => {
    card.addEventListener('click', () => {
      const langCode = card.dataset.lang;
      setSelectedLanguage(langCode);

      // Update UI
      document.querySelectorAll('.language-card').forEach(c => {
        c.classList.remove('language-card-selected');
        c.querySelector('.language-card-check')?.remove();
      });

      card.classList.add('language-card-selected');

      // Add checkmark
      const checkHtml = `
        <span class="language-card-check">
          ${getIcon('check', 'icon')}
        </span>
      `;
      card.insertAdjacentHTML('beforeend', checkHtml);
    });
  });

  // Continue button
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      navigate('interactionmode');
    });
  }
}

// Language screen styles
export const languageStyles = `
.language-screen {
  background-color: transparent;
}

.language-header {
  padding-top: var(--space-8);
  margin-bottom: var(--space-4);
}

.language-header h1 {
  margin-bottom: var(--space-2);
}

.language-footer {
  position: sticky;
  bottom: 0;
  padding: var(--space-6) 0;
  background: linear-gradient(to top, var(--color-bg) 80%, transparent);
}

.language-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.language-hint .icon {
  color: var(--color-text-muted);
}
`;
