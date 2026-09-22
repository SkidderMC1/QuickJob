/**
 * QuickJob Multi-Step Job Creation Wizard
 */
import { store } from '../state/store.js';
import { JobCategories, ApplicationModes } from '../models/types.js';
import { classifyJobSafety } from '../utils/safetyClassifier.js';

let wizardState = {
  step: 1,
  category: 'garden',
  title: '',
  description: '',
  requirementsText: '',
  payment: 25,
  estimatedDuration: '≈ 1 hour',
  dateSchedule: 'Saturday · 14:00',
  location: 'Wuppertal-Elberfeld',
  exactAddress: 'Königsstraße 15, 42103 Wuppertal',
  applicationMode: ApplicationModes.APPLICATION_REQUIRED
};

export function calculateHourlyRate(payment, durationStr) {
  let hours = 1.0;
  const dur = durationStr || '≈ 1 hour';
  if (dur.includes('45 min')) hours = 0.75;
  else if (dur.includes('1.5 hour')) hours = 1.5;
  else if (dur.includes('2 hour')) hours = 2.0;
  else if (dur.includes('3 hour')) hours = 3.0;
  else if (dur.includes('1 hour')) hours = 1.0;

  const rate = Math.round((Number(payment || 0) / hours) * 10) / 10;
  let status = 'fair';
  let badgeClass = 'badge-success';
  let text = `Fair & Attraktiv: €${rate.toFixed(2)}/Std (Hohe Erfolgsquote 🚀)`;

  if (rate < 12.5) {
    status = 'low';
    badgeClass = 'badge-warning';
    text = `Unter Richtwert: €${rate.toFixed(2)}/Std (Tipp: Mind. €13–15/Std für schnelle Zusagen)`;
  } else if (rate >= 20.0) {
    status = 'premium';
    badgeClass = 'badge-primary';
    text = `Top-Vergütung: €${rate.toFixed(2)}/Std (Besonders begehrt ⭐)`;
  }

  return { hours, rate, status, badgeClass, text };
}

