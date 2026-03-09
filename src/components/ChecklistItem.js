/**
 * Checklist Item Component
 */
import { getIcon } from '../icons.js';

/**
 * Create a checklist item
 * @param {object} options
 * @param {string} options.title - Item title
 * @param {string} options.subtitle - Item subtitle/description
 * @param {string} options.icon - Icon name
 * @param {boolean} options.checked - Is checked
 * @param {string} options.id - Item ID
 * @returns {string} Checklist item HTML
 */
export function ChecklistItem(options = {}) {
  const {
    title,
    subtitle = '',
    icon = 'idCard',
    checked = false,
    id = ''
  } = options;

  return `
    <div class="checklist-item ${checked ? 'checklist-item-checked' : ''}" ${id ? `id="${id}"` : ''}>
      <div class="checklist-checkbox">
        ${checked ? getIcon('check', 'icon icon-sm') : ''}
      </div>
      <div class="checklist-content">
        <span class="checklist-title">${title}</span>
        ${subtitle ? `<span class="checklist-subtitle">${subtitle}</span>` : ''}
      </div>
      <div class="checklist-icon">
        ${getIcon(icon, 'icon')}
      </div>
    </div>
  `;
}

/**
 * Create a checklist
 * @param {Array} items - Array of checklist items
 * @returns {string} Checklist HTML
 */
export function Checklist(items) {
  const itemsHtml = items.map((item, index) =>
    ChecklistItem({
      ...item,
      id: `checklist-item-${index}`
    })
  ).join('');

  return `
    <div class="checklist">
      ${itemsHtml}
    </div>
  `;
}

// Checklist styles
export const checklistStyles = `
.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2);
  overflow: hidden;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  cursor: pointer;
}

.checklist-item:hover {
  background-color: var(--color-bg);
  transform: translateX(4px);
}

.checklist-item:active {
  transform: translateX(2px);
}

.checklist-item-checked {
  background-color: var(--color-primary-bg);
}

.checklist-item-checked:hover {
  transform: translateX(0);
}

.checklist-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: all var(--transition-normal);
}

.checklist-item:hover .checklist-checkbox {
  border-color: var(--color-primary);
}

.checklist-item-checked .checklist-checkbox {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
  transform: scale(1.1);
}

.checklist-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.checklist-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  transition: color var(--transition-fast);
}

.checklist-item-checked .checklist-title {
  color: var(--color-primary);
}

.checklist-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

.checklist-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.checklist-item-checked .checklist-icon {
  color: var(--color-primary);
}
`;
