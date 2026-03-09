/**
 * Header Component
 */
import { getIcon } from '../icons.js';
import { getSelectedLanguage } from '../state.js';
import { navigate } from '../router.js';

/**
 * Create header component
 * @param {object} options
 * @param {boolean} options.showNav - Show navigation links
 * @param {boolean} options.showLanguageToggle - Show language toggle button
 * @param {boolean} options.showVoiceAssist - Show voice assist button
 * @param {boolean} options.showBack - Show back button instead of logo
 * @param {Function} options.onBack - Back button callback
 * @returns {string} Header HTML
 */
export function Header(options = {}) {
     const {
          showNav = false,
          showLanguageToggle = false,
          showVoiceAssist = false,
          showBack = false,
          onBack = null
     } = options;

     const lang = getSelectedLanguage();

     const logoHtml = showBack ? `
    <button class="header-back" id="header-back-btn">
      ${getIcon('arrowLeft', 'icon')}
      <span>Back</span>
    </button>
  ` : `
    <a href="#landing" class="header-logo">
      ${getIcon('government', 'icon icon-lg')}
      <span>SaralAI</span>
    </a>
  `;

     const navHtml = showNav ? `
    <nav class="header-nav">
      <a href="#speak" class="header-nav-link">Home</a>
      <a href="#explanation" class="header-nav-link">Services</a>
      <a href="#language" class="header-nav-link">Language</a>
      <a href="#speak" class="header-nav-link">Help</a>
    </nav>
  ` : '';

     const languageToggleHtml = showLanguageToggle ? `
    <button class="header-lang-toggle" id="lang-toggle-btn">
      ${getIcon('translate', 'icon icon-sm')}
      <span>${lang.english} / English</span>
    </button>
  ` : '';

     const voiceAssistHtml = showVoiceAssist ? `
    <button class="header-voice-btn" id="voice-assist-btn">
      ${getIcon('mic', 'icon icon-sm')}
      <span>Voice Assist</span>
    </button>
  ` : '';

     const userHtml = showNav ? `
    <div class="header-user">
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="User" class="header-avatar" />
    </div>
  ` : '';

     return `
    <header class="header">
      <div class="header-container">
        ${logoHtml}
        <div class="header-right">
          ${navHtml}
          ${languageToggleHtml}
          ${voiceAssistHtml}
          ${userHtml}
        </div>
      </div>
    </header>
  `;
}

/**
 * Initialize header event listeners
 */
export function initHeader() {
     const backBtn = document.getElementById('header-back-btn');
     if (backBtn) {
          backBtn.addEventListener('click', () => {
               window.history.back();
          });
     }

     const langToggle = document.getElementById('lang-toggle-btn');
     if (langToggle) {
          langToggle.addEventListener('click', () => {
               navigate('language');
          });
     }

     const voiceAssist = document.getElementById('voice-assist-btn');
     if (voiceAssist) {
          voiceAssist.addEventListener('click', () => {
               navigate('speak');
          });
     }
}

// Header styles
export const headerStyles = `
.header {
  background-color: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--space-3) var(--space-4);
  position: sticky;
  top: 0;
  z-index: var(--z-dropdown);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
}

.header-logo .icon {
  color: var(--color-primary);
}

.header-back {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.header-back:hover {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.header-nav-link:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg);
}

.header-lang-toggle,
.header-voice-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-lang-toggle:hover,
.header-voice-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.header-user {
  display: flex;
  align-items: center;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg);
  border: 2px solid var(--color-border);
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }
  
  .header-lang-toggle span,
  .header-voice-btn span {
    display: none;
  }
}
`;