export function renderCreateJobScreen(state) {
  const step = wizardState.step;
  const safety = classifyJobSafety(wizardState);
  const fairPay = calculateHourlyRate(wizardState.payment, wizardState.estimatedDuration);

  return `
    <div class="screen-container" id="screen-create">
      <!-- Wizard Progress Header -->
      <div class="wizard-progress">
        <div class="step-indicator">
          <span>✨ Post a Microjob</span>
          <span style="color: var(--qj-text-subtle);">· Step ${step} of 5</span>
        </div>
        <div class="step-dots">
          ${[1, 2, 3, 4, 5].map(s => `
            <div class="step-dot ${s <= step ? 'active' : ''}"></div>
          `).join('')}
        </div>
      </div>

      <!-- Step Content Container -->
      <div style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-lg); padding: 1.25rem; box-shadow: var(--qj-shadow-xs); display: flex; flex-direction: column; gap: 1rem;">
        
        <!-- STEP 1: Category & Title -->
        ${step === 1 ? `
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800;">What do you need help with?</h2>
            <p style="font-size: 0.85rem; color: var(--qj-text-muted); margin-top: 2px;">
              Select the best category and write a clear, friendly title.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; max-height: 220px; overflow-y: auto; padding-right: 4px;">
              ${JobCategories.map(cat => `
                <div 
                  class="category-select-item ${wizardState.category === cat.id ? 'active' : ''}" 
                  data-wizard-cat="${cat.id}"
                  style="border: 1.5px solid ${wizardState.category === cat.id ? 'var(--qj-primary)' : 'var(--qj-border)'}; background: ${wizardState.category === cat.id ? 'var(--qj-primary-light)' : '#ffffff'}; padding: 0.65rem 0.5rem; border-radius: var(--qj-radius-sm); cursor: pointer; display: flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; font-weight: 600;"
                >
                  <span style="font-size: 1.1rem;">${cat.icon}</span>
                  <span style="line-height: 1.2;">${cat.name}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-title">
              <span>Task Title</span>
              <span class="helper">e.g., Weed garden bed & sweep terrace</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              id="wizard-title" 
              placeholder="Short, specific title..." 
              value="${escapeHTML(wizardState.title)}"
            />
          </div>
        ` : ''}

        <!-- STEP 2: Description & Automated Age Safety Rating -->
        ${step === 2 ? `
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800;">Describe the task</h2>
            <p style="font-size: 0.85rem; color: var(--qj-text-muted); margin-top: 2px;">
              QuickJob bewertet die Altersfreigabe und Sicherheit automatisch nach dem Jugendarbeitsschutzgesetz.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-desc">Task Description</label>
            <textarea 
              class="form-control" 
              id="wizard-desc" 
              rows="4" 
              placeholder="Explain what needs to be done, which tools/materials are on site, and what the helper should bring..."
            >${escapeHTML(wizardState.description)}</textarea>
          </div>

          <!-- Dynamic Automatic Safety Classification Box (Read-Only AI/Rule Assessment) -->
          <div id="wizard-safety-box" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.76rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 0.35rem;">
                <span>🤖</span>
                <span>Automatische Altersfreigabe</span>
              </span>
              <span class="badge ${safety.badgeClass}" id="wizard-safety-badge">${safety.badgeText}</span>
            </div>
            
            <p style="font-size: 0.82rem; color: #1e293b; line-height: 1.45; margin-top: 2px;" id="wizard-safety-reason">
              ${safety.reason}
            </p>

            <div style="font-size: 0.72rem; color: #64748b; font-weight: 600; border-top: 1px dashed #cbd5e1; padding-top: 5px; margin-top: 2px; display: flex; justify-content: space-between;">
              <span id="wizard-safety-law">⚖️ ${safety.lawRef}</span>
              <span style="color: var(--qj-primary); font-weight: 700;">Geprüft ✓</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-reqs">
              <span>Requirements (one per line)</span>
            </label>
            <textarea 
              class="form-control" 
              id="wizard-reqs" 
              rows="2" 
              placeholder="e.g. Bring work gloves&#10;Punctual"
            >${escapeHTML(wizardState.requirementsText)}</textarea>
          </div>
        ` : ''}

        <!-- STEP 3: Payment & Schedule -->
        ${step === 3 ? `
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800;">Compensation & Time</h2>
            <p style="font-size: 0.85rem; color: var(--qj-text-muted); margin-top: 2px;">
              Fair pricing attracts reliable, motivated helpers quickly.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-pay">
              <span>Payment Amount (€)</span>
              <span style="color: var(--qj-primary); font-weight: 800; font-size: 1.1rem;">
                €<span id="wizard-pay-val">${wizardState.payment}</span>
              </span>
            </label>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input 
                type="range" 
                min="15" 
                max="120" 
                step="5" 
                id="wizard-pay-slider" 
                value="${wizardState.payment}" 
                style="flex: 1; accent-color: var(--qj-primary);"
              />
              <input 
                type="number" 
                class="form-control" 
                id="wizard-pay-input" 
                value="${wizardState.payment}" 
                style="width: 80px; font-weight: 700;"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-duration">Estimated Duration</label>
            <select class="form-control" id="wizard-duration">
              <option value="≈ 45 min" ${wizardState.estimatedDuration === '≈ 45 min' ? 'selected' : ''}>≈ 45 minutes</option>
              <option value="≈ 1 hour" ${wizardState.estimatedDuration === '≈ 1 hour' ? 'selected' : ''}>≈ 1 hour</option>
              <option value="≈ 1.5 hours" ${wizardState.estimatedDuration === '≈ 1.5 hours' ? 'selected' : ''}>≈ 1.5 hours</option>
              <option value="≈ 2 hours" ${wizardState.estimatedDuration === '≈ 2 hours' ? 'selected' : ''}>≈ 2 hours</option>
              <option value="≈ 3 hours" ${wizardState.estimatedDuration === '≈ 3 hours' ? 'selected' : ''}>≈ 3 hours</option>
            </select>
          </div>

          <!-- Dynamic Fair-Pay Hourly Calculator Widget -->
          <div id="wizard-fair-pay-box" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.03em;">
                💰 Berechneter Stundenlohn
              </div>
              <div id="wizard-fair-pay-text" style="font-size: 0.82rem; font-weight: 600; color: #1e293b; margin-top: 2px;">
                ${fairPay.text}
              </div>
            </div>
            <span class="badge ${fairPay.badgeClass}" id="wizard-fair-pay-badge" style="font-size: 0.85rem; font-weight: 800; white-space: nowrap;">
              €${fairPay.rate.toFixed(2)}/h
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-schedule">Preferred Date & Time</label>
            <input 
              type="text" 
              class="form-control" 
              id="wizard-schedule" 
              placeholder="e.g., Saturday · 14:00" 
              value="${escapeHTML(wizardState.dateSchedule)}"
            />
          </div>
        ` : ''}

        <!-- STEP 4: Location & Acceptance Mode -->
        ${step === 4 ? `
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800;">Location & Applications</h2>
            <p style="font-size: 0.85rem; color: var(--qj-text-muted); margin-top: 2px;">
              Privacy protection: your exact address is hidden until a helper is accepted.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-location">
              <span>Public Neighborhood (Approximate)</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              id="wizard-location" 
              value="${escapeHTML(wizardState.location)}" 
              placeholder="e.g. Wuppertal-Elberfeld"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="wizard-address">
              <span>Exact Address (Private)</span>
              <span class="helper">Only shared with accepted helper</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              id="wizard-address" 
              value="${escapeHTML(wizardState.exactAddress)}" 
              placeholder="Street and house number..."
            />
          </div>

          <div class="form-group">
            <label class="form-label">Application Mode</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <label 
                style="border: 1.5px solid ${wizardState.applicationMode === ApplicationModes.APPLICATION_REQUIRED ? 'var(--qj-primary)' : 'var(--qj-border)'}; background: ${wizardState.applicationMode === ApplicationModes.APPLICATION_REQUIRED ? 'var(--qj-primary-light)' : '#ffffff'}; padding: 0.75rem; border-radius: var(--qj-radius-sm); cursor: pointer; display: flex; align-items: flex-start; gap: 0.5rem;"
              >
                <input 
                  type="radio" 
                  name="appMode" 
                  value="${ApplicationModes.APPLICATION_REQUIRED}" 
                  ${wizardState.applicationMode === ApplicationModes.APPLICATION_REQUIRED ? 'checked' : ''} 
                  style="margin-top: 2px;"
                />
                <div>
                  <div style="font-size: 0.85rem; font-weight: 700;">Review Applications (Recommended)</div>
                  <div style="font-size: 0.75rem; color: var(--qj-text-muted); margin-top: 2px;">
                    Helpers apply, you inspect their profile, ratings and choose the best candidate.
                  </div>
                </div>
              </label>

              <label 
                style="border: 1.5px solid ${wizardState.applicationMode === ApplicationModes.DIRECT_ACCEPT ? 'var(--qj-primary)' : 'var(--qj-border)'}; background: ${wizardState.applicationMode === ApplicationModes.DIRECT_ACCEPT ? 'var(--qj-primary-light)' : '#ffffff'}; padding: 0.75rem; border-radius: var(--qj-radius-sm); cursor: pointer; display: flex; align-items: flex-start; gap: 0.5rem;"
              >
                <input 
                  type="radio" 
                  name="appMode" 
                  value="${ApplicationModes.DIRECT_ACCEPT}" 
                  ${wizardState.applicationMode === ApplicationModes.DIRECT_ACCEPT ? 'checked' : ''} 
                  style="margin-top: 2px;"
                />
                <div>
                  <div style="font-size: 0.85rem; font-weight: 700;">Instant Direct Accept</div>
                  <div style="font-size: 0.75rem; color: var(--qj-text-muted); margin-top: 2px;">
                    First verified eligible helper who taps accept gets immediately assigned.
                  </div>
                </div>
              </label>
            </div>
          </div>
        ` : ''}

        <!-- STEP 5: Live Card Preview & Publish -->
        ${step === 5 ? `
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800;">Review & Publish</h2>
            <p style="font-size: 0.85rem; color: var(--qj-text-muted); margin-top: 2px;">
              This is how your microjob card will appear to local helpers:
            </p>
          </div>

          <!-- Preview Card -->
          <div style="border: 1.5px solid var(--qj-primary); border-radius: var(--qj-radius-md); padding: 1rem; background: #ffffff; box-shadow: var(--qj-shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="badge ${wizardState.applicationMode === ApplicationModes.DIRECT_ACCEPT ? 'badge-success' : 'badge-purple'}">
                  ${wizardState.applicationMode === ApplicationModes.DIRECT_ACCEPT ? '⚡ Direct Accept' : '📝 Apply'}
                </span>
                <h3 style="font-size: 1.05rem; font-weight: 800; margin-top: 4px;">
                  ${escapeHTML(wizardState.title || 'Untitled Microjob')}
                </h3>
              </div>
              <div class="price-tag">
                <span class="currency">€</span>${wizardState.payment}
              </div>
            </div>

            <div style="font-size: 0.82rem; color: var(--qj-text-muted); margin: 0.5rem 0; display: flex; gap: 0.75rem;">
              <span>📍 ${wizardState.location}</span>
              <span>🕒 ${wizardState.dateSchedule}</span>
              <span>⏱️ ${wizardState.estimatedDuration}</span>
            </div>

            <p style="font-size: 0.85rem; color: var(--qj-text-main); margin-bottom: 0.5rem;">
              ${escapeHTML(wizardState.description || 'No description provided.')}
            </p>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.65rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 0.5rem;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #475569;">Altersfreigabe (automatisch ermittelt):</span>
              <span class="badge ${safety.badgeClass}">${safety.badgeText}</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.65rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 0.35rem;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #475569;">Berechneter Stundenlohn:</span>
              <span class="badge ${fairPay.badgeClass}">€${fairPay.rate.toFixed(2)}/Std</span>
            </div>
          </div>

          <!-- Safe Escrow Notice -->
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--qj-radius-sm); padding: 0.75rem; font-size: 0.78rem; color: #065f46; display: flex; gap: 0.5rem;">
            <span>🛡️</span>
            <div>
              <strong>QuickJob Escrow:</strong> Your €${wizardState.payment} payment is held securely and only transferred when you verify the helper completed the job.
            </div>
          </div>
        ` : ''}

        <!-- Wizard Navigation Buttons -->
        <div style="display: flex; justify-content: space-between; gap: 0.75rem; margin-top: 0.5rem;">
          ${step > 1 ? `
            <button class="btn btn-secondary" id="btn-wizard-prev" style="flex: 1;">
              ← Back
            </button>
          ` : `
            <button class="btn btn-secondary" id="btn-wizard-cancel" style="flex: 1;">
              Cancel
            </button>
          `}

          ${step < 5 ? `
            <button class="btn btn-primary" id="btn-wizard-next" style="flex: 1;">
              Continue →
            </button>
          ` : `
            <button class="btn btn-primary" id="btn-wizard-publish" style="flex: 1;">
              🚀 Publish Microjob
            </button>
          `}
        </div>

      </div>
    </div>
  `;
}

export function attachCreateJobEvents() {
  // Step 1 Category Selection
  const catItems = document.querySelectorAll('.category-select-item[data-wizard-cat]');
  catItems.forEach(item => {
    item.addEventListener('click', () => {
      wizardState.category = item.getAttribute('data-wizard-cat');
      renderCurrentStep();
    });
  });

  // Step 1 Title
  const titleInput = document.getElementById('wizard-title');
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      wizardState.title = e.target.value;
    });
  }

  // Live safety assessment update
  const updateLiveSafety = () => {
    const safety = classifyJobSafety(wizardState);
    const badge = document.getElementById('wizard-safety-badge');
    const reason = document.getElementById('wizard-safety-reason');
    const law = document.getElementById('wizard-safety-law');
    if (badge) {
      badge.className = `badge ${safety.badgeClass}`;
      badge.textContent = safety.badgeText;
    }
    if (reason) reason.textContent = safety.reason;
    if (law) law.textContent = `⚖️ ${safety.lawRef}`;
  };

  // Step 2 Description
  const descInput = document.getElementById('wizard-desc');
  if (descInput) {
    descInput.addEventListener('input', (e) => {
      wizardState.description = e.target.value;
      updateLiveSafety();
    });
  }

  const reqsInput = document.getElementById('wizard-reqs');
  if (reqsInput) {
    reqsInput.addEventListener('input', (e) => {
      wizardState.requirementsText = e.target.value;
    });
  }

  // Step 3 Payment Slider & Input
  const paySlider = document.getElementById('wizard-pay-slider');
  const payInput = document.getElementById('wizard-pay-input');
  const payVal = document.getElementById('wizard-pay-val');

  const updateFairPayUI = () => {
    const fairPay = calculateHourlyRate(wizardState.payment, wizardState.estimatedDuration);
    const textEl = document.getElementById('wizard-fair-pay-text');
    const badgeEl = document.getElementById('wizard-fair-pay-badge');
    if (textEl && badgeEl) {
      textEl.textContent = fairPay.text;
      badgeEl.className = `badge ${fairPay.badgeClass}`;
      badgeEl.textContent = `€${fairPay.rate.toFixed(2)}/h`;
    }
  };

  if (paySlider && payInput && payVal) {
    paySlider.addEventListener('input', (e) => {
      wizardState.payment = Number(e.target.value);
      payInput.value = wizardState.payment;
      payVal.textContent = wizardState.payment;
      updateFairPayUI();
    });
    payInput.addEventListener('input', (e) => {
      wizardState.payment = Number(e.target.value);
      paySlider.value = wizardState.payment;
      payVal.textContent = wizardState.payment;
      updateFairPayUI();
    });
  }

  const durationSelect = document.getElementById('wizard-duration');
  if (durationSelect) {
    durationSelect.addEventListener('change', (e) => {
      wizardState.estimatedDuration = e.target.value;
      updateFairPayUI();
    });
  }

  const scheduleInput = document.getElementById('wizard-schedule');
  if (scheduleInput) {
    scheduleInput.addEventListener('input', (e) => {
      wizardState.dateSchedule = e.target.value;
    });
  }

  // Step 4 Location & Mode
  const locInput = document.getElementById('wizard-location');
  if (locInput) {
    locInput.addEventListener('input', (e) => {
      wizardState.location = e.target.value;
    });
  }

  const addrInput = document.getElementById('wizard-address');
  if (addrInput) {
    addrInput.addEventListener('input', (e) => {
      wizardState.exactAddress = e.target.value;
    });
  }

  const appModeRadios = document.querySelectorAll('input[name="appMode"]');
  appModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      wizardState.applicationMode = e.target.value;
    });
  });

  // Wizard Navigation Buttons
  const nextBtn = document.getElementById('btn-wizard-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (wizardState.step === 1 && (!wizardState.title || !wizardState.title.trim())) {
        store.showToast('Please enter a task title', 'error');
        return;
      }
      if (wizardState.step === 2 && (!wizardState.description || !wizardState.description.trim())) {
        store.showToast('Please enter a brief task description', 'error');
        return;
      }
      wizardState.step++;
      renderCurrentStep();
    });
  }

  const prevBtn = document.getElementById('btn-wizard-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      wizardState.step = Math.max(1, wizardState.step - 1);
      renderCurrentStep();
    });
  }

  const cancelBtn = document.getElementById('btn-wizard-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      wizardState.step = 1;
      store.setScreen('jobs');
    });
  }

  const publishBtn = document.getElementById('btn-wizard-publish');
  if (publishBtn) {
    publishBtn.addEventListener('click', () => {
      const requirements = wizardState.requirementsText
        ? wizardState.requirementsText.split('\n').map(s => s.trim()).filter(Boolean)
        : ['Punctual', 'Reliable'];

      const safety = classifyJobSafety(wizardState);

      store.createJob({
        title: wizardState.title,
        category: wizardState.category,
        payment: wizardState.payment,
        estimatedDuration: wizardState.estimatedDuration,
        location: wizardState.location,
        exactAddress: wizardState.exactAddress,
        dateSchedule: wizardState.dateSchedule,
        applicationMode: wizardState.applicationMode,
        minAge: safety.minAge,
        ageSuitability: safety.ageSuitability,
        description: wizardState.description,
        requirements: requirements
      });

      // Reset wizard
      wizardState = {
        step: 1,
        category: 'garden',
        title: '',
        description: '',
        requirementsText: '',
        payment: 25,
        estimatedDuration: '≈ 1 hour',
        dateSchedule: 'Saturday · 14:00',
        location: 'Wuppertal-Elberfeld',
        exactAddress: 'Königsstraße 15, 42103 Wuppertal',
        applicationMode: ApplicationModes.APPLICATION_REQUIRED
      };
    });
  }
}

function renderCurrentStep() {
  // Re-renders create screen
  store.setState({ currentScreen: 'create' });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
