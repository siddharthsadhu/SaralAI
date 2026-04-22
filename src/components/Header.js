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
     
     let userProfileHtml = '';
     try {
       const userStr = localStorage.getItem('saralai_user');
       if (userStr) {
         const user = JSON.parse(userStr);
         const avatar = user.picture ? `<img src="${user.picture}" alt="Profile" class="header-avatar-img">` : getIcon('user', 'icon icon-sm');
         userProfileHtml = `
           <div class="header-profile">
             <button class="header-profile-btn" id="header-profile-btn">
               ${avatar}
               <span class="header-profile-name">${user.name || user.email}</span>
             </button>
             <div class="header-profile-dropdown" id="header-profile-dropdown" style="display: none;">
                <div class="header-profile-email">${user.email}</div>
                <button class="header-logout-btn" id="header-logout-btn">
                  Logout
                </button>
             </div>
           </div>
         `;
       }
     } catch(e) {}


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
      <a href="#services" class="header-nav-link">Services</a>
      <a href="#help" class="header-nav-link">Help</a>
    </nav>
  ` : '';

     // Language toggle has been removed as the app now automatically detects language via Voice (Saaras) or provides an inline dropdown for Typing.
     const languageToggleHtml = '';

     const voiceAssistHtml = showVoiceAssist ? `
    <button class="header-voice-btn" id="voice-assist-btn">
      ${getIcon('mic', 'icon icon-sm')}
      <span>Voice Assist</span>
    </button>
  ` : '';

     return `
    <header class="header">
      <div class="header-container">
        ${logoHtml}
        <div class="header-right">
          ${navHtml}
          ${languageToggleHtml}
          ${voiceAssistHtml}
          ${userProfileHtml}
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

     // langToggle removed for automatic language handling

     const voiceAssist = document.getElementById('voice-assist-btn');
     if (voiceAssist) {
          voiceAssist.addEventListener('click', () => {
               navigate('speak');
          });
     }

     const profileBtn = document.getElementById('header-profile-btn');
     const profileDropdown = document.getElementById('header-profile-dropdown');
     if (profileBtn && profileDropdown) {
         profileBtn.addEventListener('click', (e) => {
             e.stopPropagation();
             const isHidden = profileDropdown.style.display === 'none';
             profileDropdown.style.display = isHidden ? 'flex' : 'none';
         });

         document.addEventListener('click', () => {
             profileDropdown.style.display = 'none';
         });
     }

     const logoutBtn = document.getElementById('header-logout-btn');
     if (logoutBtn) {
         logoutBtn.addEventListener('click', () => {
             localStorage.removeItem('saralai_token');
             localStorage.removeItem('saralai_user');
             navigate('auth');
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

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }
  
  .header-lang-toggle span,
  .header-voice-btn span,
  .header-profile-name {
    display: none;
  }
}

.header-profile {
  position: relative;
}

.header-profile-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-profile-btn:hover {
  border-color: var(--color-primary);
  background-color: var(--color-bg);
}

.header-avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.header-profile-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 150px;
  display: flex;
  flex-direction: column;
  padding: var(--space-2);
}

.header-profile-email {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--space-1);
}

.header-logout-btn {
  background: none;
  border: none;
  text-align: left;
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-error, #ef4444);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.header-logout-btn:hover {
  background: var(--color-bg);
}
`;
