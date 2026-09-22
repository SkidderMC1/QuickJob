/**
 * QuickJob Job Detail Modal / View
 */
import { store } from '../state/store.js';
import { JobCategories } from '../models/types.js';

export function renderJobDetailModal(jobId, state) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return '';

  const user = state.currentUser;
  const isMinor = user.ageCategory === 'YOUTH_14_17';
  const isTooYoung = isMinor && job.minAge && job.minAge > 17;
  const categoryInfo = JobCategories.find(c => c.id === job.category) || { name: job.category, icon: '📋' };
  const isDirect = job.applicationMode === 'DIRECT_ACCEPT';
  const isAssignedToMe = job.worker && job.worker.id === user.id;
  const isMyPostedJob = job.employer && job.employer.id === user.id;
  const applicantsList = job.applicants || [];

  return `
    <div class="modal-overlay" id="job-detail-overlay">
      <div class="modal-sheet" id="job-detail-sheet" style="height: 88%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge ${isDirect ? 'badge-success' : 'badge-purple'}">
              ${isDirect ? '⚡ Direct Acceptance' : '📝 Application Required'}
            </span>
            <span class="badge badge-muted">
              ${categoryInfo.icon} ${categoryInfo.name}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button id="btn-report-job" data-job-id="${job.id}" title="Problem oder Verstoß melden" style="color: #ef4444; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border: 1px solid #fecaca; border-radius: 6px; background: #fef2f2; cursor: pointer; display: flex; align-items: center; gap: 3px;">
              <span>🚩</span><span>Melden</span>
            </button>
            <button id="btn-close-detail" style="font-size: 1.25rem; color: #64748b; padding: 4px;">
              ✕
            </button>
          </div>
        </div>

        <!-- Body Scrollable Content -->
        <div class="modal-body">
          <!-- Price & Title Section -->
          <div>
            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <div class="price-tag" style="font-size: 1.85rem;">
                <span class="currency">€</span>${job.payment}
              </div>
              <span style="font-weight: 700; color: var(--qj-text-muted); font-size: 0.9rem;">
                ⏱️ ${job.estimatedDuration}
              </span>
            </div>
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-top: 0.4rem; color: var(--qj-text-main); line-height: 1.3;">
              ${escapeHTML(job.title)}
            </h2>
          </div>

          <!-- Schedule & Location Box -->
          <div style="background: var(--qj-surface-muted); border-radius: var(--qj-radius-md); padding: 0.85rem; display: flex; flex-direction: column; gap: 0.6rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; font-weight: 600;">
              <span>🕒</span>
              <span>${job.dateSchedule}</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.88rem; font-weight: 600;">
              <span style="margin-top: 1px;">📍</span>
              <div>
                <div>${job.distanceKm} km away · ${job.approxLocation}</div>
                <div style="font-size: 0.75rem; color: var(--qj-text-subtle); font-weight: 500; margin-top: 2px;">
                  ${isAssignedToMe || isMyPostedJob ? `🔓 Exact address: <strong>${job.exactAddress}</strong>` : '🔒 Exact street number revealed upon confirmed assignment'}
                </div>
              </div>
            </div>
          </div>

          <!-- Age Suitability Notice -->
          <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.85rem; border-radius: var(--qj-radius-sm); font-size: 0.82rem; font-weight: 600; ${isTooYoung ? 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;' : 'background: #f5f3ff; color: #6b21a8; border: 1px solid #ddd6fe;'}">
            <span>${isTooYoung ? '⚠️' : '🛡️'}</span>
            <span>Altersfreigabe: ${job.ageSuitability}</span>
          </div>

          <!-- Description -->
          <div>
            <h4 style="font-size: 0.92rem; font-weight: 800; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--qj-text-muted);">
              About this task
            </h4>
            <p style="font-size: 0.9rem; line-height: 1.5; color: var(--qj-text-main);">
              ${escapeHTML(job.description)}
            </p>
          </div>

          <!-- Requirements -->
          ${job.requirements && job.requirements.length > 0 ? `
            <div>
              <h4 style="font-size: 0.92rem; font-weight: 800; margin-bottom: 0.45rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--qj-text-muted);">
                Requirements
              </h4>
              <ul style="padding-left: 1.25rem; font-size: 0.88rem; display: flex; flex-direction: column; gap: 0.35rem; color: var(--qj-text-main);">
                ${job.requirements.map(req => `<li>${escapeHTML(req)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Employer Trust Profile -->
          <div>
            <h4 style="font-size: 0.92rem; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--qj-text-muted);">
              Employer
            </h4>
            <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <div class="employer-avatar" style="width: 42px; height: 42px; font-size: 0.95rem;">
                  ${job.employer.avatarText || 'EM'}
                </div>
                <div>
                  <div style="font-size: 0.92rem; font-weight: 700; color: var(--qj-text-main); display: flex; align-items: center; gap: 0.3rem;">
                    ${escapeHTML(job.employer.name)}
                    ${job.employer.isCompany ? '🏢' : ''}
                  </div>
                  <div style="font-size: 0.78rem; color: #d97706; font-weight: 700; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                    <span>★ ${job.employer.rating || '5.0'}</span>
                    <span style="color: var(--qj-text-subtle);">· ${job.employer.completedJobs || 0} completed jobs</span>
                  </div>
                </div>
              </div>

              <div>
                <span class="badge badge-success">✓ Verified</span>
              </div>
            </div>
          </div>

          <!-- Safe Escrow Banner -->
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--qj-radius-sm); padding: 0.75rem; font-size: 0.78rem; color: #065f46; display: flex; gap: 0.5rem;">
            <span style="font-size: 1.1rem;">🛡️</span>
            <div>
              <strong>QuickJob Escrow Protection:</strong> €${job.payment} is pre-authorized and protected. Funds are automatically transferred only when the task is safely completed.
            </div>
          </div>
        </div>

        <!-- Sticky Bottom CTA -->
        <div class="modal-footer">
          ${isMyPostedJob ? `
            ${job.worker ? `
              <button class="btn btn-primary btn-block" id="btn-open-assigned-chat">
                💬 Chat mit Helfer (${escapeHTML(job.worker.name)})
              </button>
            ` : `
              <button class="btn btn-primary btn-block" id="btn-open-applicants-mgr" data-job-id="${job.id}">
                👥 Bewerbungen prüfen (${applicantsList.length} Helfer)
              </button>
            `}
          ` : isAssignedToMe ? `
            <button class="btn btn-primary btn-block" id="btn-open-assigned-chat">
              💬 Open Job Chat & Address
            </button>
          ` : isTooYoung ? `
            <button class="btn btn-secondary btn-block" disabled style="opacity: 0.6; cursor: not-allowed;">
              ⚠️ Age Requirement Not Met (18+)
            </button>
          ` : isDirect ? `
            <button class="btn btn-primary btn-block" id="btn-action-accept" data-job-id="${job.id}">
              ⚡ Accept Job Now — €${job.payment}
            </button>
          ` : `
            <button class="btn btn-primary btn-block" id="btn-action-apply" data-job-id="${job.id}">
              📝 Apply for Microjob
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

export function attachJobDetailEvents() {
  const overlay = document.getElementById('job-detail-overlay');
  const closeBtn = document.getElementById('btn-close-detail');

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        store.setState({ selectedJobId: null });
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      store.setState({ selectedJobId: null });
    });
  }

  const acceptBtn = document.getElementById('btn-action-accept');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      const jobId = acceptBtn.getAttribute('data-job-id');
      store.applyToJob(jobId, 'Accepted job directly via QuickJob!');
    });
  }

  const applyBtn = document.getElementById('btn-action-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const jobId = applyBtn.getAttribute('data-job-id');
      store.applyToJob(jobId, 'Hello! I would love to complete this task for you.');
    });
  }

  const openChatBtn = document.getElementById('btn-open-assigned-chat');
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      store.setState({ currentScreen: 'messages', selectedJobId: null });
    });
  }

  const applicantsBtn = document.getElementById('btn-open-applicants-mgr');
  if (applicantsBtn) {
    applicantsBtn.addEventListener('click', () => {
      const jobId = applicantsBtn.getAttribute('data-job-id');
      store.openApplicantModal(jobId);
    });
  }

  const reportBtn = document.getElementById('btn-report-job');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      const jobId = reportBtn.getAttribute('data-job-id') || store.getState().selectedJobId;
      store.openReportModal(jobId);
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
