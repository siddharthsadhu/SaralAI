/**
 * Button Component
 */
import { getIcon } from '../icons.js';

/**
 * Create a button component
 * @param {object} options
 * @param {string} options.text - Button text
 * @param {string} options.variant - 'primary' | 'secondary' | 'ghost' | 'dark'
 * @param {string} options.size - 'sm' | 'md' | 'lg'
 * @param {string} options.icon - Icon name (optional)
 * @param {string} options.iconPosition - 'left' | 'right'
 * @param {boolean} options.fullWidth - Full width button
 * @param {string} options.id - Button ID
 * @param {string} options.className - Additional classes
 * @param {boolean} options.disabled - Disabled state
 * @returns {string} Button HTML
 */
export function Button(options = {}) {
     const {
          text = '',
          variant = 'primary',
          size = 'md',
          icon = null,
          iconPosition = 'left',
          fullWidth = false,
          id = '',
          className = '',
          disabled = false
     } = options;

     const classes = [
          'btn',
          `btn-${variant}`,
          size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : '',
          fullWidth ? 'btn-full' : '',
          className
     ].filter(Boolean).join(' ');

     const iconHtml = icon ? getIcon(icon, 'icon') : '';

     const content = iconPosition === 'right'
          ? `${text ? `<span>${text}</span>` : ''}${iconHtml}`
          : `${iconHtml}${text ? `<span>${text}</span>` : ''}`;

     return `
    <button 
      class="${classes}" 
      ${id ? `id="${id}"` : ''} 
      ${disabled ? 'disabled' : ''}
    >
      ${content}
    </button>
  `;
}

/**
 * Create an icon-only button
 * @param {object} options
 * @param {string} options.icon - Icon name
 * @param {string} options.variant - Button variant
 * @param {string} options.size - Size
 * @param {string} options.id - Button ID
 * @param {string} options.ariaLabel - Accessibility label
 * @returns {string} Button HTML
 */
export function IconButton(options = {}) {
     const {
          icon,
          variant = 'ghost',
          size = 'md',
          id = '',
          ariaLabel = ''
     } = options;

     const sizeClass = size === 'lg' ? 'icon-btn-lg' : size === 'sm' ? 'icon-btn-sm' : '';

     return `
    <button 
      class="icon-btn icon-btn-${variant} ${sizeClass}" 
      ${id ? `id="${id}"` : ''}
      ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}
    >
      ${getIcon(icon, 'icon')}
    </button>
  `;
}

// Button styles
export const buttonStyles = `
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  background-color: transparent;
}

.icon-btn-ghost {
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.icon-btn-ghost:hover {
  background-color: var(--color-bg);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.icon-btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.icon-btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.icon-btn-lg {
  width: 48px;
  height: 48px;
}

.icon-btn-sm {
  width: 32px;
  height: 32px;
}
`;
