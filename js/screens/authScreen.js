/**
 * QuickJob Dedicated Authentication & Account Management Screen
 * Supports Login, Registration (with explicit un-preselected AGB acceptance),
 * Forgot Password, Password Reset, and Email Verification.
 */
import { store } from '../state/store.js';

export function renderAuthScreen(state) {
  const mode = state.authViewMode || 'login'; // 'login' | 'register' | 'forgot_password' | 'reset_password' | 'verify_email'

  return `
    <div class="auth-screen-container" style="padding: 1.25rem 1rem; max-width: 480px; margin: 0 auto;">
      <!-- Auth Card Shell -->
      <div style="background: #ffffff; border: 1.5px solid var(--qj-border, #e2e8f0); border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
        
        <!-- Brand Header -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="font-size: 2.2rem; line-height: 1; margin-bottom: 0.35rem;">⚡</div>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">
            ${mode === 'login' ? 'Willkommen zurück' :
              mode === 'register' ? 'Konto erstellen' :
              mode === 'forgot_password' ? 'Passwort vergessen?' :
              mode === 'reset_password' ? 'Neues Passwort festlegen' :
              'E-Mail bestätigen'}
          </h2>
          <p style="font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0 0;">
            ${mode === 'login' ? 'Melden Sie sich an, um Microjobs auszuführen oder zu inserieren.' :
              mode === 'register' ? 'Registrieren Sie sich für sichere Nachbarschaftshilfe.' :
              mode === 'forgot_password' ? 'Geben Sie Ihre E-Mail-Adresse ein für einen sicheren Reset-Link.' :
              mode === 'reset_password' ? 'Wählen Sie ein neues, sicheres Passwort.' :
              'Bestätigen Sie Ihre E-Mail-Adresse zur vollständigen Kontoaktivierung.'}
          </p>
        </div>

        <!-- MODE 1: LOGIN -->
        ${mode === 'login' ? `
          <form id="form-auth-login" style="display: flex; flex-direction: column; gap: 0.85rem;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                E-Mail-Adresse
              </label>
              <input type="email" id="login-email" class="form-input" placeholder="name@beispiel.de" required style="width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem;" />
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <label style="font-size: 0.78rem; font-weight: 700; color: #334155;">
                  Passwort
                </label>
                <button type="button" id="btn-to-forgot-password" class="btn btn-link" style="font-size: 0.74rem; color: #6366f1; text-decoration: underline; padding: 0;">
                  Passwort vergessen?
                </button>
              </div>
              <input type="password" id="login-password" class="form-input" placeholder="••••••••" required style="width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem;" />
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.1rem;">
              <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: #475569; cursor: pointer;">
                <input type="checkbox" id="login-remember" checked />
                <span>Angemeldet bleiben</span>
              </label>
            </div>

            <button type="submit" id="btn-auth-submit-login" class="btn btn-primary" style="font-weight: 700; padding: 0.75rem; margin-top: 0.35rem; width: 100%;">
              Anmelden
            </button>
          </form>

          <!-- Quick Persona Pills for Tester Convenience -->
          <div style="margin-top: 1.25rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; text-align: center;">
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; color: #94a3b8; margin-bottom: 0.5rem;">
              Test-Zugangsdaten (1-Klick)
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center;">
              <button class="btn btn-outline btn-sm btn-quick-login" data-email="jasper@quickjob.local" style="font-size: 0.72rem; padding: 0.3rem 0.5rem;">
                Jasper (16 J.)
              </button>
              <button class="btn btn-outline btn-sm btn-quick-login" data-email="sophia@quickjob.local" style="font-size: 0.72rem; padding: 0.3rem 0.5rem;">
                Sophia (22 J.)
              </button>
              <button class="btn btn-outline btn-sm btn-quick-login" data-email="marcus@quickjob.local" style="font-size: 0.72rem; padding: 0.3rem 0.5rem;">
                Dr. Marcus (48 J.)
              </button>
              <button class="btn btn-outline btn-sm btn-quick-login" data-email="admin@quickjob.local" style="font-size: 0.72rem; padding: 0.3rem 0.5rem; background: #fef2f2; border-color: #fca5a5; color: #991b1b; font-weight: 700;">
                🛡️ Admin
              </button>
            </div>
          </div>

          <!-- Switch to Register -->
          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.8rem; color: #64748b;">
            Noch kein Konto? 
            <button id="btn-to-register" class="btn btn-link" style="font-size: 0.8rem; font-weight: 700; color: #6366f1; text-decoration: underline; padding: 0 0 0 0.25rem;">
              Jetzt kostenlos registrieren
            </button>
          </div>
        ` : ''}

        <!-- MODE 2: REGISTER -->
        ${mode === 'register' ? `
          <form id="form-auth-register" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.8rem;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                Vollständiger Name *
              </label>
              <input type="text" id="reg-name" class="form-input" placeholder="z. B. Max Mustermann" required style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>

            <!-- Profile Picture (Avatar) Setup during Registration -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.7rem;">
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                Profilbild (optional)
              </label>
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div 
                  id="reg-avatar-preview" 
                  style="width: 52px; height: 52px; border-radius: 50%; background: #ffffff; border: 2px dashed #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; overflow: hidden; cursor: pointer; flex-shrink: 0;"
                  title="Bild auswählen"
                >
                  📷
                </div>
                <div style="flex: 1;">
                  <label for="reg-avatar-input" class="btn btn-outline btn-sm" style="cursor: pointer; font-size: 0.75rem; padding: 0.3rem 0.6rem; display: inline-flex; align-items: center; gap: 4px;">
                    <span>📁</span> Bild auswählen
                  </label>
                  <input type="file" id="reg-avatar-input" accept="image/*" style="display: none;" />
                  <div style="font-size: 0.68rem; color: #64748b; margin-top: 3px; line-height: 1.3;">
                    JPG, PNG oder WebP. Wenn keines gewählt wird, zeigt QuickJob deinen ersten Buchstaben.
                  </div>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                  Alter *
                </label>
                <input type="number" id="reg-age" min="10" max="99" class="form-input" placeholder="z. B. 16" required style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                  Hauptrolle *
                </label>
                <select id="reg-role" class="form-input" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;">
                  <option value="worker">Helfer (Jobs ausführen)</option>
                  <option value="employer">Auftraggeber (Jobs inserieren)</option>
                </select>
              </div>
            </div>

            <div id="reg-age-feedback" style="font-size: 0.72rem; padding: 0.4rem 0.6rem; border-radius: 6px; display: none;"></div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                E-Mail-Adresse *
              </label>
              <input type="email" id="reg-email" class="form-input" placeholder="ihre.email@beispiel.de" required style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                Passwort * (mind. 8 Zeichen, Buchstabe + Ziffer/Sonderzeichen)
              </label>
              <input type="password" id="reg-password" class="form-input" placeholder="Mindestens 8 Zeichen" required style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                Passwort bestätigen *
              </label>
              <input type="password" id="reg-password-confirm" class="form-input" placeholder="Passwort wiederholen" required style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>

            <!-- Ausweis-Verifikation (ID/KYC) Block -->
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;" id="reg-id-card-section">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 0.78rem; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 0.35rem;">
                  <span>🪪</span>
                  <span id="reg-id-title">Ausweis-Verifikation</span>
                </label>
                <span class="badge badge-info" id="reg-id-badge" style="font-size: 0.68rem;">
                  Pflicht für Helfer
                </span>
              </div>

              <!-- Required Notice Text -->
              <div id="reg-id-notice" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.65rem; font-size: 0.73rem; color: #1e40af; line-height: 1.45;">
                <strong>Als Helfer (Arbeitnehmer) ist eine Ausweisprüfung nach deutschem Recht erforderlich.</strong> Du kannst deinen Ausweis direkt hier hochladen oder die Registrierung abschließen und deinen Ausweis jederzeit später in den Profileinstellungen hinzufügen.
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
                <select id="reg-id-type" class="form-input" style="padding: 0.5rem; font-size: 0.78rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                  <option value="personalausweis">Personalausweis</option>
                  <option value="schuelerausweis">Schülerausweis</option>
                  <option value="reisepass">Reisepass</option>
                </select>
                <input 
                  type="text" 
                  id="reg-id-number" 
                  placeholder="Ausweis- / Schülernummer (optional)" 
                  class="form-input" 
                  style="padding: 0.5rem; font-size: 0.78rem; border-radius: 6px; border: 1px solid #cbd5e1;" 
                />
              </div>
            </div>

            <!-- Mandatory Un-preselected AGB Checkbox (§ 305 Abs. 2 BGB) -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; margin-top: 0.2rem;">
              <label style="display: flex; align-items: flex-start; gap: 0.55rem; cursor: pointer;">
                <input type="checkbox" id="reg-check-agb" style="margin-top: 0.2rem; transform: scale(1.15);" />
                <span style="font-size: 0.76rem; color: #1e293b; line-height: 1.45;">
                  Ich habe die <button type="button" class="btn-link" id="link-read-agb" style="padding: 0; font-weight: 700; color: #6366f1; text-decoration: underline;">AGB (Version 1.1.0)</button> sowie die <button type="button" class="btn-link" id="link-read-privacy" style="padding: 0; font-weight: 700; color: #6366f1; text-decoration: underline;">Datenschutzerklärung</button> zur Kenntnis genommen und stimme ihnen verbindlich zu. *
                </span>
              </label>
            </div>

            <button type="submit" id="btn-auth-submit-register" class="btn btn-primary" style="font-weight: 700; padding: 0.75rem; margin-top: 0.35rem; width: 100%;">
              Konto verbindlich registrieren
            </button>
          </form>

          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.8rem; color: #64748b;">
            Bereits registriert? 
            <button id="btn-to-login" class="btn btn-link" style="font-size: 0.8rem; font-weight: 700; color: #6366f1; text-decoration: underline; padding: 0 0 0 0.25rem;">
              Hier anmelden
            </button>
          </div>
        ` : ''}

        <!-- MODE 3: FORGOT PASSWORD -->
        ${mode === 'forgot_password' ? `
          <form id="form-auth-forgot" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.85rem;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                Registrierte E-Mail-Adresse
              </label>
              <input type="email" id="forgot-email" class="form-input" placeholder="ihre.email@beispiel.de" required style="width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem;" />
            </div>

            <button type="submit" id="btn-auth-submit-forgot" class="btn btn-primary" style="font-weight: 700; padding: 0.75rem; width: 100%;">
              Reset-Link anfordern
            </button>
          </form>

          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.8rem; color: #64748b;">
            <button id="btn-to-login-from-forgot" class="btn btn-link" style="font-size: 0.8rem; font-weight: 700; color: #6366f1; text-decoration: underline; padding: 0;">
              ← Zurück zur Anmeldung
            </button>
          </div>
        ` : ''}

        <!-- MODE 4: RESET PASSWORD -->
        ${mode === 'reset_password' ? `
          <form id="form-auth-reset" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.85rem;">
            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                Sicherheits-Token
              </label>
              <input type="text" id="reset-token" class="form-input" value="${state.authPendingToken || ''}" placeholder="Aus dem E-Mail-Link" required style="width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                Neues Passwort *
              </label>
              <input type="password" id="reset-new-password" class="form-input" placeholder="Mindestens 8 Zeichen" required style="width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                Neues Passwort bestätigen *
              </label>
              <input type="password" id="reset-new-password-confirm" class="form-input" placeholder="Wiederholen" required style="width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
            </div>

            <button type="submit" id="btn-auth-submit-reset" class="btn btn-primary" style="font-weight: 700; padding: 0.75rem; width: 100%;">
              Passwort speichern & Sitzungen beenden
            </button>
          </form>

          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.8rem; color: #64748b;">
            <button id="btn-to-login-from-reset" class="btn btn-link" style="font-size: 0.8rem; font-weight: 700; color: #6366f1; text-decoration: underline; padding: 0;">
              ← Zurück zur Anmeldung
            </button>
          </div>
        ` : ''}

        <!-- MODE 5: VERIFY EMAIL -->
        ${mode === 'verify_email' ? `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 0.9rem; font-size: 0.82rem; color: #166534; line-height: 1.45;">
              ✉️ Bitte geben Sie den Verifizierungs-Token aus Ihrer Bestätigungs-E-Mail ein oder klicken Sie direkt auf den Link in der E-Mail.
            </div>

            <form id="form-auth-verify" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.85rem;">
              <div>
                <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">
                  Verifizierungs-Token
                </label>
                <input type="text" id="verify-token-input" class="form-input" value="${state.authPendingToken || ''}" placeholder="Token einfügen..." required style="width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem;" />
              </div>

              <button type="submit" id="btn-auth-submit-verify" class="btn btn-primary" style="font-weight: 700; padding: 0.75rem; width: 100%;">
                E-Mail jetzt bestätigen
              </button>
            </form>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 0.85rem; text-align: center;">
              <p style="font-size: 0.76rem; color: #64748b; margin-bottom: 0.5rem;">
                Keine E-Mail erhalten?
              </p>
              <div style="display: flex; gap: 0.5rem;">
                <input type="email" id="resend-email-input" class="form-input" placeholder="Ihre E-Mail..." style="flex: 1; padding: 0.5rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1;" />
                <button type="button" id="btn-auth-resend-email" class="btn btn-outline btn-sm" style="font-weight: 700;">
                  Erneut senden
                </button>
              </div>
            </div>

            <div style="text-align: center; margin-top: 0.5rem;">
              <button id="btn-to-login-from-verify" class="btn btn-link" style="font-size: 0.8rem; font-weight: 700; color: #6366f1; text-decoration: underline; padding: 0;">
                ← Zurück zur Anmeldung
              </button>
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;
}

