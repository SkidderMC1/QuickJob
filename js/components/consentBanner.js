/**
 * QuickJob TDDDG § 25 Consent Banner Component
 * Strictly prevents dark patterns: Equal prominent styling for Reject All and Accept All.
 */
import { ConsentManager, ConsentCategories } from '../legal/consentManager.js';
import { store } from '../state/store.js';

export function renderConsentBanner(state) {
  if (ConsentManager.hasDecided() && !state.isConsentModalOpen) {
    return '';
  }

  // If user opened granular settings modal
  if (state.isConsentModalOpen) {
    const consent = ConsentManager.getConsentState();
    return `
      <div class="modal-backdrop" id="consent-modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: flex-end; justify-content: center;">
        <div class="modal-sheet" style="background: var(--qj-surface, #fff); width: 100%; max-width: 500px; max-height: 85vh; border-radius: 20px 20px 0 0; padding: 1.5rem; overflow-y: auto; box-shadow: 0 -10px 25px rgba(0,0,0,0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #1e1b4b; display: flex; align-items: center; gap: 0.5rem;">
              <span>🍪</span><span>Datenschutz- & Speicherpräferenzen</span>
            </h3>
            <button id="btn-close-consent-modal" class="btn btn-ghost" style="font-size: 1.25rem; line-height: 1; padding: 0.25rem;">✕</button>
          </div>

          <p style="font-size: 0.82rem; color: #64748b; line-height: 1.45; margin-bottom: 1.25rem;">
            Nach § 25 TDDDG und Art. 6 Abs. 1 DSGVO bestimmen Sie selbst, welche Daten auf Ihrem Endgerät gespeichert werden dürfen.
          </p>

          <!-- Category 1: Strictly Necessary -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.9rem; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">
                ${ConsentCategories.STRICTLY_NECESSARY.label}
                <span style="font-size: 0.72rem; color: #6366f1; font-weight: 600;">(${ConsentCategories.STRICTLY_NECESSARY.legalBasis})</span>
              </span>
              <span class="badge badge-success" style="font-size: 0.7rem;">Immer aktiv</span>
            </div>
            <div style="font-size: 0.76rem; color: #64748b; line-height: 1.4;">
              ${ConsentCategories.STRICTLY_NECESSARY.description}
            </div>
          </div>

          <!-- Category 2: Functional Preferences -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.9rem; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">${ConsentCategories.FUNCTIONAL_PREFERENCES.label}</span>
              <label class="switch-label" style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="consent-check-preferences" ${consent.categories.functional_preferences ? 'checked' : ''} />
              </label>
            </div>
            <div style="font-size: 0.76rem; color: #64748b; line-height: 1.4;">
              ${ConsentCategories.FUNCTIONAL_PREFERENCES.description}
            </div>
          </div>

          <!-- Category 3: Anonymous Analytics -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.9rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">${ConsentCategories.ANONYMOUS_ANALYTICS.label}</span>
              <label class="switch-label" style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="consent-check-analytics" ${consent.categories.anonymous_analytics ? 'checked' : ''} />
              </label>
            </div>
            <div style="font-size: 0.76rem; color: #64748b; line-height: 1.4;">
              ${ConsentCategories.ANONYMOUS_ANALYTICS.description}
            </div>
          </div>

          <!-- Action Buttons in Granular Modal -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <button id="btn-consent-save-selection" class="btn btn-secondary" style="font-weight: 700; padding: 0.75rem;">
              Auswahl speichern
            </button>
            <button id="btn-consent-accept-all-modal" class="btn btn-primary" style="font-weight: 700; padding: 0.75rem;">
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Floating Initial Banner
  return `
    <div id="tdddg-consent-banner" style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); border-top: 1px solid #e2e8f0; box-shadow: 0 -8px 30px rgba(0,0,0,0.12); z-index: 8500; padding: 1rem 1.25rem;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
          <span style="font-size: 1.35rem;">🍪</span>
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a;">Ihre Privatsphäre & Datenspeicherung (§ 25 TDDDG)</div>
            <div style="font-size: 0.78rem; color: #475569; line-height: 1.4; margin-top: 0.2rem;">
              Wir verwenden lokale Speichertechnologien (LocalStorage), um den Betrieb der Plattform, Ihre Sicherheit und den gesetzlichen Jugendschutz (§ 22 JArbSchG) zu gewährleisten. Sie können freiwillige Speicherungen ablehnen.
            </div>
          </div>
        </div>

        <!-- Equal Prominence Buttons (No Dark Pattern) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 0.5rem;">
          <button id="btn-consent-reject-all" class="btn btn-outline" style="font-size: 0.82rem; font-weight: 700; padding: 0.65rem; border: 1.5px solid #cbd5e1; color: #334155; background: #fff;">
            Alle ablehnen
          </button>
          <button id="btn-consent-accept-all" class="btn btn-primary" style="font-size: 0.82rem; font-weight: 700; padding: 0.65rem;">
            Alle akzeptieren
          </button>
        </div>

        <div style="text-align: center;">
          <button id="btn-consent-open-details" class="btn btn-link" style="font-size: 0.75rem; color: #6366f1; text-decoration: underline; padding: 0.2rem;">
            Einstellungen individuell anpassen
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachConsentBannerEvents() {
  const rejectBtn = document.getElementById('btn-consent-reject-all');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      ConsentManager.rejectOptional();
      store.setState({ isConsentModalOpen: false });
      store.showToast('✓ Nur technisch notwendige Speicherungen aktiv (§ 25 Abs. 2 TDDDG).');
    });
  }

  const acceptAllBtn = document.getElementById('btn-consent-accept-all');
  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', () => {
      ConsentManager.acceptAll();
      store.setState({ isConsentModalOpen: false });
      store.showToast('✓ Alle Speicherpräferenzen akzeptiert.');
    });
  }

  const openDetailsBtn = document.getElementById('btn-consent-open-details');
  if (openDetailsBtn) {
    openDetailsBtn.addEventListener('click', () => {
      store.setState({ isConsentModalOpen: true });
    });
  }

  const closeModalBtn = document.getElementById('btn-close-consent-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      store.setState({ isConsentModalOpen: false });
    });
  }

  const saveSelectionBtn = document.getElementById('btn-consent-save-selection');
  if (saveSelectionBtn) {
    saveSelectionBtn.addEventListener('click', () => {
      const prefChecked = document.getElementById('consent-check-preferences')?.checked;
      const analyticsChecked = document.getElementById('consent-check-analytics')?.checked;
      ConsentManager.saveConsent({
        functional_preferences: prefChecked,
        anonymous_analytics: analyticsChecked
      });
      store.setState({ isConsentModalOpen: false });
      store.showToast('✓ Individuelle Speicherpräferenzen gespeichert.');
    });
  }

  const acceptAllModalBtn = document.getElementById('btn-consent-accept-all-modal');
  if (acceptAllModalBtn) {
    acceptAllModalBtn.addEventListener('click', () => {
      ConsentManager.acceptAll();
      store.setState({ isConsentModalOpen: false });
      store.showToast('✓ Alle Speicherpräferenzen akzeptiert.');
    });
  }
}
