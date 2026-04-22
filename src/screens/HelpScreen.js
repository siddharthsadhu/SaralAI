/**
 * Help Screen — Simple feedback / guidance (no fake login).
 * Replaces the misleading header link that sent users to the mic screen.
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { submitFeedback } from '../api.js';

export function HelpScreen() {
  return `
    <div class="screen help-screen">
      ${Header({ showNav: true })}
      <div class="screen-content">
        <div class="container">
          <div class="help-header animate-fadeIn">
            <div class="help-icon-wrap">
              ${getIcon('government', 'icon icon-lg')}
            </div>
            <h1 class="heading-2">Help & feedback</h1>
            <p class="text-body">
              SaralAI gives simplified guidance only. For official decisions, always use the government portal linked in your answer.
            </p>
          </div>

          <div class="help-card animate-slideUp">
            <label class="help-label" for="help-message">Tell us what went wrong or what we should improve</label>
            <textarea
              id="help-message"
              class="help-textarea"
              rows="5"
              maxlength="2000"
              placeholder="Example: The steps were hard to follow, or I need information in another language."
            ></textarea>
            <p class="help-hint">Your feedback will be associated with your account so we can assist you better.</p>
            ${Button({
    text: 'Send feedback',
    icon: 'arrowRight',
    iconPosition: 'right',
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'help-submit-btn'
  })}
          </div>

          <div class="help-actions">
            ${Button({
    text: 'Back to asking questions',
    icon: 'mic',
    variant: 'ghost',
    fullWidth: true,
    id: 'help-speak-btn'
  })}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initHelpScreen() {
  initHeader();

  document.getElementById('help-submit-btn')?.addEventListener('click', async () => {
    const ta = document.getElementById('help-message');
    const text = ta?.value?.trim() || '';
    if (!text) {
      window.SaralAI?.showToast?.('Please write a short message first.');
      return;
    }
    
    try {
      window.SaralAI?.showLoading();
      let user_id = 0;
      let user_email = 'unknown';
      try {
          const userObj = JSON.parse(localStorage.getItem('saralai_user'));
          if (userObj) {
              user_id = userObj.id;
              user_email = userObj.email;
          }
      } catch(e) {}
      
      await submitFeedback(user_id, user_email, text);
      window.SaralAI?.showToast?.('Thank you. Your feedback helps us improve SaralAI.');
      if (ta) ta.value = '';
    } catch(err) {
      console.error(err);
      window.SaralAI?.showToast?.('Failed to submit feedback.');
    } finally {
      window.SaralAI?.hideLoading();
    }
  });

  document.getElementById('help-speak-btn')?.addEventListener('click', () => navigate('speak'));
}

export const helpStyles = `
.help-screen { background-color: transparent; }
.help-header {
  padding-top: var(--space-6);
  margin-bottom: var(--space-5);
  text-align: center;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}
.help-icon-wrap {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-bg);
  border-radius: var(--radius-lg);
  color: var(--color-primary);
}
.help-card {
  max-width: 520px;
  margin: 0 auto var(--space-6);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}
.help-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}
.help-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-family: inherit;
  font-size: var(--font-size-sm);
  resize: vertical;
  min-height: 120px;
  margin-bottom: var(--space-2);
}
.help-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}
.help-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
  line-height: var(--line-height-relaxed);
}
.help-actions {
  max-width: 520px;
  margin: 0 auto;
  padding-bottom: var(--space-10);
}
`;
