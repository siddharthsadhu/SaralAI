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
import { getLocalLabel } from '../utils/labels.js';

/**
 * Render guidance screen
 * @returns {string} Screen HTML
 */
export function GuidanceScreen() {
  const { currentScheme, currentExplanation, currentStep, detectedLanguageCode, selectedLanguage } = getState();
  const langCode = detectedLanguageCode || (selectedLanguage ? `${selectedLanguage}-IN` : 'en-IN');

  const schemeName = currentExplanation?.schemeName || currentScheme?.scheme_name || '';
  const expSteps = (currentExplanation?.steps || []).filter(Boolean);
  const rawSteps = currentScheme?.application_process?.steps || [];
  const appMode = currentExplanation?.applicationMode || currentScheme?.application_process?.mode || '';
  const officialSource = currentExplanation?.officialSource || currentScheme?.source_information?.official_website || '';

  // Prefer backend-translated steps from the last explanation; else JSON (English).
  const steps = expSteps.length > 0 ? expSteps : (rawSteps.length > 0 ? rawSteps : [
    'Gather your required documents (Aadhaar, income proof, etc.)',
    'Visit the relevant local office or official portal',
    'Submit your application with all required documents',
    'Track your application status via the official portal',
    'Contact helpline if there is any delay or issue'
  ]);

  const totalStepsCount = steps.length;
  const activeStep = Math.min(currentStep || 1, totalStepsCount);

  return `
    <div class="screen guidance-screen">
      ${Header({ showNav: true })}
      
      <div class="screen-content">
        <div class="container">

          <div class="guidance-header animate-fadeIn">
            <h1 class="heading-2">${getLocalLabel('what_to_do_next', langCode)}</h1>
            <p class="text-body">${getLocalLabel('step_by_step_guide', langCode)} <strong>${schemeName}</strong></p>
          </div>

          ${appMode ? `
            <div class="guidance-mode-badge animate-fadeIn">
              ${getIcon('arrowRight', 'icon icon-sm')}
              <span>${getLocalLabel('how_to_apply', langCode)}: <strong>${appMode}</strong></span>
            </div>
          ` : ''}

          <div class="guidance-progress animate-slideUp">
            ${ProgressIndicator({
    current: activeStep,
    total: totalStepsCount,
    label: `${getLocalLabel('current_step', langCode)} · ${activeStep} / ${totalStepsCount}`
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
                    ${isActive ? `<span class="guidance-step-current-badge">${getLocalLabel('current_step', langCode)}</span>` : ''}
                  </div>
                </div>
              `;
  }).join('')}
          </div>

          ${officialSource ? `
            <div class="guidance-portal-card animate-slideUp">
              ${getIcon('government', 'icon icon-sm')}
              <div>
                <p class="guidance-portal-label">${getLocalLabel('official_portal', langCode)}</p>
                <a href="${officialSource}" target="_blank" rel="noopener noreferrer" class="guidance-portal-link">${officialSource}</a>
              </div>
            </div>
          ` : ''}

          <div class="guidance-disclaimer animate-slideUp">
            <p>${getLocalLabel('disclaimer', langCode)}</p>
          </div>

          <div class="guidance-actions">
            ${activeStep < totalStepsCount ? Button({
    text: getLocalLabel('mark_step_done', langCode),
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'next-step-btn'
  }) : Button({
    text: getLocalLabel('all_steps_noted', langCode),
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'done-btn'
  })}
            ${Button({
    text: getLocalLabel('ask_another', langCode),
    icon: 'mic',
    variant: 'ghost',
    fullWidth: true,
    id: 'ask-another-btn'
  })}
            ${Button({
    text: getLocalLabel('go_home', langCode),
    variant: 'secondary',
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
    const { currentStep, currentScheme, currentExplanation } = getState();
    const expLen = (currentExplanation?.steps || []).filter(Boolean).length;
    const rawLen = currentScheme?.application_process?.steps?.length || 0;
    const totalSteps = expLen > 0 ? expLen : (rawLen > 0 ? rawLen : 5);
    if (currentStep < totalSteps) {
      setState({ currentStep: currentStep + 1 });
      // Re-render immediately without relying on hash router cache
      const app = document.querySelector('#app');
      app.innerHTML = GuidanceScreen();
      initGuidanceScreen();
      window.scrollTo(0, 0);
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
  background-color: transparent;
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
