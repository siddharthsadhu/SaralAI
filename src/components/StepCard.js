/**
 * Step Card Component
 */
import { getIcon } from '../icons.js';

/**
 * Create a numbered step card
 * @param {object} options
 * @param {number} options.number - Step number
 * @param {string} options.title - Step title
 * @param {string} options.subtitle - Step subtitle
 * @param {string} options.icon - Icon name
 * @param {boolean} options.active - Is current step
 * @param {boolean} options.completed - Is completed
 * @returns {string} Step card HTML
 */
export function StepCard(options = {}) {
     const {
          number = 1,
          title,
          subtitle = '',
          icon = 'idCard',
          active = false,
          completed = false
     } = options;

     const stateClass = active ? 'step-card-active' : completed ? 'step-card-completed' : '';

     return `
    <div class="step-card ${stateClass}">
      <div class="step-card-number ${active ? 'step-card-number-active' : ''}">
        ${completed ? getIcon('check', 'icon icon-sm') : `
          <span>${number}</span>
        `}
      </div>
      <div class="step-card-content">
        <span class="step-card-title">${title}</span>
        ${subtitle ? `<span class="step-card-subtitle">${subtitle}</span>` : ''}
      </div>
      <div class="step-card-icon">
        ${getIcon(icon, 'icon')}
      </div>
    </div>
  `;
}

/**
 * Create numbered steps list (simple bullet style)
 * @param {Array} steps - Array of step strings
 * @returns {string} Steps HTML
 */
export function NumberedSteps(steps) {
     const stepsHtml = steps.map((step, index) => `
    <div class="numbered-step">
      <span class="numbered-step-num">${index + 1}</span>
      <span class="numbered-step-text">${step}</span>
    </div>
  `).join('');

     return `
    <div class="numbered-steps">
      ${stepsHtml}
    </div>
  `;
}

// Step card styles
export const stepCardStyles = `
.step-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.step-card-active {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
}

.step-card-completed {
  opacity: 0.7;
}

.step-card-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.step-card-number-active {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.step-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.step-card-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.step-card-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.step-card-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.step-card-active .step-card-icon {
  color: var(--color-primary);
}

/* Numbered steps (bullet style) */
.numbered-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}

.numbered-step {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.numbered-step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-inverse);
  flex-shrink: 0;
}

.numbered-step-text {
  padding-top: var(--space-1);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
}
`;
