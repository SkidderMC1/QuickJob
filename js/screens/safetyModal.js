/**
 * QuickJob Safety, Moderation & Minor Protection Modal
 */
import { store } from '../state/store.js';

export function renderSafetyModal(state) {
  if (!state.isSafetyModalOpen) return '';

  return `
    <div class="modal-overlay" id="safety-modal-overlay">
      <div class="modal-sheet" id="safety-modal-sheet" style="height: 85%;">
        <div class="modal-grabber"></div>

        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">🛡️</span>
            <h3 style="font-size: 1.05rem; font-weight: 800;">Trust, Safety & Minor Protection</h3>
          </div>
          <button id="btn-close-safety" style="font-size: 1.25rem; color: #64748b; padding: 4px;">✕</button>
        </div>

        <div class="modal-body">
          <!-- Minor Protection Section -->
          <div style="background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: var(--qj-radius-md); padding: 1rem;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #5b21b6; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>👶</span>
              <span>Youth Protection Workflow (Ages 14–17)</span>
            </div>
            <p style="font-size: 0.82rem; color: #6b21a8; line-height: 1.45;">
              QuickJob is designed to provide teenagers with safe, legal, and educational microjob opportunities with full transparency:
            </p>
            <ul style="padding-left: 1.2rem; font-size: 0.8rem; color: #5b21b6; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.3rem;">
              <li><strong>Parental Consent:</strong> A parent/guardian must approve the digital consent token before tasks can be accepted.</li>
              <li><strong>Time Limits:</strong> Max 2 hours per school day, prohibited during school hours and after 18:00.</li>
              <li><strong>Banned Categories:</strong> Minors cannot accept dangerous tasks, chemical handling, or heavy bulk waste disposal.</li>
            </ul>
          </div>

          <!-- Location Privacy Section -->
          <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: var(--qj-radius-md); padding: 1rem;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #065f46; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>📍</span>
              <span>Two-Stage Location Privacy</span>
            </div>
            <p style="font-size: 0.82rem; color: #047857; line-height: 1.45;">
              To protect household privacy, employers never broadcast their house number publicly.
            </p>
            <div style="font-size: 0.78rem; color: #065f46; margin-top: 0.4rem;">
              • <strong>Before assignment:</strong> "1.4 km away · Wuppertal-Elberfeld"<br/>
              • <strong>After assignment:</strong> Full street and door number are securely unlocked for the assigned helper.
            </div>
          </div>

          <!-- Escrow & Payment Protection -->
          <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: var(--qj-radius-md); padding: 1rem;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #1e40af; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>💳</span>
              <span>Escrow Payment Guarantee</span>
            </div>
            <p style="font-size: 0.82rem; color: #1d4ed8; line-height: 1.45;">
              No cash under the table. When a microjob is booked, the payment is secured in QuickJob Escrow. When the worker finishes and the employer confirms, funds are instantly transferred.
            </p>
          </div>

          <!-- Verification Badge Standards -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 0.4rem;">Verification Badges</h4>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="badge badge-success">✓ ID Verified</span>
                <span>Government identity verified via photo ID</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="badge badge-info">🏢 Verified Company</span>
                <span>Commercial register (Handelsregister) checked</span>
              </div>
            </div>
          </div>

          <!-- Architecture Disclaimer -->
          <div style="font-size: 0.75rem; color: var(--qj-text-subtle); border-top: 1px solid var(--qj-border); padding-top: 0.75rem;">
            <em>Note for MVP: Safety workflows and payment escrow are demonstrated with safe local state simulation. Production will connect to regulated payment providers (e.g. Stripe Connect / Adyen) and compliant ID verification.</em>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary btn-block" id="btn-confirm-safety">
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachSafetyModalEvents() {
  const overlay = document.getElementById('safety-modal-overlay');
  const closeBtn = document.getElementById('btn-close-safety');
  const confirmBtn = document.getElementById('btn-confirm-safety');

  const close = () => {
    store.setState({ isSafetyModalOpen: false });
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (confirmBtn) confirmBtn.addEventListener('click', close);
}
