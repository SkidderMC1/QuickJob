/**
 * QuickJob Geolocation Permission & Privacy Consent Modal (TDDDG § 25 / Art. 6 DSGVO)
 */
import { store } from '../state/store.js';

export function renderLocationModal(state) {
  if (!state.isLocationModalOpen) return '';

  return `
    <div class="modal-overlay" id="location-modal-overlay">
      <div class="modal-sheet" id="location-modal-sheet" style="max-height: 85%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 38px; height: 38px; border-radius: 12px; background: rgba(14, 167, 107, 0.12); color: #0ea76b; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              📍
            </div>
            <div>
              <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Standort für Umgebungskarte nutzen?
              </h2>
              <span style="font-size: 0.72rem; color: var(--qj-text-muted);">
                DSGVO Art. 25 & TDDDG § 25 konform
              </span>
            </div>
          </div>
          <button id="btn-close-location-modal" style="font-size: 1.25rem; color: #64748b; padding: 4px; border: none; background: transparent; cursor: pointer;">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="gap: 1rem; text-align: center; padding: 1rem 0.5rem;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto;">
            🗺️
          </div>

          <div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0;">
              Microjobs in deiner Nachbarschaft finden
            </h3>
            <p style="font-size: 0.82rem; color: #64748b; line-height: 1.5; margin: 0.5rem auto 0; max-width: 320px;">
              Darf QuickJob deinen ungefähren Standort nutzen, um dir offene Aufgaben in deiner fußläufigen und fahrradtauglichen Umgebung auf der interaktiven Karte anzuzeigen?
            </p>
          </div>

          <!-- Privacy Guarantee Box -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; text-align: left; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.75rem; color: #475569;">
            <div style="font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.3rem;">
              <span>🛡️</span><span>Datenschutz-Garantie:</span>
            </div>
            <div>• Dein genauer GPS-Punkt wird niemals an andere Nutzer übertragen.</div>
            <div>• Es wird lediglich der ungefähre Stadtteil für Umkreisberechnungen verwendet.</div>
            <div>• Du kannst die Standortnutzung jederzeit in den Einstellungen widerrufen.</div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; flex-direction: column; gap: 0.55rem; width: 100%;">
            <button 
              id="btn-allow-location" 
              class="btn btn-primary btn-block" 
              style="font-weight: 800; padding: 0.85rem; font-size: 0.95rem; border-radius: 12px;"
            >
              ✓ Standort erlauben & Karte öffnen
            </button>
            <button 
              id="btn-deny-location" 
              class="btn btn-outline btn-block" 
              style="font-weight: 700; padding: 0.75rem; font-size: 0.88rem; border-radius: 12px;"
            >
              Ohne Standort fortfahren (Wuppertal-Zentrum)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachLocationModalEvents() {
  const overlay = document.getElementById('location-modal-overlay');
  const closeBtn = document.getElementById('btn-close-location-modal');
  const allowBtn = document.getElementById('btn-allow-location');
  const denyBtn = document.getElementById('btn-deny-location');

  const closeModal = () => {
    store.setState({ isLocationModalOpen: false });
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (allowBtn) {
    allowBtn.addEventListener('click', () => {
      store.grantLocationPermission();
    });
  }

  if (denyBtn) {
    denyBtn.addEventListener('click', () => {
      store.denyLocationPermission();
    });
  }
}