export function attachAuthScreenEvents() {
  // Navigation between modes
  document.getElementById('btn-to-register')?.addEventListener('click', () => {
    store.setAuthMode('register');
  });
  document.getElementById('btn-to-login')?.addEventListener('click', () => {
    store.setAuthMode('login');
  });
  document.getElementById('btn-to-forgot-password')?.addEventListener('click', () => {
    store.setAuthMode('forgot_password');
  });
  document.getElementById('btn-to-login-from-forgot')?.addEventListener('click', () => {
    store.setAuthMode('login');
  });
  document.getElementById('btn-to-login-from-reset')?.addEventListener('click', () => {
    store.setAuthMode('login');
  });
  document.getElementById('btn-to-login-from-verify')?.addEventListener('click', () => {
    store.setAuthMode('login');
  });

  // Read AGB & Privacy links inside registration form
  document.getElementById('link-read-agb')?.addEventListener('click', (e) => {
    e.preventDefault();
    store.openLegalDoc('AGB');
  });
  document.getElementById('link-read-privacy')?.addEventListener('click', (e) => {
    e.preventDefault();
    store.openLegalDoc('PRIVACY');
  });

  // 1-Click tester login pills
  const quickPills = document.querySelectorAll('.btn-quick-login');
  quickPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      const email = e.currentTarget.getAttribute('data-email');
      const emailInput = document.getElementById('login-email');
      const pwInput = document.getElementById('login-password');
      if (emailInput && pwInput) {
        emailInput.value = email;
        pwInput.value = 'Password123!';
      }
    });
  });

  // Dynamic age feedback during registration
  const ageInput = document.getElementById('reg-age');
  const ageFeedback = document.getElementById('reg-age-feedback');
  if (ageInput && ageFeedback) {
    ageInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (isNaN(val)) {
        ageFeedback.style.display = 'none';
        return;
      }
      ageFeedback.style.display = 'block';
      if (val < 13) {
        ageFeedback.style.background = '#fef2f2';
        ageFeedback.style.color = '#dc2626';
        ageFeedback.style.border = '1px solid #fecaca';
        ageFeedback.innerText = '⚠️ Unter 13 Jahren: Erwerbstätigkeit nach § 5 Abs. 1 JArbSchG gesetzlich unzulässig.';
      } else if (val <= 14) {
        ageFeedback.style.background = '#faf5ff';
        ageFeedback.style.color = '#7e22ce';
        ageFeedback.style.border = '1px solid #e9d5ff';
        ageFeedback.innerText = '🛡️ 13–14 Jahre: KindArbSchV erlaubt leichte Tätigkeiten bis max. 2 Std./Tag mit Elterneinwilligung.';
      } else if (val <= 17) {
        ageFeedback.style.background = '#f5f3ff';
        ageFeedback.style.color = '#5b21b6';
        ageFeedback.style.border = '1px solid #ddd6fe';
        ageFeedback.innerText = '⚡ 15–17 Jahre: Jugendlicher gem. JArbSchG (Arbeitszeit max. 8 Std./Tag, keine gefährlichen Arbeiten).';
      } else {
        ageFeedback.style.background = '#f0fdf4';
        ageFeedback.style.color = '#15803d';
        ageFeedback.style.border = '1px solid #bbf7d0';
        ageFeedback.innerText = '✓ Volljährig: Uneingeschränkte Vertrags- und Erwerbsfähigkeit.';
      }
    });
  }

  // Dynamic role-based ID notice
  const roleSelect = document.getElementById('reg-role');
  const idBadge = document.getElementById('reg-id-badge');
  const idNotice = document.getElementById('reg-id-notice');
  if (roleSelect && idBadge && idNotice) {
    roleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'employer') {
        idBadge.className = 'badge badge-muted';
        idBadge.innerText = 'Optional für Auftraggeber';
        idNotice.style.background = '#f8fafc';
        idNotice.style.borderColor = '#e2e8f0';
        idNotice.style.color = '#475569';
        idNotice.innerHTML = '<strong>Ausweis-Upload (optional für Auftraggeber):</strong> Für Auftraggeber ist der Ausweis freiwillig. Verifizierte Profile erhalten ein Vertrauensabzeichen. Du kannst deinen Ausweis jederzeit in den Einstellungen hinzufügen.';
      } else {
        idBadge.className = 'badge badge-info';
        idBadge.innerText = 'Pflicht für Helfer';
        idNotice.style.background = '#eff6ff';
        idNotice.style.borderColor = '#bfdbfe';
        idNotice.style.color = '#1e40af';
        idNotice.innerHTML = '<strong>Als Helfer (Arbeitnehmer) ist eine Ausweisprüfung nach deutschem Recht erforderlich.</strong> Du kannst deinen Ausweis direkt hier hochladen oder die Registrierung abschließen und deinen Ausweis jederzeit später in den Profileinstellungen hinzufügen.';
      }
    });
  }

  // Handle Login submission
  const loginForm = document.getElementById('form-auth-login');
  const loginBtn = document.getElementById('btn-auth-submit-login');
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const remember = document.getElementById('login-remember')?.checked;
    await store.loginUser(email, password, remember);
  };
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLoginSubmit);
  }

  // Handle Register avatar upload preview
  let currentRegAvatarDataUrl = null;
  const avatarInput = document.getElementById('reg-avatar-input');
  const avatarPreview = document.getElementById('reg-avatar-preview');
  if (avatarInput && avatarPreview) {
    avatarPreview.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          currentRegAvatarDataUrl = evt.target.result;
          avatarPreview.innerHTML = `<img src="${currentRegAvatarDataUrl}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
          avatarPreview.style.border = '2px solid #0ea76b';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle Register submission
  const registerForm = document.getElementById('form-auth-register');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name')?.value;
      const age = document.getElementById('reg-age')?.value;
      const role = document.getElementById('reg-role')?.value;
      const email = document.getElementById('reg-email')?.value;
      const password = document.getElementById('reg-password')?.value;
      const confirm = document.getElementById('reg-password-confirm')?.value;
      const agbAccepted = document.getElementById('reg-check-agb')?.checked;

      if (!agbAccepted) {
        store.showToast('Bitte stimmen Sie den AGB verbindlich zu, um fortzufahren.', 'error');
        return;
      }

      await store.registerUser({
        name,
        age,
        role,
        email,
        password,
        password_confirmation: confirm,
        agb_accepted: agbAccepted,
        agb_version: '1.1.0',
        avatarUrl: currentRegAvatarDataUrl
      });
    });
  }

  // Handle Forgot Password submission
  const forgotForm = document.getElementById('form-auth-forgot');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email')?.value;
      await store.forgotPassword(email);
    });
  }

  // Handle Reset Password submission
  const resetForm = document.getElementById('form-auth-reset');
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('reset-token')?.value;
      const new_password = document.getElementById('reset-new-password')?.value;
      const confirm = document.getElementById('reset-new-password-confirm')?.value;
      await store.resetPassword(token, new_password, confirm);
    });
  }

  // Handle Email Verification submission
  const verifyForm = document.getElementById('form-auth-verify');
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('verify-token-input')?.value;
      await store.verifyEmail(token);
    });
  }

  // Resend verification button
  const resendBtn = document.getElementById('btn-auth-resend-email');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const email = document.getElementById('resend-email-input')?.value;
      if (!email) {
        store.showToast('Bitte geben Sie Ihre E-Mail-Adresse ein.', 'error');
        return;
      }
      await store.resendVerification(email);
    });
  }
}
