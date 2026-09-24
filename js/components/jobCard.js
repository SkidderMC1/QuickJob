/**
 * QuickJob Reusable Job Card Component
 */
import { JobCategories } from '../models/types.js';

export function renderJobCard(job) {
  const categoryInfo = JobCategories.find(c => c.id === job.category) || { name: job.category, icon: '📋' };
  const isDirect = job.applicationMode === 'DIRECT_ACCEPT';

  return `
    <article class="job-card" data-job-id="${job.id}" id="card-${job.id}">
      <div class="job-card-top">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 2px;">
            <span class="job-card-category">${categoryInfo.icon} ${categoryInfo.name}</span>
            <span class="badge ${isDirect ? 'badge-success' : 'badge-purple'}">
              ${isDirect ? '⚡ Direct Accept' : '📝 Apply'}
            </span>
          </div>
          <h3 class="job-card-title">${escapeHTML(job.title)}</h3>
        </div>

        <div style="text-align: right; flex-shrink: 0;">
          <div class="price-tag">
            <span class="currency">€</span>${job.payment}
          </div>
          <div style="font-size: 0.72rem; color: var(--qj-text-subtle); font-weight: 600;">
            ${job.estimatedDuration}
          </div>
        </div>
      </div>

      <div class="job-card-meta">
        <div class="meta-item">
          <span>📍</span>
          <span>${job.distanceKm} km · ${job.approxLocation}</span>
        </div>
        <div class="meta-item">
          <span>🕒</span>
          <span>${job.dateSchedule}</span>
        </div>
      </div>

      ${job.travelTimes ? `
        <div class="travel-times-row" style="display: flex; align-items: center; justify-content: space-between; background: var(--qj-surface-muted); border-radius: 8px; padding: 0.35rem 0.6rem; font-size: 0.72rem; color: var(--qj-text-muted); margin-top: 0.45rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem; font-weight: 600;">
            <span title="Fahrrad">🚲 ${job.travelTimes.bike}</span>
            <span title="Zu Fuß">🚶 ${job.travelTimes.walk}</span>
            <span title="ÖPNV (Bus/Bahn)">🚌 ${job.travelTimes.transit}</span>
          </div>
          <a 
            href="${job.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.approxLocation)}`}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="link-gmaps" 
            onclick="event.stopPropagation();" 
            title="In Google Maps Navigation öffnen"
            style="color: #4338ca; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 2px;"
          >
            <span>🗺️ Route</span>
          </a>
        </div>
      ` : ''}

      <div class="job-card-bottom">
        <div class="employer-compact">
          <div class="employer-avatar">
            ${job.employer.avatarText || 'EM'}
          </div>
          <div>
            <div class="employer-name">
              ${escapeHTML(job.employer.name)}
              ${job.employer.isCompany ? '<span title="Verified Company">🏢</span>' : ''}
              ${job.employer.isIdentityVerified ? '<span style="color: #0ea76b;" title="Identity Verified">✓</span>' : ''}
            </div>
            <div class="employer-rating">
              <span>★</span>
              <span>${job.employer.rating || '5.0'}</span>
              <span style="color: var(--qj-text-subtle); font-weight: 500;">(${job.employer.completedJobs || 0})</span>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <button 
            class="bookmark-btn" 
            data-bookmark-id="${job.id}" 
            title="${job.isBookmarked ? 'Remove bookmark' : 'Bookmark job'}"
            style="color: ${job.isBookmarked ? '#eab308' : '#94a3b8'}; font-size: 1.1rem; padding: 4px;"
          >
            ${job.isBookmarked ? '★' : '☆'}
          </button>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--qj-primary);">
            View →
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
