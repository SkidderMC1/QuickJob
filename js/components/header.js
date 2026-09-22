/**
 * QuickJob Top Application Header
 */
import { store } from '../state/store.js';

export function renderHeader(state) {
  const isEmployer = state.activeMode === 'post';
  const modeLabel = isEmployer ? 'Employer Mode' : 'Worker Mode';
  const modeActionText = isEmployer ? 'Switch: Find Jobs' : 'Switch: Post Job';

  return `
    <header class="app-header" id="app-header">
      <div class="brand-logo" id="brand-logo" style="cursor: pointer;" title="QuickJob Home">
        <div class="logo-icon">⚡</div>
        <div>Quick<span class="brand-highlight">Job</span></div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button 
          class="mode-switch-btn ${isEmployer ? 'employer-active' : ''}" 
          id="btn-mode-switch"
          title="Toggle between finding jobs and posting jobs"
        >
          <span>${isEmployer ? '🏢' : '🔍'}</span>
          <span>${modeActionText}</span>
        </button>

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

  const safetyBtn = document.getElementById('btn-safety-modal');
  if (safetyBtn) {
    safetyBtn.addEventListener('click', () => {
      store.setState({ isSafetyModalOpen: true });
    });
  }
}
