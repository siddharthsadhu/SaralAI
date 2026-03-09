/**
 * Explanation Screen — Data-Driven from Schemes.json
 * Renders the full simplified explanation of the matched scheme.
 */
import { Header, initHeader } from '../components/Header.js';
import { AudioPlayer } from '../components/AudioPlayer.js';
import { Button } from '../components/Button.js';
import { navigate } from '../router.js';
import { getState } from '../state.js';
import { getIcon } from '../icons.js';

/**
 * Render a bullet point section
 */
function BulletSection({ title, points, icon = 'check' }) {
  if (!points || points.length === 0) return '';
  return `
    <div class="explanation-section">
      <h3 class="explanation-section-title">
        ${getIcon(icon, 'icon icon-sm explanation-section-icon')}
        ${title}
      </h3>
      <ul class="explanation-bullets">
        ${points.map(p => `<li class="explanation-bullet">${p}</li>`).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render numbered steps section
 */
function StepsSection({ steps }) {
  if (!steps || steps.length === 0) return '';
  return `
    <div class="explanation-section">
      <h3 class="explanation-section-title">
        ${getIcon('arrowRight', 'icon icon-sm explanation-section-icon')}
        How to Apply
      </h3>
      <ol class="explanation-steps-list">
        ${steps.map((step, i) => `
          <li class="explanation-step-item">
            <span class="explanation-step-number">${i + 1}</span>
            <span class="explanation-step-text">${step}</span>
          </li>
        `).join('')}
      </ol>
    </div>
  `;
}

/**
 * Render explanation screen
 * @returns {string} Screen HTML
 */
export function ExplanationScreen() {
  const { currentExplanation, currentScheme } = getState();
  const exp = currentExplanation;

  // Fallback if no data (e.g., user lands here directly via URL)
  if (!exp) {
    return `
      <div class="screen explanation-screen">
        ${Header({ showNav: true })}
        <div class="screen-content screen-center">
          <div class="explanation-empty animate-fadeIn">
            <p class="text-body">No query found. Please go back and ask a question.</p>
            ${Button({ text: 'Ask a Question', icon: 'mic', variant: 'primary', id: 'ask-btn' })}
          </div>
        </div>
      </div>
    `;
  }

  // Choose which sections to show prominently based on intent
  const showEligibility = exp.eligibilityPoints?.length > 0;
  const showBenefits = exp.benefitPoints?.length > 0;
  const showSteps = exp.intent === 'STEPS' || exp.intent === 'OVERVIEW';

  return `
    <div class="screen explanation-screen">
      ${Header({ showNav: true })}
      
      <div class="screen-content">
        <div class="container">

          <!-- Scheme header -->
          <div class="explanation-header animate-fadeIn">
            <div class="explanation-category-badge">${exp.category || 'Government Scheme'}</div>
            <h1 class="explanation-title">${exp.schemeName}</h1>
            <p class="explanation-summary">${exp.summary}</p>
          </div>

          <!-- Audio Player -->
          <div class="explanation-audio animate-slideUp">
            ${AudioPlayer({
    title: 'Listen to explanation',
    subtitle: 'Tap to hear this in your language',
    duration: '1:30',
    currentTime: '0:00'
  })}
          </div>

          <!-- Dynamic content sections -->
          <div class="explanation-body animate-slideUp">

            ${exp.intent === 'ELIGIBILITY' || exp.intent === 'OVERVIEW' ? BulletSection({
    title: 'Who is this for?',
    points: exp.eligibilityPoints,
    icon: 'check'
  }) : ''}

            ${exp.intent !== 'DOCUMENTS' ? BulletSection({
    title: 'What are the benefits?',
    points: exp.benefitPoints,
    icon: 'government'
  }) : ''}

            ${exp.intent === 'DOCUMENTS' ? BulletSection({
    title: 'Documents you need',
    points: exp.documents?.map(d => `${d.mandatory ? '✓ Required: ' : 'Optional: '}${d.name}`),
    icon: 'check'
  }) : ''}

            ${showSteps && exp.steps?.length > 0 ? StepsSection({ steps: exp.steps }) : ''}

            ${exp.applicationMode ? `
              <div class="explanation-mode-badge">
                ${getIcon('arrowRight', 'icon icon-sm')}
                <span>Application Mode: <strong>${exp.applicationMode}</strong></span>
              </div>
            ` : ''}
          </div>

          <!-- Disclaimer -->
          <div class="explanation-disclaimer animate-slideUp">
            ${getIcon('government', 'icon icon-sm')}
            <p>${exp.disclaimer}</p>
            ${exp.officialSource ? `<a href="${exp.officialSource}" target="_blank" rel="noopener noreferrer" class="explanation-source-link">Visit official portal →</a>` : ''}
          </div>

          <!-- Actions -->
          <div class="explanation-actions">
            <div class="explanation-actions-row">
              ${Button({
    text: 'Back',
    icon: 'arrowLeft',
    variant: 'ghost',
    id: 'back-btn'
  })}
              ${Button({
    text: "What's Next?",
    icon: 'arrowRight',
    iconPosition: 'right',
    variant: 'primary',
    id: 'whatnext-btn'
  })}
            </div>
            <div class="explanation-actions-secondary">
              <div class="explanation-quick-actions">
                ${Button({
    text: 'Documents needed',
    variant: 'secondary',
    id: 'docs-btn'
  })}
                ${Button({
    text: 'Step-by-step guide',
    variant: 'secondary',
    id: 'steps-btn'
  })}
              </div>
              ${Button({
    text: 'Ask Another Question',
    icon: 'mic',
    variant: 'ghost',
    fullWidth: true,
    id: 'ask-another-btn'
  })}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize explanation screen events
 */
export function initExplanationScreen() {
  initHeader();

  document.getElementById('back-btn')?.addEventListener('click', () => window.history.back());
  document.getElementById('whatnext-btn')?.addEventListener('click', () => navigate('whatnext'));
  document.getElementById('ask-another-btn')?.addEventListener('click', () => navigate('speak'));
  document.getElementById('docs-btn')?.addEventListener('click', () => navigate('documents'));
  document.getElementById('steps-btn')?.addEventListener('click', () => navigate('guidance'));
  document.getElementById('ask-btn')?.addEventListener('click', () => navigate('speak'));
}

// Explanation screen styles
export const explanationStyles = `
.explanation-screen {
  background-color: var(--color-bg);
}

.explanation-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  text-align: center;
  padding: var(--space-12);
}

.explanation-header {
  padding-top: var(--space-6);
  margin-bottom: var(--space-5);
}

.explanation-category-badge {
  display: inline-block;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-primary-ring);
  margin-bottom: var(--space-3);
}

.explanation-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-2);
}

.explanation-summary {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.explanation-audio {
  margin-bottom: var(--space-6);
}

.explanation-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.explanation-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}

.explanation-section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.explanation-section-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.explanation-bullets {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.explanation-bullet {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding-left: var(--space-4);
  position: relative;
  line-height: var(--line-height-relaxed);
}

.explanation-bullet::before {
  content: '•';
  position: absolute;
  left: var(--space-1);
  color: var(--color-primary);
  font-weight: bold;
}

.explanation-steps-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.explanation-step-item {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.explanation-step-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  margin-top: 2px;
}

.explanation-step-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.explanation-mode-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.explanation-mode-badge .icon {
  color: var(--color-primary);
}

.explanation-disclaimer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
}

.explanation-disclaimer .icon {
  color: var(--color-error);
  flex-shrink: 0;
}

.explanation-disclaimer p {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.explanation-source-link {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

.explanation-source-link:hover {
  text-decoration: underline;
}

.explanation-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4) 0 var(--space-8);
}

.explanation-actions-row {
  display: flex;
  gap: var(--space-3);
}

.explanation-actions-row .btn:first-child {
  flex-shrink: 0;
}

.explanation-actions-row .btn:last-child {
  flex: 1;
}

.explanation-actions-secondary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.explanation-quick-actions {
  display: flex;
  gap: var(--space-3);
}

.explanation-quick-actions .btn {
  flex: 1;
  font-size: var(--font-size-sm);
}

@media (max-width: 480px) {
  .explanation-actions-row {
    flex-direction: column;
  }
  .explanation-actions-row .btn {
    width: 100%;
  }
  .explanation-quick-actions {
    flex-direction: column;
  }
}
`;
