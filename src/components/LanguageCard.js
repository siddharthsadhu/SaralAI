/**
 * Language Card Component
 */
import { getIcon } from '../icons.js';

/**
 * Create a language card
 * @param {object} options
 * @param {string} options.code - Language code
 * @param {string} options.native - Native language name
 * @param {string} options.english - English language name
 * @param {boolean} options.selected - Is selected
 * @returns {string} Language card HTML
 */
export function LanguageCard(options = {}) {
  const { code, native, english, selected = false } = options;

  return `
    <button 
      class="language-card ${selected ? 'language-card-selected' : ''}" 
      data-lang="${code}"
    >
      <div class="language-card-content">
        <span class="language-card-native">${native}</span>
        <span class="language-card-english">${english}</span>
      </div>
      ${selected ? `
        <span class="language-card-check">
          ${getIcon('check', 'icon')}
        </span>
      ` : ''}
    </button>
  `;
}

/**
 * Create language grid
 * @param {Array} languages - Array of language objects
 * @param {string} selectedCode - Selected language code
 * @returns {string} Language grid HTML
 */
export function LanguageGrid(languages, selectedCode) {
  const cards = languages.map((lang, index) =>
    `<div class="stagger-item" style="animation-delay: ${index * 0.05}s">
               ${LanguageCard({
      code: lang.code,
      native: lang.native,
      english: lang.english,
      selected: lang.code === selectedCode
    })}
          </div>`
  ).join('');

  return `
    <div class="language-grid animate-fadeIn">
      ${cards}
    </div>
  `;
}

// Language card styles
export const languageCardStyles = `
.language-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

.language-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
}

.language-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.language-card-selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
}

.language-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.language-card-native {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.language-card-selected .language-card-native {
  color: var(--color-primary);
}

.language-card-english {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.language-card-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  color: var(--color-text-inverse);
}

.language-card-check .icon {
  width: 14px;
  height: 14px;
}

@media (max-width: 480px) {
  .language-grid {
    grid-template-columns: 1fr;
  }
}
`;
