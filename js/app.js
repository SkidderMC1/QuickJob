/**
 * EasyJob Main Application Entry Point & Orchestrator
 */
import { store } from './state/store.js';
import { renderDevBar, attachDevBarEvents } from './components/devBar.js';
import { renderHeader, attachHeaderEvents } from './components/header.js';
import { renderBottomNav, attachNavEvents } from './components/nav.js';
import { renderHomeScreen, attachHomeScreenEvents } from './screens/homeScreen.js';
import { renderJobsScreen, attachJobsScreenEvents } from './screens/jobsScreen.js';
import { renderJobDetailModal, attachJobDetailEvents } from './screens/jobDetailScreen.js';
import { renderCreateJobScreen, attachCreateJobEvents } from './screens/createJobScreen.js';
import { renderMessagesScreen, attachMessagesScreenEvents } from './screens/messagesScreen.js';
import { renderProfileScreen, attachProfileScreenEvents } from './screens/profileScreen.js';
import { renderSafetyModal, attachSafetyModalEvents } from './screens/safetyModal.js';
import { renderReviewModal, attachReviewModalEvents } from './screens/reviewModal.js';
import { renderApplicantModal, attachApplicantModalEvents } from './screens/applicantModal.js';
import { renderReportModal, attachReportModalEvents } from './screens/reportModal.js';
import { renderDebugDrawer, attachDebugDrawerEvents } from './components/debugDrawer.js';
import { renderConsentBanner, attachConsentBannerEvents } from './components/consentBanner.js';
import { renderLegalModal, attachLegalModalEvents } from './screens/legalModal.js';
import { renderGuardianModal, attachGuardianModalEvents } from './screens/guardianModal.js';
import { renderAuthScreen, attachAuthScreenEvents } from './screens/authScreen.js';
import { renderLocationModal, attachLocationModalEvents } from './screens/locationModal.js';
import { renderEmergencyModal, attachEmergencyModalEvents } from './screens/emergencyModal.js';
import { renderReceiptModal, attachReceiptModalEvents } from './screens/receiptModal.js';
import { renderProofPhotoModal, attachProofPhotoModalEvents } from './screens/proofPhotoModal.js';
import { renderParentModal, attachParentModalEvents } from './screens/parentModal.js';
import { renderMapScreen, attachMapScreenEvents } from './screens/mapScreen.js';
import { renderAdminScreen, attachAdminScreenEvents } from './screens/adminScreen.js';

function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

let lastStateSnapshot = null;

// --- Modal focus management (WAI-ARIA dialog pattern) ---
// Tracks whether a modal dialog currently holds focus so we can move focus into
// it on open and restore it to the triggering control on close.
let _modalFocusActive = false;
let _preModalFocusId = null;

function getActiveModalDialog() {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'))
    .filter(d => d.getClientRects().length > 0 && window.getComputedStyle(d).display !== 'none');
  return dialogs.length ? dialogs[dialogs.length - 1] : null;
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.getClientRects().length > 0);
}

