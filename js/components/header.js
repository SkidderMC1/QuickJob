/**
 * QuickJob Top Application Header
 */
import { store } from '../state/store.js';

export function renderHeader(state) {
  const isEmployer = state.activeMode === 'post';
  const modeLabel = isEmployer ? 'Employer Mode' : 'Worker Mode';
  const modeActionText = isEmployer ? 'Switch: Find Jobs' : 'Switch: Post Job';
  const isAuth = state.isAuthenticated;
  const user = state.currentUser;

  return `
    <header class="app-header" id="app-header">
      <div class="brand-logo" id="brand-logo" style="cursor: pointer;" title="QuickJob Home">
        <div class="logo-icon">⚡</div>
        <div>Quick<span class="brand-highlight">Job</span></div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <button 
          class="mode-switch-btn ${isEmployer ? 'employer-active' : ''}" 
          id="btn-mode-switch"
          title="Toggle between finding jobs and posting jobs"
        >
          <span>${isEmployer ? '🏢' : '🔍'}</span>
          <span>${modeActionText}</span>
        </button>

        ${isAuth ? `
          <button 
            id="btn-header-profile"
            style="display: flex; align-items: center; gap: 0.25rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 20px; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; color: #1e293b;"
            title="Mein Profil (${user.name})"
          >
            <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background: #6366f1; color: #ffffff; text-align: center; line-height: 18px; font-size: 0.65rem;">
              ${(user.name || 'U').charAt(0)}
            </span>
            <span class="header-user-name" style="max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${user.name?.split(' ')[0] || 'Konto'}
            </span>
          </button>
        ` : `
          <button 
            id="btn-header-login"
            class="btn btn-primary btn-sm"
            style="padding: 0.35rem 0.65rem; font-size: 0.76rem; font-weight: 700; border-radius: 16px;"
            title="Anmelden oder Registrieren"
          >
            Anmelden
          </button>
        `}

        <button 
          id="btn-safety-modal"
          style="width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;"
          title="Safety, Minor Protection & Verification"
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
      store.setScreen('home', { selectedJobId: null, selectedConversationId: null });
    });
  }

  const modeSwitch = document.getElementById('btn-mode-switch');
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      store.toggleMode();
    });
  }

  const headerLoginBtn = document.getElementById('btn-header-login');
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', () => {
      store.setAuthMode('login');
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
