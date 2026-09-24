/**
 * QuickJob Legally Compliant Microjob Receipt Modal (§ 368 BGB / § 147 AO)
 */
import { store } from '../state/store.js';

export function renderReceiptModal(state) {
  if (!state.receiptModalJobId) return '';

  const job = state.jobs.find(j => j.id === state.receiptModalJobId) || state.jobs[0];
  if (!job) return '';

  const user = state.currentUser || {};
  const workerName = job.worker ? job.worker.name : (user.role === 'worker' ? user.name : 'Jasper Klein');
  const employerName = job.employer ? job.employer.name : 'Dr. Marcus Lang';
  const basePayment = job.payment || 28;
  const tipPayment = job.tipAmount || 0;
  const totalPayment = basePayment + tipPayment;
  const receiptNumber = `QJ-${new Date().getFullYear()}-${job.id.replace('job_', '90')}`;
  const receiptDate = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return `
    <div class="modal-overlay" id="receipt-modal-overlay">
      <div class="modal-sheet" id="receipt-modal-sheet" style="max-height: 90%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(14, 167, 107, 0.12); color: #0ea76b; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 800;">
              📄
            </div>
            <div>
              <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Zahlungsquittung (§ 368 BGB)
              </h2>
              <span style="font-size: 0.72rem; color: var(--qj-text-muted);">
                Offizieller Zahlungsnachweis · ${receiptNumber}
              </span>
            </div>
          </div>
          <button id="btn-close-receipt" style="font-size: 1.25rem; color: #64748b; padding: 4px; border: none; background: transparent; cursor: pointer;">
            ✕
          </button>
        </div>

        <!-- Body / Printable Receipt Paper -->
        <div class="modal-body" style="gap: 1rem;">
          <div class="printable-receipt" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 1.25rem; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 0.85rem; font-family: monospace, sans-serif;">
            <!-- Receipt Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0ea76b; padding-bottom: 0.75rem;">
              <div>
                <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif;">
                  ⚡ QuickJob Quittung
                </div>
                <div style="font-size: 0.75rem; color: #64748b;">
                  Nachbarschaftliche Taschengeld-Vermittlung
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #0f172a;">${receiptNumber}</div>
                <div style="font-size: 0.72rem; color: #64748b;">Datum: ${receiptDate}</div>
              </div>
            </div>

            <!-- Parties Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: #f8fafc; border-radius: 8px; padding: 0.75rem; font-size: 0.78rem;">
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Zahlungsempfänger (Helfer)</div>
                <div style="font-weight: 800; color: #0f172a; margin-top: 2px;">${escapeHTML(workerName)}</div>
                <div style="color: #64748b;">Verifizierter Schüler / Helfer</div>
              </div>
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Auftraggeber (Zahlender)</div>
                <div style="font-weight: 800; color: #0f172a; margin-top: 2px;">${escapeHTML(employerName)}</div>
                <div style="color: #64748b;">Privathaushalt / Auftraggeber</div>
              </div>
            </div>

            <!-- Job Service Description -->
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
              <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Erbrachte Leistung</div>
              <div style="font-size: 0.88rem; font-weight: 700; color: #0f172a;">${escapeHTML(job.title)}</div>
              <div style="font-size: 0.76rem; color: #475569; margin-top: 2px;">
                Kategorie: ${job.category} · Dauer: ${job.estimatedDuration} · Ort: ${job.approxLocation}
              </div>
            </div>

            <!-- Line Items Table -->
            <div style="display: flex; flex-direction: column; gap: 0.4rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.65rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: #334155;">
                <span>Grundhonorar (Aufwandsentschädigung):</span>
                <span style="font-weight: 700;">€${basePayment.toFixed(2)}</span>
              </div>
              ${tipPayment > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: #059669;">
                  <span>Trinkgeld (Freiwillige Anerkennung):</span>
                  <span style="font-weight: 700;">+ €${tipPayment.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 0.45rem; margin-top: 0.2rem;">
                <span>Gesamtbetrag erhalten:</span>
                <span style="color: #0ea76b;">€${totalPayment.toFixed(2)}</span>
              </div>
            </div>

            <!-- Legal Citation Notice -->
            <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4; background: #f8fafc; border-radius: 6px; padding: 0.55rem;">
              <strong>Rechtlicher Hinweis gem. § 368 BGB:</strong> Der Empfänger bestätigt hiermit den vollständigen Erhalt des oben genannten Betrags über das QuickJob-Treuhandkonto (Escrow). Aufbewahrungspflichtige Daten werden revisionssicher gem. § 147 Abs. 1 Nr. 4 AO archiviert.
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 0.6rem;">
            <button class="btn btn-primary" id="btn-print-receipt" style="flex: 1; font-weight: 700;">
              🖨️ Quittung drucken / PDF speichern
            </button>
            <button class="btn btn-outline" id="btn-dismiss-receipt" style="flex: 1; font-weight: 700;">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachReceiptModalEvents() {
  const overlay = document.getElementById('receipt-modal-overlay');
  const closeBtn = document.getElementById('btn-close-receipt');
  const dismissBtn = document.getElementById('btn-dismiss-receipt');
  const printBtn = document.getElementById('btn-print-receipt');

  const closeReceipt = () => {
    store.setState({ receiptModalJobId: null });
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeReceipt();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeReceipt);
  if (dismissBtn) dismissBtn.addEventListener('click', closeReceipt);

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
