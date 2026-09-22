/**
 * QuickJob Legal Documents & AGB Acceptance Modal
 * Displays versioned statutory documents and captures un-preselected AGB acceptance.
 */
import { LEGAL_DOCUMENTS } from '../legal/legalDocuments.js';
import { store } from '../state/store.js';

export function renderLegalModal(state) {
  if (!state.activeLegalDocType) return '';

  const doc = LEGAL_DOCUMENTS[state.activeLegalDocType] || LEGAL_DOCUMENTS.AGB;
  const isAcceptanceFlow = Boolean(state.isAgbAcceptanceRequired);

  return `
    <div class="modal-backdrop" id="legal-modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div class="modal-card" style="background: #fff; width: 100%; max-width: 620px; max-height: 88vh; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.25);">
        
        <!-- Header & Document Tab Bar -->
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #6366f1;">
                Rechtliche Dokumente · Version ${doc.version}
              </div>
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0.2rem 0 0 0;">
                ${doc.title}
              </h2>
            </div>
            ${!isAcceptanceFlow ? `
              <button id="btn-close-legal-modal" class="btn btn-ghost" style="font-size: 1.35rem; padding: 0.25rem; line-height: 1;">✕</button>
            ` : ''}
          </div>

          <!-- Document Selector Pills -->
          <div style="display: flex; gap: 0.35rem; overflow-x: auto; padding-bottom: 0.2rem;">
            <button class="btn-doc-tab ${state.activeLegalDocType === 'AGB' ? 'active' : ''}" data-doctype="AGB">AGB</button>
            <button class="btn-doc-tab ${state.activeLegalDocType === 'PRIVACY' ? 'active' : ''}" data-doctype="PRIVACY">Datenschutz</button>
            <button class="btn-doc-tab ${state.activeLegalDocType === 'IMPRESSUM' ? 'active' : ''}" data-doctype="IMPRESSUM">Impressum</button>
            <button class="btn-doc-tab ${state.activeLegalDocType === 'WIDERRUF' ? 'active' : ''}" data-doctype="WIDERRUF">Widerruf</button>
            <button class="btn-doc-tab ${state.activeLegalDocType === 'YOUTH_PROTECTION' ? 'active' : ''}" data-doctype="YOUTH_PROTECTION">Jugendschutz</button>
          </div>
        </div>

        <!-- Scrollable Document Body -->
        <div id="legal-doc-content" style="flex: 1; padding: 1.25rem; overflow-y: auto; font-size: 0.84rem; line-height: 1.6; color: #334155;">
          ${renderMarkdownLikeText(doc.content)}
        </div>

        <!-- Footer / Acceptance Section -->
        <div style="padding: 1rem 1.25rem; border-top: 1px solid #e2e8f0; background: #f8fafc;">
          ${isAcceptanceFlow ? `
            <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 0.75rem; margin-bottom: 0.85rem;">
              <label style="display: flex; align-items: flex-start; gap: 0.6rem; cursor: pointer;">
                <!-- Explicit Un-preselected Checkbox (§ 305 Abs. 2 BGB) -->
                <input type="checkbox" id="check-accept-agb" style="margin-top: 0.2rem; transform: scale(1.15);" />
                <span style="font-size: 0.8rem; color: #1e1b4b; font-weight: 600;">
                  Ich habe die AGB (v${doc.version}) und die Datenschutzerklärung zur Kenntnis genommen und erkläre mich ausdrücklich damit einverstanden.
                </span>
              </label>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
              <button id="btn-submit-agb-acceptance" class="btn btn-primary" style="font-weight: 700; width: 100%;">
                Verbindlich zustimmen & fortfahren
              </button>
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: #64748b;">
                Gültig ab: ${doc.effectiveFrom} · Prüfstatus: ${doc.lawyerReviewStatus}
              </span>
              <button id="btn-legal-modal-done" class="btn btn-secondary" style="font-size: 0.82rem; font-weight: 700; padding: 0.45rem 1rem;">
                Schließen
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderMarkdownLikeText(text) {
  if (!text) return '';
  // Basic safe markdown-to-HTML parser for headers, bold, and lists
  return text
    .trim()
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.2rem; font-weight: 800; margin: 0.5rem 0 0.75rem 0; color: #0f172a;">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.05rem; font-weight: 800; margin: 1.25rem 0 0.5rem 0; color: #1e293b;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 0.95rem; font-weight: 700; margin: 1rem 0 0.35rem 0; color: #334155;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #0f172a;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '<p style="margin: 0.6rem 0;"></p>')
    .replace(/\n/gim, '<br />');
}

export function attachLegalModalEvents() {
  const closeBtn = document.getElementById('btn-close-legal-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      store.setState({ activeLegalDocType: null, isAgbAcceptanceRequired: false });
    });
  }

  const doneBtn = document.getElementById('btn-legal-modal-done');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      store.setState({ activeLegalDocType: null });
    });
  }

  // Switch tabs
  const tabButtons = document.querySelectorAll('.btn-doc-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const docType = e.currentTarget.getAttribute('data-doctype');
      store.setState({ activeLegalDocType: docType });
    });
  });

  // Submit AGB Acceptance
  const submitAgbBtn = document.getElementById('btn-submit-agb-acceptance');
  if (submitAgbBtn) {
    submitAgbBtn.addEventListener('click', () => {
      const isChecked = document.getElementById('check-accept-agb')?.checked;
      if (!isChecked) {
        store.showToast('Bitte markieren Sie das Zustimmungs-Kästchen vor dem Fortfahren.', 'error');
        return;
      }
      store.recordAgbAcceptance('AGB', '1.1.0');
    });
  }
}
