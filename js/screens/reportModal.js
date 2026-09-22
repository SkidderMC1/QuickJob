/**
 * QuickJob Safety Incident & Report Modal
 * Enables helpers, minors, and employers to report violations, safety hazards, or inappropriate behavior.
 */
import { store } from '../state/store.js';

let selectedCategory = 'youth_safety';
let reportDetails = '';

const reportCategories = [
  {
    id: 'youth_safety',
    icon: '⚠️',
    title: 'Jugendschutz-Verstoß / Gefährliche Arbeit',
    desc: 'Schwere Lasten, gefährliche Maschinen oder unzulässige Arbeitszeiten für Minderjährige.'
  },
  {
    id: 'suspicious',
    icon: '🚩',
    title: 'Verdächtiges oder unklares Angebot',
    desc: 'Aufgabe weicht von der Beschreibung ab oder fordert Zahlungen außerhalb von QuickJob.'
  },
  {
    id: 'conduct',
    icon: '💬',
    title: 'Unangemessenes Verhalten / Belästigung',
    desc: 'Unfreundliche, beleidigende oder grenzüberschreitende Kommunikation.'
  },
  {
    id: 'payment',
    icon: '💰',
    title: 'Zahlungs- oder Treuhandproblem',
    desc: 'Verweigerung der vereinbarten Auszahlung nach ordnungsgemäßer Erledigung.'
  }
];

export function renderReportModal(state) {
  if (!state.reportJobId) return '';

  const job = state.jobs.find(j => j.id === state.reportJobId);
  const jobTitle = job ? job.title : 'Auftrag';

  return `
    <div class="modal-overlay" id="report-modal-overlay" style="z-index: 9000;">
      <div class="modal-sheet" id="report-modal-sheet" style="max-height: 90%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge badge-danger">🛡️ Vertraulich Melden</span>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--qj-text-main);">
              Sicherheitsmeldung
            </h3>
          </div>
          <button id="btn-close-report" style="font-size: 1.25rem; color: #64748b; padding: 4px;">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="gap: 1rem;">
          <div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--qj-text-main);">
              Betroffener Microjob:
            </div>
            <div style="font-size: 0.82rem; color: var(--qj-text-muted); margin-top: 2px;">
              "${escapeHTML(jobTitle)}"
            </div>
          </div>

          <!-- Category Selection -->
          <div class="form-group">
            <label class="form-label">Grund der Meldung</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${reportCategories.map(cat => `
                <label 
                  style="border: 1.5px solid ${selectedCategory === cat.id ? '#ef4444' : 'var(--qj-border)'}; background: ${selectedCategory === cat.id ? '#fef2f2' : '#ffffff'}; padding: 0.75rem; border-radius: var(--qj-radius-sm); cursor: pointer; display: flex; align-items: flex-start; gap: 0.6rem; transition: var(--qj-transition);"
                >
                  <input 
                    type="radio" 
                    name="reportCat" 
                    value="${cat.id}" 
                    ${selectedCategory === cat.id ? 'checked' : ''} 
                    style="margin-top: 3px; accent-color: #ef4444;"
                  />
                  <div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.35rem;">
                      <span>${cat.icon}</span>
                      <span>${cat.title}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px; line-height: 1.35;">
                      ${cat.desc}
                    </div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Details Textarea -->
          <div class="form-group">
            <label class="form-label" for="report-details-input">
              <span>Beschreibung des Vorfalls</span>
              <span class="helper">Bitte schildere kurz, was vorgefallen ist</span>
            </label>
            <textarea 
              id="report-details-input" 
              class="form-control" 
              rows="3" 
              placeholder="z. B. Vor Ort sollte ein schwerer Balken getragen werden, der nicht im Inserat stand..."
            >${escapeHTML(reportDetails)}</textarea>
          </div>

          <!-- Official Youth Emergency Contact Box -->
          <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #1e40af; display: flex; align-items: center; gap: 0.35rem;">
              <span>📞</span>
              <span>Sofortige Hilfe für Jugendliche & Eltern</span>
            </div>
            <p style="font-size: 0.76rem; color: #1e3a8a; line-height: 1.4; margin-top: 2px;">
              In dringenden Fällen oder bei Übergriffen: <strong>Nummer gegen Kummer (kostenlos & anonym): 116 111</strong> oder Notruf <strong>110</strong>.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-report" style="flex: 1;">
            Abbrechen
          </button>
          <button class="btn btn-danger" id="btn-submit-report" style="flex: 2; background: #dc2626; color: white; border: none;">
            🚩 Meldung vertraulich absenden
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachReportModalEvents() {
  const overlay = document.getElementById('report-modal-overlay');
  const closeBtn = document.getElementById('btn-close-report');
  const cancelBtn = document.getElementById('btn-cancel-report');

  const close = () => {
    store.closeReportModal();
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  // Radio selection
  const radios = document.querySelectorAll('input[name="reportCat"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedCategory = e.target.value;
      // Re-render
      store.setState({ reportJobId: store.getState().reportJobId });
    });
  });

  // Details input
  const detailsInput = document.getElementById('report-details-input');
  if (detailsInput) {
    detailsInput.addEventListener('input', (e) => {
      reportDetails = e.target.value;
    });
  }

  // Submit button
  const submitBtn = document.getElementById('btn-submit-report');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const jobId = store.getState().reportJobId;
      if (jobId) {
        store.submitReport(jobId, selectedCategory, reportDetails);
        reportDetails = '';
        selectedCategory = 'youth_safety';
      }
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
