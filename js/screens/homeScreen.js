/**
 * EasyJob Mobile Home Screen View
 * Redesigned for mobile-first visual excellence, rapid scannability, and clear information hierarchy.
 */
import { store } from '../state/store.js';
import { JobCategories } from '../models/types.js';
import { renderJobCard } from '../components/jobCard.js';
import { isMinorUser } from '../legal/legalEngine.js';

export function renderHomeScreen(state) {
  const user = state.currentUser || {};
  const isMinor = isMinorUser(user);
  
  // Filter jobs safe for minors
  const availableJobs = state.jobs.filter(j => 
    !isMinor || (j.minAge <= 17 && j.category !== 'disposal')
  );
  
  const nearbyJobs = availableJobs.slice(0, 3);
  const recommendedJobs = availableJobs.slice(3, 6);
  const totalCount = availableJobs.length;

  return `
    <div class="screen-container home-screen-container" id="screen-home">
      <!-- 1. Compact Header / Hero Greeting (Decluttered) -->
      <section class="home-greeting-section" style="margin-bottom: -0.35rem;">
        <div>
          <span class="home-greeting-sub" style="font-size: 0.76rem; color: var(--qj-text-muted); font-weight: 600;">Welcome back,</span>
          <h1 class="home-greeting" style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; margin-top: 1px;">${escapeHTML(user.name || 'Member')} 👋</h1>
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
        ${state.filters.query ? '<button id="btn-clear-home-search" style="color: #94a3b8; font-size: 0.9rem;">✕</button>' : '<span class="search-kbd-hint" title="Taste / für Schnellsuche" style="font-size: 0.72rem; color: var(--qj-text-subtle); background: var(--qj-surface-muted); border: 1px solid var(--qj-border); padding: 1px 6px; border-radius: 4px; font-family: var(--qj-font-mono); font-weight: 700; user-select: none;">/</span>'}
      </div>

      <!-- 3. Categories: Horizontally Scrollable Chips -->
      <section class="home-categories-section">
        <div class="section-header">
          <h2 class="section-title">Categories</h2>
          <span class="section-link" id="link-view-all-cats">See all →</span>
        </div>
        <div class="category-scroll" id="home-category-chips">
          <div class="category-chip ${state.filters.category === 'all' ? 'active' : ''}" data-cat="all" role="button" tabindex="0" aria-pressed="${state.filters.category === 'all'}">
            <span>✨ Alle ${totalCount}</span>
          </div>
          ${JobCategories.map(cat => {
            const count = availableJobs.filter(j => j.category === cat.id).length;
            return `
              <div class="category-chip ${state.filters.category === cat.id ? 'active' : ''}" data-cat="${cat.id}" role="button" tabindex="0" aria-pressed="${state.filters.category === cat.id}">
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

// Persistent search debounce & focus retention across re-renders
let homeSearchTimer = null;
let homeSearchShouldRefocus = false;

export function attachHomeScreenEvents() {
  const searchInput = document.getElementById('home-search-input');
  if (searchInput) {
    if (homeSearchShouldRefocus) {
      searchInput.focus();
      const end = searchInput.value.length;
      try { searchInput.setSelectionRange(end, end); } catch (e) { /* noop */ }
      homeSearchShouldRefocus = false;
    }

    const executeHomeSearch = (val) => {
      homeSearchTimer = null;
      const state = store.getState();
      if (state.currentScreen !== 'home') return;
      const currentQ = state.filters.query || '';
      if (val !== currentQ) {
        homeSearchShouldRefocus = true;
        store.setFilter('query', val);
      }
    };

    // Fast 200ms debounce
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (homeSearchTimer) clearTimeout(homeSearchTimer);
      homeSearchTimer = setTimeout(() => {
        executeHomeSearch(val);
      }, 200);
    });

    // Immediate search when pressing Enter / blur; cancel and blur on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (homeSearchTimer) clearTimeout(homeSearchTimer);
        executeHomeSearch(searchInput.value);
        store.setScreen('jobs');
      } else if (e.key === 'Escape') {
        if (homeSearchTimer) clearTimeout(homeSearchTimer);
        homeSearchTimer = null;
        homeSearchShouldRefocus = false;
        searchInput.blur();
      }
    });

    // Immediate search when clicking out (blur)
    searchInput.addEventListener('blur', () => {
      if (homeSearchTimer) clearTimeout(homeSearchTimer);
      executeHomeSearch(searchInput.value);
    });
  }

  const clearBtn = document.getElementById('btn-clear-home-search');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (homeSearchTimer) clearTimeout(homeSearchTimer);
      homeSearchTimer = null;
      store.setFilter('query', '');
    });
  }

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
    const selectCategory = () => {
      const cat = chip.getAttribute('data-cat');
      store.setFilter('category', cat);
      store.setScreen('jobs', { jobsViewMode: 'list' });
    };
    chip.addEventListener('click', selectCategory);
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCategory();
      }
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
