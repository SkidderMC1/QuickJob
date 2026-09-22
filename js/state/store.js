/**
 * QuickJob Central Reactive State Store
 */
import { mockUsers, initialJobs, initialConversations } from '../data/mockData.js';
import { JobStates } from '../models/types.js';

const STORAGE_KEY = 'quickjob_state_v1';

class Store {
  constructor() {
    this.listeners = [];
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
      isFilterModalOpen: false,
      isSafetyModalOpen: false,
      viewportSize: 'size-390',
      toast: null,
      filters: {
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

  // Filter actions
  setFilter(key, value) {
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
        category: 'all',
        query: '',
        maxDistanceKm: 10,
        minPayment: 0,
        sortBy: 'closest',
        onlySuitableForMyAge: true
      }
    });
  }

  // Job actions
  toggleBookmark(jobId) {
    const jobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        const next = !j.isBookmarked;
        return { ...j, isBookmarked: next };
      }
      return j;
    });
    this.setState({ jobs });
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
              text: text.trim(),
              timestamp: 'Just now',
              isMine: true
            }
          ]
        };
      }
      return c;
    });
    this.setState({ conversations: convs });
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

    this.showToast(`🎉 ${applicant.name} ausgewählt! Adresse freigeschaltet.`);
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
