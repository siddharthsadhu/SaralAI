/**
 * Progress Indicator Component
 */

/**
 * Create a step progress indicator
 * @param {object} options
 * @param {number} options.current - Current step (1-indexed)
 * @param {number} options.total - Total steps
 * @param {boolean} options.showPercentage - Show percentage
 * @returns {string} Progress indicator HTML
 */
export function ProgressIndicator(options = {}) {
     const { current = 1, total = 3, showPercentage = true } = options;

     const percentage = Math.round((current / total) * 100);

     return `
    <div class="progress-indicator">
      <div class="progress-info">
        <span class="progress-step">STEP ${current} OF ${total}</span>
        ${showPercentage ? `<span class="progress-percent">${percentage}% completed</span>` : ''}
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

/**
 * Create a simple step badge
 * @param {number} current - Current step
 * @param {number} total - Total steps
 * @returns {string} Step badge HTML
 */
export function StepBadge(current, total) {
     return `
    <div class="step-badge">
      <span class="step-badge-text">STEP ${current} OF ${total}</span>
    </div>
  `;
}

// Progress indicator styles
export const progressStyles = `
.progress-indicator {
  width: 100%;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.progress-step {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  letter-spacing: 0.5px;
}

.progress-percent {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.step-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-primary-bg);
  border-radius: var(--radius-md);
}

.step-badge-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  letter-spacing: 0.5px;
}
`;
