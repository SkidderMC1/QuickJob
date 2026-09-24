/**
 * QuickJob Job-Based Messages Screen
 */
import { store } from '../state/store.js';
import { JobStates } from '../models/types.js';

export function renderMessagesScreen(state) {
  const selectedConvId = state.selectedConversationId;

  // If a conversation is selected, render active thread view
  if (selectedConvId) {
    const conv = state.conversations.find(c => c.id === selectedConvId);
    if (conv) {
      return renderChatThread(conv, state);
    }
  }

  // Otherwise render list of job conversations
  return `
    <div class="screen-container" id="screen-messages">
      <div class="section-header">
        <h1 class="section-title">💬 Microjob Messages</h1>
        <span style="font-size: 0.8rem; color: var(--qj-text-muted); font-weight: 600;">
          ${state.conversations.length} Active Thread${state.conversations.length === 1 ? '' : 's'}
        </span>
      </div>

      <!-- Trust & Privacy Banner -->
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--qj-radius-sm); padding: 0.65rem 0.85rem; font-size: 0.78rem; color: #1e40af; display: flex; align-items: center; gap: 0.45rem;">
        <span>🛡️</span>
        <span>For your safety, always keep communication and payment inside QuickJob.</span>
      </div>

      <!-- Conversation Threads List -->
      <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-top: 0.35rem;">
        ${state.conversations.length > 0 ? state.conversations.map(conv => {
          const lastMsg = conv.messages[conv.messages.length - 1];
          return `
            <div 
              class="conversation-item" 
              data-conv-id="${conv.id}"
              id="conv-item-${conv.id}"
              style="background: #ffffff; border: 1px solid var(--qj-border); border-radius: var(--qj-radius-md); padding: 0.9rem; cursor: pointer; transition: var(--qj-transition); box-shadow: var(--qj-shadow-xs);"
            >
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <div class="employer-avatar" style="width: 38px; height: 38px; font-size: 0.85rem;">
                    ${conv.participant.avatarText || 'EM'}
                  </div>
                  <div>
                    <div style="font-size: 0.88rem; font-weight: 700; color: var(--qj-text-main);">
                      ${escapeHTML(conv.participant.name)}
                    </div>
                    <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
                      ${conv.participant.role || 'Member'}
                    </div>
                  </div>
                </div>

                <div style="text-align: right;">
                  <span class="badge badge-success" style="font-size: 0.72rem;">
                    €${conv.jobPayment}
                  </span>
                  <div style="font-size: 0.7rem; color: var(--qj-text-subtle); margin-top: 2px;">
                    ${lastMsg ? lastMsg.timestamp : ''}
                  </div>
                </div>
              </div>

              <!-- Linked Job Title -->
              <div style="background: var(--qj-surface-muted); border-radius: var(--qj-radius-xs); padding: 0.35rem 0.55rem; margin-top: 0.6rem; font-size: 0.78rem; font-weight: 600; color: var(--qj-text-muted); display: flex; align-items: center; justify-content: space-between;">
                <span>📋 ${escapeHTML(conv.jobTitle)}</span>
                <span style="font-size: 0.7rem; font-weight: 700; color: var(--qj-primary);">
                  ${conv.status || 'ACTIVE'}
                </span>
              </div>

              <!-- Last Message Snippet -->
              <div style="font-size: 0.82rem; color: var(--qj-text-main); margin-top: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${lastMsg ? `${lastMsg.isMine ? 'You: ' : ''}${escapeHTML(lastMsg.text)}` : 'No messages yet.'}
              </div>
            </div>
          `;
        }).join('') : `
          <div style="text-align: center; padding: 2.5rem 1rem; background: white; border-radius: var(--qj-radius-md); border: 1px dashed var(--qj-border);">
            <div style="font-size: 2rem; margin-bottom: 0.4rem;">💬</div>
            <h3 style="font-size: 1rem; font-weight: 700;">No conversations yet</h3>
            <p style="font-size: 0.8rem; color: var(--qj-text-muted); margin-top: 0.2rem;">
              When you apply to a microjob or post a job, message threads will appear here.
            </p>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderChatThread(conv, state) {
  const isEmployer = state.activeMode === 'post';
  const status = conv.status || 'IN_PROGRESS';
  const job = state.jobs.find(j => j.id === conv.jobId) || {
    id: conv.jobId,
    title: conv.jobTitle,
    payment: conv.jobPayment,
    checkInStatus: 'NOT_ARRIVED',
    travelTimes: { bike: '5 Min.', walk: '14 Min.', transit: '7 Min.' },
    googleMapsUrl: '#'
  };

  const isCheckedIn = job.checkInStatus === 'ARRIVED';
  const hasProof = !!job.proofPhotoAfter;
  const isDone = status === 'COMPLETED' || status === 'PAYMENT_RELEASED' || status === 'REVIEWED';

  return `
    <div class="screen-container" id="screen-chat-thread" style="padding-bottom: 5.5rem;">
      <!-- Chat Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--qj-border); padding-bottom: 0.75rem;">
        <button id="btn-back-to-convs" style="font-size: 0.85rem; font-weight: 700; color: var(--qj-primary); display: flex; align-items: center; gap: 0.3rem;">
          ← Messages
        </button>

        <div style="text-align: center;">
          <div style="font-size: 0.9rem; font-weight: 800; color: var(--qj-text-main);">
            ${escapeHTML(conv.participant.name)}
          </div>
          <div style="font-size: 0.72rem; color: var(--qj-text-muted);">
            ${conv.participant.role}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <button id="btn-chat-report" data-job-id="${conv.jobId}" title="Diesen Chat oder Vorfall melden" style="color: #ef4444; font-size: 0.72rem; font-weight: 700; padding: 3px 6px; border: 1px solid #fecaca; border-radius: 6px; background: #fef2f2; cursor: pointer; display: flex; align-items: center; gap: 2px;">
            <span>🚩</span><span>Melden</span>
          </button>
          <span class="price-tag" style="font-size: 1.1rem;">
            <span class="currency">€</span>${conv.jobPayment}
          </span>
        </div>
      </div>

      <!-- Linked Job Banner & Status Action -->
      <div class="chat-job-banner">
        <div>
          <div style="font-size: 0.75rem; color: var(--qj-text-muted); font-weight: 600;">Verknüpfter Microjob</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--qj-text-main); line-height: 1.25;">
            ${escapeHTML(conv.jobTitle)}
          </div>
          ${job.travelTimes ? `
            <div style="font-size: 0.7rem; color: #4338ca; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span>🚲 ${job.travelTimes.bike}</span>
              <span>🚶 ${job.travelTimes.walk}</span>
              <span>🚌 ${job.travelTimes.transit}</span>
              <a href="${job.googleMapsUrl || '#'}" target="_blank" rel="noopener noreferrer" style="color: #4338ca; text-decoration: underline;">
                Google Maps ↗
              </a>
            </div>
          ` : ''}
          <div style="font-size: 0.72rem; color: var(--qj-primary); font-weight: 700; margin-top: 2px;">
            Status: ${status}
          </div>
        </div>

        <!-- Dynamic Lifecycle Action Buttons -->
        <div>
          ${status === 'WORKER_SELECTED' || status === 'IN_PROGRESS' ? `
            <button class="btn btn-primary btn-sm" id="btn-chat-complete-job" data-job-id="${conv.jobId}">
              ✓ Als erledigt markieren
            </button>
          ` : status === 'COMPLETED' ? `
            <button class="btn btn-primary btn-sm" id="btn-chat-release-payment" data-job-id="${conv.jobId}">
              💸 Auszahlung €${conv.jobPayment} freigeben
            </button>
          ` : status === 'PAYMENT_RELEASED' ? `
            <button class="btn btn-outline btn-sm" id="btn-chat-leave-review" data-job-id="${conv.jobId}">
              ⭐ Bewerten & Trinkgeld
            </button>
          ` : `
            <span class="badge badge-success">✓ Bewertet</span>
          `}
        </div>
      </div>

      <!-- Live Action & Safety Strip (Check-In, Foto-Beweis, Notfall SOS, Quittung) -->
      <div style="display: flex; gap: 0.4rem; overflow-x: auto; padding: 0.4rem 0; align-items: center;" id="chat-live-action-strip">
        ${isCheckedIn ? `
          <span class="badge badge-success" style="font-size: 0.74rem; padding: 0.4rem 0.65rem; white-space: nowrap;">
            📍 Vor Ort (${job.checkInTime || '14:02 Uhr'})
          </span>
        ` : `
          <button 
            class="btn btn-outline btn-sm" 
            id="btn-chat-live-checkin" 
            data-job-id="${conv.jobId}"
            style="font-size: 0.74rem; font-weight: 800; color: #0ea76b; border-color: #a7f3d0; background: #ecfdf5; white-space: nowrap;"
          >
            📍 Ich bin da (Check-In)
          </button>
        `}

        <button 
          class="btn btn-outline btn-sm" 
          id="btn-chat-open-proof" 
          data-job-id="${conv.jobId}"
          style="font-size: 0.74rem; font-weight: 800; color: #4338ca; border-color: #c7d2fe; background: #eef2ff; white-space: nowrap;"
        >
          📸 Vorher-/Nachher Foto
        </button>

        ${isDone ? `
          <button 
            class="btn btn-outline btn-sm" 
            id="btn-chat-view-receipt" 
            data-job-id="${conv.jobId}"
            style="font-size: 0.74rem; font-weight: 800; color: #0f172a; border-color: #cbd5e1; background: #f8fafc; white-space: nowrap;"
          >
            📄 Quittung (§ 368 BGB)
          </button>
        ` : ''}

        <button 
          class="btn btn-danger btn-sm" 
          id="btn-chat-sos" 
          data-job-id="${conv.jobId}"
          style="font-size: 0.74rem; font-weight: 800; background: #dc2626; color: #ffffff; border: none; border-radius: 8px; padding: 0.35rem 0.7rem; white-space: nowrap; margin-left: auto;"
        >
          🚨 Notfall SOS
        </button>
      </div>

      <!-- Messages History Container -->
      <div class="chat-messages" id="chat-messages-scroll" style="height: 330px; overflow-y: auto;">
        ${conv.messages.map(msg => `
          <div class="chat-bubble ${msg.isMine ? 'mine' : 'theirs'}">
            <div>${escapeHTML(msg.text)}</div>
            <div class="chat-time">${msg.timestamp}</div>
          </div>
        `).join('')}

        <!-- Inline Before & After Photo Proof Card (if available) -->
        ${hasProof ? `
          <div style="background: #f8fafc; border: 1.5px solid #86efac; border-radius: 12px; padding: 0.75rem; margin: 0.5rem 0; display: flex; flex-direction: column; gap: 0.45rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.78rem; font-weight: 800; color: #15803d; display: flex; align-items: center; gap: 0.3rem;">
                <span>📸</span><span>Vorher-/Nachher-Beweis hochgeladen</span>
              </span>
              <span class="badge badge-success" style="font-size: 0.68rem;">✓ KI-Geprüft (98%)</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
              <div style="height: 90px; border-radius: 8px; overflow: hidden; position: relative;">
                <img src="${job.proofPhotoBefore || 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=400&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="Vorher" />
                <span style="position: absolute; bottom: 3px; left: 3px; font-size: 0.6rem; background: rgba(0,0,0,0.7); color: white; padding: 1px 4px; border-radius: 4px;">Vorher</span>
              </div>
              <div style="height: 90px; border-radius: 8px; overflow: hidden; position: relative; border: 2px solid #10b981;">
                <img src="${job.proofPhotoAfter}" style="width: 100%; height: 100%; object-fit: cover;" alt="Nachher" />
                <span style="position: absolute; bottom: 3px; left: 3px; font-size: 0.6rem; background: #10b981; color: white; padding: 1px 4px; border-radius: 4px;">Nachher ✓</span>
              </div>
            </div>
            <div style="font-size: 0.7rem; color: #166534; line-height: 1.35;">
              ${job.aiVisionSummary || '🤖 KI-Prüfung: Arbeitsergebnis stimmt mit Aufgabenbeschreibung überein.'}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Quick Reply Suggestions (German) -->
      <div class="chat-quick-replies" style="display: flex; gap: 0.4rem; overflow-x: auto; padding: 0.35rem 0;">
        <button class="quick-reply-btn" data-reply="Bin auf dem Weg! 🚲">🚲 Bin auf dem Weg!</button>
        <button class="quick-reply-btn" data-reply="Bin an der Haustür 🔔">🔔 Bin an der Haustür</button>
        <button class="quick-reply-btn" data-reply="Verzögert sich um 5 Minuten ⏳">⏳ +5 Min.</button>
        <button class="quick-reply-btn" data-reply="Habe eine kurze Frage zum Job ❓">❓ Kurze Frage</button>
        <button class="quick-reply-btn" data-reply="Aufgabe ist fertig! Foto hochgeladen ✅">✅ Aufgabe fertig!</button>
      </div>

      <!-- Message Input Bar -->
      <div class="chat-input-bar">
        <input 
          type="text" 
          id="chat-input-field" 
          class="form-control" 
          placeholder="Nachricht schreiben..." 
          style="flex: 1; border-radius: var(--qj-radius-full);"
        />
        <button class="btn btn-primary" id="btn-send-message" style="border-radius: var(--qj-radius-full); padding: 0.65rem 1rem;">
          Senden
        </button>
      </div>
    </div>
  `;
}

export function attachMessagesScreenEvents() {
  // Select thread
  const convItems = document.querySelectorAll('.conversation-item[data-conv-id]');
  convItems.forEach(item => {
    item.addEventListener('click', () => {
      const convId = item.getAttribute('data-conv-id');
      store.setState({ selectedConversationId: convId });
    });
  });

  // Back to list
  const backBtn = document.getElementById('btn-back-to-convs');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      store.setState({ selectedConversationId: null });
    });
  }

  // Send message
  const sendBtn = document.getElementById('btn-send-message');
  const inputField = document.getElementById('chat-input-field');

  const handleSend = () => {
    if (!inputField) return;
    const text = inputField.value;
    const convId = store.getState().selectedConversationId;
    if (convId && text.trim()) {
      store.sendMessage(convId, text);
      inputField.value = '';
    }
  };

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
  }

  if (inputField) {
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });
  }

  // Quick reply chips
  const quickReplies = document.querySelectorAll('.quick-reply-btn[data-reply]');
  quickReplies.forEach(btn => {
    btn.addEventListener('click', () => {
      const reply = btn.getAttribute('data-reply');
      const convId = store.getState().selectedConversationId;
      if (convId && reply) {
        store.sendMessage(convId, reply);
      }
    });
  });

  // Live Check-In button
  const checkInBtn = document.getElementById('btn-chat-live-checkin');
  if (checkInBtn) {
    checkInBtn.addEventListener('click', () => {
      const jobId = checkInBtn.getAttribute('data-job-id');
      if (jobId) {
        store.checkInToJob(jobId);
      }
    });
  }

  // Open Proof Modal
  const openProofBtn = document.getElementById('btn-chat-open-proof');
  if (openProofBtn) {
    openProofBtn.addEventListener('click', () => {
      const jobId = openProofBtn.getAttribute('data-job-id');
      if (jobId) {
        store.openProofModal(jobId);
      }
    });
  }

  // Emergency SOS button
  const sosBtn = document.getElementById('btn-chat-sos');
  if (sosBtn) {
    sosBtn.addEventListener('click', () => {
      const jobId = sosBtn.getAttribute('data-job-id');
      store.openEmergencyModal(jobId);
    });
  }

  // View Receipt button
  const viewReceiptBtn = document.getElementById('btn-chat-view-receipt');
  if (viewReceiptBtn) {
    viewReceiptBtn.addEventListener('click', () => {
      const jobId = viewReceiptBtn.getAttribute('data-job-id');
      if (jobId) {
        store.openReceiptModal(jobId);
      }
    });
  }

  // Job lifecycle action buttons
  const completeBtn = document.getElementById('btn-chat-complete-job');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      const jobId = completeBtn.getAttribute('data-job-id');
      store.openProofModal(jobId);
    });
  }

  const releaseBtn = document.getElementById('btn-chat-release-payment');
  if (releaseBtn) {
    releaseBtn.addEventListener('click', () => {
      const jobId = releaseBtn.getAttribute('data-job-id');
      store.updateJobState(jobId, JobStates.PAYMENT_RELEASED);
      store.showToast('Escrow payment released to helper!');
    });
  }

  const reviewBtn = document.getElementById('btn-chat-leave-review');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
      const jobId = reviewBtn.getAttribute('data-job-id');
      if (jobId) {
        store.openReviewModal(jobId);
      }
    });
  }

  const chatReportBtn = document.getElementById('btn-chat-report');
  if (chatReportBtn) {
    chatReportBtn.addEventListener('click', () => {
      const jobId = chatReportBtn.getAttribute('data-job-id');
      store.openReportModal(jobId);
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