function renderApp() {
  const state = store.getState();
  const root = document.getElementById('app-root');
  if (!root) return;

  // Optimized atomic toast updater: Avoids tearing down the whole DOM on toast changes
  if (lastStateSnapshot && root.children.length > 0) {
    const isOnlyToastChange = Boolean(
      lastStateSnapshot.toast !== state.toast &&
      Object.keys(state).every(k => k === 'toast' || lastStateSnapshot[k] === state[k])
    );

    if (isOnlyToastChange) {
      lastStateSnapshot = { ...state };
      const existingToast = document.getElementById('toast-notice');
      if (!state.toast) {
        if (existingToast) existingToast.remove();
      } else {
        const toastClass = state.toast.type === 'error' ? 'toast-error' : 'toast-success';
        const icon = state.toast.type === 'error' ? '⚠️' : '✓';
        if (existingToast) {
          existingToast.className = `toast-notice ${toastClass}`;
          existingToast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${escapeHTML(state.toast.message)}</span>`;
        } else {
          const container = document.getElementById('phone-screen') || document.querySelector('.native-pwa-container') || root;
          const newToast = document.createElement('div');
          newToast.className = `toast-notice ${toastClass}`;
          newToast.id = 'toast-notice';
          newToast.setAttribute('role', 'status');
          newToast.setAttribute('aria-live', 'polite');
          newToast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${escapeHTML(state.toast.message)}</span>`;
          container.appendChild(newToast);
        }
      }
      return;
    }
  }

  lastStateSnapshot = { ...state };

  // Capture focus before the DOM is rebuilt so it can be restored on modal close.
  const activeBeforeRender = document.activeElement;

  // Sync theme
  const theme = state.activeTheme || state.currentUser?.settings?.theme || 'light';
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
  }

  // Manage body scroll lock for open modals
  const isAnyModalOpen = Boolean(
    (state.isAuthenticated && state.selectedJobId) ||
    state.isSafetyModalOpen ||
    (state.isAuthenticated && state.reviewJobId) ||
    (state.isAuthenticated && state.applicantJobId) ||
    (state.isAuthenticated && state.reportJobId) ||
    state.activeLegalDocType ||
    (state.isAuthenticated && state.isGuardianModalOpen) ||
    state.isLocationModalOpen ||
    state.isEmergencyModalOpen ||
    state.receiptModalJobId ||
    state.isProofModalOpen ||
    state.isParentModalOpen ||
    state.selectedAdminReportId ||
    state.isConsentModalOpen
  );
  if (isAnyModalOpen) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }

  const timeStr = getCurrentTimeString();
  const isNative = state.displayMode === 'native';
  const isAuth = state.isAuthenticated;

  if (isNative) {
    // 100% Native Fullscreen PWA Experience
    root.innerHTML = `
      <div class="native-pwa-container">
        <!-- EasyJob Top Bar -->
        ${renderHeader(state)}

        <!-- Scrollable Main Viewport Area -->
        <main class="app-viewport" id="app-viewport">
          ${!isAuth ? renderAuthScreen(state) : `
            ${state.currentScreen === 'home' ? renderHomeScreen(state) : ''}
            ${state.currentScreen === 'jobs' ? renderJobsScreen(state) : ''}
            ${state.currentScreen === 'map' ? renderMapScreen(state) : ''}
            ${state.currentScreen === 'admin' ? renderAdminScreen(state) : ''}
            ${state.currentScreen === 'create' ? renderCreateJobScreen(state) : ''}
            ${state.currentScreen === 'messages' ? renderMessagesScreen(state) : ''}
            ${state.currentScreen === 'profile' ? renderProfileScreen(state) : ''}
            ${state.currentScreen === 'auth' ? renderAuthScreen(state) : ''}
          `}
        </main>

        <!-- Toast Notification Banner -->
        ${state.toast ? `
          <div class="toast-notice ${state.toast.type === 'error' ? 'toast-error' : 'toast-success'}" id="toast-notice" role="status" aria-live="polite">
            <span class="toast-icon">${state.toast.type === 'error' ? '⚠️' : '✓'}</span>
            <span class="toast-text">${escapeHTML(state.toast.message)}</span>
          </div>
        ` : ''}

        <!-- Job Detail Sheet Overlay -->
        ${isAuth && state.selectedJobId ? renderJobDetailModal(state.selectedJobId, state) : ''}

        <!-- Safety & Minor Protection Modal -->
        ${renderSafetyModal(state)}

        <!-- Review & Compliments Modal -->
        ${isAuth ? renderReviewModal(state) : ''}

        <!-- Applicant Management & Selection Modal -->
        ${isAuth ? renderApplicantModal(state) : ''}

        <!-- Report Incident / Safety Violation Modal -->
        ${isAuth ? renderReportModal(state) : ''}

        <!-- Legal Documents & AGB Acceptance Modal -->
        ${renderLegalModal(state)}

        <!-- Guardian Authorization Modal (BGB §§ 107, 113) -->
        ${isAuth ? renderGuardianModal(state) : ''}

        <!-- Advanced Modals -->
        ${state.isLocationModalOpen ? renderLocationModal(state) : ''}
        ${state.isEmergencyModalOpen ? renderEmergencyModal(state) : ''}
        ${state.receiptModalJobId ? renderReceiptModal(state) : ''}
        ${state.isProofModalOpen ? renderProofPhotoModal(state) : ''}
        ${state.isParentModalOpen ? renderParentModal(state) : ''}

        <!-- Bottom Navigation Bar (Visible only when authenticated) -->
        ${isAuth ? renderBottomNav(state) : ''}

        <!-- Floating Debug Tool -->
        ${store.isNonProductionEnvironment() ? renderDebugDrawer(state) : ''}

        <!-- TDDDG § 25 Storage Consent Banner -->
        ${renderConsentBanner(state)}
      </div>
    `;
  } else {
    // Simulator Mode (Phone Bezel + Desktop Dev Bar)
    root.innerHTML = `
      <div class="preview-container">
        <!-- Desktop Dev Header Controls -->
        ${store.isNonProductionEnvironment() ? renderDevBar(state) : ''}

        <!-- Smartphone Chassis -->
        <div class="phone-bezel ${state.viewportSize}" id="phone-bezel">
          <!-- Dynamic Island / Sensor Notch -->
          <div class="dynamic-island">
            <div class="camera-lens"></div>
            <div class="sensor-dot"></div>
          </div>

          <!-- Phone Internal Screen Canvas -->
          <div class="phone-screen" id="phone-screen">
            <!-- iOS-style Status Bar -->
            <div class="phone-status-bar">
              <span style="font-weight: 700; letter-spacing: -0.02em;">${timeStr}</span>
              <div class="status-icons">
                <span title="Full 5G Cellular Signal">●●●●</span>
                <span title="High-Speed Wi-Fi">📶</span>
                <span title="Battery 98%">🔋</span>
              </div>
            </div>

            <!-- EasyJob Top Bar -->
            ${renderHeader(state)}

            <!-- Scrollable Main Viewport Area -->
            <main class="app-viewport" id="app-viewport">
              ${!isAuth ? renderAuthScreen(state) : `
                ${state.currentScreen === 'home' ? renderHomeScreen(state) : ''}
                ${state.currentScreen === 'jobs' ? renderJobsScreen(state) : ''}
                ${state.currentScreen === 'map' ? renderMapScreen(state) : ''}
                ${state.currentScreen === 'admin' ? renderAdminScreen(state) : ''}
                ${state.currentScreen === 'create' ? renderCreateJobScreen(state) : ''}
                ${state.currentScreen === 'messages' ? renderMessagesScreen(state) : ''}
                ${state.currentScreen === 'profile' ? renderProfileScreen(state) : ''}
                ${state.currentScreen === 'auth' ? renderAuthScreen(state) : ''}
              `}
            </main>

            <!-- Toast Notification Banner -->
            ${state.toast ? `
              <div class="toast-notice ${state.toast.type === 'error' ? 'toast-error' : 'toast-success'}" id="toast-notice" role="status" aria-live="polite">
                <span class="toast-icon">${state.toast.type === 'error' ? '⚠️' : '✓'}</span>
                <span class="toast-text">${escapeHTML(state.toast.message)}</span>
              </div>
            ` : ''}

            <!-- Job Detail Sheet Overlay -->
            ${isAuth && state.selectedJobId ? renderJobDetailModal(state.selectedJobId, state) : ''}

            <!-- Safety & Minor Protection Modal -->
            ${renderSafetyModal(state)}

            <!-- Review & Compliments Modal -->
            ${isAuth ? renderReviewModal(state) : ''}

            <!-- Applicant Management & Selection Modal -->
            ${isAuth ? renderApplicantModal(state) : ''}

            <!-- Report Incident / Safety Violation Modal -->
            ${isAuth ? renderReportModal(state) : ''}

            <!-- Legal Documents & AGB Acceptance Modal -->
            ${renderLegalModal(state)}

            <!-- Guardian Authorization Modal (BGB §§ 107, 113) -->
            ${isAuth ? renderGuardianModal(state) : ''}

            <!-- Advanced Modals -->
            ${state.isLocationModalOpen ? renderLocationModal(state) : ''}
            ${state.isEmergencyModalOpen ? renderEmergencyModal(state) : ''}
            ${state.receiptModalJobId ? renderReceiptModal(state) : ''}
            ${state.isProofModalOpen ? renderProofPhotoModal(state) : ''}
            ${state.isParentModalOpen ? renderParentModal(state) : ''}

            <!-- Bottom Navigation Bar (Visible only when authenticated) -->
            ${isAuth ? renderBottomNav(state) : ''}

            <!-- iOS Home Indicator -->
            <div class="phone-home-indicator"></div>
          </div>
        </div>

        <!-- Floating Debug Tool -->
        ${store.isNonProductionEnvironment() ? renderDebugDrawer(state) : ''}

        <!-- TDDDG § 25 Storage Consent Banner -->
        ${renderConsentBanner(state)}
      </div>
    `;
  }

  // Modal focus management: when a dialog is (re)rendered/open, move focus into
  // it; when it closes, restore focus to the control that opened it.
  const activeDialog = getActiveModalDialog();
  if (activeDialog) {
    if (!_modalFocusActive) {
      _modalFocusActive = true;
      _preModalFocusId = (activeBeforeRender && activeBeforeRender.id) ? activeBeforeRender.id : null;
      const focusables = getFocusableElements(activeDialog);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!activeDialog.hasAttribute('tabindex')) activeDialog.setAttribute('tabindex', '-1');
        activeDialog.focus();
      }
    } else if (!activeDialog.contains(document.activeElement)) {
      const focusables = getFocusableElements(activeDialog);
      if (focusables.length > 0) focusables[0].focus();
    }
  } else if (_modalFocusActive) {
    _modalFocusActive = false;
    const prevId = _preModalFocusId;
    _preModalFocusId = null;
    if (prevId) {
      const target = document.getElementById(prevId);
      if (target && typeof target.focus === 'function') target.focus();
    }
  }

  // Attach interactive events
  if (!isNative && store.isNonProductionEnvironment()) attachDevBarEvents();
  attachHeaderEvents();
  if (isAuth) attachNavEvents();
  if (store.isNonProductionEnvironment()) attachDebugDrawerEvents();
  attachConsentBannerEvents();

  if (!isAuth) {
    attachAuthScreenEvents();
  } else {
    if (state.currentScreen === 'home') attachHomeScreenEvents();
    if (state.currentScreen === 'jobs') attachJobsScreenEvents();
    if (state.currentScreen === 'map') attachMapScreenEvents();
    if (state.currentScreen === 'admin') attachAdminScreenEvents();
    if (state.currentScreen === 'create') attachCreateJobEvents();
    if (state.currentScreen === 'messages') attachMessagesScreenEvents();
    if (state.currentScreen === 'profile') attachProfileScreenEvents();
    if (state.currentScreen === 'auth') attachAuthScreenEvents();
  }

  if (isAuth && state.selectedJobId) attachJobDetailEvents();
  if (state.isSafetyModalOpen) attachSafetyModalEvents();
  if (isAuth && state.reviewJobId) attachReviewModalEvents();
  if (isAuth && state.applicantJobId) attachApplicantModalEvents();
  if (isAuth && state.reportJobId) attachReportModalEvents();
  if (state.activeLegalDocType) attachLegalModalEvents();
  if (isAuth && state.isGuardianModalOpen) attachGuardianModalEvents();

  // Advanced modal event listeners
  if (state.isLocationModalOpen) attachLocationModalEvents();
  if (state.isEmergencyModalOpen) attachEmergencyModalEvents();
  if (state.receiptModalJobId) attachReceiptModalEvents();
  if (state.isProofModalOpen) attachProofPhotoModalEvents();
  if (state.isParentModalOpen) attachParentModalEvents();
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Initial mount & store subscription
window.store = store;
document.addEventListener('DOMContentLoaded', () => {
  // Check URL query parameters for verification or reset tokens
  try {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify_token');
    const resetToken = params.get('reset_token');

    if (verifyToken) {
      store.setAuthMode('verify_email', verifyToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (resetToken) {
      store.setAuthMode('reset_password', resetToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (e) {
    console.warn('URL param parse error', e);
  }

  // Global Escape Key Listener for Modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const state = store.getState();
      if (state.selectedJobId || state.isSafetyModalOpen || state.reviewJobId || 
          state.applicantJobId || state.reportJobId || state.activeLegalDocType || 
          state.isGuardianModalOpen || state.isLocationModalOpen || state.isEmergencyModalOpen ||
          state.receiptModalJobId || state.isProofModalOpen || state.isParentModalOpen ||
          state.selectedAdminReportId || state.isConsentModalOpen) {
        store.setState({
          selectedJobId: null,
          isSafetyModalOpen: false,
          reviewJobId: null,
          applicantJobId: null,
          reportJobId: null,
          activeLegalDocType: null,
          isGuardianModalOpen: false,
          isLocationModalOpen: false,
          isEmergencyModalOpen: false,
          receiptModalJobId: null,
          isProofModalOpen: false,
          isParentModalOpen: false,
          selectedAdminReportId: null,
          isConsentModalOpen: false
        });
      }
    }

    // Trap Tab focus within the currently open modal dialog (WAI-ARIA).
    if (e.key === 'Tab') {
      const dialog = getActiveModalDialog();
      if (dialog) {
        const focusables = getFocusableElements(dialog);
        if (focusables.length === 0) {
          e.preventDefault();
        } else {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement;
          if (e.shiftKey) {
            if (active === first || !dialog.contains(active)) {
              e.preventDefault();
              last.focus();
            }
          } else if (active === last || !dialog.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    // Quick Search Shortcut: Ctrl+K / Cmd+K or '/'
    const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                      document.activeElement?.isContentEditable;
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !isEditing)) {
      e.preventDefault();
      const state = store.getState();
      if (state.currentScreen === 'home') {
        const homeInput = document.getElementById('home-search-input');
        if (homeInput) {
          homeInput.focus();
          homeInput.select();
        }
      } else {
        if (state.currentScreen !== 'jobs') {
          store.setScreen('jobs');
        }
        setTimeout(() => {
          const jobsInput = document.getElementById('jobs-search-input');
          if (jobsInput) {
            jobsInput.focus();
            jobsInput.select();
          }
        }, 60);
      }
    }
  });

  renderApp();
  store.subscribe(() => {
    renderApp();
  });
});
