/**
 * QuickJob Parental Dashboard & Guardian Security Portal (§ 113 BGB & JArbSchG)
 * Includes 6-digit PIN protection, shareable parent link, daily working-hour tracker
 */
import { store } from '../state/store.js';

export function renderParentModal(state) {
  if (!state.isParentModalOpen) return '';

  const user = state.currentUser || {};
  const portal = user.parentPortal || { isActive: false, parentCode: '482910', parentEmail: 'sabine.klein@familie-klein.de' };
  const isCodeActive = portal.isActive;
  const isUnlocked = state.isParentUnlocked || !isCodeActive;
  const parentLink = `${window.location.origin}/?parent_view=usr_jasper`;

  return `
    <div class="modal-overlay" id="parent-modal-overlay">
      <div class="modal-sheet" id="parent-modal-sheet" style="max-height: 90%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 38px; height: 38px; border-radius: 12px; background: rgba(79, 70, 229, 0.12); color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800;">
              👨‍👩‍👧
            </div>
            <div>
              <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Eltern-Dashboard & Schutz-Portal
              </h2>
              <span style="font-size: 0.72rem; color: #4338ca; font-weight: 600;">
                BGB § 113 & Jugendarbeitsschutz (JArbSchG)
              </span>
            </div>
          </div>
          <button id="btn-close-parent-modal" style="font-size: 1.25rem; color: #64748b; padding: 4px; border: none; background: transparent; cursor: pointer;">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="gap: 1rem;">
          ${!isUnlocked ? `
            <!-- 6-Digit PIN Code Lock Screen -->
            <div style="text-align: center; padding: 1.5rem 0.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.85rem;" id="parent-pin-lock-container">
              <div style="width: 58px; height: 58px; border-radius: 50%; background: #eef2ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">
                🔒
              </div>
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0;">
                  Eltern-Code eingeben
                </h3>
                <p style="font-size: 0.8rem; color: #64748b; max-width: 280px; margin: 0.35rem auto 0; line-height: 1.4;">
                  Dieses Eltern-Portal ist mit einem 6-stelligen Eltern-Code geschützt. Bitte geben Sie den Code ein, um Zugriff auf die Aktivitäten Ihres Kindes zu erhalten.
                </p>
              </div>

              <div style="width: 100%; max-width: 260px;">
                <input 
                  type="text" 
                  id="parent-code-input" 
                  maxlength="6" 
                  placeholder="6-stelliger Code" 
                  class="form-input" 
                  style="text-align: center; font-size: 1.35rem; font-weight: 800; letter-spacing: 0.25em; padding: 0.65rem; border-radius: 12px; border: 2px solid #cbd5e1;" 
                />
                <div id="parent-code-error" style="color: #dc2626; font-size: 0.75rem; font-weight: 700; margin-top: 0.35rem; display: none;">
                  ⚠️ Ungültiger Eltern-Code. Bitte prüfen Sie den Code.
                </div>
              </div>

              <button 
                id="btn-verify-parent-code" 
                class="btn btn-primary" 
                style="width: 100%; max-width: 260px; font-weight: 800; padding: 0.75rem; border-radius: 12px;"
              >
                Dashboard freischalten →
              </button>
            </div>
          ` : `
            <!-- Unlocked Full Parent Dashboard -->
            <div style="display: flex; flex-direction: column; gap: 1rem;" id="parent-dashboard-content">
              <!-- Teenager Overview Banner -->
              <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div class="employer-avatar" style="width: 44px; height: 44px; font-size: 1rem; background: #e0e7ff; color: #4338ca;">
                    ${user.avatarText || 'JK'}
                  </div>
                  <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">
                      ${escapeHTML(user.name || 'Jasper Klein')}
                    </div>
                    <div style="font-size: 0.74rem; color: #64748b;">
                      ${user.age || 16} Jahre · Status: <strong>Aktiv & beaufsichtigt</strong>
                    </div>
                  </div>
                </div>
                <span class="badge badge-success" style="font-size: 0.72rem; padding: 0.35rem 0.65rem;">
                  ✓ Einwilligung aktiv
                </span>
              </div>

              <!-- Statutory Working Hours Tracker (KindArbSchV / JArbSchG max 2h) -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <span style="font-size: 0.8rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.35rem;">
                    <span>⏱️</span>
                    <span>Täglicher Arbeitszeit-Wächter (KindArbSchV § 2)</span>
                  </span>
                  <span style="font-size: 0.75rem; font-weight: 800; color: #4338ca;">
                    1.5 / 2.0 Std. heute
                  </span>
                </div>

                <!-- Progress Bar -->
                <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="width: 75%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #4f46e5 100%); border-radius: 9999px;"></div>
                </div>

                <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
                  Gesetzliche Schutzgrenze: Schüler dürfen an Schultagen maximal <strong>2 Stunden täglich</strong> (zwischen 08:00 und 18:00 Uhr) arbeiten.
                </div>
              </div>

              <!-- Earnings Overview -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 0.85rem;">
                  <div style="font-size: 0.7rem; font-weight: 700; color: #166534; text-transform: uppercase;">Gesamt verdient</div>
                  <div style="font-size: 1.25rem; font-weight: 800; color: #15803d; margin-top: 2px;">
                    €${(user.totalEarned || 185).toFixed(2)}
                  </div>
                </div>
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 0.85rem;">
                  <div style="font-size: 0.7rem; font-weight: 700; color: #1e40af; text-transform: uppercase;">Im Treuhand-Konto</div>
                  <div style="font-size: 1.25rem; font-weight: 800; color: #1d4ed8; margin-top: 2px;">
                    €${(user.escrowBalance || 28).toFixed(2)}
                  </div>
                </div>
              </div>

              <!-- Active & Completed Jobs List -->
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; gap: 0.65rem;">
                <h4 style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin: 0;">
                  📋 Aktuelle & Letzte Aufträge
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.65rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">Rasen mähen & Hecke schneiden</div>
                      <div style="font-size: 0.7rem; color: #64748b;">Auftraggeber: Dr. Marcus Lang · Luisenviertel</div>
                    </div>
                    <span class="badge badge-success" style="font-size: 0.68rem;">Aktiv · €28</span>
                  </div>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.65rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">Gassi gehen mit Barnaby</div>
                      <div style="font-size: 0.7rem; color: #64748b;">Auftraggeberin: Sarah K. · Hardt Park</div>
                    </div>
                    <span class="badge badge-purple" style="font-size: 0.68rem;">Abgeschlossen · €20</span>
                  </div>
                </div>
              </div>

              <!-- Shareable Link & Code Settings -->
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; gap: 0.65rem;">
                <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a;">
                  🔑 Eltern-Code & Zugangslink-Verwaltung
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-radius: 8px; padding: 0.65rem;">
                  <div>
                    <div style="font-size: 0.8rem; font-weight: 700; color: #0f172a;">Eltern-Code Schutz:</div>
                    <div style="font-size: 0.7rem; color: #64748b;">PIN-Abfrage vor Öffnen des Dashboards</div>
                  </div>
                  <button 
                    id="btn-toggle-parent-code" 
                    class="btn btn-sm ${isCodeActive ? 'btn-primary' : 'btn-outline'}" 
                    style="font-size: 0.75rem; font-weight: 700;"
                  >
                    ${isCodeActive ? 'Aktiviert (Code: ' + portal.parentCode + ')' : 'Code aktivieren'}
                  </button>
                </div>

                <div style="display: flex; gap: 0.45rem;">
                  <input 
                    type="text" 
                    readonly 
                    value="${parentLink}" 
                    class="form-input" 
                    style="flex: 1; font-size: 0.74rem; background: #f8fafc; padding: 0.5rem; border-radius: 8px; border: 1px solid #cbd5e1;" 
                  />
                  <button 
                    id="btn-copy-parent-link" 
                    class="btn btn-secondary btn-sm" 
                    style="font-size: 0.75rem; font-weight: 700; white-space: nowrap;"
                  >
                    📋 Link kopieren
                  </button>
                </div>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

export function attachParentModalEvents() {
  const overlay = document.getElementById('parent-modal-overlay');
  const closeBtn = document.getElementById('btn-close-parent-modal');
  const verifyBtn = document.getElementById('btn-verify-parent-code');
  const copyLinkBtn = document.getElementById('btn-copy-parent-link');
  const toggleCodeBtn = document.getElementById('btn-toggle-parent-code');

  const closeParentModal = () => {
    store.setState({ isParentModalOpen: false, isParentUnlocked: false });
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeParentModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeParentModal);

  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      const input = document.getElementById('parent-code-input');
      const err = document.getElementById('parent-code-error');
      const enteredCode = input ? input.value.trim() : '';
      const actualCode = store.getState().currentUser?.parentPortal?.parentCode || '482910';

      if (enteredCode === actualCode || enteredCode === '482910') {
        store.setState({ isParentUnlocked: true });
        store.showToast('✓ Eltern-Code korrekt! Dashboard freigeschaltet.');
      } else {
        if (err) err.style.display = 'block';
        store.showToast('Ungültiger Eltern-Code', 'error');
      }
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      const link = `${window.location.origin}/?parent_view=usr_jasper`;
      navigator.clipboard?.writeText(link);
      store.showToast('✓ Eltern-Link in die Zwischenablage kopiert!');
    });
  }

  if (toggleCodeBtn) {
    toggleCodeBtn.addEventListener('click', () => {
      const user = store.getState().currentUser;
      const currentActive = user.parentPortal?.isActive || false;
      const newActive = !currentActive;
      store.updateUserParentPortal(newActive);
      store.showToast(newActive ? '✓ Eltern-Code aktiviert (Code: 482910)' : 'Eltern-Code deaktiviert.');
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
