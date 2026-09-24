/**
 * QuickJob Core Data Types & Constants
 */

export const JobCategories = [
  { id: 'household', name: 'Household', icon: '🏡', description: 'Cleaning, tidying, window wiping' },
  { id: 'garden', name: 'Garden', icon: '🌱', description: 'Mowing lawn, raking leaves, watering' },
  { id: 'disposal', name: 'Disposal', icon: '🗑️', description: 'Recycling, cellar clearing, bulk trash' },
  { id: 'shopping', name: 'Shopping & Errands', icon: '🛒', description: 'Supermarket runs, pharmacy pickup' },
  { id: 'animals', name: 'Animals', icon: '🐕', description: 'Dog walking, cat sitting, pet feeding' },
  { id: 'carrying', name: 'Carrying & Moving', icon: '📦', description: 'Box lifting, furniture rearrangement' },
  { id: 'tech', name: 'Computer & Technology', icon: '💻', description: 'Smartphone setup, WiFi help, PC assistance' },
  { id: 'tutoring', name: 'Tutoring', icon: '📚', description: 'Math, languages, school homework help' },
  { id: 'other', name: 'Other', icon: '🚗', description: 'Car wash, event help, small handiwork' }
];

export const JobStates = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  APPLICATIONS_OPEN: 'APPLICATIONS_OPEN',
  WORKER_SELECTED: 'WORKER_SELECTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETION_PENDING: 'COMPLETION_PENDING',
  COMPLETED: 'COMPLETED',
  PAYMENT_RELEASED: 'PAYMENT_RELEASED',
  REVIEWED: 'REVIEWED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
  EXPIRED: 'EXPIRED',
  BLOCKED: 'BLOCKED'
};

export const ApplicationModes = {
  DIRECT_ACCEPT: 'DIRECT_ACCEPT', // Direct acceptance [Accept Job]
  APPLICATION_REQUIRED: 'APPLICATION_REQUIRED' // Review applications first [Apply]
};

export const AgeCategories = {
  YOUTH_14_17: {
    id: 'YOUTH_14_17',
    label: 'Youth · 14–17',
    badgeClass: 'badge-purple',
    minAge: 14,
    maxAge: 17,
    guardianConsentRequired: true,
    maxHoursPerWeek: 10,
    restrictedCategories: ['disposal'] // e.g. heavy hazardous bulk waste
  },
  YOUNG_WORKER_18_25: {
    id: 'YOUNG_WORKER_18_25',
    label: 'Young Worker · 18–25',
    badgeClass: 'badge-info',
    minAge: 18,
    maxAge: 25,
    guardianConsentRequired: false
  },
  ADULT: {
    id: 'ADULT',
    label: 'Adult',
    badgeClass: 'badge-muted',
    minAge: 26,
    maxAge: 99,
    guardianConsentRequired: false
  },
  COMPANY: {
    id: 'COMPANY',
    label: '🏢 Verified Company',
    badgeClass: 'badge-info',
    isCompany: true
  }
};

export const ModerationStates = {
  SAFE: 'SAFE',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  BLOCKED: 'BLOCKED'
};

export const CheckInStates = {
  NOT_ARRIVED: 'NOT_ARRIVED',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED'
};

export const DefaultAchievements = [
  {
    id: 'tierfreund',
    title: 'Tierfreund',
    icon: '🐾',
    description: 'Erfolgreich Gassigeh- & Haustier-Jobs abgeschlossen.',
    unlocked: true,
    unlockedDate: '12.09.2026',
    category: 'animals'
  },
  {
    id: 'gartenprofi',
    title: 'Garten-Profi',
    icon: '🌿',
    description: 'Rasenpflege & Gartenarbeiten mit 5 Sternen gemeistert.',
    unlocked: true,
    unlockedDate: '16.09.2026',
    category: 'garden'
  },
  {
    id: 'einkaufsheld',
    title: 'Einkaufs-Held',
    icon: '🛒',
    description: 'Zuverlässig Senioren beim Wocheneinkauf unterstützt.',
    unlocked: true,
    unlockedDate: '18.09.2026',
    category: 'shopping'
  },
  {
    id: 'blitzschnell',
    title: 'Blitzschnell',
    icon: '⚡',
    description: 'Auftrag in Rekordzeit innerhalb von 24h erledigt.',
    unlocked: true,
    unlockedDate: '20.09.2026',
    category: 'speed'
  },
  {
    id: 'fivestar',
    title: '5-Sterne-Liebling',
    icon: '⭐',
    description: '3 hervorragende 5,0-Sterne-Bewertungen in Folge.',
    unlocked: true,
    unlockedDate: '22.09.2026',
    category: 'quality'
  },
  {
    id: 'sicherheit',
    title: 'Sicherheits-Pionier',
    icon: '🛡️',
    description: 'Ausweis verifiziert & Eltern-Portal erfolgreich aktiv.',
    unlocked: true,
    unlockedDate: '23.09.2026',
    category: 'safety'
  }
];
