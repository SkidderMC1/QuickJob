/**
 * QuickJob Guardian Consent & Authorization Modal (BGB §§ 107, 113)
 * Provides minors and legal guardians an auditable, verifiable consent portal.
 */
import { GuardianConsentManager } from '../legal/guardianConsent.js';
import { store } from '../state/store.js';

export function renderGuardianModal(state) {
  if (!state.isGuardianModalOpen) return '';

  const user = state.currentUser;
  const isMinor = user && user.age && user.age < 18;
  const existingConsent = user?.guardianConsent;
  const isActive = Boolean(existingConsent && existingConsent.status === 'ACTIVE');

  return `
    <div class="modal-backdrop" id="guardian-modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div class="modal-card" style="background: #fff; width: 100%; max-width: 540px; max-height: 88vh; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.25);">
        
        <!-- Header -->
        <div style="padding: 1.25rem; border-bottom: 1px solid #e2e8f0; background: #faf5ff; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.4rem;">👨‍👩‍👧</span>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #581c87;">
                Eltern-Einwilligung & Jugendschutz
              </h3>
              <div style="font-size: 0.72rem; color: #7e22ce; font-weight: 600;">
                Gemäß §§ 107, 113 BGB & KindArbSchV / JArbSchG
              </div>
            </div>
          </div>
          <button id="btn-close-guardian-modal" class="btn btn-ghost" style="font-size: 1.35rem; padding: 0.25rem; line-height: 1;">✕</button>
        </div>

        <!-- Body -->
        <div style="flex: 1; padding: 1.25rem; overflow-y: auto;">
          ${isActive ? `
            <!-- Currently Active Authorization Summary -->
            <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 1rem; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.85rem; font-weight: 800; color: #166534; display: flex; align-items: center; gap: 0.35rem;">
                  <span>✓</span><span>Einwilligung aktiv & verifiziert</span>
                </span>
                <span class="badge badge-success" style="font-size: 0.72rem; font-weight: 700;">Gültig</span>
              </div>
              <div style="font-size: 0.8rem; color: #15803d; line-height: 1.5;">
                <strong>Personensorgeberechtigte(r):</strong> ${escapeHTML(existingConsent.guardianName)} (${existingConsent.relationship})<br />
                <strong>E-Mail:</strong> ${escapeHTML(existingConsent.guardianEmail)}<br />
                <strong>Zulässige Höchstarbeitszeit:</strong> max. ${existingConsent.maxWeeklyHours} Std./Woche<br />
                <strong>Signatur-Prüfcode:</strong> <code style="background: #dcfce7; padding: 2px 5px; border-radius: 4px;">${existingConsent.signatureVerificationCode}</code><br />
                <strong>Erteilt am:</strong> ${new Date(existingConsent.authorizedAt).toLocaleDateString('de-DE')}
              </div>
            </div>

            <p style="font-size: 0.8rem; color: #64748b; line-height: 1.45; margin-bottom: 1rem;">
              Die Personensorgeberechtigten haben das Recht, diese Ermächtigung nach § 113 BGB und die datenschutzrechtliche Einwilligung nach Art. 8 DSGVO jederzeit mit Wirkung für die Zukunft zu widerrufen.
            </p>

            <button id="btn-revoke-guardian-consent" class="btn btn-outline" style="border-color: #fca5a5; color: #dc2626; width: 100%; font-size: 0.8rem; font-weight: 700; padding: 0.6rem;">
              Einwilligung widerrufen (§ 113 BGB)
            </button>
          ` : `
            <!-- Form to Request / Submit Digital Consent -->
            <p style="font-size: 0.82rem; color: #475569; line-height: 1.5; margin-bottom: 1rem;">
              Nach deutschem Zivil- und Jugendarbeitsschutzrecht (§§ 107, 113 BGB) benötigen Minderjährige unter 18 Jahren für die Annahme von Microjobs die ausdrückliche Einwilligung der Personensorgeberechtigten.
            </p>

            <form id="form-guardian-consent" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div>
                <label style="display: block; font-size: 0.76rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                  Vollständiger Name des/der Erziehungsberechtigten *
                </label>
                <input type="text" id="input-guardian-name" class="form-input" placeholder="z. B. Sabine Klein" required style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div>
                  <label style="display: block; font-size: 0.76rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                    Verhältnis *
                  </label>
                  <select id="select-guardian-relation" class="form-input" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                    <option value="Mutter">Mutter</option>
                    <option value="Vater">Vater</option>
                    <option value="Gesetzlicher Vormund">Gesetzlicher Vormund</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.76rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                    E-Mail-Adresse *
                  </label>
                  <input type="email" id="input-guardian-email" class="form-input" placeholder="eltern@beispiel.de" required style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 0.76rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                  Telefonnummer für Rückfragen (optional)
                </label>
                <input type="tel" id="input-guardian-phone" class="form-input" placeholder="+49 170 1234567" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
              </div>

              <!-- Statutory Confirmation Checkbox -->
              <div style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 10px; padding: 0.75rem; margin-top: 0.25rem;">
                <label style="display: flex; align-items: flex-start; gap: 0.55rem; cursor: pointer;">
                  <input type="checkbox" id="check-guardian-statutory" style="margin-top: 0.2rem; transform: scale(1.15);" />
                  <span style="font-size: 0.76rem; color: #701a75; line-height: 1.4; font-weight: 600;">
                    Hiermit ermächtige(n) ich/wir den/die Minderjährige(n) zur Annahme leichter, jugendkonformer Nachbarschafts-Microjobs gemäß § 113 BGB und erteile(n) die datenschutzrechtliche Zustimmung gemäß Art. 8 DSGVO.
                  </span>
                </label>
              </div>

              <button id="btn-submit-guardian-consent" class="btn btn-primary" style="background: #7e22ce; border-color: #6b21a8; font-weight: 700; padding: 0.75rem; margin-top: 0.5rem; width: 100%;">
                Digitale Ermächtigung jetzt verifizieren & erteilen
              </button>
            </form>
          `}
        </div>

        <div style="padding: 0.85rem 1.25rem; border-top: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
          <span style="font-size: 0.72rem; color: #64748b;">
            Verifizierte Einwilligungen werden manipulationssicher in der Compliance-Historie archiviert.
          </span>
        </div>
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

export function attachGuardianModalEvents() {
  const closeBtn = document.getElementById('btn-close-guardian-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      store.setState({ isGuardianModalOpen: false });
    });
  }

  const submitBtn = document.getElementById('btn-submit-guardian-consent');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const name = document.getElementById('input-guardian-name')?.value;
      const email = document.getElementById('input-guardian-email')?.value;
      const relation = document.getElementById('select-guardian-relation')?.value;
      const phone = document.getElementById('input-guardian-phone')?.value;
      const checked = document.getElementById('check-guardian-statutory')?.checked;

      if (!name || !name.trim()) {
        store.showToast('Bitte Namen der Erziehungsberechtigten angeben.', 'error');
        return;
      }
      if (!email || !email.includes('@')) {
        store.showToast('Bitte gültige E-Mail-Adresse angeben.', 'error');
        return;
      }
      if (!checked) {
        store.showToast('Bitte bestätigen Sie die rechtliche Erklärung (§ 113 BGB).', 'error');
        return;
      }

      store.recordGuardianConsent({
        guardianName: name,
        guardianEmail: email,
        relationship: relation,
        guardianPhone: phone
      });
    });
  }

  const revokeBtn = document.getElementById('btn-revoke-guardian-consent');
  if (revokeBtn) {
    revokeBtn.addEventListener('click', () => {
      store.revokeGuardianConsent();
    });
  }
}
