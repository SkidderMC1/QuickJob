/**
 * EasyJob Legally Compliant Microjob Receipt Modal (§ 368 BGB / § 147 AO)
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
      <div class="modal-sheet" id="receipt-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title" style="max-height: 90%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0, 145, 255, 0.12); color: #0091ff; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 800;">
              📄
            </div>
            <div>
              <h2 id="receipt-modal-title" style="font-size: 1.1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Zahlungsquittung (§ 368 BGB)
              </h2>
              <span style="font-size: 0.72rem; color: var(--qj-text-muted);">
                Offizieller Zahlungsnachweis · ${receiptNumber}
              </span>
            </div>
          </div>
          <button id="btn-close-receipt" aria-label="Schließen" style="font-size: 1.25rem; color: var(--qj-text-muted); padding: 4px; border: none; background: transparent; cursor: pointer;">
            ✕
          </button>
        </div>

        <!-- Body / Printable Receipt Paper -->
        <div class="modal-body" style="gap: 1rem;">
          <div class="printable-receipt" style="background: var(--qj-card); border: 1.5px solid var(--qj-border); border-radius: 12px; padding: 1.25rem; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 0.85rem; font-family: monospace, sans-serif;">
            <!-- Receipt Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0091ff; padding-bottom: 0.75rem;">
              <div>
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--qj-text-main); font-family: 'Plus Jakarta Sans', sans-serif;">
                  ⚡ EasyJob Quittung
                </div>
                <div style="font-size: 0.75rem; color: var(--qj-text-muted);">
                  Nachbarschaftliche Taschengeld-Vermittlung
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--qj-text-main);">${receiptNumber}</div>
                <div style="font-size: 0.72rem; color: var(--qj-text-muted);">Datum: ${receiptDate}</div>
              </div>
            </div>

            <!-- Parties Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: var(--qj-surface-subtle); border-radius: 8px; padding: 0.75rem; font-size: 0.78rem;">
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: var(--qj-text-muted); text-transform: uppercase;">Zahlungsempfänger (Helfer)</div>
                <div style="font-weight: 800; color: var(--qj-text-main); margin-top: 2px;">${escapeHTML(workerName)}</div>
                <div style="color: var(--qj-text-muted);">Verifizierter Schüler / Helfer</div>
              </div>
              <div>
                <div style="font-size: 0.68rem; font-weight: 700; color: var(--qj-text-muted); text-transform: uppercase;">Auftraggeber (Zahlender)</div>
                <div style="font-weight: 800; color: var(--qj-text-main); margin-top: 2px;">${escapeHTML(employerName)}</div>
                <div style="color: var(--qj-text-muted);">Privathaushalt / Auftraggeber</div>
              </div>
            </div>

            <!-- Job Service Description -->
            <div style="border: 1px solid var(--qj-border); border-radius: 8px; padding: 0.75rem;">
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--qj-text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">Erbrachte Leistung</div>
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--qj-text-main);">${escapeHTML(job.title)}</div>
              <div style="font-size: 0.76rem; color: var(--qj-text-muted); margin-top: 2px;">
                Kategorie: ${job.category} · Dauer: ${job.estimatedDuration} · Ort: ${job.approxLocation}
              </div>
            </div>

            <!-- Line Items Table -->
            <div style="display: flex; flex-direction: column; gap: 0.4rem; border-bottom: 1px solid var(--qj-border); padding-bottom: 0.65rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--qj-text-main);">
                <span>Grundhonorar (Aufwandsentschädigung):</span>
                <span style="font-weight: 700;">€${basePayment.toFixed(2)}</span>
              </div>
              ${tipPayment > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: #059669;">
                  <span>Trinkgeld (Freiwillige Anerkennung):</span>
                  <span style="font-weight: 700;">+ €${tipPayment.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; color: var(--qj-text-main); border-top: 2px solid var(--qj-text-main); padding-top: 0.45rem; margin-top: 0.2rem;">
                <span>Gesamtbetrag erhalten:</span>
                <span style="color: #0091ff;">€${totalPayment.toFixed(2)}</span>
              </div>
            </div>

            <!-- Legal Citation Notice -->
            <div style="font-size: 0.7rem; color: var(--qj-text-muted); line-height: 1.4; background: var(--qj-surface-subtle); border-radius: 6px; padding: 0.55rem;">
              <strong>Rechtlicher Hinweis gem. § 368 BGB:</strong> Der Empfänger bestätigt hiermit den vollständigen Erhalt des oben genannten Betrags über das EasyJob-Treuhandkonto (Escrow). Aufbewahrungspflichtige Daten werden revisionssicher gem. § 147 Abs. 1 Nr. 4 AO archiviert.
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
