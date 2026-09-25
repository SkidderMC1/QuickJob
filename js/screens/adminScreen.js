/**
 * QuickJob Admin & Compliance Management Panel Screen
 * Comprehensive administrative moderation interface for viewing platform statistics,
 * reviewing reported users and incidents, taking disciplinary actions (warn/ban),
 * and inspecting user profiles.
 */
import { store } from '../state/store.js';

export function renderAdminScreen(state) {
  const adminStats = state.adminStats || {
    totalUsers: 2840,
    activeWorkers: 1920,
    activeEmployers: 920,
    minorWorkersCount: 412,
    activeJobsCount: 48,
    escrowVolumeEur: 3420.50,
    kycVerificationRate: 94.2,
    safetyIncidentCount: 3,
    bannedUsersCount: 4
  };

  const reports = state.reports || [];
  const activeTab = state.adminTab || 'reports';
  const selectedReportId = state.selectedAdminReportId;
  const selectedReport = reports.find(r => r.id === selectedReportId);

  const pendingReports = reports.filter(r => r.status === 'PENDING');
  const userFilter = (state.adminUserFilter || '').toLowerCase().trim();

  // Combine mockUsers into a manageable list
  const usersList = [
    { id: 'user_jasper', name: 'Jasper Klein', email: 'jasper@quickjob.local', role: 'Helfer', age: 16, ageCategory: 'Jugendlicher (14–17)', kyc: true, status: 'active', rating: 4.9, jobs: 32 },
    { id: 'user_sophia', name: 'Sophia Weber', email: 'sophia@quickjob.local', role: 'Helfer', age: 22, ageCategory: 'Erwachsener (18+)', kyc: true, status: 'active', rating: 5.0, jobs: 19 },
    { id: 'user_marcus', name: 'Dr. Marcus Lang', email: 'marcus@quickjob.local', role: 'Auftraggeber', age: 48, ageCategory: 'Erwachsener (18+)', kyc: true, status: 'active', rating: 4.9, jobs: 15 },
    { id: 'user_lena', name: 'Lena Sommer', email: 'lena@quickjob.local', role: 'Helfer', age: 14, ageCategory: 'Kind (13–14)', kyc: true, status: 'active', rating: 4.9, jobs: 5 },
    { id: 'user_kevin_b', name: 'Kevin Breuer', email: 'kevin.breuer98@example.de', role: 'Auftraggeber', age: 26, ageCategory: 'Erwachsener (18+)', kyc: false, status: reports.find(r => r.reportedUserId === 'user_kevin_b')?.reportedUserStatus || 'active', rating: 2.1, jobs: 1 },
    { id: 'user_artur_s', name: 'Artur Schneider', email: 'artur.trade@mail-fake.com', role: 'Auftraggeber', age: 31, ageCategory: 'Erwachsener (18+)', kyc: false, status: reports.find(r => r.reportedUserId === 'user_artur_s')?.reportedUserStatus || 'active', rating: 1.8, jobs: 0 },
    { id: 'user_tim_v', name: 'Tim Vogt', email: 'tim.vogt@testmail.de', role: 'Helfer', age: 19, ageCategory: 'Erwachsener (18+)', kyc: true, status: reports.find(r => r.reportedUserId === 'user_tim_v')?.reportedUserStatus || 'warned', rating: 3.4, jobs: 4 }
  ].filter(u => !userFilter || u.name.toLowerCase().includes(userFilter) || u.email.toLowerCase().includes(userFilter));

  return `
    <div class="screen-container admin-screen-container" id="screen-admin" style="padding-bottom: 5rem;">
      <!-- 1. Admin Header Bar -->
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; border-radius: var(--qj-radius-lg); padding: 1.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; background: #dc2626; color: #ffffff; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
              <span>🛡️</span>
              <span>Admin & Moderation Panel</span>
            </div>
            <h1 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin: 0.5rem 0 0.25rem 0;">
              QuickJob Leitstand
            </h1>
            <p style="font-size: 0.78rem; color: #94a3b8; margin: 0; line-height: 1.4;">
              Marktplatz-Überwachung, Vorfallsmeldungen, Jugendschutz gem. JArbSchG und Kontosperren.
            </p>
          </div>
          <button class="btn btn-outline btn-sm" id="btn-admin-exit" style="background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 0.75rem; white-space: nowrap;">
            ← Zurück
          </button>
        </div>
      </div>

      <!-- 2. Platform KPI Statistics Cards -->
      <section style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h2 style="font-size: 0.92rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
            📊 Plattform-Statistiken (Live)
          </h2>
          <span style="font-size: 0.7rem; color: #0ea76b; font-weight: 700;">● System online</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.55rem;">
          <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 0.85rem; box-shadow: var(--qj-shadow-xs);">
            <div style="font-size: 0.7rem; color: var(--qj-text-muted); font-weight: 700; text-transform: uppercase;">
              Registrierte Nutzer
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--qj-text-main); margin-top: 2px;" id="stat-total-users">
              ${adminStats.totalUsers.toLocaleString('de-DE')}
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
              ${adminStats.activeWorkers} Helfer · ${adminStats.activeEmployers} Auftraggeber
            </div>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 0.85rem; box-shadow: var(--qj-shadow-xs);">
            <div style="font-size: 0.7rem; color: var(--qj-text-muted); font-weight: 700; text-transform: uppercase;">
              Offene Meldungen
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: ${pendingReports.length > 0 ? '#dc2626' : '#0ea76b'}; margin-top: 2px;" id="stat-pending-reports">
              ${pendingReports.length} ⚠️
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
              ${reports.length} Vorfälle erfasst · ${adminStats.bannedUsersCount || 0} gesperrt
            </div>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 0.85rem; box-shadow: var(--qj-shadow-xs);">
            <div style="font-size: 0.7rem; color: var(--qj-text-muted); font-weight: 700; text-transform: uppercase;">
              Treuhandvolumen (Escrow)
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #0ea76b; margin-top: 2px;" id="stat-escrow-volume">
              €${(adminStats.escrowVolumeEur || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
              ${adminStats.activeJobsCount} aktive Aufträge in Prüfung
            </div>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 0.85rem; box-shadow: var(--qj-shadow-xs);">
            <div style="font-size: 0.7rem; color: var(--qj-text-muted); font-weight: 700; text-transform: uppercase;">
              Ausweis-Quote (KYC)
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #2563eb; margin-top: 2px;" id="stat-kyc-rate">
              ${adminStats.kycVerificationRate}%
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
              ${adminStats.minorWorkersCount} Jugendliche (14–17 J.)
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Admin Navigation Tabs -->
      <div class="segmented-control" style="margin-bottom: 1rem;">
        <button class="segment-btn ${activeTab === 'reports' ? 'active' : ''}" id="admin-tab-btn-reports" data-tab="reports">
          <span>🚨</span><span>Meldungen (${pendingReports.length})</span>
        </button>
        <button class="segment-btn ${activeTab === 'users' ? 'active' : ''}" id="admin-tab-btn-users" data-tab="users">
          <span>👥</span><span>Benutzer (${usersList.length})</span>
        </button>
        <button class="segment-btn ${activeTab === 'stats' ? 'active' : ''}" id="admin-tab-btn-stats" data-tab="stats">
          <span>⚖️</span><span>Recht & Jugendschutz</span>
        </button>
      </div>

      <!-- TAB 1: REPORTS & INCIDENTS -->
      ${activeTab === 'reports' ? `
        <section id="admin-section-reports">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
            <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--qj-text-main); margin: 0;">
              Gemeldete Nutzer & Vorfälle
            </h3>
            <span style="font-size: 0.72rem; color: var(--qj-text-muted);">
              Klicke auf einen Eintrag zur Prüfung
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;" id="admin-reports-list">
            ${reports.length === 0 ? `
              <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 2rem; text-align: center; color: var(--qj-text-muted);">
                Aktuell liegen keine Vorfallsmeldungen vor. Der Marktplatz läuft sauber.
              </div>
            ` : reports.map(rep => {
              const isPending = rep.status === 'PENDING';
              const isBanned = rep.status === 'BANNED' || rep.reportedUserStatus === 'banned';
              const isWarned = rep.status === 'WARNED';

              const statusBadge = isBanned ? `
                <span class="badge" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800;">
                  ⛔ GESPERRT
                </span>
              ` : isWarned ? `
                <span class="badge" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-weight: 800;">
                  ⚠️ VERWARNT
                </span>
              ` : isPending ? `
                <span class="badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 800;">
                  🔴 OFFEN
                </span>
              ` : `
                <span class="badge" style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-weight: 800;">
                  ✓ ERLEDIGT
                </span>
              `;

              return `
                <div 
                  class="admin-report-card" 
                  id="admin-report-${rep.id}"
                  data-report-id="${rep.id}"
                  style="background: #ffffff; border: 1.5px solid ${isPending ? '#fca5a5' : 'var(--qj-border)'}; border-radius: var(--qj-radius-md); padding: 1rem; box-shadow: var(--qj-shadow-xs); cursor: pointer; transition: all 0.15s ease;"
                >
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                      <div style="width: 42px; height: 42px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; border: 1.5px solid #fca5a5;">
                        ${(rep.reportedUserName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                          <h4 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 0;">
                            ${escapeHTML(rep.reportedUserName)}
                          </h4>
                          <span style="font-size: 0.72rem; color: #64748b;">${escapeHTML(rep.reportedUserHandle)}</span>
                        </div>
                        <div style="font-size: 0.72rem; color: #64748b;">
                          ${rep.reportedUserRole === 'worker' ? 'Helfer' : 'Auftraggeber'} · ${rep.reportedUserAge} Jahre · ★ ${rep.reportedUserRating || '2.0'}
                        </div>
                      </div>
                    </div>
                    <div>${statusBadge}</div>
                  </div>

                  <div style="background: #f8fafc; border-left: 3px solid #dc2626; border-radius: 4px; padding: 0.5rem 0.65rem; margin-bottom: 0.5rem;">
                    <div style="font-size: 0.72rem; font-weight: 800; color: #991b1b; text-transform: uppercase;">
                      ${escapeHTML(rep.categoryLabel || rep.category)}
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 700; color: #1e293b; margin-top: 2px;">
                      ${escapeHTML(rep.reason)}
                    </div>
                    <div style="font-size: 0.74rem; color: #475569; margin-top: 3px; line-height: 1.35;">
                      ${escapeHTML(rep.details)}
                    </div>
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 0.5rem;">
                    <span>Gemeldet von: <strong>${escapeHTML(rep.reporterName)}</strong> (${rep.createdAt})</span>
                    <button class="btn btn-outline btn-sm btn-open-report-details" data-report-id="${rep.id}" style="padding: 0.25rem 0.55rem; font-size: 0.72rem; font-weight: 700;">
                      Profil & Fall prüfen →
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}

      <!-- TAB 2: USER DIRECTORY & MANAGEMENT -->
      ${activeTab === 'users' ? `
        <section id="admin-section-users">
          <div style="margin-bottom: 0.75rem;">
            <div class="search-box">
              <span style="color: #94a3b8;">🔍</span>
              <input 
                type="text" 
                id="admin-search-users-input" 
                placeholder="Nutzer suchen nach Name oder E-Mail..." 
                value="${escapeHTML(state.adminUserFilter || '')}" 
              />
              ${state.adminUserFilter ? '<button id="btn-admin-clear-search">✕</button>' : ''}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem;" id="admin-users-list">
            ${usersList.map(u => {
              const isBanned = u.status === 'banned';
              return `
                <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 0.8rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: ${isBanned ? '#fee2e2' : '#f1f5f9'}; color: ${isBanned ? '#dc2626' : '#0ea76b'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; border: 1.5px solid ${isBanned ? '#fca5a5' : '#cbd5e1'};">
                      ${u.name.charAt(0)}
                    </div>
                    <div>
                      <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.35rem;">
                        <span>${escapeHTML(u.name)}</span>
                        ${u.kyc ? '<span title="Ausweis verifiziert" style="color: #0ea76b; font-size: 0.85rem;">✓</span>' : ''}
                        ${isBanned ? '<span class="badge" style="background: #fef2f2; color: #dc2626; font-size: 0.65rem;">GESPERRT</span>' : ''}
                      </div>
                      <div style="font-size: 0.72rem; color: #64748b;">
                        ${escapeHTML(u.email)} · ${u.role} (${u.age} J.) · ★ ${u.rating} (${u.jobs} Jobs)
                      </div>
                    </div>
                  </div>

                  <div>
                    <button 
                      class="btn ${isBanned ? 'btn-outline' : 'btn-outline'} btn-sm btn-admin-toggle-ban" 
                      data-user-id="${u.id}"
                      style="font-size: 0.72rem; padding: 0.3rem 0.6rem; border-color: ${isBanned ? '#0ea76b' : '#dc2626'}; color: ${isBanned ? '#0ea76b' : '#dc2626'}; font-weight: 700;"
                    >
                      ${isBanned ? 'Entsperren' : 'Sperren'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}

      <!-- TAB 3: LEGAL COMPLIANCE & AUDIT LOGS -->
      ${activeTab === 'stats' ? `
        <section id="admin-section-stats">
          <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.15rem; display: flex; flex-direction: column; gap: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span style="font-size: 1.25rem;">⚖️</span>
              <h3 style="font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0;">
                Gesetzlicher Jugendschutz & Compliance Audit
              </h3>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; font-size: 0.78rem;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
                <div style="font-weight: 800; color: #0f172a;">§ 5 Abs. 1 JArbSchG (Verbot der Kinderarbeit)</div>
                <div style="color: #64748b; margin-top: 2px;">
                  100% automatische Registrierungssperre für Personen unter 13 Jahren aktiv.
                </div>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
                <div style="font-weight: 800; color: #0f172a;">KindArbSchV & § 113 BGB (Erziehungsberechtigte)</div>
                <div style="color: #64748b; margin-top: 2px;">
                  Arbeitszeitbegrenzung auf max. 2h/Tag an Schultagen für 13–14-Jährige. Eltern-Portal mit PIN-Code aktivierbar.
                </div>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem;">
                <div style="font-weight: 800; color: #0f172a;">§ 8 & § 22 JArbSchG (Arbeitszeit- & Gefahrenschutz)</div>
                <div style="color: #64748b; margin-top: 2px;">
                  Arbeitszeitfenster für Jugendliche 14–17 Jahre auf 06:00 bis 20:00 Uhr beschränkt. Schwere Lasten und Gefahrgut automatisch ausgeblendet.
                </div>
              </div>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- 4. Selected Report & User Profile Details Modal / Drawer -->
      ${selectedReport ? `
        <div class="modal-backdrop" id="admin-report-modal" style="display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); z-index: 1000; padding: 1rem;">
          <div style="background: #ffffff; border-radius: 18px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 1.25rem; box-shadow: 0 20px 40px rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 0.85rem;">
            
            <!-- Modal Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
              <div>
                <span class="badge" style="background: #fee2e2; color: #991b1b; font-size: 0.7rem; font-weight: 800;">
                  FALL #${selectedReport.id}
                </span>
                <h2 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0.35rem 0 0 0;">
                  Vorfall & Nutzerprofil prüfen
                </h2>
              </div>
              <button id="btn-admin-close-modal" style="background: none; border: none; font-size: 1.35rem; cursor: pointer; color: #64748b;">✕</button>
            </div>

            <!-- Reported User Profile Card -->
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #dc2626; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 800;">
                  ${(selectedReport.reportedUserName || 'U').charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <h3 style="font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0;">
                      ${escapeHTML(selectedReport.reportedUserName)}
                    </h3>
                    <span style="font-size: 0.75rem; color: #64748b;">${escapeHTML(selectedReport.reportedUserHandle)}</span>
                  </div>
                  <div style="font-size: 0.74rem; color: #475569; margin-top: 2px;">
                    ✉️ ${escapeHTML(selectedReport.reportedUserEmail)}
                  </div>
                  <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                    Rolle: <strong>${selectedReport.reportedUserRole}</strong> · Alter: <strong>${selectedReport.reportedUserAge} Jahre</strong> · Registriert: ${selectedReport.reportedUserJoined || '14.08.2026'}
                  </div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem; margin-top: 0.65rem; background: #ffffff; border-radius: 8px; padding: 0.5rem; text-align: center; border: 1px solid #e2e8f0;">
                <div>
                  <div style="font-size: 0.85rem; font-weight: 800; color: #d97706;">★ ${selectedReport.reportedUserRating}</div>
                  <div style="font-size: 0.65rem; color: #64748b;">Bewertung (${selectedReport.reportedUserRatingCount || 1})</div>
                </div>
                <div>
                  <div style="font-size: 0.85rem; font-weight: 800; color: #0ea76b;">${selectedReport.reportedUserCompletedJobs}</div>
                  <div style="font-size: 0.65rem; color: #64748b;">Erledigte Jobs</div>
                </div>
                <div>
                  <div style="font-size: 0.85rem; font-weight: 800; color: #2563eb;">${selectedReport.reportedUserReliability}%</div>
                  <div style="font-size: 0.65rem; color: #64748b;">Zuverlässigkeit</div>
                </div>
              </div>
            </div>

            <!-- Incident & Accusation Details -->
            <div style="display: flex; flex-direction: column; gap: 0.45rem;">
              <div style="font-size: 0.78rem; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                Vorfall & Beweislage
              </div>
              <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 0.75rem;">
                <div style="font-size: 0.74rem; font-weight: 800; color: #9f1239;">
                  Kategorie: ${escapeHTML(selectedReport.categoryLabel || selectedReport.category)}
                </div>
                <div style="font-size: 0.85rem; font-weight: 700; color: #881337; margin-top: 3px;">
                  "${escapeHTML(selectedReport.reason)}"
                </div>
                <div style="font-size: 0.78rem; color: #4c0519; margin-top: 4px; line-height: 1.4;">
                  ${escapeHTML(selectedReport.details)}
                </div>
              </div>

              <!-- Evidence & Chat Excerpt -->
              ${selectedReport.chatExcerpt ? `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.65rem;">
                  <div style="font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase;">
                    Auszug aus Chatverlauf:
                  </div>
                  <pre style="margin: 4px 0 0 0; font-size: 0.72rem; color: #1e293b; white-space: pre-wrap; font-family: monospace; line-height: 1.4;">${escapeHTML(selectedReport.chatExcerpt)}</pre>
                </div>
              ` : ''}

              ${selectedReport.evidence && selectedReport.evidence.length > 0 ? `
                <div style="font-size: 0.72rem; color: #475569;">
                  <strong>Gesicherte Anhaltspunkte:</strong>
                  <ul style="margin: 3px 0 0 1rem; padding: 0;">
                    ${selectedReport.evidence.map(ev => `<li>${escapeHTML(ev)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                Meldender Nutzer: <strong>${escapeHTML(selectedReport.reporterName)}</strong> (${escapeHTML(selectedReport.reporterEmail)})
              </div>
            </div>

            <!-- Disciplinary / Moderation Action Buttons -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="font-size: 0.76rem; font-weight: 800; color: #0f172a;">
                Moderationsentscheidung treffen:
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
                <button 
                  class="btn btn-warning" 
                  id="btn-admin-warn-user" 
                  data-report-id="${selectedReport.id}" 
                  style="font-size: 0.76rem; font-weight: 800; padding: 0.55rem; background: #f59e0b; border: none; color: #ffffff;"
                >
                  ⚠️ Nutzer verwarnen
                </button>
                <button 
                  class="btn btn-danger" 
                  id="btn-admin-ban-user" 
                  data-report-id="${selectedReport.id}" 
                  style="font-size: 0.76rem; font-weight: 800; padding: 0.55rem; background: #dc2626; border: none; color: #ffffff;"
                >
                  ⛔ Nutzer sperren (Ban)
                </button>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
                <button 
                  class="btn btn-outline" 
                  id="btn-admin-resolve-report" 
                  data-report-id="${selectedReport.id}" 
                  style="font-size: 0.74rem; font-weight: 700; padding: 0.5rem; color: #059669; border-color: #10b981;"
                >
                  ✓ Fall klären / erledigt
                </button>
                <button 
                  class="btn btn-outline" 
                  id="btn-admin-dismiss-report" 
                  data-report-id="${selectedReport.id}" 
                  style="font-size: 0.74rem; font-weight: 700; padding: 0.5rem; color: #64748b;"
                >
                  Meldung abweisen
                </button>
              </div>
            </div>

          </div>
        </div>
      ` : ''}

    </div>
  `;
}

export function attachAdminScreenEvents() {
  // Exit back to home
  document.getElementById('btn-admin-exit')?.addEventListener('click', () => {
    store.setScreen('home');
  });

  // Tab switcher
  document.getElementById('admin-tab-btn-reports')?.addEventListener('click', () => {
    store.setAdminTab('reports');
  });
  document.getElementById('admin-tab-btn-users')?.addEventListener('click', () => {
    store.setAdminTab('users');
  });
  document.getElementById('admin-tab-btn-stats')?.addEventListener('click', () => {
    store.setAdminTab('stats');
  });

  // User search
  const userSearch = document.getElementById('admin-search-users-input');
  if (userSearch) {
    userSearch.addEventListener('input', (e) => {
      store.setAdminUserFilter(e.target.value);
    });
  }
  document.getElementById('btn-admin-clear-search')?.addEventListener('click', () => {
    store.setAdminUserFilter('');
  });

  // Open report detail modal
  const openReportBtns = document.querySelectorAll('.btn-open-report-details[data-report-id], .admin-report-card[data-report-id]');
  openReportBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const repId = btn.getAttribute('data-report-id');
      if (repId) {
        store.openAdminReport(repId);
      }
    });
  });

  // Close modal
  document.getElementById('btn-admin-close-modal')?.addEventListener('click', () => {
    store.closeAdminReport();
  });

  // Actions on reported user
  document.getElementById('btn-admin-warn-user')?.addEventListener('click', (e) => {
    const repId = e.target.getAttribute('data-report-id');
    if (repId) {
      store.warnReportedUser(repId, 'Verstoß gegen Jugendschutz & Verhaltensrichtlinien');
    }
  });

  document.getElementById('btn-admin-ban-user')?.addEventListener('click', (e) => {
    const repId = e.target.getAttribute('data-report-id');
    if (repId) {
      store.banReportedUser(repId, 'Wiederholter oder schwerer Regelverstoß');
    }
  });

  document.getElementById('btn-admin-resolve-report')?.addEventListener('click', (e) => {
    const repId = e.target.getAttribute('data-report-id');
    if (repId) {
      store.resolveReport(repId, 'Einvernehmlich geklärt.');
    }
  });

  document.getElementById('btn-admin-dismiss-report')?.addEventListener('click', (e) => {
    const repId = e.target.getAttribute('data-report-id');
    if (repId) {
      store.dismissReport(repId, 'Meldung nach Prüfung abgewiesen.');
    }
  });

  // Ban/Unban buttons in user directory
  const toggleBanBtns = document.querySelectorAll('.btn-admin-toggle-ban[data-user-id]');
  toggleBanBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const uId = btn.getAttribute('data-user-id');
      if (uId) {
        store.toggleUserBan(uId);
      }
    });
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
