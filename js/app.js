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
import { renderDebugDrawer, attachDebugDrawerEvents } from './components/debugDrawer.js';

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

  if (isNative) {
    // 100% Native Fullscreen PWA Experience
    root.innerHTML = `
      <div class="native-pwa-container">
        <!-- QuickJob Top Bar -->
        ${renderHeader(state)}

        <!-- Scrollable Main Viewport Area -->
        <main class="app-viewport" id="app-viewport">
          ${state.currentScreen === 'home' ? renderHomeScreen(state) : ''}
          ${state.currentScreen === 'jobs' ? renderJobsScreen(state) : ''}
          ${state.currentScreen === 'create' ? renderCreateJobScreen(state) : ''}
          ${state.currentScreen === 'messages' ? renderMessagesScreen(state) : ''}
          ${state.currentScreen === 'profile' ? renderProfileScreen(state) : ''}
        </main>

        <!-- Toast Notification Banner -->
        ${state.toast ? `
          <div class="toast-notice" id="toast-notice">
            <span>${state.toast.type === 'error' ? '⚠️' : '✓'}</span>
            <span>${escapeHTML(state.toast.message)}</span>
          </div>
        ` : ''}

        <!-- Job Detail Sheet Overlay -->
        ${state.selectedJobId ? renderJobDetailModal(state.selectedJobId, state) : ''}

        <!-- Safety & Minor Protection Modal -->
        ${renderSafetyModal(state)}

        <!-- Bottom Navigation Bar -->
        ${renderBottomNav(state)}

        <!-- Floating Debug Tool -->
        ${renderDebugDrawer(state)}
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
              ${state.currentScreen === 'home' ? renderHomeScreen(state) : ''}
              ${state.currentScreen === 'jobs' ? renderJobsScreen(state) : ''}
              ${state.currentScreen === 'create' ? renderCreateJobScreen(state) : ''}
              ${state.currentScreen === 'messages' ? renderMessagesScreen(state) : ''}
              ${state.currentScreen === 'profile' ? renderProfileScreen(state) : ''}
            </main>

            <!-- Toast Notification Banner -->
            ${state.toast ? `
              <div class="toast-notice" id="toast-notice">
                <span>${state.toast.type === 'error' ? '⚠️' : '✓'}</span>
                <span>${escapeHTML(state.toast.message)}</span>
              </div>
            ` : ''}

            <!-- Job Detail Sheet Overlay -->
            ${state.selectedJobId ? renderJobDetailModal(state.selectedJobId, state) : ''}

            <!-- Safety & Minor Protection Modal -->
            ${renderSafetyModal(state)}

            <!-- Bottom Navigation Bar -->
            ${renderBottomNav(state)}

            <!-- iOS Home Indicator -->
            <div class="phone-home-indicator"></div>
          </div>
        </div>

        <!-- Floating Debug Tool -->
        ${renderDebugDrawer(state)}
      </div>
    `;
  }

  // Attach interactive events
  if (!isNative) attachDevBarEvents();
  attachHeaderEvents();
  attachNavEvents();
  attachDebugDrawerEvents();

  if (state.currentScreen === 'home') attachHomeScreenEvents();
  if (state.currentScreen === 'jobs') attachJobsScreenEvents();
  if (state.currentScreen === 'create') attachCreateJobEvents();
  if (state.currentScreen === 'messages') attachMessagesScreenEvents();
  if (state.currentScreen === 'profile') attachProfileScreenEvents();

  if (state.selectedJobId) attachJobDetailEvents();
  if (state.isSafetyModalOpen) attachSafetyModalEvents();
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Initial mount & store subscription
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  store.subscribe(() => {
    renderApp();
  });
});
