/**
 * Guidance Screen — Data-Driven Application Steps
 * Shows the step-by-step application process from Schemes.json
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { ProgressIndicator } from '../components/ProgressIndicator.js';
import { navigate } from '../router.js';
import { getState, setState } from '../state.js';
import { getIcon } from '../icons.js';

/**
 * Render guidance screen
 * @returns {string} Screen HTML
 */
export function GuidanceScreen() {
  const { currentScheme, currentExplanation, currentStep, totalSteps } = getState();

  const schemeName = currentExplanation?.schemeName || currentScheme?.scheme_name || 'this scheme';
  const rawSteps = currentScheme?.application_process?.steps || [];
  const appMode = currentScheme?.application_process?.mode || '';
  const officialSource = currentExplanation?.officialSource || currentScheme?.source_information?.official_website || '';

  // Use real steps or fallback
  const steps = rawSteps.length > 0 ? rawSteps : [
    'Gather your required documents (Aadhaar, income proof, etc.)',
    'Visit the relevant local office or official portal',
    'Submit your application with all required documents',
    'Track your application status via the official portal',
    'Contact helpline if there is any delay or issue'
  ];

  const totalStepsCount = steps.length;
  const activeStep = Math.min(currentStep || 1, totalStepsCount);

  return `
    <div class="screen guidance-screen">
      ${Header({ showNav: true })}
      
      <div class="screen-content">
        <div class="container">

          <div class="guidance-header animate-fadeIn">
            <h1 class="heading-2">What to Do Next</h1>
            <p class="text-body">Step-by-step guide for <strong>${schemeName}</strong></p>
          </div>

          ${appMode ? `
            <div class="guidance-mode-badge animate-fadeIn">
              ${getIcon('arrowRight', 'icon icon-sm')}
              <span>How to apply: <strong>${appMode}</strong></span>
            </div>
          ` : ''}

          <div class="guidance-progress animate-slideUp">
            ${ProgressIndicator({
    current: activeStep,
    total: totalStepsCount,
    label: `Step ${activeStep} of ${totalStepsCount}`
  })}
          </div>

          <div class="guidance-steps animate-slideUp">
            ${steps.map((step, i) => {
    const stepNum = i + 1;
    const isActive = stepNum === activeStep;
    const isCompleted = stepNum < activeStep;
    const statusClass = isCompleted ? 'guidance-step-done' : isActive ? 'guidance-step-active' : 'guidance-step-pending';
    return `
                <div class="guidance-step ${statusClass}">
                  <div class="guidance-step-indicator">
                    ${isCompleted
        ? `<div class="guidance-step-check">${getIcon('check', 'icon icon-sm')}</div>`
        : `<div class="guidance-step-number">${stepNum}</div>`
      }
                    ${i < steps.length - 1 ? '<div class="guidance-step-line"></div>' : ''}
                  </div>
                  <div class="guidance-step-content">
                    <p class="guidance-step-text">${step}</p>
                    ${isActive ? '<span class="guidance-step-current-badge">Current Step</span>' : ''}
                  </div>
                </div>
              `;
  }).join('')}
          </div>

          ${officialSource ? `
            <div class="guidance-portal-card animate-slideUp">
              ${getIcon('government', 'icon icon-sm')}
              <div>
                <p class="guidance-portal-label">Official Portal</p>
                <a href="${officialSource}" target="_blank" rel="noopener noreferrer" class="guidance-portal-link">${officialSource}</a>
              </div>
            </div>
          ` : ''}

          <div class="guidance-disclaimer animate-slideUp">
            <p>This is for guidance only. For official decisions, always visit the government portal or your local office.</p>
          </div>

          <div class="guidance-actions">
            ${activeStep < totalStepsCount ? Button({
    text: 'Mark Step Done →',
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'next-step-btn'
  }) : Button({
    text: '✓ All steps noted!',
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'done-btn'
  })}
            ${Button({
    text: 'Ask Another Question',
    icon: 'mic',
    variant: 'ghost',
    fullWidth: true,
    id: 'ask-another-btn'
  })}
            ${Button({
    text: 'Go to Home',
    variant: 'ghost',
    fullWidth: true,
    id: 'home-btn'
  })}
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize guidance screen events
 */
export function initGuidanceScreen() {
  initHeader();

  document.getElementById('next-step-btn')?.addEventListener('click', () => {
    const { currentStep, currentScheme } = getState();
    const totalSteps = currentScheme?.application_process?.steps?.length || 5;
    if (currentStep < totalSteps) {
      setState({ currentStep: currentStep + 1 });
      // Re-render to show next step
      import('../router.js').then(({ navigate }) => navigate('guidance'));
    }
  });

  document.getElementById('done-btn')?.addEventListener('click', () => navigate('whatnext'));
  document.getElementById('ask-another-btn')?.addEventListener('click', () => {
    setState({ currentStep: 1 });
    navigate('speak');
  });
  document.getElementById('home-btn')?.addEventListener('click', () => {
    setState({ currentStep: 1 });
    navigate('landing');
  });
}

// Guidance screen styles
export const guidanceStyles = `
.guidance-screen {
  background-color: var(--color-bg);
}

.guidance-header {
  padding-top: var(--space-6);
  margin-bottom: var(--space-4);
}

.guidance-header h1 {
  margin-bottom: var(--space-2);
}

.guidance-mode-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-ring);
  border-radius: var(--radius-full);
  width: fit-content;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-5);
}

.guidance-mode-badge .icon {
  color: var(--color-primary);
}

.guidance-progress {
  margin-bottom: var(--space-6);
}

.guidance-steps {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-6);
}

.guidance-step {
  display: flex;
  gap: var(--space-4);
}

.guidance-step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.guidance-step-number,
.guidance-step-check {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.guidance-step-done .guidance-step-check {
  background: var(--color-success);
  color: white;
}

.guidance-step-active .guidance-step-number {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}

.guidance-step-pending .guidance-step-number {
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
}

.guidance-step-line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  margin: var(--space-1) 0;
  background: var(--color-border);
}

.guidance-step-done .guidance-step-line {
  background: var(--color-success);
}

.guidance-step-active .guidance-step-line {
  background: var(--color-border);
}

.guidance-step-content {
  padding-bottom: var(--space-5);
  flex: 1;
  padding-top: 4px;
}

.guidance-step-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.guidance-step-active .guidance-step-text {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.guidance-step-done .guidance-step-text {
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.guidance-step-current-badge {
  display: inline-block;
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-bg);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}

.guidance-portal-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.guidance-portal-card .icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.guidance-portal-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
}

.guidance-portal-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-all;
}

.guidance-portal-link:hover {
  text-decoration: underline;
}

.guidance-disclaimer {
  padding: var(--space-3) var(--space-4);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
}

.guidance-disclaimer p {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.guidance-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}
`;
