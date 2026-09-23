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
            style="display: flex; align-items: center; gap: 0.3rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 20px; padding: 0.28rem 0.65rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; color: #1e293b;"
            title="Mein Profil (${user.name})"
          >
            <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: #0ea76b; color: #ffffff; text-align: center; line-height: 20px; font-size: 0.7rem; font-weight: 800;">
              ${(user.name || 'U').charAt(0)}
            </span>
            <span class="header-user-name" style="max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${user.name?.split(' ')[0] || 'Konto'}
            </span>
          </button>
        ` : ''}

        <button 
          id="btn-safety-modal"
          style="width: 34px; height: 34px; border-radius: 50%; background: #f1f5f9; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer;"
          title="Safety, Jugendschutz & Verifikation"
        >
          🛡️
        </button>
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

  const safetyBtn = document.getElementById('btn-safety-modal');
  if (safetyBtn) {
    safetyBtn.addEventListener('click', () => {
      store.setState({ isSafetyModalOpen: true });
    });
  }
}
