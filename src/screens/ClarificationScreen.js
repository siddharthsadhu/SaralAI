/**
 * Clarification Screen — Shows top matching schemes for user to choose from
 */
import { Header, initHeader } from '../components/Header.js';
import { MicButton, MicButtonSmall } from '../components/MicButton.js';
import { Button } from '../components/Button.js';
import { navigate } from '../router.js';
import { getState, setState } from '../state.js';
import { getIcon } from '../icons.js';
import { generateExplanation, detectIntent } from '../ai.js';

/** Category emoji map */
const CATEGORY_ICONS = {
  'Housing': '🏠',
  'Farmers / Income Support': '🌾',
  'Health Assurance': '🏥',
  'Food Security / Subsidy': '🍚',
  'Financial Inclusion': '🏦',
  'Savings / Child Benefit': '👧',
  'Clean Cooking / Energy': '🔥',
  'Social Assistance / Pensions': '👴',
  'Skill Development / Employment': '🎓',
  'Education / Scholarships': '📚',
};

function getEmoji(category) {
  return CATEGORY_ICONS[category] || '📋';
}

/**
 * Render clarification screen
 */
export function ClarificationScreen() {
  const { topMatches, currentQuery } = getState();

  // Show top 4 matching schemes as selectable cards
  const matchCards = (topMatches || []).slice(0, 4);
  const hasMatches = matchCards.length > 0;

  return `
    <div class="screen clarification-screen">
      ${Header({ showNav: true })}
      
      <div class="screen-content">
        <div class="container">

          <div class="clarification-header animate-fadeIn">
            <h1 class="heading-2">Can you clarify?</h1>
            <p class="text-body">I want to make sure I give you the right information.</p>
            ${currentQuery ? `<div class="clarification-query-badge">"${currentQuery}"</div>` : ''}
          </div>

          ${hasMatches ? `
            <div class="clarification-schemes animate-slideUp">
              <p class="clarification-hint">Which scheme are you asking about?</p>
              <div class="clarification-scheme-cards">
                ${matchCards.map((match, i) => `
                  <button 
                    class="clarification-scheme-card card-interactive stagger-item" 
                    data-scheme-index="${i}"
                    id="scheme-card-${i}"
                  >
                    <span class="clarification-scheme-emoji">${getEmoji(match.scheme?.category)}</span>
                    <div class="clarification-scheme-info">
                      <span class="clarification-scheme-name">${match.scheme?.scheme_name}</span>
                      <span class="clarification-scheme-desc">${match.scheme?.who_is_it_for?.short || match.scheme?.category}</span>
                    </div>
                    <span class="clarification-scheme-arrow">${getIcon('arrowRight', 'icon icon-sm')}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="clarification-no-match animate-slideUp">
              <div class="clarification-no-match-icon">🔍</div>
              <p class="text-body">I could not find a matching scheme. Try asking differently.</p>
            </div>
          `}

          <div class="clarification-divider">
            <span>or ask again</span>
          </div>

          <div class="clarification-micro animate-slideUp">
            <p class="clarification-mic-hint">Speak or type your question again</p>
            <div class="clarification-mic-row">
              ${MicButtonSmall({ id: 'clarify-mic-btn', text: 'Speak to clarify' })}
            </div>
            ${Button({
    text: 'Type your question',
    icon: 'arrowRight',
    iconPosition: 'right',
    variant: 'secondary',
    fullWidth: true,
    id: 'type-btn'
  })}
          </div>

          <div class="clarification-examples animate-slideUp">
            <p class="clarification-examples-title">Try asking:</p>
            <div class="clarification-example-chips">
              <button class="type-chip" data-query="PM Kisan scheme for farmers">PM Kisan (Farmers)</button>
              <button class="type-chip" data-query="Pradhan Mantri Awas Yojana housing">PMAY Housing</button>
              <button class="type-chip" data-query="Ayushman Bharat health insurance">Ayushman Bharat</button>
              <button class="type-chip" data-query="ration card food scheme">Ration Card</button>
              <button class="type-chip" data-query="Jan Dhan bank account">Jan Dhan</button>
              <button class="type-chip" data-query="scholarship education students">Scholarship</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize clarification screen events
 */
export function initClarificationScreen() {
  initHeader();

  // Scheme card selection
  document.querySelectorAll('.clarification-scheme-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.schemeIndex);
      const { topMatches, currentQuery } = getState();
      const selectedScheme = topMatches[idx]?.scheme;
      if (!selectedScheme) return;

      const intent = detectIntent(currentQuery || '');
      const explanation = generateExplanation(selectedScheme, intent);

      setState({
        currentScheme: selectedScheme,
        currentIntent: intent,
        currentExplanation: explanation
      });

      navigate('explanation');
    });
  });

  // Mic button
  document.getElementById('clarify-mic-btn')?.addEventListener('click', () => navigate('speak'));

  // Type button
  document.getElementById('type-btn')?.addEventListener('click', () => navigate('type'));

  // Example chips
  document.querySelectorAll('.clarification-examples .type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (query) {
        setState({ currentQuery: query });
        navigate('processing');
      }
    });
  });
}

// Clarification screen styles
export const clarificationStyles = `
.clarification-screen {
  background-color: var(--color-bg);
}

.clarification-header {
  padding-top: var(--space-6);
  margin-bottom: var(--space-6);
}

.clarification-header h1 {
  margin-bottom: var(--space-2);
}

.clarification-query-badge {
  display: inline-block;
  margin-top: var(--space-3);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-ring);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-style: italic;
}

.clarification-hint {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-3);
}

.clarification-scheme-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.clarification-scheme-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all var(--transition-normal);
}

.clarification-scheme-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.clarification-scheme-emoji {
  font-size: 1.75rem;
  flex-shrink: 0;
  width: 42px;
  text-align: center;
}

.clarification-scheme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clarification-scheme-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.clarification-scheme-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.clarification-scheme-arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.clarification-no-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8);
  text-align: center;
}

.clarification-no-match-icon {
  font-size: 3rem;
}

.clarification-divider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: var(--space-6) 0;
}

.clarification-divider::before,
.clarification-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.clarification-divider span {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.clarification-mic-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
  text-align: center;
}

.clarification-mic-row {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.clarification-examples {
  margin-top: var(--space-6);
  padding-bottom: var(--space-8);
}

.clarification-examples-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.clarification-examples .type-chip {
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-primary-bg);
  border: 1px solid var(--color-primary-ring);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clarification-examples .type-chip:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.clarification-examples .type-example-chips,
.clarification-examples .clarification-example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
`;
