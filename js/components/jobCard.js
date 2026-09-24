/**
 * QuickJob Reusable Job Card Component
 * Redesigned for fast 1-2s scannability: Category label & Price -> Strong Title -> Location/Time -> Employer Trust -> Apply
 */
import { JobCategories } from '../models/types.js';

export function renderJobCard(job) {
  const categoryInfo = JobCategories.find(c => c.id === job.category) || { name: job.category, icon: '📋' };
  const employer = job.employer || {};
  const isVerified = Boolean(employer.isIdentityVerified);
  const reviewsCount = employer.completedJobs ?? employer.ratingCount ?? 0;
  const ratingVal = employer.rating ? Number(employer.rating).toFixed(1) : '5.0';
  const approxLoc = job.approxLocation || 'Wuppertal-Elberfeld';

  return `
    <article class="job-card" data-job-id="${job.id}" id="card-${job.id}">
      <!-- Top Row: Category Label (left) and Price (right) -->
      <div class="job-card-top-row">
        <span class="job-card-category-label">
          <span class="cat-icon">${categoryInfo.icon}</span>
          <span class="cat-name">${categoryInfo.name.toUpperCase()}</span>
        </span>
        <div class="job-card-price-prominent">
          <span class="currency">€</span>${job.payment}
        </div>
      </div>

      <!-- Job Title: Strongest textual element -->
      <h3 class="job-card-title">${escapeHTML(job.title)}</h3>

      <!-- Compact Secondary Metadata -->
      <div class="job-card-meta-compact">
        <div class="meta-item-pill">
          <span class="meta-icon">📍</span>
          <span class="meta-val">${job.distanceKm} km · ${escapeHTML(approxLoc)}</span>
        </div>
        <div class="meta-item-pill">
          <span class="meta-icon">🕐</span>
          <span class="meta-val">${escapeHTML(job.dateSchedule || 'Flexibel')}</span>
        </div>
        <div class="meta-item-pill">
          <span class="meta-icon">⏱</span>
          <span class="meta-val">${escapeHTML(job.estimatedDuration || '≈ 1h')}</span>
        </div>
      </div>

      <!-- Travel Times Row (Compact & Useful) -->
      ${job.travelTimes ? `
        <div class="job-card-travel-row">
          <div class="travel-badges">
            <span title="Fahrrad">🚲 ${job.travelTimes.bike}</span>
            <span class="dot">·</span>
            <span title="Zu Fuß">🚶 ${job.travelTimes.walk}</span>
            <span class="dot">·</span>
            <span title="ÖPNV">🚌 ${job.travelTimes.transit}</span>
          </div>
          <a 
            href="${job.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.approxLocation)}`}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="job-card-route-link" 
            onclick="event.stopPropagation();" 
            title="In Google Maps öffnen"
          >
            <span>Route ↗</span>
          </a>
        </div>
      ` : ''}

      <!-- Bottom Row: Poster Trust Info (left) & Actions (right) -->
      <div class="job-card-bottom-row">
        <div class="job-card-employer-trust">
          <div class="employer-name-line">
            <span class="employer-name">${escapeHTML(employer.name || 'Auftraggeber')}</span>
            ${isVerified ? '<span class="verified-badge-check" title="Ausweis verifiziert">✓</span>' : ''}
          </div>
          <div class="employer-rating-line">
            <span class="rating-star">★</span>
            <span class="rating-number">${ratingVal}</span>
            <span class="reviews-count">· ${reviewsCount} reviews</span>
          </div>
        </div>

        <div class="job-card-actions-group">
          <button 
            class="bookmark-btn" 
            data-bookmark-id="${job.id}" 
            title="${job.isBookmarked ? 'Remove bookmark' : 'Bookmark job'}"
            aria-label="Bookmark"
          >
            ${job.isBookmarked ? '★' : '☆'}
          </button>
          <span class="job-card-apply-cta">
            Apply →
          </span>
        </div>
      </div>
    </article>
  `;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
