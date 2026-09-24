/**
 * QuickJob Interactive 5-Star Review & Compliment Modal
 */
import { store } from '../state/store.js';

let selectedRating = 5;
let selectedTags = new Set(['Pünktlich & zuverlässig']);
let reviewComment = '';
let selectedTip = 0;

const complimentOptions = [
  '⏰ Pünktlich & zuverlässig',
  '😊 Sehr freundlich & höflich',
  '🧹 Sauber & sorgfältig',
  '⚡ Schnell erledigt',
  '👍 Gerne wieder',
  '💬 Vorbildliche Kommunikation'
];

export function renderReviewModal(state) {
  if (!state.reviewJobId) return '';

  const job = state.jobs.find(j => j.id === state.reviewJobId);
  if (!job) return '';

  const recipientName = job.worker ? job.worker.name : (job.employer ? job.employer.name : 'Helfer');

  return `
    <div class="modal-overlay" id="review-modal-overlay">
      <div class="modal-sheet" id="review-modal-sheet" style="max-height: 85%;">
        <div class="modal-grabber"></div>

        <!-- Header -->
        <div class="modal-header">
          <div>
            <span class="badge badge-success">⭐ Auftrag bewerten</span>
            <h2 style="font-size: 1.1rem; font-weight: 800; margin-top: 4px; color: var(--qj-text-main);">
              Bewertung für ${escapeHTML(recipientName)}
            </h2>
          </div>
          <button id="btn-close-review" style="font-size: 1.25rem; color: #64748b; padding: 4px;">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="gap: 1rem;">
          <div style="text-align: center;">
            <p style="font-size: 0.85rem; color: var(--qj-text-muted);">
              Wie zufrieden warst du mit der Durchführung von <strong>"${escapeHTML(job.title)}"</strong>?
            </p>
            
            <!-- 5 Interactive Stars -->
            <div class="star-rating-row" id="star-rating-selector">
              ${[1, 2, 3, 4, 5].map(star => `
                <span 
                  class="star-btn ${star <= selectedRating ? 'active' : ''}" 
                  data-star="${star}"
                  title="${star} Sterne"
                >★</span>
              `).join('')}
            </div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #d97706;" id="star-rating-label">
              ${selectedRating === 5 ? 'Hervorragend! (5 von 5 Sternen)' : `${selectedRating} von 5 Sternen`}
            </div>
          </div>

          <!-- Quick Compliment Tags -->
          <div>
            <label class="form-label" style="margin-bottom: 0.4rem;">
              <span>Besondere Stärken hervorheben</span>
            </label>
            <div class="compliment-tags" id="compliment-tags-container">
              ${complimentOptions.map(tag => `
                <div 
                  class="compliment-tag ${selectedTags.has(tag) ? 'selected' : ''}" 
                  data-tag="${escapeHTML(tag)}"
                >
                  ${escapeHTML(tag)}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Comment Input -->
          <div class="form-group">
            <label class="form-label" for="review-comment-input">
              <span>Persönliches Feedback (optional)</span>
            </label>
            <textarea 
              id="review-comment-input" 
              class="form-control" 
              rows="3" 
              placeholder="z. B. Sehr freundlich, die Hecke wurde perfekt geschnitten..."
            >${escapeHTML(reviewComment)}</textarea>
          </div>

          <!-- Trinkgeld (Tip) Feature -->
          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;" id="review-tip-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label" style="margin: 0; font-weight: 800; font-size: 0.85rem; color: #0f172a;">
                <span>☕ Trinkgeld geben (Tip)</span>
              </label>
              <span id="selected-tip-display" style="font-size: 0.82rem; font-weight: 800; color: #0ea76b;">
                ${selectedTip > 0 ? `+ €${selectedTip.toFixed(2)}` : 'Kein Trinkgeld'}
              </span>
            </div>
            <div class="tip-options-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
              <button type="button" class="btn btn-sm tip-btn ${selectedTip === 0 ? 'btn-primary' : 'btn-outline'}" data-tip="0">0 €</button>
              <button type="button" class="btn btn-sm tip-btn ${selectedTip === 2 ? 'btn-primary' : 'btn-outline'}" data-tip="2">+ 2 €</button>
              <button type="button" class="btn btn-sm tip-btn ${selectedTip === 5 ? 'btn-primary' : 'btn-outline'}" data-tip="5">+ 5 €</button>
              <button type="button" class="btn btn-sm tip-btn ${selectedTip === 10 ? 'btn-primary' : 'btn-outline'}" data-tip="10">+ 10 €</button>
            </div>
            <div style="font-size: 0.7rem; color: #64748b;">
              Das Trinkgeld geht zu 100 % an den Helfer und wird auf der Quittung ausgewiesen.
            </div>
          </div>

          <!-- Reputation Shield Note -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--qj-radius-sm); padding: 0.65rem 0.75rem; font-size: 0.76rem; color: #166534; display: flex; gap: 0.4rem;">
            <span>🛡️</span>
            <span>Echte Bewertungen stärken das Vertrauen in der Nachbarschaft und schalten weitere Job-Möglichkeiten frei.</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-review" style="flex: 1;">
            Abbrechen
          </button>
          <button class="btn btn-primary" id="btn-submit-review" style="flex: 2;">
            ⭐ Bewertung & Trinkgeld absenden
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachReviewModalEvents() {
  const overlay = document.getElementById('review-modal-overlay');
  const closeBtn = document.getElementById('btn-close-review');
  const cancelBtn = document.getElementById('btn-cancel-review');

  const close = () => {
    store.closeReviewModal();
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  // Star selector
  const starBtns = document.querySelectorAll('.star-btn[data-star]');
  const starLabel = document.getElementById('star-rating-label');

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = Number(btn.getAttribute('data-star'));
      starBtns.forEach(b => {
        const val = Number(b.getAttribute('data-star'));
        b.classList.toggle('active', val <= selectedRating);
      });
      if (starLabel) {
        starLabel.textContent = selectedRating === 5 
          ? 'Hervorragend! (5 von 5 Sternen)' 
          : `${selectedRating} von 5 Sternen`;
      }
    });
  });

  // Compliment tags
  const tags = document.querySelectorAll('.compliment-tag[data-tag]');
  tags.forEach(tagEl => {
    tagEl.addEventListener('click', () => {
      const tag = tagEl.getAttribute('data-tag');
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        tagEl.classList.remove('selected');
      } else {
        selectedTags.add(tag);
        tagEl.classList.add('selected');
      }
    });
  });

  // Comment input
  const commentInput = document.getElementById('review-comment-input');
  if (commentInput) {
    commentInput.addEventListener('input', (e) => {
      reviewComment = e.target.value;
    });
  }

  // Tip buttons
  const tipBtns = document.querySelectorAll('.tip-btn[data-tip]');
  const tipDisplay = document.getElementById('selected-tip-display');
  tipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTip = Number(btn.getAttribute('data-tip')) || 0;
      tipBtns.forEach(b => {
        const val = Number(b.getAttribute('data-tip')) || 0;
        b.className = `btn btn-sm tip-btn ${val === selectedTip ? 'btn-primary' : 'btn-outline'}`;
      });
      if (tipDisplay) {
        tipDisplay.textContent = selectedTip > 0 ? `+ €${selectedTip.toFixed(2)}` : 'Kein Trinkgeld';
      }
    });
  });

  // Submit button
  const submitBtn = document.getElementById('btn-submit-review');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const state = store.getState();
      const jobId = state.reviewJobId;
      if (jobId) {
        store.submitReview(jobId, selectedRating, Array.from(selectedTags), reviewComment, selectedTip);
        // Reset local state
        selectedRating = 5;
        selectedTags = new Set(['Pünktlich & zuverlässig']);
        reviewComment = '';
        selectedTip = 0;
      }
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
