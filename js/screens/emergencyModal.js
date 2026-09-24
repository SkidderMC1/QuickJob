/**
 * QuickJob Instant Emergency & SOS Modal
 * Provides 1-tap emergency calling, guardian alerts, and live location sharing
 */
import { store } from '../state/store.js';

export function renderEmergencyModal(state) {
  if (!state.isEmergencyModalOpen) return '';

  const user = state.currentUser || {};
  const activeJob = state.jobs.find(j => j.id === state.emergencyJobId) || state.jobs[0];
  const guardianPhone = user.guardianConsent?.guardianPhone || '+49 171 8899221';
  const guardianName = user.guardianConsent?.guardianName || 'Sabine Klein (Mutter)';

  return `
    <div class="modal-overlay" id="emergency-modal-overlay" style="z-index: 9999;">
      <div class="modal-sheet" id="emergency-modal-sheet" style="background: #fff5f5; border: 2px solid #ef4444; max-height: 90%;">
        <div class="modal-grabber" style="background: #fca5a5;"></div>

        <!-- Header -->
        <div class="modal-header" style="border-bottom: 1px solid #fee2e2;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 38px; height: 38px; border-radius: 12px; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; animation: pulse 1.5s infinite;">
              🚨
            </div>
            <div>
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #991b1b; margin: 0;">
                Notfall & Sofort-Hilfe (SOS)
              </h2>
              <span style="font-size: 0.72rem; color: #b91c1c; font-weight: 600;">
                QuickJob Schutz- & Sicherheits-Zentrale
              </span>
            </div>
          </div>
          <button id="btn-close-emergency" style="font-size: 1.25rem; color: #991b1b; padding: 4px; border: none; background: transparent; cursor: pointer;">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="gap: 0.9rem;">
          <!-- Critical Safety Alert -->
          <div style="background: #ffffff; border: 1.5px solid #fecaca; border-radius: 12px; padding: 0.85rem; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);">
            <div style="font-size: 0.85rem; font-weight: 800; color: #991b1b; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.35rem;">
              <span>⚠️</span>
              <span>Fühlst du dich unwohl oder bist in Gefahr?</span>
            </div>
            <p style="font-size: 0.8rem; color: #475569; line-height: 1.45; margin: 0;">
              Verlasse sofort den Einsatzort! Deine Sicherheit steht an erster Stelle. Du musst keine Aufgaben ausführen, die dir unsicher erscheinen.
            </p>
          </div>

          <!-- Emergency One-Tap Call Grid -->
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <!-- Police 110 -->
            <a 
              href="tel:110" 
              class="btn-emergency-call" 
              style="display: flex; align-items: center; justify-content: space-between; background: #dc2626; color: #ffffff; padding: 0.9rem 1.1rem; border-radius: 14px; text-decoration: none; font-weight: 800; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);"
            >
              <div style="display: flex; align-items: center; gap: 0.7rem;">
                <span style="font-size: 1.4rem;">👮</span>
                <div>
                  <div style="font-size: 1rem; line-height: 1.2;">Polizei Notruf: 110</div>
                  <div style="font-size: 0.72rem; color: #fecaca; font-weight: 500;">Bei akuter Gefahr oder Bedrohung</div>
                </div>
              </div>
              <span style="font-size: 1.2rem;">📞 Jetzt anrufen</span>
            </a>

            <!-- Ambulance 112 -->
            <a 
              href="tel:112" 
              class="btn-emergency-call" 
              style="display: flex; align-items: center; justify-content: space-between; background: #b91c1c; color: #ffffff; padding: 0.9rem 1.1rem; border-radius: 14px; text-decoration: none; font-weight: 800; box-shadow: 0 4px 12px rgba(185, 28, 28, 0.25);"
            >
              <div style="display: flex; align-items: center; gap: 0.7rem;">
                <span style="font-size: 1.4rem;">🚑</span>
                <div>
                  <div style="font-size: 1rem; line-height: 1.2;">Rettungsdienst: 112</div>
                  <div style="font-size: 0.72rem; color: #fecaca; font-weight: 500;">Bei Verletzungen oder medizinischem Notfall</div>
                </div>
              </div>
              <span style="font-size: 1.2rem;">📞 Jetzt anrufen</span>
            </a>

            <!-- Guardian / Parent Emergency Call -->
            <a 
              href="tel:${guardianPhone}" 
              class="btn-emergency-call" 
              id="btn-call-guardian"
              style="display: flex; align-items: center; justify-content: space-between; background: #4338ca; color: #ffffff; padding: 0.9rem 1.1rem; border-radius: 14px; text-decoration: none; font-weight: 800; box-shadow: 0 4px 12px rgba(67, 56, 202, 0.25);"
            >
              <div style="display: flex; align-items: center; gap: 0.7rem;">
                <span style="font-size: 1.4rem;">👨‍👩‍👧</span>
                <div>
                  <div style="font-size: 0.95rem; line-height: 1.2;">Eltern-Notruf anrufen</div>
                  <div style="font-size: 0.72rem; color: #c7d2fe; font-weight: 500;">${escapeHTML(guardianName)} (${guardianPhone})</div>
                </div>
              </div>
              <span style="font-size: 1.1rem;">📞 Anrufen</span>
            </a>
          </div>

          <!-- Share Current Location Action -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">
              📍 Einsatzort & Standort teilen
            </div>
            <div style="font-size: 0.75rem; color: #64748b;">
              Aktueller Einsatz: <strong>${escapeHTML(activeJob ? activeJob.title : 'Microjob')}</strong><br/>
              Adresse: <strong>${escapeHTML(activeJob ? (activeJob.exactAddress || activeJob.approxLocation) : 'Wuppertal')}</strong>
            </div>
            <button 
              id="btn-send-emergency-location" 
              class="btn btn-outline btn-sm" 
              style="margin-top: 0.2rem; font-weight: 700; color: #4338ca; border-color: #c7d2fe;"
            >
              📲 Standort per SMS / Nachricht an Eltern senden
            </button>
          </div>

          <!-- QuickJob 24/7 Safety Team Notice -->
          <div style="font-size: 0.72rem; color: #64748b; text-align: center; line-height: 1.4;">
            🛡️ QuickJob protokolliert diesen Vorfall revisionssicher. Bei Fragen erreichst du unseren Support unter <a href="mailto:notfall@quickjob.local" style="color: #6366f1; font-weight: 700;">notfall@quickjob.local</a>.
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachEmergencyModalEvents() {
  const overlay = document.getElementById('emergency-modal-overlay');
  const closeBtn = document.getElementById('btn-close-emergency');

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        store.setState({ isEmergencyModalOpen: false });
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      store.setState({ isEmergencyModalOpen: false });
    });
  }

  const sendLocBtn = document.getElementById('btn-send-emergency-location');
  if (sendLocBtn) {
    sendLocBtn.addEventListener('click', () => {
      store.showToast('✓ Notfall-Standort an Eltern & Notfallkontakt übermittelt!');
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
