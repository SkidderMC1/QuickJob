/**
 * QuickJob Ergonomic Bottom Navigation Component
 */
import { store } from '../state/store.js';

export function renderBottomNav(state) {
  const currentScreen = state.currentScreen;
  const unreadMessages = state.conversations ? state.conversations.length : 0;
  const isMapActive = currentScreen === 'jobs' && state.jobsViewMode === 'map';
  const isJobsActive = currentScreen === 'jobs' && state.jobsViewMode !== 'map';

  return `
    <nav class="bottom-nav" id="bottom-nav">
      <button class="nav-item ${currentScreen === 'home' ? 'active' : ''}" data-screen="home" id="nav-home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Home</span>
      </button>

      <button class="nav-item ${isJobsActive ? 'active' : ''}" data-screen="jobs" id="nav-jobs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        <span>Jobs</span>
      </button>

      <button class="nav-item ${isMapActive ? 'active' : ''}" data-screen="map" id="nav-map" title="Umkreis-Karte">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
        <span>Karte</span>
      </button>

      <button class="nav-item ${currentScreen === 'create' ? 'active' : ''}" data-screen="create" id="nav-create">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span>Create</span>
      </button>

      <button class="nav-item ${currentScreen === 'messages' ? 'active' : ''}" data-screen="messages" id="nav-messages">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        ${unreadMessages > 0 ? `<span class="nav-badge">${unreadMessages}</span>` : ''}
        <span>Messages</span>
      </button>

      <button class="nav-item ${currentScreen === 'profile' ? 'active' : ''}" data-screen="profile" id="nav-profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  `;
}

export function attachNavEvents() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const screen = item.getAttribute('data-screen');
      if (screen === 'map') {
        store.setScreen('jobs', { selectedJobId: null, selectedConversationId: null, jobsViewMode: 'map' });
        if (store.getState().locationPermissionGranted === null) {
          store.setState({ isLocationModalOpen: true });
        }
      } else if (screen === 'jobs') {
        store.setScreen('jobs', { selectedJobId: null, selectedConversationId: null, jobsViewMode: 'list' });
      } else if (screen) {
        store.setScreen(screen, { selectedJobId: null, selectedConversationId: null });
      }
    });
  });
}
