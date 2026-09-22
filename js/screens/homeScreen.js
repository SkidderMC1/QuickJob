/**
 * QuickJob Home Screen View
 */
import { store } from '../state/store.js';
import { JobCategories } from '../models/types.js';
import { renderJobCard } from '../components/jobCard.js';

export function renderHomeScreen(state) {
  const user = state.currentUser;
  const isMinor = user.ageCategory === 'YOUTH_14_17';
  const nearbyJobs = state.jobs
    .filter(j => !isMinor || (j.minAge <= 17 && j.category !== 'disposal'))
    .slice(0, 3);
  const recommendedJobs = state.jobs.slice(3, 6);

  return `
    <div class="screen-container" id="screen-home">
      <!-- Greeting & Hero -->
      <section class="home-hero">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div class="home-subtitle">Welcome back,</div>
            <h1 class="home-greeting">${escapeHTML(user.name)} 👋</h1>
          </div>
          <div class="badge ${isMinor ? 'badge-purple' : 'badge-info'}">
            ${user.ageCategoryLabel || 'Member'}
          </div>
        </div>
      </section>

      <!-- Search Input -->
      <div class="search-box" id="home-search-box">
        <span style="font-size: 1.1rem; color: #94a3b8;">🔍</span>
        <input 
          type="text" 
          id="home-search-input" 
          placeholder="Search garden, tutoring, dog walking..." 
          value="${escapeHTML(state.filters.query)}"
        />
        ${state.filters.query ? '<button id="btn-clear-home-search" style="color: #94a3b8; font-size: 0.9rem;">✕</button>' : ''}
      </div>

      <!-- Quick Action Banner -->
      ${state.activeMode === 'find' ? `
        <div style="background: linear-gradient(135deg, #0ea76b 0%, #059669 100%); color: white; border-radius: var(--qj-radius-md); padding: 1rem; box-shadow: 0 4px 14px rgba(14, 167, 107, 0.28); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Safe & Protected</div>
            <div style="font-size: 1.05rem; font-weight: 800; margin-top: 2px;">Earn money locally</div>
            <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">Protected payment escrow on every job</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-home-browse-all" style="background: white; color: #065f46; border: none; font-weight: 700;">
            Browse
          </button>
        </div>
      ` : `
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: white; border-radius: var(--qj-radius-md); padding: 1rem; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.28); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Employer Mode</div>
            <div style="font-size: 1.05rem; font-weight: 800; margin-top: 2px;">Need help with a task?</div>
            <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">Post a microjob in under 2 minutes</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-home-create-job" style="background: white; color: #3730a3; border: none; font-weight: 700;">
            + Post Job
          </button>
        </div>
      `}

      <!-- Category Pills -->
      <section>
        <div class="section-header">
          <h2 class="section-title">Categories</h2>
          <span class="section-link" id="link-view-all-cats">All Jobs →</span>
        </div>
        <div class="category-scroll" style="margin-top: 0.6rem;">
          <div class="category-chip ${state.filters.category === 'all' ? 'active' : ''}" data-cat="all">
            <span>✨</span>
            <span>All (${state.jobs.length})</span>
          </div>
          ${JobCategories.map(cat => {
            const count = state.jobs.filter(j => j.category === cat.id).length;
            return `
              <div class="category-chip ${state.filters.category === cat.id ? 'active' : ''}" data-cat="${cat.id}">
                <span>${cat.icon}</span>
                <span>${cat.name} ${count > 0 ? `(${count})` : ''}</span>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Nearby Microjobs -->
      <section>
        <div class="section-header">
          <h2 class="section-title">📍 Nearby Microjobs</h2>
          <span class="section-link" id="link-see-nearby">View All (${state.jobs.length})</span>
        </div>
        <div class="jobs-list" style="margin-top: 0.6rem;">
          ${nearbyJobs.map(job => renderJobCard(job)).join('')}
        </div>
      </section>

      <!-- Recommended Jobs -->
      ${recommendedJobs.length > 0 ? `
        <section>
          <div class="section-header">
            <h2 class="section-title">⚡ Recommended for You</h2>
          </div>
          <div class="jobs-list" style="margin-top: 0.6rem;">
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

  const browseAllBtn = document.getElementById('btn-home-browse-all');
  if (browseAllBtn) {
    browseAllBtn.addEventListener('click', () => {
      store.setScreen('jobs');
    });
  }

  const createJobBtn = document.getElementById('btn-home-create-job');
  if (createJobBtn) {
    createJobBtn.addEventListener('click', () => {
      store.setScreen('create');
    });
  }

  const viewAllCats = document.getElementById('link-view-all-cats');
  if (viewAllCats) {
    viewAllCats.addEventListener('click', () => {
      store.setFilter('category', 'all');
      store.setScreen('jobs');
    });
  }

  const seeNearby = document.getElementById('link-see-nearby');
  if (seeNearby) {
    seeNearby.addEventListener('click', () => {
      store.setScreen('jobs');
    });
  }

  const catChips = document.querySelectorAll('.category-chip[data-cat]');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-cat');
      store.setFilter('category', cat);
      store.setScreen('jobs');
    });
  });

  // Attach card click handlers
  const jobCards = document.querySelectorAll('.job-card[data-job-id]');
  jobCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if bookmark was clicked
      if (e.target.closest('.bookmark-btn')) return;
      const jobId = card.getAttribute('data-job-id');
      store.setState({ selectedJobId: jobId });
    });
  });

  // Bookmark buttons
  const bookmarkBtns = document.querySelectorAll('.bookmark-btn[data-bookmark-id]');
  bookmarkBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-bookmark-id');
      store.toggleBookmark(id);
    });
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
