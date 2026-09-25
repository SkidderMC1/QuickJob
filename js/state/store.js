/**
 * QuickJob Central Reactive State Store
 */
import { mockUsers, initialJobs, initialConversations } from '../data/mockData.js';
import { JobStates } from '../models/types.js';
import { LegalEligibilityEngine } from '../legal/legalEngine.js';
import { GuardianConsentManager } from '../legal/guardianConsent.js';
import { ConsentManager } from '../legal/consentManager.js';
import { DataSubjectRightsManager } from '../legal/dataSubjectRights.js';
import { AuthService } from '../services/authService.js';

const STORAGE_KEY = 'quickjob_state_v1';

class Store {
  constructor() {
    this.listeners = [];
    this._replyTimeouts = {};
    this.state = this.loadInitialState();
    this.checkSession();
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
          currentUser: mockUsers[parsed.currentPersonaKey || 'jasper'] || mockUsers.jasper,
          isAuthenticated: false,
          authSession: null,
          authViewMode: 'login',
          authPendingToken: '',
          currentScreen: 'auth' // Mandatory Auth Gate: Must be logged in to access app
        };
      } catch (e) {
        console.warn('Failed to parse cached state, reverting to initial mock data', e);
      }
    }

    return {
      currentPersonaKey: 'jasper',
      currentUser: mockUsers.jasper,
      isAuthenticated: false,
      authSession: null,
      authViewMode: 'login',
      authPendingToken: '',
      activeMode: 'find', // 'find' (Worker) or 'post' (Employer)
      currentScreen: 'auth', // Mandatory Auth Gate: App defaults to login screen
      displayMode: isStandalone ? 'native' : 'simulator', // 'simulator' (with PC phone frame) or 'native' (full-screen PWA)
      isDebugDrawerOpen: false,
      selectedJobId: null,
      selectedConversationId: null,
      reviewJobId: null,
      applicantJobId: null,
      reportJobId: null,
      activeLegalDocType: null,
      isAgbAcceptanceRequired: false,
      isGuardianModalOpen: false,
      isConsentModalOpen: false,
      agbAcceptedVersion: '1.1.0',
      agbAcceptedAt: '2026-09-22T10:00:00.000Z',
      agbAcceptanceHistory: [
        { documentId: 'AGB', version: '1.1.0', acceptedAt: '2026-09-22T10:00:00.000Z', userId: 'user_jasper' }
      ],
      isFilterModalOpen: false,
      isSafetyModalOpen: false,
      viewportSize: 'size-390',
      toast: null,

      // New Features State
      jobsViewMode: 'list', // 'list' or 'map'
      locationPermissionGranted: null, // null (not asked), true, or false
      isLocationModalOpen: false,
      isEmergencyModalOpen: false,
      emergencyJobId: null,
      isParentModalOpen: false,
      isParentUnlocked: false,
      isProofModalOpen: false,
      proofModalJobId: null,
      tempAiVerified: false,
      receiptModalJobId: null,
      activeTheme: 'light',

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

  // Navigation (Guarded by Mandatory Authentication Gate)
  setScreen(screen, payload = {}) {
    if (!this.state.isAuthenticated && screen !== 'auth') {
      this.setState({
        currentScreen: 'auth',
        authViewMode: 'login',
        ...payload
      });
      return;
    }
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
      isAuthenticated: true,
      currentScreen: this.state.currentScreen === 'auth' ? 'home' : this.state.currentScreen,
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

    // Authoritative Legal Eligibility Check (JArbSchG, KindArbSchV, BGB §§ 107, 113)
    const eligibility = LegalEligibilityEngine.evaluateEligibility(this.state.currentUser, job);
    if (!eligibility.isEligible) {
      this.showToast(`⛔ Jugendarbeitsschutz: ${eligibility.reasons[0]} (${eligibility.legalBases[0]})`, 'error');
      return;
    }

    // Guardian Consent check for minors
    if (eligibility.requiresGuardianConsent && !GuardianConsentManager.isConsentActive(this.state.currentUser)) {
      this.showToast('👨‍👩‍👧 Digitale Eltern-Einwilligung erforderlich (§ 113 BGB). Bitte im Profil verifizieren.', 'error');
      this.setState({ isGuardianModalOpen: true });
      return;
    }

    // Mandatory ID Verification check for Workers (Arbeitnehmer)
    const isWorker = !this.state.currentUser.role || this.state.currentUser.role === 'worker' || this.state.activeMode === 'find';
    if (isWorker && !this.state.currentUser.isIdentityVerified) {
      this.showToast('⚠️ Ausweispflicht für Helfer: Bitte verifiziere zuerst deinen Ausweis in den Profileinstellungen.', 'error');
      this.setState({ currentScreen: 'profile', selectedJobId: null });
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
    const audit = LegalEligibilityEngine.auditJobPosting(jobData);
    const effectiveMinAge = audit.recommendedMinAge > (Number(jobData.minAge) || 14) ? audit.recommendedMinAge : (Number(jobData.minAge) || 14);
    const effectiveSuitability = audit.recommendedMinAge === 18 ? '18+ Only (Gesetzlicher Jugendschutz)' : (jobData.ageSuitability || 'Suitable for 14+');

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
      ageSuitability: effectiveSuitability,
      minAge: effectiveMinAge,
      moderation: audit.isSafeForMinors ? 'SAFE' : 'RESTRICTED_18_PLUS',
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

  submitReview(jobId, rating, tags = [], comment = '', tipAmount = 0) {
    const parsedTip = Number(tipAmount) || 0;
    const jobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return { 
          ...j, 
          state: JobStates.REVIEWED,
          tipAmount: parsedTip
        };
      }
      return j;
    });

    const convs = this.state.conversations.map(c => {
      if (c.jobId === jobId) {
        return { ...c, status: JobStates.REVIEWED };
      }
      return c;
    });

    // If tip given, update wallet of worker
    let currentUser = this.state.currentUser;
    if (parsedTip > 0 && currentUser.role === 'worker') {
      currentUser = {
        ...currentUser,
        walletBalance: (currentUser.walletBalance || 0) + parsedTip,
        totalEarned: (currentUser.totalEarned || 0) + parsedTip
      };
    }

    this.setState({
      jobs,
      conversations: convs,
      currentUser,
      reviewJobId: null
    });
    this.showToast(`⭐ Danke! ★${rating}-Bewertung ${parsedTip > 0 ? `inkl. €${parsedTip} Trinkgeld ` : ''}veröffentlicht.`);
  }

  // --- NEW ADVANCED FEATURE STORE METHODS ---

  setJobsViewMode(mode) {
    if (mode === 'map' && this.state.locationPermissionGranted === null) {
      this.setState({ isLocationModalOpen: true });
    } else {
      this.setState({ jobsViewMode: mode });
    }
  }

  requestBrowserLocation(force = false) {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      this.showToast('⚠️ Standortzugriff erfordert HTTPS oder localhost (127.0.0.1).', 'error');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.showToast('⚠️ Standortbestimmung wird von deinem Browser nicht unterstützt.', 'error');
      return;
    }

    this.showToast('📍 Standortabfrage im Browser gestartet... Bitte bestätigen.', 'info');

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          this.setState({
            locationPermissionGranted: true,
            userCoordinates: coords,
            isLocationModalOpen: false,
            jobsViewMode: 'map'
          });
          this.showToast('✓ Live-Standort erfolgreich ermittelt!');
        },
        (err) => {
          console.warn('Geolocation error / browser prompt status:', err);
          if (err.code === 1) { // PERMISSION_DENIED
            this.setState({
              locationPermissionGranted: false,
              isLocationModalOpen: false,
              jobsViewMode: 'map'
            });
            this.showToast('⚠️ Standort im Browser blockiert. Klicke links neben der URL auf das Schlosssymbol 🔒, um den Standort zu erlauben.', 'error');
          } else if (err.code === 2) { // POSITION_UNAVAILABLE
            this.setState({
              locationPermissionGranted: true,
              isLocationModalOpen: false,
              jobsViewMode: 'map'
            });
            this.showToast('📍 Standortsignal nicht empfangen (Wuppertal-Zentrum aktiv).');
          } else if (err.code === 3) { // TIMEOUT
            this.setState({
              locationPermissionGranted: true,
              isLocationModalOpen: false,
              jobsViewMode: 'map'
            });
            this.showToast('📍 Zeitüberschreitung der Standortabfrage.');
          } else {
            this.setState({
              locationPermissionGranted: true,
              isLocationModalOpen: false,
              jobsViewMode: 'map'
            });
            this.showToast('📍 Standard-Standort (Wuppertal) aktiviert.');
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } catch (e) {
      console.warn('Geolocation exception:', e);
      this.showToast('Standortabfrage konnte nicht gestartet werden.', 'error');
    }
  }

  grantLocationPermission() {
    return this.requestBrowserLocation();
  }

  denyLocationPermission() {
    this.setState({
      locationPermissionGranted: false,
      isLocationModalOpen: false,
      jobsViewMode: 'map'
    });
    this.showToast('📍 Umgebungskarte auf Wuppertal-Zentrum zentriert.');
  }

  checkInToJob(jobId) {
    const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const updatedJobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          checkInStatus: 'ARRIVED',
          checkInTime: `${timeStr} Uhr`
        };
      }
      return j;
    });

    const conv = this.state.conversations.find(c => c.jobId === jobId);
    let updatedConvs = this.state.conversations;
    if (conv) {
      const checkInMsg = {
        id: `msg_checkin_${Date.now()}`,
        senderId: this.state.currentUser.id,
        senderName: this.state.currentUser.name,
        text: `📍 Live Check-In: Ich bin pünktlich um ${timeStr} Uhr am Einsatzort eingetroffen!`,
        timestamp: 'Gerade eben',
        isMine: true
      };
      updatedConvs = this.state.conversations.map(c => {
        if (c.jobId === jobId) {
          return { ...c, messages: [...c.messages, checkInMsg] };
        }
        return c;
      });
    }

    this.setState({ jobs: updatedJobs, conversations: updatedConvs });
    this.showToast(`✓ Live Check-In um ${timeStr} Uhr erfasst!`);
  }

  openEmergencyModal(jobId = null) {
    this.setState({ isEmergencyModalOpen: true, emergencyJobId: jobId });
  }

  closeEmergencyModal() {
    this.setState({ isEmergencyModalOpen: false, emergencyJobId: null });
  }

  openProofModal(jobId) {
    this.setState({ isProofModalOpen: true, proofModalJobId: jobId, tempAiVerified: false });
  }

  closeProofModal() {
    this.setState({ isProofModalOpen: false, proofModalJobId: null });
  }

  submitJobProofPhotos(jobId) {
    const job = this.state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const updatedJobs = this.state.jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          state: JobStates.COMPLETED,
          checkInStatus: 'COMPLETED',
          aiVisionVerified: true,
          aiVisionSummary: '🤖 KI-Bildprüfung (Gemini Vision): Arbeitsergebnis erfolgreich und plausibel verifiziert (98% Übereinstimmung).'
        };
      }
      return j;
    });

    const conv = this.state.conversations.find(c => c.jobId === jobId);
    let updatedConvs = this.state.conversations;
    if (conv) {
      const proofMsg = {
        id: `msg_proof_${Date.now()}`,
        senderId: this.state.currentUser.id,
        senderName: this.state.currentUser.name,
        text: `📸 Vorher-/Nachher-Beweis hochgeladen. KI-Prüfung: ✓ 98% Plausibilität bestätigt. Bitte Arbeit abnehmen!`,
        timestamp: 'Gerade eben',
        isMine: true
      };
      updatedConvs = this.state.conversations.map(c => {
        if (c.jobId === jobId) {
          return { ...c, status: JobStates.COMPLETED, messages: [...c.messages, proofMsg] };
        }
        return c;
      });
    }

    this.setState({
      jobs: updatedJobs,
      conversations: updatedConvs,
      isProofModalOpen: false
    });
    this.showToast('✓ Foto-Beweis & KI-Zertifikat im Chat eingereicht!');
  }

  openReceiptModal(jobId) {
    this.setState({ receiptModalJobId: jobId });
  }

  closeReceiptModal() {
    this.setState({ receiptModalJobId: null });
  }

  openParentModal() {
    this.setState({ isParentModalOpen: true, isParentUnlocked: false });
  }

  closeParentModal() {
    this.setState({ isParentModalOpen: false, isParentUnlocked: false });
  }

  updateUserParentPortal(isActive) {
    const current = this.state.currentUser;
    const updatedPortal = {
      ...(current.parentPortal || {}),
      isActive: !!isActive,
      parentCode: current.parentPortal?.parentCode || '482910'
    };
    this.setState({
      currentUser: {
        ...current,
        parentPortal: updatedPortal
      }
    });
  }

  setTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      root.removeAttribute('data-theme');
      document.body.classList.remove('dark-mode');
    }
    const current = this.state.currentUser;
    this.setState({
      activeTheme: theme,
      currentUser: {
        ...current,
        settings: {
          ...(current.settings || {}),
          theme
        }
      }
    });
    this.showToast(theme === 'dark' ? '🌙 Dark Mode aktiviert' : '☀️ Light Mode aktiviert');
  }

  updateNotificationSettings(key, value) {
    const current = this.state.currentUser;
    const notifications = {
      ...(current.settings?.notifications || {}),
      [key]: value
    };
    this.setState({
      currentUser: {
        ...current,
        settings: {
          ...(current.settings || {}),
          notifications
        }
      }
    });
    this.showToast('✓ Benachrichtigungseinstellungen gespeichert.');
  }

  verifyIdentity(idCardType = 'Personalausweis') {
    const current = this.state.currentUser;
    this.setState({
      currentUser: {
        ...current,
        isIdentityVerified: true,
        idCardType: idCardType,
        idCardVerifiedAt: new Date().toLocaleDateString('de-DE')
      }
    });
    this.showToast(`✓ ${idCardType} erfolgreich verifiziert!`);
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

  // Legal & Compliance Methods
  openLegalDoc(docType, requireAcceptance = false) {
    this.setState({ activeLegalDocType: docType, isAgbAcceptanceRequired: requireAcceptance });
  }

  recordAgbAcceptance(docType = 'AGB', version = '1.1.0') {
    const timestamp = new Date().toISOString();
    const entry = {
      documentId: docType,
      version: version,
      acceptedAt: timestamp,
      userId: this.state.currentUser.id
    };
    const history = [...(this.state.agbAcceptanceHistory || []), entry];
    this.setState({
      agbAcceptedVersion: version,
      agbAcceptedAt: timestamp,
      agbAcceptanceHistory: history,
      isAgbAcceptanceRequired: false,
      activeLegalDocType: null
    });
    this.showToast(`✓ AGB (Version ${version}) rechtsverbindlich akzeptiert.`);
  }

  openGuardianModal() {
    this.setState({ isGuardianModalOpen: true });
  }

  closeGuardianModal() {
    this.setState({ isGuardianModalOpen: false });
  }

  recordGuardianConsent(formData) {
    const user = this.state.currentUser;
    const authRecord = GuardianConsentManager.createAuthorizationRecord({
      minorId: user.id,
      minorName: user.name,
      guardianName: formData.guardianName,
      guardianEmail: formData.guardianEmail,
      guardianPhone: formData.guardianPhone || '',
      relationship: formData.relationship || 'Mutter'
    });

    const updatedUser = {
      ...user,
      hasParentConsent: true,
      guardianConsent: authRecord
    };

    this.setState({
      currentUser: updatedUser,
      isGuardianModalOpen: false
    });
    this.showToast('✓ Digitale Eltern-Einwilligung (§ 113 BGB) erfolgreich verifiziert!');
  }

  revokeGuardianConsent() {
    const user = this.state.currentUser;
    const revoked = GuardianConsentManager.revokeAuthorization(user.guardianConsent);
    const updatedUser = {
      ...user,
      hasParentConsent: false,
      guardianConsent: revoked
    };
    this.setState({
      currentUser: updatedUser,
      isGuardianModalOpen: false
    });
    this.showToast('Eltern-Einwilligung widerrufen. Auftragsannahme für Minderjährige pausiert.', 'error');
  }

  exportUserData() {
    const data = DataSubjectRightsManager.exportUserData(this.state, this.state.currentUser.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickjob-dsgvo-datenexport-${this.state.currentUser.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('✓ Vollständiger DSGVO-Datenexport (Art. 15) heruntergeladen.');
  }

  // Authentication & Session Management Methods
  async checkSession() {
    try {
      const res = await AuthService.getSession();
      if (res && res.authenticated && res.user) {
        this.setState({
          isAuthenticated: true,
          authSession: res.user,
          currentScreen: this.state.currentScreen === 'auth' ? 'home' : this.state.currentScreen,
          currentUser: {
            ...this.state.currentUser,
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            age: res.user.age,
            role: res.user.role,
            emailVerified: res.user.email_verified,
            isIdentityVerified: res.user.email_verified,
            walletBalance: res.user.wallet_balance !== undefined ? res.user.wallet_balance : this.state.currentUser.walletBalance,
            escrowBalance: res.user.escrow_balance !== undefined ? res.user.escrow_balance : this.state.currentUser.escrowBalance
          }
        });
      } else {
        this.setState({
          isAuthenticated: false,
          authSession: null,
          currentScreen: 'auth',
          authViewMode: 'login'
        });
      }
    } catch (e) {
      // Not logged in or session expired - strictly route to login screen
      this.setState({
        isAuthenticated: false,
        authSession: null,
        currentScreen: 'auth',
        authViewMode: 'login'
      });
    }
  }

  setAuthMode(mode, token = '') {
    this.setState({
      currentScreen: 'auth',
      authViewMode: mode,
      authPendingToken: token
    });
  }

  async loginUser(email, password, remember = true) {
    try {
      const res = await AuthService.login({ email, password, remember_me: remember });
      if (res && res.success && res.user) {
        this.setState({
          isAuthenticated: true,
          authSession: res.user,
          currentScreen: 'home',
          currentUser: {
            ...this.state.currentUser,
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            age: res.user.age,
            role: res.user.role,
            emailVerified: res.user.email_verified,
            isIdentityVerified: res.user.email_verified,
            walletBalance: res.user.wallet_balance !== undefined ? res.user.wallet_balance : this.state.currentUser.walletBalance,
            escrowBalance: res.user.escrow_balance !== undefined ? res.user.escrow_balance : this.state.currentUser.escrowBalance
          }
        });
        this.showToast(`✓ Willkommen zurück, ${res.user.name}!`);
        return { success: true, user: res.user };
      }
    } catch (err) {
      this.showToast(err.message || 'Anmeldung fehlgeschlagen.', 'error');
      return { success: false, error: err.message };
    }
  }

  async registerUser(regData) {
    try {
      const res = await AuthService.register(regData);
      if (res && res.success && res.user) {
        this.setState({
          isAuthenticated: true,
          authSession: res.user,
          currentScreen: 'auth',
          authViewMode: 'verify_email',
          currentUser: {
            ...this.state.currentUser,
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            age: res.user.age,
            role: res.user.role,
            emailVerified: false,
            isIdentityVerified: false
          }
        });
        this.showToast('✓ Konto erfolgreich registriert! Bitte E-Mail bestätigen.');
        return { success: true, user: res.user, token: res.verification_token_dev };
      }
    } catch (err) {
      this.showToast(err.message || 'Registrierung fehlgeschlagen.', 'error');
      return { success: false, error: err.message };
    }
  }

  async logoutUser() {
    try {
      await AuthService.logout();
    } catch (e) {
      console.warn('Logout warning', e);
    }
    this.setState({
      isAuthenticated: false,
      authSession: null,
      currentUser: null,
      currentScreen: 'auth',
      authViewMode: 'login',
      selectedJobId: null,
      selectedConversationId: null
    });
    this.showToast('✓ Erfolgreich abgemeldet.');
  }

  async verifyEmail(token) {
    try {
      const res = await AuthService.verifyEmail(token);
      if (res && res.success) {
        this.setState(prev => ({
          currentScreen: 'home',
          currentUser: {
            ...prev.currentUser,
            emailVerified: true,
            isIdentityVerified: true
          }
        }));
        this.showToast('✓ E-Mail erfolgreich verifiziert! Konto ist uneingeschränkt aktiv.');
        return { success: true };
      }
    } catch (err) {
      this.showToast(err.message || 'Ungültiger oder abgelaufener Bestätigungs-Token.', 'error');
      return { success: false, error: err.message };
    }
  }

  async resendVerification(email) {
    try {
      const res = await AuthService.resendVerification(email);
      this.showToast(res.message || '✓ Neuer Bestätigungs-Link wurde versendet.');
      return { success: true };
    } catch (err) {
      this.showToast(err.message || 'Fehler beim Senden des Bestätigungslinks.', 'error');
      return { success: false, error: err.message };
    }
  }

  async forgotPassword(email) {
    try {
      const res = await AuthService.forgotPassword(email);
      this.setState({ authViewMode: 'reset_password' });
      this.showToast(res.message || 'Falls ein Konto existiert, wurde eine E-Mail gesendet.');
      return { success: true };
    } catch (err) {
      this.showToast(err.message || 'Fehler beim Anfordern des Reset-Links.', 'error');
      return { success: false, error: err.message };
    }
  }

  async resetPassword(token, new_password, new_password_confirmation) {
    try {
      const res = await AuthService.resetPassword({ token, new_password, new_password_confirmation });
      this.setState({ authViewMode: 'login', authPendingToken: '' });
      this.showToast(res.message || '✓ Passwort geändert. Bitte neu anmelden.');
      return { success: true };
    } catch (err) {
      this.showToast(err.message || 'Passwort-Reset fehlgeschlagen.', 'error');
      return { success: false, error: err.message };
    }
  }

  async changePassword(current_password, new_password, new_password_confirmation) {
    try {
      const res = await AuthService.changePassword({ current_password, new_password, new_password_confirmation });
      this.showToast(res.message || '✓ Passwort erfolgreich geändert.');
      return { success: true };
    } catch (err) {
      this.showToast(err.message || 'Passwortänderung fehlgeschlagen.', 'error');
      return { success: false, error: err.message };
    }
  }

  async deleteAccount() {
    try {
      if (this.state.isAuthenticated) {
        await AuthService.deleteAccount();
      }
    } catch (e) {
      console.warn('Backend deleteAccount notice', e);
    }
    const result = DataSubjectRightsManager.processAccountDeletion(this.state, this.state.currentUser.id);
    this.setState({
      isAuthenticated: false,
      authSession: null,
      currentUser: null,
      jobs: result.sanitizedJobs,
      conversations: result.sanitizedConversations,
      currentScreen: 'auth',
      authViewMode: 'login',
      selectedJobId: null,
      selectedConversationId: null
    });
    this.showToast(result.message, result.hasFinancialRecords ? 'warning' : 'success');
  }

  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
    this.notify();
    this.showToast('Reset QuickJob data to initial mock seed.');
  }
}

export const store = new Store();
