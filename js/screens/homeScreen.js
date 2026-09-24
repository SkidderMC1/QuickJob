/**
 * QuickJob Mobile Home Screen View
 * Redesigned for mobile-first visual excellence, rapid scannability, and clear information hierarchy.
 */
import { store } from '../state/store.js';
import { JobCategories } from '../models/types.js';
import { renderJobCard } from '../components/jobCard.js';

export function renderHomeScreen(state) {
  const user = state.currentUser || {};
  const isMinor = user.ageCategory === 'YOUTH_14_17';
  
  // Filter jobs safe for minors
  const availableJobs = state.jobs.filter(j => 
    !isMinor || (j.minAge <= 17 && j.category !== 'disposal')
  );
  
  const nearbyJobs = availableJobs.slice(0, 3);
  const recommendedJobs = availableJobs.slice(3, 6);
  const totalCount = availableJobs.length;

  return `
    <div class="screen-container home-screen-container" id="screen-home">
      <!-- 1. Compact Header / Hero Greeting -->
      <section class="home-greeting-section">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span class="home-greeting-sub">Welcome back,</span>
            <h1 class="home-greeting">${escapeHTML(user.name || 'Member')} 👋</h1>
          </div>
          <div class="badge ${isMinor ? 'badge-purple' : 'badge-info'}" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;">
            ${user.ageCategoryLabel || 'Member'}
          </div>
        </div>
      </section>

      <!-- 2. Search Input Box -->
      <div class="search-box" id="home-search-box" style="margin-top: -0.25rem;">
        <span style="font-size: 1.05rem; color: #94a3b8;">🔍</span>
        <input 
          type="text" 
          id="home-search-input" 
          placeholder="Search garden, tutoring, dog walking..." 
          value="${escapeHTML(state.filters.query)}"
        />
        ${state.filters.query ? '<button id="btn-clear-home-search" style="color: #94a3b8; font-size: 0.9rem;">✕</button>' : ''}
      </div>

      <!-- 3. Compact Nearby Map Card (35-45% Shorter, Native Product Feature) -->
      <section class="home-compact-map-card" id="home-map-card">
        <div class="map-card-text">
          <div class="map-card-heading">
            <span class="map-pin-icon">📍</span>
            <span class="map-heading-text">${totalCount} jobs near you</span>
            <span class="map-privacy-tag">DSGVO</span>
          </div>
          <p class="map-card-subtext">
            See available jobs around your location.
          </p>
        </div>
        <button class="btn btn-primary btn-sm btn-open-map-cta" id="btn-home-open-map">
          Open map →
        </button>
      </section>

      <!-- 4. Categories: Horizontally Scrollable Chips -->
      <section class="home-categories-section">
        <div class="section-header">
          <h2 class="section-title">Categories</h2>
          <span class="section-link" id="link-view-all-cats">See all →</span>
        </div>
        <div class="category-scroll" id="home-category-chips">
          <div class="category-chip ${state.filters.category === 'all' ? 'active' : ''}" data-cat="all">
            <span>✨ All ${totalCount}</span>
          </div>
          ${JobCategories.map(cat => {
            const count = availableJobs.filter(j => j.category === cat.id).length;
            return `
              <div class="category-chip ${state.filters.category === cat.id ? 'active' : ''}" data-cat="${cat.id}">
                <span>${cat.icon} ${cat.name} ${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- 5. Nearby Jobs Section -->
      <section class="home-nearby-section">
        <div class="section-header">
          <h2 class="section-title">Nearby jobs · ${totalCount}</h2>
          <span class="section-link" id="link-see-nearby">See all →</span>
        </div>
        <div class="jobs-list" style="margin-top: 0.5rem;">
          ${nearbyJobs.map(job => renderJobCard(job)).join('')}
        </div>
      </section>

      <!-- 6. Recommended for You (if available) -->
      ${recommendedJobs.length > 0 ? `
        <section class="home-recommended-section">
          <div class="section-header">
            <h2 class="section-title">Recommended for you</h2>
            <span class="section-link" id="link-see-recommended">See all →</span>
          </div>
          <div class="jobs-list" style="margin-top: 0.5rem;">
            ${recommendedJobs.map(job => renderJobCard(job)).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

export function attachHomeScreenEvents() {
  const searchInput = document.getElementById('home-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.setFilter('query', e.target.value);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        store.setScreen('jobs');
      }
    });
  }

  const clearBtn = document.getElementById('btn-clear-home-search');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      store.setFilter('query', '');
    });
  }

  // Compact Map Card CTA & Card click
  const btnHomeOpenMap = document.getElementById('btn-home-open-map');
  const homeMapCard = document.getElementById('home-map-card');
  const handleOpenMap = (e) => {
    if (e) e.stopPropagation();
    store.setScreen('jobs', { jobsViewMode: 'map' });
    if (store.getState().locationPermissionGranted === null) {
      store.setState({ isLocationModalOpen: true });
    }
  };

  if (btnHomeOpenMap) btnHomeOpenMap.addEventListener('click', handleOpenMap);
  if (homeMapCard) homeMapCard.addEventListener('click', handleOpenMap);

  // Categories "See all →"
  const viewAllCats = document.getElementById('link-view-all-cats');
  if (viewAllCats) {
    viewAllCats.addEventListener('click', () => {
      store.setFilter('category', 'all');
      store.setScreen('jobs', { jobsViewMode: 'list' });
    });
  }

  // Nearby jobs "See all →"
  const seeNearby = document.getElementById('link-see-nearby');
  if (seeNearby) {
    seeNearby.addEventListener('click', () => {
      store.setScreen('jobs', { jobsViewMode: 'list' });
    });
  }

  const seeRecommended = document.getElementById('link-see-recommended');
  if (seeRecommended) {
    seeRecommended.addEventListener('click', () => {
      store.setScreen('jobs', { jobsViewMode: 'list' });
    });
  }

  // Category chip clicks
  const catChips = document.querySelectorAll('.category-chip[data-cat]');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-cat');
      store.setFilter('category', cat);
      store.setScreen('jobs', { jobsViewMode: 'list' });
    });
  });

  // Entire Job Card is tappable -> Opens details modal
  const jobCards = document.querySelectorAll('.job-card[data-job-id]');
  jobCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger modal if bookmark button was clicked
      if (e.target.closest('.bookmark-btn')) return;
      if (e.target.closest('.job-card-route-link')) return;
      const jobId = card.getAttribute('data-job-id');
      if (jobId) {
        store.setState({ selectedJobId: jobId });
      }
    });
  });

  // Bookmark star clicks
  const bookmarkBtns = document.querySelectorAll('.bookmark-btn[data-bookmark-id]');
  bookmarkBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-bookmark-id');
      if (id) {
        store.toggleBookmark(id);
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
