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

        <span class="price-tag" style="font-size: 1.1rem;">
          <span class="currency">€</span>${conv.jobPayment}
        </span>
      </div>

      <!-- Linked Job Banner & Status Action -->
      <div class="chat-job-banner">
        <div>
          <div style="font-size: 0.75rem; color: var(--qj-text-muted); font-weight: 600;">Linked Microjob</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--qj-text-main); line-height: 1.25;">
            ${escapeHTML(conv.jobTitle)}
          </div>
          <div style="font-size: 0.72rem; color: var(--qj-primary); font-weight: 700; margin-top: 2px;">
            Status: ${status}
          </div>
        </div>

        <!-- Dynamic Lifecycle Action Buttons -->
        <div>
          ${status === 'WORKER_SELECTED' || status === 'IN_PROGRESS' ? `
            <button class="btn btn-primary btn-sm" id="btn-chat-complete-job" data-job-id="${conv.jobId}">
              ✓ Mark Complete
            </button>
          ` : status === 'COMPLETED' ? `
            <button class="btn btn-primary btn-sm" id="btn-chat-release-payment" data-job-id="${conv.jobId}">
              💸 Release €${conv.jobPayment}
            </button>
          ` : status === 'PAYMENT_RELEASED' ? `
            <button class="btn btn-outline btn-sm" id="btn-chat-leave-review" data-job-id="${conv.jobId}">
              ⭐ Review
            </button>
          ` : `
            <span class="badge badge-success">✓ Reviewed</span>
          `}
        </div>
      </div>

      <!-- Messages History Container -->
      <div class="chat-messages" id="chat-messages-scroll" style="height: 360px; overflow-y: auto;">
        ${conv.messages.map(msg => `
          <div class="chat-bubble ${msg.isMine ? 'mine' : 'theirs'}">
            <div>${escapeHTML(msg.text)}</div>
            <div class="chat-time">${msg.timestamp}</div>
          </div>
        `).join('')}
      </div>

      <!-- Quick Reply Suggestions -->
      <div class="chat-quick-replies">
        <button class="quick-reply-btn" data-reply="Is 3pm okay?">"Is 3pm okay?"</button>
        <button class="quick-reply-btn" data-reply="Yes, perfect! See you then.">"Yes, perfect!"</button>
        <button class="quick-reply-btn" data-reply="I have arrived at the location.">"I have arrived!"</button>
        <button class="quick-reply-btn" data-reply="All done! Completed the task.">"Task completed!"</button>
      </div>

      <!-- Message Input Bar -->
      <div class="chat-input-bar">
        <input 
          type="text" 
          id="chat-input-field" 
          class="form-control" 
          placeholder="Type a message..." 
          style="flex: 1; border-radius: var(--qj-radius-full);"
        />
        <button class="btn btn-primary" id="btn-send-message" style="border-radius: var(--qj-radius-full); padding: 0.65rem 1rem;">
          Send
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

  // Job lifecycle action buttons
  const completeBtn = document.getElementById('btn-chat-complete-job');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      const jobId = completeBtn.getAttribute('data-job-id');
      store.updateJobState(jobId, JobStates.COMPLETED);
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
      const rating = prompt('Leave a star rating for this job (1 to 5 stars):', '5');
      if (rating) {
        const jobId = reviewBtn.getAttribute('data-job-id');
        store.updateJobState(jobId, JobStates.REVIEWED);
        store.showToast(`Thank you! ★${rating} review submitted.`);
      }
    });
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
