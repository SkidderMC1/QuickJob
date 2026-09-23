/**
 * QuickJob Main Application Entry Point & Orchestrator
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

function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function renderApp() {
  const state = store.getState();
  const root = document.getElementById('app-root');
  if (!root) return;

  const timeStr = getCurrentTimeString();
  const isNative = state.displayMode === 'native';
  const isAuth = state.isAuthenticated;

  if (isNative) {
    // 100% Native Fullscreen PWA Experience
    root.innerHTML = `
      <div class="native-pwa-container">
        <!-- QuickJob Top Bar -->
        ${renderHeader(state)}

        <!-- Scrollable Main Viewport Area -->
        <main class="app-viewport" id="app-viewport">
          ${!isAuth ? renderAuthScreen(state) : `
            ${state.currentScreen === 'home' ? renderHomeScreen(state) : ''}
            ${state.currentScreen === 'jobs' ? renderJobsScreen(state) : ''}
            ${state.currentScreen === 'create' ? renderCreateJobScreen(state) : ''}
            ${state.currentScreen === 'messages' ? renderMessagesScreen(state) : ''}
            ${state.currentScreen === 'profile' ? renderProfileScreen(state) : ''}
            ${state.currentScreen === 'auth' ? renderAuthScreen(state) : ''}
          `}
        </main>

        <!-- Toast Notification Banner -->
        ${state.toast ? `
          <div class="toast-notice" id="toast-notice">
            <span>${state.toast.type === 'error' ? '⚠️' : '✓'}</span>
            <span>${escapeHTML(state.toast.message)}</span>
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

        <!-- Bottom Navigation Bar (Visible only when authenticated) -->
        ${isAuth ? renderBottomNav(state) : ''}

        <!-- Floating Debug Tool -->
        ${renderDebugDrawer(state)}

        <!-- TDDDG § 25 Storage Consent Banner -->
        ${renderConsentBanner(state)}
      </div>
    `;
  } else {
    // Simulator Mode (Phone Bezel + Desktop Dev Bar)
    root.innerHTML = `
      <div class="preview-container">
        <!-- Desktop Dev Header Controls -->
        ${renderDevBar(state)}

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

            <!-- QuickJob Top Bar -->
            ${renderHeader(state)}

            <!-- Scrollable Main Viewport Area -->
            <main class="app-viewport" id="app-viewport">
              ${!isAuth ? renderAuthScreen(state) : `
                ${state.currentScreen === 'home' ? renderHomeScreen(state) : ''}
                ${state.currentScreen === 'jobs' ? renderJobsScreen(state) : ''}
                ${state.currentScreen === 'create' ? renderCreateJobScreen(state) : ''}
                ${state.currentScreen === 'messages' ? renderMessagesScreen(state) : ''}
                ${state.currentScreen === 'profile' ? renderProfileScreen(state) : ''}
                ${state.currentScreen === 'auth' ? renderAuthScreen(state) : ''}
              `}
            </main>

            <!-- Toast Notification Banner -->
            ${state.toast ? `
              <div class="toast-notice" id="toast-notice">
                <span>${state.toast.type === 'error' ? '⚠️' : '✓'}</span>
                <span>${escapeHTML(state.toast.message)}</span>
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

            <!-- Bottom Navigation Bar (Visible only when authenticated) -->
            ${isAuth ? renderBottomNav(state) : ''}

            <!-- iOS Home Indicator -->
            <div class="phone-home-indicator"></div>
          </div>
        </div>

        <!-- Floating Debug Tool -->
        ${renderDebugDrawer(state)}

        <!-- TDDDG § 25 Storage Consent Banner -->
        ${renderConsentBanner(state)}
      </div>
    `;
  }

  // Attach interactive events
  if (!isNative) attachDevBarEvents();
  attachHeaderEvents();
  if (isAuth) attachNavEvents();
  attachDebugDrawerEvents();
  attachConsentBannerEvents();

  if (!isAuth) {
    attachAuthScreenEvents();
  } else {
    if (state.currentScreen === 'home') attachHomeScreenEvents();
    if (state.currentScreen === 'jobs') attachJobsScreenEvents();
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

  renderApp();
  store.subscribe(() => {
    renderApp();
  });
});
