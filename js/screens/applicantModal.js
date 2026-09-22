/**
 * QuickJob Applicant Management & Selection Modal
 * Allows employers to inspect applicant profiles, age compliance, and assign workers.
 */
import { store } from '../state/store.js';

export function renderApplicantModal(state) {
  if (!state.applicantJobId) return '';

  const job = state.jobs.find(j => j.id === state.applicantJobId);
  if (!job) return '';

  const applicants = job.applicants || [];

  return `
    <div class="modal-overlay" id="applicant-modal-overlay">
      <div class="modal-sheet" id="applicant-modal-sheet" style="max-height: 88%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div>
            <span class="badge badge-purple">👥 Bewerbungen prüfen</span>
            <h2 style="font-size: 1.1rem; font-weight: 800; margin-top: 4px; color: var(--qj-text-main); line-height: 1.3;">
              ${escapeHTML(job.title)}
            </h2>
            <div style="font-size: 0.78rem; color: var(--qj-text-muted); margin-top: 2px;">
              ${applicants.length} Helfer haben sich beworben · Vergütung: €${job.payment}
            </div>
          </div>
          <button id="btn-close-applicants" style="font-size: 1.25rem; color: #64748b; padding: 4px;">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          ${applicants.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${applicants.map(app => `
                <div class="applicant-card" id="applicant-card-${app.id}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                      <div class="employer-avatar" style="width: 44px; height: 44px; font-size: 1rem; background: #e0e7ff; color: #3730a3;">
                        ${app.avatarText || 'H'}
                      </div>
                      <div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: var(--qj-text-main);">
                          ${escapeHTML(app.name)}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 2px;">
                          <span class="badge ${app.age < 18 ? 'badge-purple' : 'badge-info'}" style="font-size: 0.68rem;">
                            ${app.ageCategoryLabel || (app.age + ' Jahre')}
                          </span>
                          ${app.hasParentConsent ? '<span class="badge badge-success" style="font-size: 0.68rem;">✓ Eltern-Zustimmung</span>' : ''}
                        </div>
                      </div>
                    </div>

                    <div style="text-align: right;">
                      <div style="font-size: 0.88rem; font-weight: 800; color: #d97706;">
                        ★ ${app.rating || '5.0'}
                      </div>
                      <div style="font-size: 0.7rem; color: var(--qj-text-subtle);">
                        ${app.completedJobs || 0} Jobs · ${app.reliability || 98}%
                      </div>
                    </div>
                  </div>

                  <!-- Pitch / Bewerbungsnachricht -->
                  <div style="background: #f8fafc; border-radius: 8px; padding: 0.65rem; border: 1px solid #e2e8f0; font-size: 0.82rem; color: #334155; line-height: 1.4;">
                    "${escapeHTML(app.pitch || 'Hallo! Ich bin motiviert und helfe gerne bei dieser Aufgabe.')}"
                    <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 4px;">
                      Eingegangen: ${app.appliedAt || 'Vor kurzem'}
                    </div>
                  </div>

                  <!-- Assign CTA -->
                  <button 
                    class="btn btn-primary btn-sm btn-assign-worker" 
                    data-job-id="${job.id}" 
                    data-applicant-id="${app.id}"
                    style="width: 100%; justify-content: center; padding: 0.55rem;"
                  >
                    ✓ ${escapeHTML(app.name.split(' ')[0])} beauftragen & Adresse freigeben
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="text-align: center; padding: 2.5rem 1rem;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📬</div>
              <h3 style="font-size: 1rem; font-weight: 700;">Noch keine Bewerbungen</h3>
              <p style="font-size: 0.82rem; color: var(--qj-text-muted); margin-top: 0.35rem;">
                Lokale Helfer aus deiner Umgebung werden über dein Microjob-Inserat informiert.
              </p>
            </div>
          `}

          <!-- Escrow & Security Notice -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--qj-radius-sm); padding: 0.65rem 0.85rem; font-size: 0.76rem; color: #1e40af; display: flex; gap: 0.4rem; margin-top: 0.5rem;">
            <span>🛡️</span>
            <div>
              <strong>Treuhand-Garantie:</strong> Erst nach Auswahl eines Helfers wird deine genaue Hausnummer freigegeben. Die Zahlung (€${job.payment}) verbleibt geschützt im QuickJob Escrow.
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary btn-block" id="btn-back-to-job">
            Schließen
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachApplicantModalEvents() {
  const overlay = document.getElementById('applicant-modal-overlay');
  const closeBtn = document.getElementById('btn-close-applicants');
  const backBtn = document.getElementById('btn-back-to-job');

  const close = () => {
    store.closeApplicantModal();
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backBtn) backBtn.addEventListener('click', close);

  // Assign buttons
  const assignBtns = document.querySelectorAll('.btn-assign-worker');
  assignBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-job-id');
      const applicantId = btn.getAttribute('data-applicant-id');
      if (jobId && applicantId) {
        store.assignApplicant(jobId, applicantId);
      }
    });
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
