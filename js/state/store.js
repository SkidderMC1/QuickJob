/**
 * QuickJob Central Reactive State Store
 */
import { mockUsers, initialJobs, initialConversations } from '../data/mockData.js';
import { JobStates } from '../models/types.js';

const STORAGE_KEY = 'quickjob_state_v1';

class Store {
  constructor() {
    this.listeners = [];
    this._replyTimeouts = {};
    this.state = this.loadInitialState();
  }

  loadInitialState() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true || 
                         window.location.search.includes('mode=app') ||
                         window.location.search.includes('mode=standalone');

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          displayMode: parsed.displayMode || (isStandalone ? 'native' : 'simulator'),
          isDebugDrawerOpen: false,
          currentUser: mockUsers[parsed.currentPersonaKey || 'jasper'] || mockUsers.jasper
        };
      } catch (e) {
        console.warn('Failed to parse cached state, reverting to initial mock data', e);
      }
    }

    return {
      currentPersonaKey: 'jasper',
      currentUser: mockUsers.jasper,
      activeMode: 'find', // 'find' (Worker) or 'post' (Employer)
      currentScreen: 'home', // 'home', 'jobs', 'create', 'messages', 'profile'
      displayMode: isStandalone ? 'native' : 'simulator', // 'simulator' (with PC phone frame) or 'native' (full-screen PWA)
      isDebugDrawerOpen: false,
      selectedJobId: null,
      selectedConversationId: null,
      reviewJobId: null,
      applicantJobId: null,
      reportJobId: null,
      isFilterModalOpen: false,
      isSafetyModalOpen: false,
      viewportSize: 'size-390',
      toast: null,
      filters: {
        feedTab: 'all', // 'all', 'saved', 'my_jobs'
        category: 'all',
        query: '',
        maxDistanceKm: 10,
        minPayment: 0,
        sortBy: 'closest', // 'closest', 'highest_pay', 'newest'
        onlySuitableForMyAge: true
      },
      jobs: JSON.parse(JSON.stringify(initialJobs)),
      conversations: JSON.parse(JSON.stringify(initialConversations))
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentPersonaKey: this.state.currentPersonaKey,
        activeMode: this.state.activeMode,
        currentScreen: this.state.currentScreen,
        displayMode: this.state.displayMode,
        selectedJobId: this.state.selectedJobId,
        selectedConversationId: this.state.selectedConversationId,
        filters: this.state.filters,
        jobs: this.state.jobs,
        conversations: this.state.conversations,
        viewportSize: this.state.viewportSize
      }));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.save();
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  setState(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.notify();
  }

  showToast(message, type = 'success') {
    this.setState({ toast: { message, type, id: Date.now() } });
    setTimeout(() => {
      if (this.state.toast && Date.now() - this.state.toast.id >= 2800) {
        this.setState({ toast: null });
      }
    }, 3000);
  }

  // Navigation
  setScreen(screen, payload = {}) {
    this.setState({
      currentScreen: screen,
      ...payload
    });
  }

  setViewportSize(size) {
    this.setState({ viewportSize: size });
  }

  // Persona switching
  switchPersona(personaKey) {
    const user = mockUsers[personaKey] || mockUsers.jasper;
    const isEmployerPersona = personaKey === 'marcus' || personaKey === 'techcraft';
    this.setState({
      currentPersonaKey: personaKey,
      currentUser: user,
      activeMode: isEmployerPersona ? 'post' : 'find'
    });
    this.showToast(`Switched active persona to ${user.name}`);
  }

  toggleMode() {
    const newMode = this.state.activeMode === 'find' ? 'post' : 'find';
    this.setState({ activeMode: newMode });
    this.showToast(`Switched mode to: ${newMode === 'find' ? 'Find Jobs (Worker)' : 'Post a Job (Employer)'}`);
  }

  isMinor() {
    const user = this.state.currentUser;
    return Boolean(user && (user.ageCategory === 'YOUTH_14_17' || (user.age && user.age < 18)));
  }

  // Filter actions
  setFilter(key, value) {
    if (key === 'onlySuitableForMyAge' && !value && this.isMinor()) {
      this.showToast('🛡️ Gesetzlicher Jugendschutz: Kann für Minderjährige nicht deaktiviert werden (§ 22 JArbSchG).', 'error');
      return;
    }
    this.setState({
      filters: {
        ...this.state.filters,
        [key]: value
      }
    });
  }

  resetFilters() {
    this.setState({
      filters: {
        feedTab: 'all',
        category: 'all',
        query: '',
        maxDistanceKm: 10,
        minPayment: 0,
        sortBy: 'closest',
        onlySuitableForMyAge: true
      }
    });
  }

  setFeedTab(tab) {
    this.setState({
      filters: {
        ...this.state.filters,
        feedTab: tab
      }
    });
  }

  // Job actions
  toggleBookmark(jobId) {
    let isNowBookmarked = false;
    const jobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        const next = !j.isBookmarked;
        isNowBookmarked = next;
        return { ...j, isBookmarked: next };
      }
      return j;
    });
    this.setState({ jobs });
    this.showToast(isNowBookmarked ? '⭐ Job gemerkt & im Profil gespeichert!' : 'Aus gemerkten Jobs entfernt');
  }

  applyToJob(jobId, note = '') {
    const job = this.state.jobs.find(j => j.id === jobId);
    if (!job) return;

    // Check age suitability
    if (this.state.currentUser.age && job.minAge && this.state.currentUser.age < job.minAge) {
      this.showToast(`This job requires minimum age ${job.minAge}.`, 'error');
      return;
    }

    const updatedJobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          state: JobStates.WORKER_SELECTED,
          worker: {
            id: this.state.currentUser.id,
            name: this.state.currentUser.name,
            avatarText: this.state.currentUser.avatarText
          },
          hasApplied: true
        };
      }
      return j;
    });

    // Create or open chat thread
    let conv = this.state.conversations.find(c => c.jobId === jobId);
    let updatedConvs = [...this.state.conversations];
    if (!conv) {
      conv = {
        id: `conv_${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        jobPayment: job.payment,
        status: 'WORKER_SELECTED',
        participant: {
          id: job.employer.id,
          name: job.employer.name,
          avatarText: job.employer.avatarText,
          role: job.employer.isCompany ? 'Verified Company' : 'Employer'
        },
        messages: [
          {
            id: `msg_${Date.now()}`,
            senderId: this.state.currentUser.id,
            senderName: this.state.currentUser.name,
            text: note || `Hello! I would love to complete this job: "${job.title}". I am available at the scheduled time.`,
            timestamp: 'Just now',
            isMine: true
          }
        ]
      };
      updatedConvs.unshift(conv);
    }

    this.setState({
      jobs: updatedJobs,
      conversations: updatedConvs,
      currentScreen: 'messages',
      selectedConversationId: conv.id,
      selectedJobId: null
    });

    this.showToast(job.applicationMode === 'DIRECT_ACCEPT' ? 'Job accepted! Conversation opened.' : 'Application sent to employer!');
  }

  sendMessage(conversationId, text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    const convs = this.state.conversations.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          messages: [
            ...c.messages,
            {
              id: `msg_${Date.now()}`,
              senderId: this.state.currentUser.id,
              senderName: this.state.currentUser.name,
              text: cleanText,
              timestamp: 'Just now',
              isMine: true
            }
          ]
        };
      }
      return c;
    });
    this.setState({ conversations: convs });

    // Interactive simulated response from the participant
    this.triggerSimulatedReply(conversationId, cleanText);
  }

  triggerSimulatedReply(conversationId, userText) {
    if (this._replyTimeouts && this._replyTimeouts[conversationId]) {
      clearTimeout(this._replyTimeouts[conversationId]);
    }

    const conv = this.state.conversations.find(c => c.id === conversationId);
    if (!conv) return;

    const lower = userText.toLowerCase();
    let replyText = '';

    if (lower.includes('arrived') || lower.includes('da') || lower.includes('hier') || lower.includes('vor ort')) {
      replyText = 'Super! Ich öffne direkt die Tür bzw. komme zum Tor. Bis gleich!';
    } else if (lower.includes('3pm') || lower.includes('okay') || lower.includes('zeit') || lower.includes('uhr') || lower.includes('passt')) {
      replyText = 'Ja, perfekt! Die Uhrzeit passt mir hervorragend. Alles steht bereit.';
    } else if (lower.includes('fertig') || lower.includes('done') || lower.includes('erledigt')) {
      replyText = 'Großartig! Vielen Dank für die saubere Arbeit. Ich habe den Betrag gerade freigegeben!';
    } else if (lower.includes('frage') || lower.includes('werkzeug') || lower.includes('handschuhe') || lower.includes('tool')) {
      replyText = 'Alles nötige Werkzeug habe ich bereits vor Ort bereitgestellt. Du brauchst nur Arbeitskleidung!';
    } else {
      const genericReplies = [
        'Vielen Dank für die schnelle Nachricht! Wir freuen uns auf die Zusammenarbeit.',
        'Alles klar, notiert! Melde dich einfach kurz, sobald du da bist.',
        'Klingt hervorragend. Bis später!'
      ];
      replyText = genericReplies[Math.floor(Math.random() * genericReplies.length)];
    }

    this._replyTimeouts[conversationId] = setTimeout(() => {
      const currentConv = this.state.conversations.find(c => c.id === conversationId);
      if (!currentConv) return;

      const replyMsg = {
        id: `msg_reply_${Date.now()}`,
        senderId: currentConv.participant.id,
        senderName: currentConv.participant.name,
        text: replyText,
        timestamp: 'Just now',
        isMine: false
      };

      const updatedConvs = this.state.conversations.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: [...c.messages, replyMsg]
          };
        }
        return c;
      });

      this.setState({ conversations: updatedConvs });
      if (this.state.currentScreen !== 'messages' || this.state.selectedConversationId !== conversationId) {
        this.showToast(`💬 Neue Nachricht von ${currentConv.participant.name}`);
      }
    }, 850);
  }

  // Job lifecycle state machine transitions
  updateJobState(jobId, newState) {
    const jobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, state: newState };
      }
      return j;
    });

    const convs = this.state.conversations.map(c => {
      if (c.jobId === jobId) {
        return { ...c, status: newState };
      }
      return c;
    });

    this.setState({ jobs, conversations: convs });
    this.showToast(`Job status transitioned to: ${newState}`);
  }

  createJob(jobData) {
    const newJob = {
      id: `job_${Date.now()}`,
      title: jobData.title,
      category: jobData.category,
      payment: Number(jobData.payment),
      estimatedDuration: jobData.estimatedDuration || '≈ 1 hour',
      distanceKm: 0.5,
      approxLocation: jobData.location || 'Wuppertal-Elberfeld',
      exactAddress: jobData.exactAddress || 'Friedrich-Ebert-Straße 12, 42103 Wuppertal',
      dateSchedule: jobData.dateSchedule || 'This weekend',
      state: JobStates.PUBLISHED,
      applicationMode: jobData.applicationMode,
      ageSuitability: jobData.ageSuitability || 'Suitable for 14+',
      minAge: Number(jobData.minAge) || 14,
      moderation: 'SAFE',
      employer: {
        id: this.state.currentUser.id,
        name: this.state.currentUser.name,
        avatarText: this.state.currentUser.avatarText,
        rating: this.state.currentUser.rating || 5.0,
        completedJobs: this.state.currentUser.completedJobs || 1,
        isIdentityVerified: true,
        isCompany: !!this.state.currentUser.isCompany
      },
      description: jobData.description,
      requirements: jobData.requirements || ['Punctual', 'Reliable'],
      applicantsCount: 0,
      isBookmarked: false
    };

    const jobs = [newJob, ...this.state.jobs];
    this.setState({
      jobs,
      currentScreen: 'jobs',
      selectedJobId: null
    });
    this.showToast('Microjob published successfully!');
  }

  // Review & Rating Modal actions
  openReviewModal(jobId) {
    this.setState({ reviewJobId: jobId });
  }

  closeReviewModal() {
    this.setState({ reviewJobId: null });
  }

  submitReview(jobId, rating, tags = [], comment = '') {
    const jobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, state: JobStates.REVIEWED };
      }
      return j;
    });

    const convs = this.state.conversations.map(c => {
      if (c.jobId === jobId) {
        return { ...c, status: JobStates.REVIEWED };
      }
      return c;
    });

    this.setState({
      jobs,
      conversations: convs,
      reviewJobId: null
    });
    this.showToast(`⭐ Danke! Deine ★${rating}-Bewertung wurde veröffentlicht.`);
  }

  // Applicant Management actions
  openApplicantModal(jobId) {
    this.setState({ applicantJobId: jobId, selectedJobId: null });
  }

  closeApplicantModal() {
    this.setState({ applicantJobId: null });
  }

  assignApplicant(jobId, applicantId) {
    const job = this.state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const applicant = (job.applicants || []).find(a => a.id === applicantId);
    if (!applicant) return;

    const updatedJobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          state: JobStates.WORKER_SELECTED,
          worker: {
            id: applicant.id,
            name: applicant.name,
            avatarText: applicant.avatarText
          }
        };
      }
      return j;
    });

    // Create or find conversation thread
    let conv = this.state.conversations.find(c => c.jobId === jobId);
    let updatedConvs = [...this.state.conversations];
    if (!conv) {
      conv = {
        id: `conv_${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        jobPayment: job.payment,
        status: JobStates.WORKER_SELECTED,
        participant: {
          id: applicant.id,
          name: applicant.name,
          avatarText: applicant.avatarText,
          role: applicant.ageCategoryLabel || 'Helfer'
        },
        messages: [
          {
            id: `msg_${Date.now()}`,
            senderId: this.state.currentUser.id,
            senderName: this.state.currentUser.name,
            text: `Hallo ${applicant.name}! Du wurdest für "${job.title}" ausgewählt. Die genaue Adresse lautet: ${job.exactAddress}. Bis bald!`,
            timestamp: 'Just now',
            isMine: true
          }
        ]
      };
      updatedConvs.unshift(conv);
    } else {
      updatedConvs = updatedConvs.map(c => {
        if (c.jobId === jobId) {
          return {
            ...c,
            status: JobStates.WORKER_SELECTED,
            messages: [
              ...c.messages,
              {
                id: `msg_${Date.now()}`,
                senderId: this.state.currentUser.id,
                senderName: this.state.currentUser.name,
                text: `Du wurdest als Helfer bestätigt! Genaue Adresse: ${job.exactAddress}`,
                timestamp: 'Just now',
                isMine: true
              }
            ]
          };
        }
        return c;
      });
    }

    this.setState({
      jobs: updatedJobs,
      conversations: updatedConvs,
      applicantJobId: null,
      selectedJobId: null,
      currentScreen: 'messages',
      selectedConversationId: conv.id
    });
  }

  // Safety Incident Report
  openReportModal(jobId) {
    this.setState({ reportJobId: jobId, selectedJobId: null });
  }

  closeReportModal() {
    this.setState({ reportJobId: null });
  }

  submitReport(jobId, category, details) {
    const jobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, moderation: 'FLAGGED' };
      }
      return j;
    });

    this.setState({
      jobs,
      reportJobId: null
    });
    this.showToast('🛡️ Sicherheitsmeldung vertraulich eingegangen. Unser Team prüft den Vorfall sofort.');
  }

  // Wallet Payout
  withdrawFunds() {
    const user = this.state.currentUser;
    const amount = user.walletBalance || 0;
    if (amount <= 0) {
      this.showToast('Dein auszahlbares Guthaben beträgt €0,00.', 'error');
      return;
    }

    const updatedUser = {
      ...user,
      walletBalance: 0.0
    };

    this.setState({ currentUser: updatedUser });
    this.showToast(`💸 Auszahlung von €${amount.toFixed(2)} auf dein Bankkonto veranlasst! (1–2 Werktage)`);
  }

  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
    this.notify();
    this.showToast('Reset QuickJob data to initial mock seed.');
  }
}

export const store = new Store();
