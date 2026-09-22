/**
 * QuickJob Jobs Discovery & Filter Screen
 */
import { store } from '../state/store.js';
import { JobCategories } from '../models/types.js';
import { renderJobCard } from '../components/jobCard.js';

export function renderJobsScreen(state) {
  const user = state.currentUser;
  const isMinor = user.ageCategory === 'YOUTH_14_17';
  const filters = state.filters;

  // Filter jobs
  let filtered = state.jobs.filter(job => {
    // Quick Filter Logic
    if (filters.quickFilter === 'direct' && job.applicationMode !== 'DIRECT_ACCEPT') return false;
    if (filters.quickFilter === 'near' && job.distanceKm > 2) return false;
    if (filters.quickFilter === 'high_pay' && job.payment < 30) return false;
    if (filters.quickFilter === 'youth') {
      if (job.minAge && job.minAge > 17) return false;
      if (job.category === 'disposal') return false;
    }

    // Category filter
    if (filters.category !== 'all' && job.category !== filters.category) {
      return false;
    }

    // Search query
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchDesc = job.description.toLowerCase().includes(q);
      const matchLoc = job.approxLocation.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }

    // Min payment
    if (filters.minPayment > 0 && job.payment < filters.minPayment) {
      return false;
    }

    // Max distance
    if (filters.maxDistanceKm < 10 && job.distanceKm > filters.maxDistanceKm) {
      return false;
    }

    // Age restriction check
    if (filters.onlySuitableForMyAge && isMinor) {
      if (job.minAge && job.minAge > 17) return false;
      if (job.category === 'disposal') return false; // hazardous heavy bulk waste restricted
    }

    return true;
  });

  // Sort jobs
  filtered.sort((a, b) => {
    if (filters.sortBy === 'closest') {
      return a.distanceKm - b.distanceKm;
    }
    if (filters.sortBy === 'highest_pay') {
      return b.payment - a.payment;
    }
    return 0;
  });

  const activeQuick = filters.quickFilter || 'all';

  return `
    <div class="screen-container" id="screen-jobs">
      <!-- Search & Filter Controls -->
      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        <div class="search-box">
          <span style="color: #94a3b8;">🔍</span>
          <input 
            type="text" 
            id="jobs-search-input" 
            placeholder="Search by keyword, location, skill..." 
            value="${escapeHTML(filters.query)}"
          />
          ${filters.query ? '<button id="btn-clear-jobs-search" style="color: #94a3b8;">✕</button>' : ''}
        </div>

        <!-- 1-Tap Quick Action Filter Pills -->
        <div class="quick-filter-pills" id="jobs-quick-pills">
          <button class="quick-filter-pill ${activeQuick === 'all' ? 'active' : ''}" data-quick="all">
            <span>✨</span><span>Alle</span>
          </button>
          <button class="quick-filter-pill ${activeQuick === 'direct' ? 'active' : ''}" data-quick="direct">
            <span>⚡</span><span>Sofort-Zuschlag</span>
          </button>
          <button class="quick-filter-pill ${activeQuick === 'youth' ? 'active' : ''}" data-quick="youth">
            <span>🛡️</span><span>Jugend-konform</span>
          </button>
          <button class="quick-filter-pill ${activeQuick === 'near' ? 'active' : ''}" data-quick="near">
            <span>📍</span><span>Unter 2 km</span>
          </button>
          <button class="quick-filter-pill ${activeQuick === 'high_pay' ? 'active' : ''}" data-quick="high_pay">
            <span>💰</span><span>Ab 30 €</span>
          </button>
        </div>

        <!-- Filter Row -->
        <div class="filter-row">
          <select class="filter-select" id="filter-sort">
            <option value="closest" ${filters.sortBy === 'closest' ? 'selected' : ''}>Sort: Closest</option>
            <option value="highest_pay" ${filters.sortBy === 'highest_pay' ? 'selected' : ''}>Sort: Highest Pay</option>
          </select>

          <select class="filter-select" id="filter-distance">
            <option value="10" ${filters.maxDistanceKm >= 10 ? 'selected' : ''}>Distance: All (<10 km)</option>
            <option value="2" ${filters.maxDistanceKm === 2 ? 'selected' : ''}>Distance: < 2 km</option>
            <option value="5" ${filters.maxDistanceKm === 5 ? 'selected' : ''}>Distance: < 5 km</option>
          </select>

          <select class="filter-select" id="filter-pay">
            <option value="0" ${filters.minPayment === 0 ? 'selected' : ''}>Min Pay: All</option>
            <option value="25" ${filters.minPayment === 25 ? 'selected' : ''}>Min: €25+</option>
            <option value="40" ${filters.minPayment === 40 ? 'selected' : ''}>Min: €40+</option>
          </select>
        </div>

        <!-- Age Filter Banner / Toggle -->
        ${isMinor ? `
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: var(--qj-radius-sm); padding: 0.5rem 0.75rem; display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.76rem; color: #5b21b6; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;">
              <span>🛡️</span>
              <span>Jugendschutz aktiv (14–17 Jahre)</span>
            </div>
            <label style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #6b21a8; font-weight: 700; cursor: pointer;">
              <input type="checkbox" id="check-age-filter" ${filters.onlySuitableForMyAge ? 'checked' : ''} />
              <span>Safe for me</span>
            </label>
          </div>
        ` : ''}

        <!-- Category Scroll Bar -->
        <div class="category-scroll">
          <div class="category-chip ${filters.category === 'all' ? 'active' : ''}" data-cat="all">
            <span>✨</span>
            <span>All</span>
          </div>
          ${JobCategories.map(cat => `
            <div class="category-chip ${filters.category === cat.id ? 'active' : ''}" data-cat="${cat.id}">
              <span>${cat.icon}</span>
              <span>${cat.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Results Count Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--qj-text-muted);">
          Showing ${filtered.length} microjob${filtered.length === 1 ? '' : 's'}
        </span>
        ${(filters.category !== 'all' || filters.query || filters.minPayment > 0 || filters.maxDistanceKm < 10) ? `
          <button id="btn-reset-filters" style="font-size: 0.78rem; color: var(--qj-primary); font-weight: 700;">
            Clear filters
          </button>
        ` : ''}
      </div>

      <!-- Job Cards List -->
      ${filtered.length > 0 ? `
        <div class="jobs-list" id="jobs-cards-container">
          ${filtered.map(job => renderJobCard(job)).join('')}
        </div>
      ` : `
        <!-- Empty State -->
        <div style="text-align: center; padding: 3rem 1.5rem; background: #ffffff; border: 1px dashed var(--qj-border); border-radius: var(--qj-radius-lg); margin-top: 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 style="font-size: 1.1rem; font-weight: 700;">No microjobs found</h3>
          <p style="font-size: 0.85rem; color: var(--qj-text-muted); margin: 0.35rem 0 1.25rem 0;">
            No active jobs match your current search or distance filters.
          </p>
          <button class="btn btn-primary btn-sm" id="btn-empty-reset">
            Reset all filters
          </button>
        </div>
      `}
    </div>
  `;
}

export function attachJobsScreenEvents() {
  const searchInput = document.getElementById('jobs-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.setFilter('query', e.target.value);
    });
  }

  const clearBtn = document.getElementById('btn-clear-jobs-search');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      store.setFilter('query', '');
    });
  }

  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      store.setFilter('sortBy', e.target.value);
    });
  }

  const distSelect = document.getElementById('filter-distance');
  if (distSelect) {
    distSelect.addEventListener('change', (e) => {
      store.setFilter('maxDistanceKm', Number(e.target.value));
    });
  }

  const paySelect = document.getElementById('filter-pay');
  if (paySelect) {
    paySelect.addEventListener('change', (e) => {
      store.setFilter('minPayment', Number(e.target.value));
    });
  }

  const ageCheck = document.getElementById('check-age-filter');
  if (ageCheck) {
    ageCheck.addEventListener('change', (e) => {
      store.setFilter('onlySuitableForMyAge', e.target.checked);
    });
  }

  const resetBtns = [document.getElementById('btn-reset-filters'), document.getElementById('btn-empty-reset')];
  resetBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        store.resetFilters();
      });
    }
  });

  const catChips = document.querySelectorAll('.category-chip[data-cat]');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-cat');
      store.setFilter('category', cat);
    });
  });

  // Quick filter pills
  const quickPills = document.querySelectorAll('.quick-filter-pill[data-quick]');
  quickPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const q = pill.getAttribute('data-quick');
      store.setFilter('quickFilter', q === 'all' ? null : q);
    });
  });

  // Card clicks
  const jobCards = document.querySelectorAll('.job-card[data-job-id]');
  jobCards.forEach(card => {
    card.addEventListener('click', (e) => {
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
