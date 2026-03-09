/**
 * What Next Screen — Dynamic Summary + Follow-up Options
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { MicButtonSmall } from '../components/MicButton.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { getState, setState } from '../state.js';

export function WhatNextScreen() {
  const { currentScheme, currentExplanation } = getState();

  const schemeName = currentExplanation?.schemeName || currentScheme?.scheme_name || 'the scheme';
  const summary = currentScheme?.who_is_it_for?.short || currentExplanation?.summary || '';
  const category = currentScheme?.category || '';
  const officialSource = currentExplanation?.officialSource || currentScheme?.source_information?.official_website || '';

  return `
    <div class="screen whatnext-screen">
      ${Header({})}
      
      <div class="screen-content">
        <div class="container">

          <div class="whatnext-summary animate-fadeIn">
            <div class="whatnext-summary-icon">
              ${getIcon('government', 'icon')}
            </div>
            <div class="whatnext-summary-body">
              <p class="whatnext-summary-label">You asked about</p>
              <p class="whatnext-summary-scheme">${schemeName}</p>
              ${summary ? `<p class="whatnext-summary-desc">${summary}</p>` : ''}
              ${category ? `<span class="whatnext-category-badge">${category}</span>` : ''}
            </div>
          </div>
          
          <div class="whatnext-question animate-slideUp">
            <h2 class="whatnext-title">What would you like to do next?</h2>
            
            <div class="whatnext-options">
              ${Button({
    text: 'Explain again',
    variant: 'secondary',
    fullWidth: true,
    id: 'explain-btn'
  })}
              ${Button({
    text: 'Documents needed',
    variant: 'secondary',
    fullWidth: true,
    id: 'documents-btn'
  })}
              ${Button({
    text: 'Step-by-step guide',
    variant: 'secondary',
    fullWidth: true,
    id: 'steps-btn'
  })}
              ${Button({
    text: 'Ask another question',
    icon: 'mic',
    variant: 'primary',
    fullWidth: true,
    id: 'ask-another-btn'
  })}
            </div>
          </div>

          ${officialSource ? `
            <a href="${officialSource}" target="_blank" rel="noopener noreferrer" class="whatnext-official-link animate-slideUp">
              ${getIcon('arrowRight', 'icon icon-sm')}
              Visit official portal
            </a>
          ` : ''}

          <div class="whatnext-disclaimer animate-slideUp">
            <p>Remember: This information is for guidance only. For official decisions, always visit the government portal.</p>
          </div>
          
          <div class="whatnext-mic animate-slideUp">
            ${MicButtonSmall({ id: 'whatnext-mic-btn', text: 'Tap to speak' })}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize what next screen events
 */
export function initWhatNextScreen() {
  initHeader();

  document.getElementById('explain-btn')?.addEventListener('click', () => navigate('explanation'));
  document.getElementById('documents-btn')?.addEventListener('click', () => navigate('documents'));
  document.getElementById('steps-btn')?.addEventListener('click', () => navigate('guidance'));
  document.getElementById('ask-another-btn')?.addEventListener('click', () => {
    setState({ currentScheme: null, currentExplanation: null, currentIntent: null, currentQuery: '', currentStep: 1 });
    navigate('speak');
  });
  document.getElementById('whatnext-mic-btn')?.addEventListener('click', () => {
    setState({ currentScheme: null, currentExplanation: null, currentIntent: null, currentQuery: '', currentStep: 1 });
    navigate('listening');
  });
}

// What next screen styles
export const whatNextStyles = `
.whatnext-screen {
  background-color: var(--color-bg);
}

.whatnext-summary {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-5);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  margin-top: var(--space-8);
  margin-bottom: var(--space-6);
}

.whatnext-summary-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
}

.whatnext-summary-body {
  flex: 1;
}

.whatnext-summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-1);
}

.whatnext-summary-scheme {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.whatnext-summary-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.whatnext-category-badge {
  display: inline-block;
  margin-top: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-ring);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
}

.whatnext-question {
  text-align: center;
  margin-bottom: var(--space-6);
}

.whatnext-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-5);
}

.whatnext-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 400px;
  margin: 0 auto;
}

.whatnext-official-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-ring);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-4);
  transition: all var(--transition-fast);
}

.whatnext-official-link:hover {
  background: var(--color-primary);
  color: white;
}

.whatnext-disclaimer {
  padding: var(--space-3) var(--space-4);
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.whatnext-disclaimer p {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: center;
  line-height: var(--line-height-relaxed);
}

.whatnext-mic {
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0 var(--space-8);
}
`;
