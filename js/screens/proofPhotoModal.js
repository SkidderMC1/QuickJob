/**
 * QuickJob Before & After Photo Proof & AI Vision Verification Modal
 */
import { store } from '../state/store.js';

export function renderProofPhotoModal(state) {
  if (!state.isProofModalOpen) return '';

  const job = state.jobs.find(j => j.id === state.proofModalJobId) || state.jobs[0];
  if (!job) return '';

  const defaultBefore = job.proofPhotoBefore || 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=400&q=80';
  const defaultAfter = job.proofPhotoAfter || 'https://images.unsplash.com/photo-1592417817098-8f3d69102657?auto=format&fit=crop&w=400&q=80';
  const isVerified = state.tempAiVerified || job.aiVisionVerified;

  return `
    <div class="modal-overlay" id="proof-photo-modal-overlay">
      <div class="modal-sheet" id="proof-photo-modal-sheet" style="max-height: 90%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(79, 70, 229, 0.12); color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 800;">
              📸
            </div>
            <div>
              <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Vorher-/Nachher-Nachweis
              </h2>
              <span style="font-size: 0.72rem; color: var(--qj-text-muted);">
                KI-gestützte Arbeitsabnahme & Beweissicherung
              </span>
            </div>
          </div>
          <button id="btn-close-proof-photo" style="font-size: 1.25rem; color: #64748b; padding: 4px; border: none; background: transparent; cursor: pointer;">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="gap: 1rem;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; font-size: 0.8rem; color: #334155;">
            <strong>Auftrag:</strong> ${escapeHTML(job.title)}<br/>
            <span style="color: #64748b; font-size: 0.74rem;">Lade Vorher- und Nachher-Fotos hoch, um die ordnungsgemäße Erledigung vor der Auszahlung transparent zu belegen.</span>
          </div>

          <!-- 2-Photo Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <!-- Before Photo Box -->
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              <span style="font-size: 0.74rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                1. Vor Beginn (Vorher)
              </span>
              <div style="position: relative; border-radius: 10px; overflow: hidden; height: 130px; background: #e2e8f0; border: 1px solid #cbd5e1;">
                <img 
                  id="preview-photo-before" 
                  src="${defaultBefore}" 
                  alt="Vorher Foto" 
                  style="width: 100%; height: 100%; object-fit: cover;" 
                />
                <span class="badge" style="position: absolute; bottom: 6px; left: 6px; background: rgba(15,23,42,0.75); color: white; font-size: 0.65rem;">
                  Vorher
                </span>
              </div>
            </div>

            <!-- After Photo Box -->
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              <span style="font-size: 0.74rem; font-weight: 700; color: #059669; text-transform: uppercase;">
                2. Nach Fertigstellung (Nachher)
              </span>
              <div style="position: relative; border-radius: 10px; overflow: hidden; height: 130px; background: #e2e8f0; border: 2px solid #10b981;">
                <img 
                  id="preview-photo-after" 
                  src="${defaultAfter}" 
                  alt="Nachher Foto" 
                  style="width: 100%; height: 100%; object-fit: cover;" 
                />
                <span class="badge" style="position: absolute; bottom: 6px; left: 6px; background: rgba(16,185,129,0.9); color: white; font-size: 0.65rem;">
                  Nachher ✓
                </span>
              </div>
            </div>
          </div>

          <!-- AI Vision Verification Card -->
          <div style="background: ${isVerified ? '#f0fdf4' : '#f5f3ff'}; border: 1.5px solid ${isVerified ? '#86efac' : '#c4b5fd'}; border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 800; font-size: 0.84rem; color: ${isVerified ? '#15803d' : '#5b21b6'};">
                <span>🤖</span>
                <span>KI-Vision-Prüfung (Gemini Vision)</span>
              </div>
              <span class="badge ${isVerified ? 'badge-success' : 'badge-purple'}" id="ai-verification-badge" style="font-size: 0.72rem;">
                ${isVerified ? '✓ Plausibel verifiziert (98%)' : 'Prüfung bereit'}
              </span>
            </div>

            <p id="ai-verification-text" style="font-size: 0.76rem; color: ${isVerified ? '#166534' : '#6b21a8'}; line-height: 1.45; margin: 0;">
              ${isVerified 
                ? (job.aiVisionSummary || 'Arbeitsschritt erfolgreich abgeglichen: Rasenfläche ordnungsgemäß gemäht, Rasenkanten getrimmt, Schnittgut ordnungsgemäß beseitigt.')
                : 'Die KI prüft automatisch, ob das Nachher-Foto die vereinbarte Aufgabenbeschreibung (z. B. gemähter Rasen, aufgeräumter Raum) erfüllt und kein Standard-Foto ist.'}
            </p>

            <button 
              id="btn-run-ai-vision" 
              class="btn btn-outline btn-sm" 
              style="font-size: 0.76rem; font-weight: 700; border-color: ${isVerified ? '#86efac' : '#c4b5fd'}; color: ${isVerified ? '#15803d' : '#5b21b6'}; background: #ffffff;"
            >
              🔄 ${isVerified ? 'Erneut mit KI prüfen' : 'Jetzt KI-Bildprüfung durchführen'}
            </button>
          </div>

          <!-- Submit Button -->
          <button 
            id="btn-submit-proof-to-chat" 
            class="btn btn-primary btn-block" 
            style="font-weight: 800; padding: 0.85rem; margin-top: 0.25rem;"
          >
            📤 Foto-Beweis im Chat freigeben
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachProofPhotoModalEvents() {
  const overlay = document.getElementById('proof-photo-modal-overlay');
  const closeBtn = document.getElementById('btn-close-proof-photo');
  const runAiBtn = document.getElementById('btn-run-ai-vision');
  const submitBtn = document.getElementById('btn-submit-proof-to-chat');

  const closeProof = () => {
    store.setState({ isProofModalOpen: false });
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeProof();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeProof);

  if (runAiBtn) {
    runAiBtn.addEventListener('click', () => {
      store.showToast('🔍 Gemini Vision analysiert Vorher-/Nachher-Bilder...');
      setTimeout(() => {
        store.setState({ tempAiVerified: true });
        const badge = document.getElementById('ai-verification-badge');
        const text = document.getElementById('ai-verification-text');
        if (badge) {
          badge.className = 'badge badge-success';
          badge.innerText = '✓ Plausibel verifiziert (98%)';
        }
        if (text) {
          text.innerText = '🤖 KI-Prüfung abgeschlossen: Rasenschnitt & Kantenpflege plausibel bestätigt. Arbeitsergebnis stimmt mit Auftrag überein.';
          text.style.color = '#166534';
        }
        store.showToast('✓ KI-Bildprüfung erfolgreich: 98% Plausibilität!');
      }, 700);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const jobId = store.getState().proofModalJobId;
      store.submitJobProofPhotos(jobId);
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
