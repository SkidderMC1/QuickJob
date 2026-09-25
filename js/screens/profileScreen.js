/**
 * QuickJob Profile Screen Component
 */
import { store } from '../state/store.js';
import { DefaultAchievements } from '../models/types.js';

export function renderProfileScreen(state) {
  const user = state.currentUser;
  const isMinor = user.ageCategory === 'YOUTH_14_17';
  const isEmployer = state.activeMode === 'post';
  const savedJobs = state.jobs.filter(j => j.isBookmarked);
  const achievements = user.achievements || DefaultAchievements;
  const isParentActive = user.parentPortal?.isActive || false;
  const parentCode = user.parentPortal?.parentCode || '482910';
  const parentLink = `https://quickjob.app/eltern/${user.id || 'jasper'}`;
  const completedJobs = state.jobs.filter(j => j.state === 'COMPLETED' || j.state === 'REVIEWED');
  const activeTheme = state.activeTheme || user.settings?.theme || 'light';
  const notifs = user.settings?.notifications || { newJobsNearMe: true, chatMessages: true, payouts: true };

  return `
    <div class="screen-container" id="screen-profile">
      <!-- Profile Header Card -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.25rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.9rem;">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <div style="position: relative; flex-shrink: 0;">
            ${(user.avatarUrl || user.profilePicture) ? `
              <img 
                src="${escapeHTML(user.avatarUrl || user.profilePicture)}" 
                alt="${escapeHTML(user.name)}" 
                id="profile-avatar-img"
                style="width: 62px; height: 62px; border-radius: 50%; object-fit: cover; border: 2.5px solid #0ea76b; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"
              />
            ` : `
              <div 
                id="profile-avatar-letter"
                style="width: 62px; height: 62px; border-radius: 50%; background: #0ea76b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 800; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(14, 167, 107, 0.25);"
              >
                ${(user.name || 'U').charAt(0).toUpperCase()}
              </div>
            `}
            <label 
              for="profile-avatar-file-input" 
              id="profile-avatar-change-btn" 
              style="position: absolute; bottom: -2px; right: -2px; width: 26px; height: 26px; border-radius: 50%; background: #ffffff; border: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15);" 
              title="Profilbild ändern"
            >
              📷
            </label>
            <input type="file" id="profile-avatar-file-input" accept="image/*" style="display: none;" />
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                ${escapeHTML(user.name)}
              </h2>
              ${user.isIdentityVerified ? '<span title="Ausweis verifiziert" style="color: #0ea76b; font-weight: 800; font-size: 1.15rem;">✓</span>' : ''}
              ${user.isCompany ? '<span title="Verified Company">🏢</span>' : ''}
              ${user.role === 'admin' ? '<span class="badge" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 0.7rem;">ADMINISTRATOR</span>' : ''}
            </div>
            <div style="font-size: 0.78rem; color: var(--qj-text-muted);">
              ${user.handle} · 📍 ${user.locationApprox || 'Wuppertal'}
            </div>
            <div style="margin-top: 4px; display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <span class="badge ${isMinor ? 'badge-purple' : 'badge-info'}" id="profile-age-category-badge">
                ${user.ageCategoryLabel}
              </span>
              ${user.isIdentityVerified ? '<span class="badge badge-success" id="profile-id-verified-badge" style="font-weight: 800; font-size: 0.74rem; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; display: inline-flex; align-items: center; gap: 3px;"><span>✓</span> Ausweis verifiziert</span>' : '<span class="badge badge-warning" id="profile-id-unverified-badge">Ausweis ausstehend</span>'}
              ${user.isCompany ? '<span class="badge badge-info">🏢 Registered</span>' : ''}
            </div>
          </div>
        </div>

        ${user.role === 'admin' ? `
          <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); color: #ffffff; border-radius: var(--qj-radius-lg); padding: 1rem 1.15rem; box-shadow: 0 4px 15px rgba(49, 46, 129, 0.25); display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.05em;">
                🛡️ QuickJob Administration
              </div>
              <div style="font-size: 1rem; font-weight: 800; margin-top: 2px;">
                Admin & Compliance Center
              </div>
              <div style="font-size: 0.72rem; color: #c7d2fe; margin-top: 2px;">
                Gemeldete Nutzer prüfen, Jugendschutz & Plattform-Statistiken
              </div>
            </div>
            <button class="btn btn-primary" id="btn-profile-to-admin" style="white-space: nowrap; font-weight: 800; font-size: 0.8rem; background: #6366f1; border: none; padding: 0.55rem 0.95rem;">
              Admin-Panel →
            </button>
          </div>
        ` : ''}

        <p style="font-size: 0.85rem; color: var(--qj-text-muted); line-height: 1.4;">
          ${escapeHTML(user.bio || 'Active QuickJob local microjob community member.')}
        </p>

        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; background: var(--qj-surface-muted); border-radius: var(--qj-radius-md); padding: 0.75rem 0.5rem; text-align: center;">
          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #d97706;">
              ★ ${user.rating || '5.0'}
            </div>
            <div style="font-size: 0.7rem; color: var(--qj-text-subtle); font-weight: 600;">
              ${user.ratingCount || 1} Reviews
            </div>
          </div>

          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--qj-primary);">
              ${user.completedJobs || 0}
            </div>
            <div style="font-size: 0.7rem; color: var(--qj-text-subtle); font-weight: 600;">
              Completed
            </div>
          </div>

          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--qj-text-main);">
              ${user.reliability || 98}%
            </div>
            <div style="font-size: 0.7rem; color: var(--qj-text-subtle); font-weight: 600;">
              Reliability
            </div>
          </div>

          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #eab308;" id="profile-saved-count-stat">
              ${savedJobs.length}
            </div>
            <div style="font-size: 0.7rem; color: var(--qj-text-subtle); font-weight: 600;">
              Gemerkt
            </div>
          </div>
        </div>
      </div>

      <!-- QuickJob FinTech Wallet & Escrow Balance Card -->
      <div class="wallet-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 0.74rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.35rem;">
              <span>💳</span>
              <span>QuickJob Wallet & Treuhand</span>
            </div>
            <div class="wallet-balance-num" style="margin-top: 2px;">
              €${(user.walletBalance || 0).toFixed(2)}
            </div>
            <div style="font-size: 0.74rem; color: #34d399; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
              <span>🛡️</span>
              <span>€${(user.escrowBalance || 0).toFixed(2)} im Treuhandkonto hinterlegt</span>
            </div>
          </div>

          <button class="btn btn-primary btn-sm" id="btn-profile-withdraw" style="padding: 0.45rem 0.85rem; font-size: 0.8rem; box-shadow: 0 2px 8px rgba(14, 167, 107, 0.4);">
            💸 Auszahlen
          </button>
        </div>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.12); padding-top: 0.5rem; display: flex; justify-content: space-between; font-size: 0.72rem; color: #cbd5e1;">
          <span>Gesamt verdient: <strong>€${(user.totalEarned || 185).toFixed(2)}</strong></span>
          <span style="color: #6ee7b7;">SEPA Instant aktiv ✓</span>
        </div>
      </div>

      <!-- Gespeicherte Jobs (Saved Bookmarks) Card -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.15rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.85rem;" id="profile-saved-jobs-container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.45rem;">
            <span style="font-size: 1.1rem;">⭐</span>
            <h3 style="font-size: 1rem; font-weight: 800; color: var(--qj-text-main);">
              Gespeicherte Jobs
            </h3>
            <span class="badge ${savedJobs.length > 0 ? 'badge-primary' : 'badge-muted'}" id="profile-saved-jobs-badge" style="font-size: 0.75rem;">
              ${savedJobs.length}
            </span>
          </div>

          ${savedJobs.length > 0 ? `
            <span style="font-size: 0.74rem; color: var(--qj-text-muted); font-weight: 600;">
              Tippen zum Öffnen
            </span>
          ` : ''}
        </div>

        ${savedJobs.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 0.6rem;" id="profile-saved-jobs-list">
            ${savedJobs.map(job => `
              <div 
                class="profile-saved-job-item" 
                data-saved-job-id="${job.id}"
                id="profile-saved-job-${job.id}"
              >
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.45rem; flex: 1; min-width: 0;">
                    <span style="font-size: 1.15rem;">${job.categoryIcon || '📋'}</span>
                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--qj-text-main); line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${escapeHTML(job.title)}
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <span class="price-tag" style="font-size: 0.95rem; font-weight: 800;">
                      €${job.payment}
                    </span>
                    <button 
                      class="btn-remove-saved-job" 
                      data-job-id="${job.id}" 
                      title="Aus gemerkten Jobs entfernen" 
                      style="color: #94a3b8; font-size: 0.95rem; padding: 2px 6px; border-radius: 4px; background: transparent; border: none; cursor: pointer;"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: var(--qj-text-muted); margin-top: 2px;">
                  <span>📍 ${job.approxLocation} · ⏱️ ${job.estimatedDuration}</span>
                  <span class="badge badge-outline" style="font-size: 0.68rem; padding: 2px 6px;">
                    ${job.ageSuitability || 'Ab 14'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 1.5rem 1rem; background: var(--qj-surface-muted); border-radius: var(--qj-radius-md); border: 1px dashed var(--qj-border); display: flex; flex-direction: column; align-items: center; gap: 0.4rem;" id="profile-saved-jobs-empty">
            <div style="font-size: 1.8rem;">⭐</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--qj-text-main);">
              Noch keine Jobs gemerkt
            </div>
            <p style="font-size: 0.78rem; color: var(--qj-text-muted); max-width: 270px; margin: 0 auto; line-height: 1.35;">
              Tippe in der Job-Übersicht oder im Job-Detail auf das Stern-Symbol (★), um Aufgaben für später zu sichern.
            </p>
            <button class="btn btn-secondary btn-sm" id="btn-profile-browse-jobs" style="margin-top: 0.4rem;">
              🔍 Zu den Microjobs
            </button>
          </div>
        `}
      </div>

      <!-- Minor Protection & Parental Consent Card (§ 113 BGB & JArbSchG) -->
      ${isMinor ? `
        <div style="background: #f5f3ff; border: 1.5px solid #c4b5fd; border-radius: var(--qj-radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; box-shadow: 0 1px 3px rgba(124, 58, 237, 0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.85rem; font-weight: 800; color: #5b21b6; display: flex; align-items: center; gap: 0.4rem;">
              <span>🛡️</span>
              <span>Eltern-Einwilligung & Jugendarbeitsschutz</span>
            </div>
            <span class="badge ${user.guardianConsent?.status === 'ACTIVE' || user.hasParentConsent ? 'badge-success' : 'badge-danger'}">
              ${user.guardianConsent?.status === 'ACTIVE' || user.hasParentConsent ? 'Verifiziert ✓' : 'Erforderlich ⚠️'}
            </span>
          </div>

          <p style="font-size: 0.78rem; color: #6b21a8; line-height: 1.45;">
            Nach § 113 BGB und dem JArbSchG dürfen Minderjährige nur jugendkonforme Tätigkeiten annehmen. Der Jugendschutzfilter ist dauerhaft verankert.
          </p>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: #7c3aed; border-top: 1px solid #e9d5ff; padding-top: 0.45rem; margin-top: 0.15rem;">
            <span>
              ${user.guardianConsent?.guardianName ? `Vormund: ${escapeHTML(user.guardianConsent.guardianName)} (${user.guardianConsent.relationship})` : 'Einwilligung: Sabine Klein (Mutter)'}
            </span>
            <button id="btn-open-guardian-portal" class="btn btn-link" style="color: #6d28d9; text-decoration: underline; font-weight: 700; font-size: 0.75rem; padding: 0;">
              Verwalten
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Skills Section -->
      ${user.skills && user.skills.length > 0 ? `
        <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 1rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem;">
            Verified Skills
          </h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.45rem;">
            ${user.skills.map(skill => `
              <span class="badge badge-muted" style="font-size: 0.8rem; padding: 0.35rem 0.65rem;">
                ✓ ${escapeHTML(skill)}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Recent Reviews -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 1rem;">
        <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.65rem;">
          Recent Reviews
        </h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${user.recentReviews && user.recentReviews.length > 0 ? user.recentReviews.map(rev => `
            <div style="border-bottom: 1px solid var(--qj-border-light); padding-bottom: 0.65rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                <span style="font-weight: 700;">${escapeHTML(rev.author)}</span>
                <span style="color: #d97706; font-weight: 800;">${'★'.repeat(rev.rating)}</span>
              </div>
              <p style="font-size: 0.82rem; color: var(--qj-text-muted); margin-top: 3px;">
                "${escapeHTML(rev.text)}"
              </p>
              <div style="font-size: 0.7rem; color: var(--qj-text-subtle); margin-top: 2px;">
                ${rev.date}
              </div>
            </div>
          `).join('') : `
            <div style="font-size: 0.82rem; color: var(--qj-text-muted); text-align: center; padding: 0.5rem 0;">
              No written reviews yet. Complete your first microjob to collect reviews!
            </div>
          `}
        </div>
      </div>

      <!-- Badges & Achievements Card -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.15rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.85rem;" id="profile-achievements-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">🏆</span>
            <div>
              <h3 style="font-size: 1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Badges & Achievements
              </h3>
              <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
                Freigeschaltete Auszeichnungen für zuverlässige Helfer
              </div>
            </div>
          </div>
          <span class="badge badge-primary" style="font-weight: 800;">
            ${achievements.filter(a => a.unlocked).length} / ${achievements.length}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem;" id="achievements-grid">
          ${achievements.map(ach => `
            <div style="background: ${ach.unlocked ? '#f8fafc' : '#f1f5f9'}; border: 1px solid ${ach.unlocked ? '#e2e8f0' : '#cbd5e1'}; border-radius: 10px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.3rem; opacity: ${ach.unlocked ? '1' : '0.6'};">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.4rem;">${ach.icon}</span>
                <span class="badge ${ach.unlocked ? 'badge-success' : 'badge-muted'}" style="font-size: 0.65rem;">
                  ${ach.unlocked ? '✓ Aktiv' : 'Gesperrt'}
                </span>
              </div>
              <div style="font-weight: 800; font-size: 0.85rem; color: var(--qj-text-main);">
                ${escapeHTML(ach.title)}
              </div>
              <div style="font-size: 0.72rem; color: var(--qj-text-muted); line-height: 1.3;">
                ${escapeHTML(ach.description)}
              </div>
              ${ach.unlocked && ach.unlockedDate ? `
                <div style="font-size: 0.65rem; color: #0ea76b; font-weight: 600; margin-top: 2px;">
                  Freigeschaltet: ${ach.unlockedDate}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Ausweis-Verifikation (KYC) Card -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.15rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.85rem;" id="profile-id-verification-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">🆔</span>
            <div>
              <h3 style="font-size: 1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Ausweis-Verifikation (KYC)
              </h3>
              <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
                Identitätsnachweis & Sicherheit in der Nachbarschaft
              </div>
            </div>
          </div>
          ${user.isIdentityVerified ? `
            <span class="badge badge-success" style="font-weight: 800; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
              ✓ Verifiziert
            </span>
          ` : `
            <span class="badge badge-warning" style="font-weight: 700;">
              Ausstehend ⚠️
            </span>
          `}
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem 0.85rem; font-size: 0.78rem; color: var(--qj-text-muted); line-height: 1.45;">
          <strong style="color: var(--qj-text-main);">Gesetzliche Regelung:</strong>
          Für <strong>Helfer (Arbeitnehmer)</strong> ist die Ausweisverifikation vor Annahme von bezahlten Aufträgen verpflichtend. Für <strong>Auftraggeber</strong> ist sie freiwillig.
        </div>

        ${user.isIdentityVerified ? `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 0.75rem 0.85rem;">
            <div>
              <div style="font-size: 0.84rem; font-weight: 800; color: #065f46;">
                ✓ ${user.idCardType || 'Personalausweis'} geprüft
              </div>
              <div style="font-size: 0.72rem; color: #047857;">
                Geprüft am ${user.idCardVerifiedAt || '23.09.2026'} · Profil trägt das verifizierte Häkchen
              </div>
            </div>
            <span style="font-size: 1.4rem; color: #059669;">🛡️</span>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; gap: 0.5rem;">
              <select id="select-id-type" class="form-input" style="flex: 1; padding: 0.5rem; font-size: 0.82rem; border-radius: 8px;">
                <option value="Personalausweis">Personalausweis</option>
                <option value="Reisepass">Reisepass</option>
                <option value="Schülerausweis">Schülerausweis (mit Foto)</option>
              </select>
              <button class="btn btn-primary btn-sm" id="btn-profile-verify-id" style="font-weight: 700; white-space: nowrap; padding: 0.5rem 0.85rem;">
                ✓ Jetzt verifizieren
              </button>
            </div>
            <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
              Hinweis: Du kannst deinen Ausweis jederzeit auch hier in den Einstellungen hochladen und aktualisieren.
            </div>
          </div>
        `}
      </div>

      <!-- Eltern-Dashboard & Eltern-Code Card -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.15rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.85rem;" id="profile-parent-portal-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">👨‍👩‍👧</span>
            <div>
              <h3 style="font-size: 1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Eltern-Dashboard & Eltern-Link
              </h3>
              <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
                Einsicht für Erziehungsberechtigte nach § 113 BGB & JArbSchG
              </div>
            </div>
          </div>
          <span class="badge ${isParentActive ? 'badge-success' : 'badge-muted'}" id="badge-parent-code-status">
            ${isParentActive ? 'PIN-Schutz Aktiv 🔒' : 'PIN-Schutz Inaktiv 🔓'}
          </span>
        </div>

        <p style="font-size: 0.8rem; color: var(--qj-text-muted); line-height: 1.4; margin: 0;">
          Über diesen Link können deine Eltern deine Arbeitszeiten (max. 2h/Tag gem. KindArbSchV), Verdienste und Sicherheitsnachweise einsehen.
        </p>

        <!-- Shareable Link Box -->
        <div style="background: var(--qj-surface-muted); border: 1px solid var(--qj-border); border-radius: 10px; padding: 0.65rem 0.8rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem; font-family: monospace; color: var(--qj-text-main); font-weight: 600;" id="parent-link-text">
            ${parentLink}
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-copy-parent-link" style="font-size: 0.74rem; font-weight: 700; white-space: nowrap; padding: 0.35rem 0.65rem;">
            📋 Link kopieren
          </button>
        </div>

        <!-- 6-digit Code Protection Setting -->
        <div style="border-top: 1px solid var(--qj-border-light); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--qj-text-main);">
                6-stelliger Eltern-Code (PIN)
              </div>
              <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
                Standardmäßig aus. Wenn aktiv, muss beim Aufrufen des Links der Code eingegeben werden.
              </div>
            </div>
            <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
              <input type="checkbox" id="toggle-parent-code" ${isParentActive ? 'checked' : ''} style="cursor: pointer;" />
            </label>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; background: ${isParentActive ? '#ecfdf5' : '#f8fafc'}; border: 1px solid ${isParentActive ? '#a7f3d0' : '#e2e8f0'}; border-radius: 8px; padding: 0.6rem 0.8rem;">
            <span style="font-size: 0.78rem; font-weight: 600; color: var(--qj-text-muted);">
              Aktueller Eltern-Code:
            </span>
            <span style="font-family: monospace; font-size: 1rem; font-weight: 800; color: ${isParentActive ? '#059669' : '#64748b'}; letter-spacing: 0.15em;" id="display-parent-code">
              ${parentCode}
            </span>
          </div>

          <button class="btn btn-primary btn-sm" id="btn-open-parent-dashboard" style="font-weight: 700; padding: 0.65rem; border-radius: 10px; margin-top: 0.2rem;">
            👨‍👩‍👧 Eltern-Dashboard jetzt öffnen
          </button>
        </div>
      </div>

      <!-- Erledigte Aufträge & Rechtssichere Quittungen (§ 368 BGB) -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.15rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.85rem;" id="profile-receipts-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">🧾</span>
            <div>
              <h3 style="font-size: 1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
                Quittungen (§ 368 BGB / § 147 AO)
              </h3>
              <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
                Offizielle Nachweise für abgeschlossene Taschengeldarbeiten
              </div>
            </div>
          </div>
          <span class="badge badge-info" style="font-size: 0.72rem;">
            ${completedJobs.length} Belege
          </span>
        </div>

        ${completedJobs.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 0.55rem;">
            ${completedJobs.map(job => `
              <div style="background: var(--qj-surface-muted); border: 1px solid var(--qj-border); border-radius: 10px; padding: 0.7rem 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                <div style="min-width: 0;">
                  <div style="font-weight: 700; font-size: 0.84rem; color: var(--qj-text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHTML(job.title)}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
                    Honorar: €${job.payment} ${job.tipAmount ? `+ €${job.tipAmount} Trinkgeld` : ''} · ${job.approxLocation}
                  </div>
                </div>
                <button class="btn btn-secondary btn-sm btn-profile-open-receipt" data-job-id="${job.id}" id="btn-receipt-${job.id}" style="font-size: 0.74rem; font-weight: 700; white-space: nowrap; padding: 0.35rem 0.65rem;">
                  🧾 Quittung
                </button>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 1rem; font-size: 0.8rem; color: var(--qj-text-muted);">
            Noch keine beendeten Jobs vorhanden. Nach Abschluss eines Jobs wird hier automatisch eine rechtssichere Quittung generiert.
          </div>
        `}
      </div>

      <!-- App-Einstellungen (Dark Mode & Push-Mitteilungen) -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.15rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.85rem;" id="profile-settings-card">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.25rem;">⚙️</span>
          <div>
            <h3 style="font-size: 1rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
              App-Einstellungen
            </h3>
            <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
              Darstellung & Benachrichtigungs-Präferenzen
            </div>
          </div>
        </div>

        <!-- Dark Mode Toggle -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--qj-border-light);">
          <div>
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--qj-text-main);">
              Design-Modus (Dark Mode)
            </div>
            <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
              Aktuell: ${activeTheme === 'dark' ? '🌙 Dunkel' : '☀️ Hell'}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-toggle-theme" style="font-weight: 700; font-size: 0.8rem; padding: 0.4rem 0.8rem; border-radius: 8px;">
            ${activeTheme === 'dark' ? '☀️ Zu Hell wechseln' : '🌙 Zu Dunkel wechseln'}
          </button>
        </div>

        <!-- Notification Preferences -->
        <div style="display: flex; flex-direction: column; gap: 0.6rem; padding-top: 0.25rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--qj-text-main);">
            Push-Benachrichtigungen
          </div>

          <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--qj-text-main); cursor: pointer;">
            <span>📍 Neue Microjobs in meiner Nähe</span>
            <input type="checkbox" id="notif-new-jobs" ${notifs.newJobsNearMe ? 'checked' : ''} style="cursor: pointer;" />
          </label>

          <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--qj-text-main); cursor: pointer;">
            <span>💬 Chat-Nachrichten & Live-Check-In</span>
            <input type="checkbox" id="notif-chat" ${notifs.chatMessages ? 'checked' : ''} style="cursor: pointer;" />
          </label>

          <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--qj-text-main); cursor: pointer;">
            <span>🛡️ Treuhand & Auszahlungen</span>
            <input type="checkbox" id="notif-payouts" ${notifs.payouts ? 'checked' : ''} style="cursor: pointer;" />
          </label>
        </div>
      </div>

      <!-- Account Authentication & Security Card (Redesigned) -->
      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 1.35rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 1rem;" id="profile-auth-card">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.55rem;">
            <div style="width: 38px; height: 38px; border-radius: 12px; background: rgba(14, 167, 107, 0.1); color: #0ea76b; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 800;">
              🛡️
            </div>
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">
                Konto & Sicherheit
              </h3>
              <span style="font-size: 0.72rem; color: #64748b;">NIST & OWASP abgesichert</span>
            </div>
          </div>
          <span class="badge ${user.emailVerified ? 'badge-success' : 'badge-warning'}" style="font-size: 0.74rem; font-weight: 700; padding: 0.3rem 0.6rem; border-radius: 12px;">
            ${user.emailVerified ? '✓ E-Mail verifiziert' : '⚠️ Verifizierung ausstehend'}
          </span>
        </div>

        <!-- Account Info Block -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
            <span style="color: #64748b; font-weight: 600;">E-Mail-Adresse:</span>
            <span style="font-weight: 700; color: #0f172a;">${escapeHTML(user.email || 'konto@quickjob.local')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
            <span style="color: #64748b; font-weight: 600;">Konto-Rolle:</span>
            <span class="badge badge-outline" style="font-size: 0.72rem; font-weight: 700;">
              ${user.role === 'employer' ? '🏢 Auftraggeber' : '🔍 Helfer (Worker)'}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
            <span style="color: #64748b; font-weight: 600;">Sitzungs-Status:</span>
            <span style="color: #0ea76b; font-weight: 700; display: flex; align-items: center; gap: 0.3rem;">
              <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #0ea76b;"></span>
              Aktiv (HttpOnly Cookie)
            </span>
          </div>

          ${!user.emailVerified ? `
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 0.65rem; display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem;">
              <span style="font-size: 0.76rem; color: #b45309; font-weight: 600;">E-Mail noch nicht bestätigt</span>
              <button class="btn btn-warning btn-sm" id="btn-profile-to-verify" style="font-size: 0.74rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 8px;">
                Jetzt bestätigen
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Password Change Section (Collapsible Accordion) -->
        <details style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 0.9rem;">
          <summary style="font-size: 0.84rem; font-weight: 700; color: #4338ca; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 0.45rem;">
            <span>🔑</span>
            <span>Passwort ändern</span>
          </summary>
          <form id="form-profile-change-password" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 0.65rem; margin-top: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 0.25rem;">Aktuelles Passwort</label>
              <input type="password" id="change-current-pw" placeholder="••••••••" required class="form-input" style="width: 100%; padding: 0.55rem; font-size: 0.84rem; border-radius: 8px; border: 1px solid #cbd5e1;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 0.25rem;">Neues Passwort</label>
              <input type="password" id="change-new-pw" placeholder="Mind. 8 Zeichen, Buchstabe & Ziffer" required class="form-input" style="width: 100%; padding: 0.55rem; font-size: 0.84rem; border-radius: 8px; border: 1px solid #cbd5e1;" />
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 0.25rem;">Neues Passwort bestätigen</label>
              <input type="password" id="change-confirm-pw" placeholder="Passwort wiederholen" required class="form-input" style="width: 100%; padding: 0.55rem; font-size: 0.84rem; border-radius: 8px; border: 1px solid #cbd5e1;" />
            </div>
            <button type="submit" class="btn btn-secondary btn-sm" id="btn-submit-change-password" style="font-weight: 700; padding: 0.65rem; margin-top: 0.2rem; border-radius: 8px;">
              Passwort jetzt aktualisieren
            </button>
          </form>
        </details>

        <!-- Big Solid Red Logout Button -->
        <div style="margin-top: 0.25rem;">
          <button 
            id="btn-profile-logout" 
            style="width: 100%; padding: 0.95rem 1.25rem; font-size: 1rem; font-weight: 800; color: #ffffff; background-color: #dc2626; background: #dc2626; border: none; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 0.6rem; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.35); cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
          >
            <span style="font-size: 1.15rem;">🚪</span>
            <span>Abmelden</span>
          </button>
        </div>
      </div>

      <!-- Legal & Privacy Center Card (Compliance & GDPR Hub) -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 1.1rem; display: flex; flex-direction: column; gap: 0.85rem;" id="profile-compliance-hub">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 0.92rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚖️</span>
            <span>Rechtliches & Datenschutz-Center</span>
          </div>
          <span class="badge badge-outline" style="font-size: 0.7rem; color: #475569;">DSGVO / DDG</span>
        </div>

        <!-- Document Links -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
          <button class="btn btn-outline btn-sm btn-open-legal-doc" data-doc="AGB" style="font-size: 0.75rem; font-weight: 700; text-align: left; padding: 0.45rem 0.6rem;">
            📄 AGB (v1.1)
          </button>
          <button class="btn btn-outline btn-sm btn-open-legal-doc" data-doc="PRIVACY" style="font-size: 0.75rem; font-weight: 700; text-align: left; padding: 0.45rem 0.6rem;">
            🔒 Datenschutz
          </button>
          <button class="btn btn-outline btn-sm btn-open-legal-doc" data-doc="IMPRESSUM" style="font-size: 0.75rem; font-weight: 700; text-align: left; padding: 0.45rem 0.6rem;">
            🏛️ Impressum (§ 5 DDG)
          </button>
          <button class="btn btn-outline btn-sm btn-open-legal-doc" data-doc="WIDERRUF" style="font-size: 0.75rem; font-weight: 700; text-align: left; padding: 0.45rem 0.6rem;">
            ↩️ Widerrufsbelehrung
          </button>
        </div>

        <!-- Data Subject Rights (DSGVO Art. 15, 17) -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #334155;">
            Ihre Betroffenenrechte (DSGVO):
          </div>

          <button class="btn btn-outline btn-sm" id="btn-export-data-json" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; border-color: #cbd5e1;">
            <span>📥</span><span>Daten-Export herunterladen (JSON · Art. 15)</span>
          </button>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: #64748b; margin-top: 0.1rem;">
            <button id="btn-open-cookie-settings" class="btn btn-link" style="font-size: 0.74rem; color: #6366f1; text-decoration: underline; padding: 0;">
              🍪 Cookie- & Speicherpräferenzen (§ 25 TDDDG)
            </button>
            <button id="btn-delete-account" class="btn btn-link" style="font-size: 0.74rem; color: #dc2626; text-decoration: underline; padding: 0;">
              🗑️ Konto löschen
            </button>
          </div>
        </div>
      </div>

      <!-- Youth Protection Safety Guide -->
      <div style="margin-top: 0.25rem;">
        <button class="btn btn-outline btn-block" id="btn-profile-safety-guide" style="font-weight: 700; padding: 0.75rem;">
          🛡️ Jugendschutz-Charta & Sicherheitsleitfaden
        </button>
      </div>
    </div>
  `;
}

export function attachProfileScreenEvents() {
  const safetyGuideBtn = document.getElementById('btn-profile-safety-guide');
  if (safetyGuideBtn) {
    safetyGuideBtn.addEventListener('click', () => {
      store.openLegalDoc('YOUTH_PROTECTION');
    });
  }

  const openGuardianPortalBtn = document.getElementById('btn-open-guardian-portal');
  if (openGuardianPortalBtn) {
    openGuardianPortalBtn.addEventListener('click', () => {
      store.openGuardianModal();
    });
  }

  // Legal document viewers
  const legalDocBtns = document.querySelectorAll('.btn-open-legal-doc');
  legalDocBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const docType = e.currentTarget.getAttribute('data-doc');
      if (docType) {
        store.openLegalDoc(docType);
      }
    });
  });

  // GDPR Data Subject Rights
  const exportDataBtn = document.getElementById('btn-export-data-json');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      store.exportUserData();
    });
  }

  const deleteAccountBtn = document.getElementById('btn-delete-account');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      if (window.confirm('Möchten Sie Ihr QuickJob-Konto und alle zugehörigen Daten wirklich löschen? Steuerlich relevante Buchungsdaten werden gem. § 147 AO für 10 Jahre revisionssicher archiviert.')) {
        store.deleteAccount();
      }
    });
  }

  const cookieSettingsBtn = document.getElementById('btn-open-cookie-settings');
  if (cookieSettingsBtn) {
    cookieSettingsBtn.addEventListener('click', () => {
      store.setState({ isConsentModalOpen: true });
    });
  }

  const withdrawBtn = document.getElementById('btn-profile-withdraw');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      store.withdrawFunds();
    });
  }

  // Saved jobs click and remove handlers
  const savedJobItems = document.querySelectorAll('.profile-saved-job-item[data-saved-job-id]');
  savedJobItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-saved-job')) return;
      const jobId = item.getAttribute('data-saved-job-id');
      if (jobId) {
        store.setState({ selectedJobId: jobId });
      }
    });
  });

  const removeSavedBtns = document.querySelectorAll('.btn-remove-saved-job[data-job-id]');
  removeSavedBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const jobId = btn.getAttribute('data-job-id');
      if (jobId) {
        store.toggleBookmark(jobId);
      }
    });
  });

  const browseJobsBtn = document.getElementById('btn-profile-browse-jobs');
  if (browseJobsBtn) {
    browseJobsBtn.addEventListener('click', () => {
      store.setState({ currentScreen: 'jobs' });
      store.setFeedTab('all');
    });
  }

  // Account Authentication & Security events
  const profileLogoutBtn = document.getElementById('btn-profile-logout');
  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener('click', async () => {
      await store.logoutUser();
    });
  }

  const profileLoginBtn = document.getElementById('btn-profile-login');
  if (profileLoginBtn) {
    profileLoginBtn.addEventListener('click', () => {
      store.setAuthMode('login');
    });
  }

  const profileRegisterBtn = document.getElementById('btn-profile-register');
  if (profileRegisterBtn) {
    profileRegisterBtn.addEventListener('click', () => {
      store.setAuthMode('register');
    });
  }

  const profileToVerifyBtn = document.getElementById('btn-profile-to-verify');
  if (profileToVerifyBtn) {
    profileToVerifyBtn.addEventListener('click', () => {
      store.setAuthMode('verify_email');
    });
  }

  const changePwForm = document.getElementById('form-profile-change-password');
  if (changePwForm) {
    changePwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current_pw = document.getElementById('change-current-pw')?.value;
      const new_pw = document.getElementById('change-new-pw')?.value;
      const confirm_pw = document.getElementById('change-confirm-pw')?.value;
      if (!current_pw || !new_pw || !confirm_pw) {
        store.showToast('Bitte alle Passwort-Felder ausfüllen.', 'error');
        return;
      }
      await store.changePassword(current_pw, new_pw, confirm_pw);
      changePwForm.reset();
    });
  }

  // --- NEW FEATURES PROFILE EVENT LISTENERS ---

  // Copy parent link
  const copyParentLinkBtn = document.getElementById('btn-copy-parent-link');
  if (copyParentLinkBtn) {
    copyParentLinkBtn.addEventListener('click', () => {
      const linkText = document.getElementById('parent-link-text')?.innerText?.trim() || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(linkText);
      }
      store.showToast('📋 Eltern-Link in die Zwischenablage kopiert!');
    });
  }

  // Toggle parent code protection
  const toggleParentCodeInput = document.getElementById('toggle-parent-code');
  if (toggleParentCodeInput) {
    toggleParentCodeInput.addEventListener('change', (e) => {
      store.updateUserParentPortal(e.target.checked);
    });
  }

  // Open parent dashboard
  const openParentDashboardBtn = document.getElementById('btn-open-parent-dashboard');
  if (openParentDashboardBtn) {
    openParentDashboardBtn.addEventListener('click', () => {
      store.openParentModal();
    });
  }

  // ID Verification button
  const verifyIdBtn = document.getElementById('btn-profile-verify-id');
  if (verifyIdBtn) {
    verifyIdBtn.addEventListener('click', () => {
      const idType = document.getElementById('select-id-type')?.value || 'Personalausweis';
      store.verifyIdentity(idType);
    });
  }

  // Open Receipt buttons
  const receiptBtns = document.querySelectorAll('.btn-profile-open-receipt[data-job-id]');
  receiptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-job-id');
      if (jobId) {
        store.openReceiptModal(jobId);
      }
    });
  });

  // Dark mode toggle
  const toggleThemeBtn = document.getElementById('btn-toggle-theme');
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
      const current = store.getState().activeTheme || 'light';
      store.setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Notification toggles
  const notifNewJobs = document.getElementById('notif-new-jobs');
  if (notifNewJobs) {
    notifNewJobs.addEventListener('change', (e) => {
      store.updateNotificationSettings('newJobsNearMe', e.target.checked);
    });
  }

  const notifChat = document.getElementById('notif-chat');
  if (notifChat) {
    notifChat.addEventListener('change', (e) => {
      store.updateNotificationSettings('chatMessages', e.target.checked);
    });
  }

  const notifPayouts = document.getElementById('notif-payouts');
  if (notifPayouts) {
    notifPayouts.addEventListener('change', (e) => {
      store.updateNotificationSettings('payouts', e.target.checked);
    });
  }

  // Profile avatar change handler
  const avatarFileInput = document.getElementById('profile-avatar-file-input');
  if (avatarFileInput) {
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          store.setUserProfilePicture(evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Jump to Admin Panel button
  const toAdminBtn = document.getElementById('btn-profile-to-admin');
  if (toAdminBtn) {
    toAdminBtn.addEventListener('click', () => {
      store.setScreen('admin');
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
