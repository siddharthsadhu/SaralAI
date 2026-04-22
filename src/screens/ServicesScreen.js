/**
 * Services Screen — Browse schemes grouped by category (from local Schemes.json).
 * Replaces the broken header link that pointed to #explanation with no state.
 */
import { Header, initHeader } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { getIcon } from '../icons.js';
import { navigate } from '../router.js';
import { setState, getState } from '../state.js';
import schemes from '../Schemes.json';
import { getLocalLabel } from '../utils/labels.js';

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function groupSchemesByCategory() {
  const map = new Map();
  for (const s of schemes) {
    const cat = s.category || 'Government schemes';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(s.scheme_name || s.scheme_id || '');
  }
  return map;
}

export function ServicesScreen() {
  const { detectedLanguageCode, selectedLanguage } = getState();
  const langCode = detectedLanguageCode || (selectedLanguage ? `${selectedLanguage}-IN` : 'en-IN');
  const byCat = groupSchemesByCategory();
  const entries = [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const cards = entries
    .map(([category, names]) => {
      const safeCat = encodeURIComponent(category);
      const preview = names
        .filter(Boolean)
        .slice(0, 3)
        .map(n => `<li class="services-card-scheme">${escHtml(n)}</li>`)
        .join('');
      const more = names.length > 3 ? `<li class="services-card-more">+${names.length - 3} more</li>` : '';
      return `
        <button type="button" class="services-category-card animate-fadeIn" data-category="${safeCat}">
          <div class="services-card-head">
            ${getIcon('government', 'icon icon-sm services-card-icon')}
            <h2 class="services-card-title">${escHtml(category)}</h2>
          </div>
          <ul class="services-card-list">${preview}${more}</ul>
          <span class="services-card-cta">${getLocalLabel('ask_question', langCode)} →</span>
        </button>
      `;
    })
    .join('');

  return `
    <div class="screen services-screen">
      ${Header({ showNav: true })}
      <div class="screen-content">
        <div class="container">
          <div class="services-header animate-fadeIn">
            <h1 class="heading-2">${getLocalLabel('government_scheme', langCode)}</h1>
          </div>
          <div class="services-grid animate-slideUp">
            ${cards}
          </div>
          <div class="services-footer-actions">
            ${Button({
    text: getLocalLabel('speak_in_your_language', langCode),
    icon: 'mic',
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'services-voice-btn'
  })}
            ${Button({
    text: getLocalLabel('type_your_question', langCode),
    icon: 'arrowRight',
    iconPosition: 'right',
    variant: 'ghost',
    fullWidth: true,
    id: 'services-type-btn'
  })}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initServicesScreen() {
  initHeader();

  document.querySelectorAll('.services-category-card').forEach(card => {
    card.addEventListener('click', () => {
      const raw = card.getAttribute('data-category') || '';
      const category = decodeURIComponent(raw);
      setState({
        typeScreenPrefill:
          `Tell me about government schemes in the "${category}" area. Which schemes apply and how can I apply?`,
      });
      navigate('type');
    });
  });

  document.getElementById('services-voice-btn')?.addEventListener('click', () => navigate('speak'));
  document.getElementById('services-type-btn')?.addEventListener('click', () => navigate('type'));
}

export const servicesStyles = `
.services-screen { background-color: transparent; }
.services-header {
  padding-top: var(--space-6);
  margin-bottom: var(--space-5);
}
.services-header h1 { margin-bottom: var(--space-2); }
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
.services-category-card {
  text-align: left;
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}
.services-category-card:hover {
  border-color: var(--color-primary-ring);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.services-card-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.services-card-icon { color: var(--color-primary); flex-shrink: 0; }
.services-card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}
.services-card-list {
  list-style: none;
  margin: 0 0 var(--space-3);
  padding: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}
.services-card-scheme::before { content: '· '; color: var(--color-primary); }
.services-card-more { font-style: italic; color: var(--color-text-muted); margin-top: var(--space-1); }
.services-card-cta {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}
.services-footer-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-10);
}
`;
