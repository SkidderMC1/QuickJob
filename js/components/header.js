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
            style="display: flex; align-items: center; gap: 0.35rem; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 20px; padding: 0.28rem 0.7rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; color: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
            title="Mein Profil (${escapeHTML(user.name)})"
          >
            <span style="display: inline-block; width: 22px; height: 22px; border-radius: 50%; background: #0ea76b; color: #ffffff; text-align: center; line-height: 22px; font-size: 0.72rem; font-weight: 800;">
              ${(user.name || 'U').charAt(0)}
            </span>
            <span class="header-user-name" style="max-width: 95px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHTML(user.name?.split(' ')[0] || 'Konto')}
            </span>
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
