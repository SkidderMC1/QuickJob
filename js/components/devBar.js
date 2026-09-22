/**
 * QuickJob Desktop Preview Dev Control Bar Component
 */
import { store } from '../state/store.js';

export function renderDevBar(state) {
  const currentSize = state.viewportSize;
  const currentPersona = state.currentPersonaKey;

  return `
    <div class="dev-controls" id="dev-controls">
      <div class="dev-brand">
        <span class="dev-brand-badge">PREVIEW</span>
        <span>QuickJob Phone Simulator</span>
      </div>

      <div class="dev-group">
        <span class="dev-label">Viewport:</span>
        <button class="dev-pill-btn ${currentSize === 'size-375' ? 'active' : ''}" data-size="size-375">
          375 × 812
        </button>
        <button class="dev-pill-btn ${currentSize === 'size-390' ? 'active' : ''}" data-size="size-390">
          390 × 844 (Default)
        </button>
        <button class="dev-pill-btn ${currentSize === 'size-414' ? 'active' : ''}" data-size="size-414">
          414 × 896
        </button>
        <button class="dev-pill-btn ${currentSize === 'size-full' ? 'active' : ''}" data-size="size-full">
          Responsive
        </button>
      </div>

      <div class="dev-group">
        <span class="dev-label">Active User:</span>
        <select class="dev-persona-select" id="dev-persona-select">
          <option value="felix" ${currentPersona === 'felix' ? 'selected' : ''}>
            Felix (12, Kind unter 13 · § 5 JArbSchG)
          </option>
          <option value="lena" ${currentPersona === 'lena' ? 'selected' : ''}>
            Lena (14, Kind 13–14 · KindArbSchV)
          </option>
          <option value="jasper" ${currentPersona === 'jasper' ? 'selected' : ''}>
            Jasper (16, Youth 15–17 · JArbSchG)
          </option>
          <option value="sophia" ${currentPersona === 'sophia' ? 'selected' : ''}>
            Sophia (22, Young Worker 18–25)
          </option>
          <option value="marcus" ${currentPersona === 'marcus' ? 'selected' : ''}>
            Dr. Marcus (48, Employer)
          </option>
          <option value="techcraft" ${currentPersona === 'techcraft' ? 'selected' : ''}>
            TechCraft GmbH (🏢 Company)
          </option>
        </select>

        <button class="dev-pill-btn" id="btn-dev-switch-native" style="background: rgba(14, 167, 107, 0.2); color: #34d399; border-color: rgba(52, 211, 153, 0.3);">
          📱 Vollbild-App (PWA)
        </button>

        <button class="dev-pill-btn" id="btn-dev-reset" title="Reset local storage data">
          ↺ Reset Data
        </button>
      </div>
    </div>
  `;
}

export function attachDevBarEvents() {
  const switchNativeBtn = document.getElementById('btn-dev-switch-native');
  if (switchNativeBtn) {
    switchNativeBtn.addEventListener('click', () => {
      store.setState({ displayMode: 'native' });
    });
  }

  const sizeBtns = document.querySelectorAll('.dev-pill-btn[data-size]');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.getAttribute('data-size');
      if (size) {
        store.setViewportSize(size);
        const bezel = document.getElementById('phone-bezel');
        if (bezel) {
          bezel.className = `phone-bezel ${size}`;
        }
      }
    });
  });

  const personaSelect = document.getElementById('dev-persona-select');
  if (personaSelect) {
    personaSelect.addEventListener('change', (e) => {
      store.switchPersona(e.target.value);
    });
  }

  const resetBtn = document.getElementById('btn-dev-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all QuickJob test data back to default initial seed?')) {
        store.resetAll();
      }
    });
  }
}
