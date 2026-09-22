/**
 * QuickJob Floating Debug Drawer Component
 * Allows testing personas, modes, and resetting data inside the real PWA full-screen app
 */
import { store } from '../state/store.js';

export function renderDebugDrawer(state) {
  const isDrawerOpen = state.isDebugDrawerOpen;
  const currentPersona = state.currentPersonaKey;
  const currentMode = state.activeMode;
  const displayMode = state.displayMode;

  return `
    <!-- Floating Debug Trigger Pill -->
    <div 
      id="debug-floating-trigger"
      style="position: fixed; bottom: 74px; right: 12px; z-index: 9999; display: flex; align-items: center; gap: 4px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: white; padding: 6px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); cursor: pointer; user-select: none;"
      title="Open Developer & Tester Tools"
    >
      <span style="font-size: 0.9rem;">🛠️</span>
      <span>Debug</span>
    </div>

    <!-- Slide-up Debug Drawer Modal -->
    ${isDrawerOpen ? `
      <div class="modal-overlay" id="debug-drawer-overlay" style="z-index: 10000;">
        <div class="modal-sheet" style="max-height: 80%; border-radius: 20px 20px 0 0; background: #0f172a; color: #f8fafc; border: 1px solid #334155;">
          <div class="modal-grabber" style="background: #475569;"></div>
          
          <div class="modal-header" style="border-bottom: 1px solid #1e293b; padding: 1rem 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.2rem;">🛠️</span>
              <h3 style="font-size: 1rem; font-weight: 800; color: #ffffff;">QuickJob Tester & Debug Console</h3>
            </div>
            <button id="btn-close-debug-drawer" style="color: #94a3b8; font-size: 1.25rem;">✕</button>
          </div>

          <div class="modal-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1.2rem;">
            <!-- Display Mode Switch -->
            <div style="background: #1e293b; border-radius: 12px; padding: 0.85rem; border: 1px solid #334155;">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 0.5rem;">
                Ansichtsmodus (View Mode)
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button 
                  class="btn btn-sm ${displayMode === 'native' ? 'btn-primary' : 'btn-secondary'}" 
                  id="btn-switch-native"
                  style="flex: 1;"
                >
                  📱 Echte Vollbild-App (PWA)
                </button>
                <button 
                  class="btn btn-sm ${displayMode === 'simulator' ? 'btn-primary' : 'btn-secondary'}" 
                  id="btn-switch-simulator"
                  style="flex: 1;"
                >
                  💻 Handy-Simulator
                </button>
              </div>
            </div>

            <!-- Active Persona -->
            <div style="background: #1e293b; border-radius: 12px; padding: 0.85rem; border: 1px solid #334155;">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 0.5rem;">
                Test-Benutzer (Persona) wechseln
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                <button 
                  class="btn btn-sm ${currentPersona === 'felix' ? 'btn-primary' : 'btn-secondary'}" 
                  data-debug-persona="felix"
                  style="border-color: #ef4444;"
                >
                  Felix (12, Kind &lt;13)
                </button>
                <button 
                  class="btn btn-sm ${currentPersona === 'lena' ? 'btn-primary' : 'btn-secondary'}" 
                  data-debug-persona="lena"
                  style="border-color: #8b5cf6;"
                >
                  Lena (14, Kind 13–14)
                </button>
                <button 
                  class="btn btn-sm ${currentPersona === 'jasper' ? 'btn-primary' : 'btn-secondary'}" 
                  data-debug-persona="jasper"
                >
                  Jasper (16, Youth 15–17)
                </button>
                <button 
                  class="btn btn-sm ${currentPersona === 'sophia' ? 'btn-primary' : 'btn-secondary'}" 
                  data-debug-persona="sophia"
                >
                  Sophia (22, Young Worker)
                </button>
                <button 
                  class="btn btn-sm ${currentPersona === 'marcus' ? 'btn-primary' : 'btn-secondary'}" 
                  data-debug-persona="marcus"
                >
                  Dr. Marcus (48, Arbeitgeber)
                </button>
                <button 
                  class="btn btn-sm ${currentPersona === 'techcraft' ? 'btn-primary' : 'btn-secondary'}" 
                  data-debug-persona="techcraft"
                >
                  TechCraft (🏢 Firma)
                </button>
              </div>
            </div>

            <!-- Mode Switcher -->
            <div style="background: #1e293b; border-radius: 12px; padding: 0.85rem; border: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 0.85rem; font-weight: 700; color: white;">Aktueller Modus</div>
                <div style="font-size: 0.75rem; color: #94a3b8;">
                  ${currentMode === 'find' ? '🔍 Jobs suchen (Worker Mode)' : '🏢 Jobs inserieren (Employer Mode)'}
                </div>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-debug-toggle-mode">
                Modus wechseln
              </button>
            </div>

            <!-- Quick Reset -->
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary btn-block" id="btn-debug-reset-data" style="color: #f87171; border-color: #7f1d1d;">
                ↺ Alle Testdaten zurücksetzen
              </button>
            </div>
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

export function attachDebugDrawerEvents() {
  const trigger = document.getElementById('debug-floating-trigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      store.setState({ isDebugDrawerOpen: true });
    });
  }

  const closeBtn = document.getElementById('btn-close-debug-drawer');
  const overlay = document.getElementById('debug-drawer-overlay');

  const close = () => {
    store.setState({ isDebugDrawerOpen: false });
  };

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  // Persona buttons
  const personaBtns = document.querySelectorAll('button[data-debug-persona]');
  personaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const persona = btn.getAttribute('data-debug-persona');
      store.switchPersona(persona);
      close();
    });
  });

  // Mode button
  const modeBtn = document.getElementById('btn-debug-toggle-mode');
  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      store.toggleMode();
      close();
    });
  }

  // View mode switches
  const nativeBtn = document.getElementById('btn-switch-native');
  if (nativeBtn) {
    nativeBtn.addEventListener('click', () => {
      store.setState({ displayMode: 'native', isDebugDrawerOpen: false });
    });
  }

  const simBtn = document.getElementById('btn-switch-simulator');
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      store.setState({ displayMode: 'simulator', isDebugDrawerOpen: false });
    });
  }

  // Reset button
  const resetBtn = document.getElementById('btn-debug-reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Alle Testdaten auf Ausgangszustand zurücksetzen?')) {
        store.resetAll();
        close();
      }
    });
  }
}
