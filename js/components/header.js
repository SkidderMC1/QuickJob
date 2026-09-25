/**
 * QuickJob Top Application Header
 */
import { store } from '../state/store.js';

export function renderHeader(state) {
  const isAuth = state.isAuthenticated;
  const user = state.currentUser;

  return `
    <header class="app-header" id="app-header">
      <div class="brand-logo" id="brand-logo" style="cursor: pointer;" title="QuickJob">
        <div class="logo-icon">⚡</div>
        <div>Quick<span class="brand-highlight">Job</span></div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.45rem;">
        ${isAuth && user ? `
          <button 
            id="btn-header-profile"
            class="header-avatar-btn"
            style="display: flex; align-items: center; justify-content: center; background: none; border: none; padding: 2px; cursor: pointer; border-radius: 50%;"
            title="Mein Profil (${escapeHTML(user.name)})"
          >
            ${(user.avatarUrl || user.profilePicture) ? `
              <img 
                src="${escapeHTML(user.avatarUrl || user.profilePicture)}" 
                alt="${escapeHTML(user.name)}" 
                id="header-user-avatar-img"
                style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #0ea76b; box-shadow: 0 2px 6px rgba(14, 167, 107, 0.25);"
              />
            ` : `
              <div 
                id="header-user-avatar-letter"
                style="width: 36px; height: 36px; border-radius: 50%; background: #0ea76b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 800; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(14, 167, 107, 0.25);"
              >
                ${(user.name || 'U').charAt(0).toUpperCase()}
              </div>
            `}
          </button>
        ` : ''}

        <!-- Hidden triggers preserved for test and script compatibility -->
        <button id="btn-header-map" style="display: none;" aria-hidden="true"></button>
        <button id="btn-safety-modal" style="display: none;" aria-hidden="true"></button>
      </div>
    </header>
  `;
}

export function attachHeaderEvents() {
  const brandLogo = document.getElementById('brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', () => {
      if (store.getState().isAuthenticated) {
        store.setScreen('home', { selectedJobId: null, selectedConversationId: null });
      } else {
        store.setAuthMode('login');
      }
    });
  }

  const headerProfileBtn = document.getElementById('btn-header-profile');
  if (headerProfileBtn) {
    headerProfileBtn.addEventListener('click', () => {
      store.setScreen('profile');
    });
  }

  const headerMapBtn = document.getElementById('btn-header-map');
  if (headerMapBtn) {
    headerMapBtn.addEventListener('click', () => {
      store.setScreen('jobs', { selectedJobId: null, selectedConversationId: null, jobsViewMode: 'map' });
      if (store.getState().locationPermissionGranted === null) {
        store.setState({ isLocationModalOpen: true });
      }
    });
  }

  const safetyBtn = document.getElementById('btn-safety-modal');
  if (safetyBtn) {
    safetyBtn.addEventListener('click', () => {
      store.setState({ isSafetyModalOpen: true });
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
