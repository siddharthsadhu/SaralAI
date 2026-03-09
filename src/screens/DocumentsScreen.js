/**
 * Documents Screen — Data-Driven from Schemes.json
 */
import { Header, initHeader } from '../components/Header.js';
import { ChecklistItem } from '../components/ChecklistItem.js';
import { Button } from '../components/Button.js';
import { MicButtonSmall } from '../components/MicButton.js';
import { navigate } from '../router.js';
import { getState } from '../state.js';
import { getIcon } from '../icons.js';

/**
 * Render documents screen
 * @returns {string} Screen HTML
 */
export function DocumentsScreen() {
  const { currentScheme, currentExplanation } = getState();

  const schemeName = currentExplanation?.schemeName || currentScheme?.scheme_name || 'this scheme';
  const documents = currentScheme?.required_documents || [];

  const mandatoryDocs = documents.filter(d => d.mandatory);
  const optionalDocs = documents.filter(d => !d.mandatory);

  // Fallback document list if no scheme data
  const fallbackDocs = [
    { document_name: 'Aadhaar Card', mandatory: true },
    { document_name: 'Ration Card', mandatory: true },
    { document_name: 'Voter ID / PAN Card', mandatory: false },
    { document_name: 'Bank Account Details', mandatory: true }
  ];

  const docsToShow = documents.length > 0 ? documents : fallbackDocs;
  const mandatoryToShow = docsToShow.filter(d => d.mandatory);
  const optionalToShow = docsToShow.filter(d => !d.mandatory);

  return `
    <div class="screen documents-screen">
      ${Header({ showNav: true })}
      
      <div class="screen-content">
        <div class="container">

          <div class="documents-header animate-fadeIn">
            <h1 class="heading-2">Documents You May Need</h1>
            <p class="text-body">For <strong>${schemeName}</strong></p>
            <p class="documents-subtitle">Please keep original documents ready. Requirements may vary by location.</p>
          </div>

          ${mandatoryToShow.length > 0 ? `
            <div class="documents-section animate-slideUp">
              <div class="documents-section-label documents-required-label">
                ${getIcon('check', 'icon icon-sm')} Required Documents
              </div>
              <div class="documents-list">
                ${mandatoryToShow.map((doc, i) => ChecklistItem({
    id: `doc-${i}`,
    title: doc.document_name,
    subtitle: 'Required',
    mandatory: true
  })).join('')}
              </div>
            </div>
          ` : ''}

          ${optionalToShow.length > 0 ? `
            <div class="documents-section animate-slideUp">
              <div class="documents-section-label documents-optional-label">
                ${getIcon('arrowRight', 'icon icon-sm')} Optional / May Be Needed
              </div>
              <div class="documents-list">
                ${optionalToShow.map((doc, i) => ChecklistItem({
    id: `opt-doc-${i}`,
    title: doc.document_name,
    subtitle: 'May be required',
    mandatory: false
  })).join('')}
              </div>
            </div>
          ` : ''}

          <div class="documents-note animate-slideUp">
            ${getIcon('government', 'icon icon-sm')}
            <p>Document requirements may vary by State and local office. Always check with your local authority before applying.</p>
          </div>

          <div class="documents-actions">
            <div class="documents-voice-row">
              ${MicButtonSmall({ id: 'read-docs-btn', text: 'Read this to me' })}
            </div>
            ${Button({
    text: 'I have these documents →',
    variant: 'primary',
    size: 'lg',
    fullWidth: true,
    id: 'have-docs-btn'
  })}
            ${Button({
    text: 'Back to Explanation',
    variant: 'ghost',
    fullWidth: true,
    id: 'back-btn'
  })}
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize documents screen events
 */
export function initDocumentsScreen() {
  initHeader();
  document.getElementById('have-docs-btn')?.addEventListener('click', () => navigate('guidance'));
  document.getElementById('back-btn')?.addEventListener('click', () => window.history.back());
  document.getElementById('read-docs-btn')?.addEventListener('click', () => {
    // Web Speech API TTS — read document names
    if ('speechSynthesis' in window) {
      const { currentScheme } = getState();
      const docs = currentScheme?.required_documents || [];
      const text = docs.length > 0
        ? 'You will need: ' + docs.map(d => d.document_name).join(', ')
        : 'Please check the required documents list with your local authority.';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      speechSynthesis.speak(utterance);
    }
  });
}

// Documents screen styles
export const documentsStyles = `
.documents-screen {
  background-color: var(--color-bg);
}

.documents-header {
  padding-top: var(--space-6);
  margin-bottom: var(--space-6);
}

.documents-header h1 {
  margin-bottom: var(--space-2);
}

.documents-header p {
  margin-bottom: var(--space-1);
}

.documents-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2) !important;
}

.documents-section {
  margin-bottom: var(--space-5);
}

.documents-section-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-3);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  width: fit-content;
}

.documents-required-label {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.documents-optional-label {
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.documents-note {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
}

.documents-note .icon {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.documents-note p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.documents-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-8);
}

.documents-voice-row {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-2);
}
`;
