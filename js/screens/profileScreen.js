/**
 * QuickJob Profile Screen Component
 */
import { store } from '../state/store.js';

export function renderProfileScreen(state) {
  const user = state.currentUser;
  const isMinor = user.ageCategory === 'YOUTH_14_17';
  const isEmployer = state.activeMode === 'post';
  const savedJobs = state.jobs.filter(j => j.isBookmarked);

  return `
    <div class="screen-container" id="screen-profile">
      <!-- Profile Header Card -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.25rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 0.9rem;">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <div class="employer-avatar" style="width: 58px; height: 58px; font-size: 1.35rem; background: #e2e8f0;">
            ${user.avatarText || 'US'}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--qj-text-main);">
                ${escapeHTML(user.name)}
              </h2>
              ${user.isCompany ? '<span title="Verified Company">🏢</span>' : ''}
            </div>
            <div style="font-size: 0.78rem; color: var(--qj-text-muted);">
              ${user.handle} · 📍 ${user.locationApprox || 'Wuppertal'}
            </div>
            <div style="margin-top: 4px; display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <span class="badge ${isMinor ? 'badge-purple' : 'badge-info'}">
                ${user.ageCategoryLabel}
              </span>
              ${user.isIdentityVerified ? '<span class="badge badge-success">✓ ID Verified</span>' : ''}
              ${user.isCompany ? '<span class="badge badge-info">🏢 Registered</span>' : ''}
            </div>
          </div>
        </div>

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

      <!-- Minor Protection & Parental Consent Card -->
      ${isMinor ? `
        <div style="background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: var(--qj-radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.85rem; font-weight: 800; color: #5b21b6; display: flex; align-items: center; gap: 0.4rem;">
              <span>🛡️</span>
              <span>Parental Consent & Youth Protection</span>
            </div>
            <span class="badge badge-success">Active ✓</span>
          </div>

          <p style="font-size: 0.78rem; color: #6b21a8; line-height: 1.4;">
            As a 16-year-old youth worker, tasks are legally limited to max 2 hours per school day and 10 hours per week. Dangerous work, hazardous bulk disposal, and late evening shifts are restricted.
          </p>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: #7c3aed; border-top: 1px solid #e9d5ff; padding-top: 0.4rem; margin-top: 0.2rem;">
            <span>Guardian: Sandra Klein (Mother)</span>
            <button id="btn-view-consent-doc" style="color: #6d28d9; text-decoration: underline; font-weight: 700;">
              View Consent
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

      <!-- Settings & Mode Switch -->
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <button class="btn btn-secondary btn-block" id="btn-profile-toggle-mode">
          ${isEmployer ? 'Switch to Worker View (Find Jobs)' : 'Switch to Employer View (Post Jobs)'}
        </button>
        <button class="btn btn-outline btn-block" id="btn-profile-safety-guide">
          🛡️ Safety, Terms & Minor Guidelines
        </button>
      </div>
    </div>
  `;
}

export function attachProfileScreenEvents() {
  const toggleModeBtn = document.getElementById('btn-profile-toggle-mode');
  if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', () => {
      store.toggleMode();
    });
  }

  const safetyGuideBtn = document.getElementById('btn-profile-safety-guide');
  if (safetyGuideBtn) {
    safetyGuideBtn.addEventListener('click', () => {
      store.setState({ isSafetyModalOpen: true });
    });
  }

  const consentDocBtn = document.getElementById('btn-view-consent-doc');
  if (consentDocBtn) {
    consentDocBtn.addEventListener('click', () => {
      store.setState({ isSafetyModalOpen: true });
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
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
