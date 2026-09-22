/**
 * QuickJob Realistic Mock Data
 */
import { JobStates, ApplicationModes } from '../models/types.js';

export const mockUsers = {
  jasper: {
    id: 'user_jasper',
    name: 'Jasper Klein',
    handle: '@jasper_k',
    avatarText: 'JK',
    age: 16,
    ageCategory: 'YOUTH_14_17',
    ageCategoryLabel: 'Youth · 14–17',
    rating: 4.9,
    ratingCount: 32,
    completedJobs: 32,
    reliability: 97,
    walletBalance: 75.0,
    escrowBalance: 28.0,
    totalEarned: 185.0,
    isIdentityVerified: true,
    hasParentConsent: true,
    skills: ['Garden', 'Computer & Technology', 'Tutoring'],
    locationApprox: 'Wuppertal-Elberfeld',
    bio: 'High school student passionate about gardening and tech help. Always on time and reliable.',
    recentReviews: [
      {
        author: 'Frau Schmidt',
        rating: 5,
        date: '3 days ago',
        text: 'Jasper helped raking leaves and mowing the lawn. Extremely polite, thorough and punctual!'
      },
      {
        author: 'TechCraft Digital GmbH',
        rating: 5,
        date: '2 weeks ago',
        text: 'Great assistance during our office hardware inventory check.'
      }
    ]
  },
  sophia: {
    id: 'user_sophia',
    name: 'Sophia Weber',
    handle: '@sophia_w',
    avatarText: 'SW',
    age: 22,
    ageCategory: 'YOUNG_WORKER_18_25',
    ageCategoryLabel: 'Young Worker · 18–25',
    rating: 5.0,
    ratingCount: 19,
    completedJobs: 19,
    reliability: 100,
    walletBalance: 120.0,
    escrowBalance: 0.0,
    totalEarned: 340.0,
    isIdentityVerified: true,
    hasParentConsent: false, // not needed for 18+
    skills: ['Tutoring', 'Shopping & Errands', 'Animals'],
    locationApprox: 'Wuppertal-Barmen',
    bio: 'University student offering friendly English/German tutoring and loving pet care.'
  },
  marcus: {
    id: 'user_marcus',
    name: 'Dr. Marcus Lang',
    handle: '@dr_lang',
    avatarText: 'ML',
    age: 48,
    ageCategory: 'ADULT',
    ageCategoryLabel: 'Adult Homeowner',
    rating: 4.9,
    ratingCount: 24,
    completedJobs: 24,
    walletBalance: 50.0,
    escrowBalance: 28.0,
    totalEarned: 0.0,
    isIdentityVerified: true,
    isCompany: false,
    locationApprox: 'Wuppertal-Elberfeld (Briller Viertel)',
    bio: 'Homeowner looking for dependable neighborhood help with garden and household tasks.'
  },
  techcraft: {
    id: 'user_techcraft',
    name: 'TechCraft Digital GmbH',
    handle: '@techcraft_de',
    avatarText: 'TC',
    ageCategory: 'COMPANY',
    ageCategoryLabel: '🏢 Verified Company',
    rating: 4.8,
    ratingCount: 45,
    completedJobs: 45,
    walletBalance: 450.0,
    escrowBalance: 55.0,
    totalEarned: 0.0,
    isIdentityVerified: true,
    isCompany: true,
    companyReg: 'HRB 29841 (Amtsgericht Wuppertal)',
    locationApprox: 'Wuppertal-Unterbarmen',
    bio: 'Local software and hardware logistics workshop supporting youth training opportunities.'
  }
};

export const initialJobs = [
  {
    id: 'job_01',
    title: 'Mow front lawn & rake hedge clippings',
    category: 'garden',
    payment: 28,
    estimatedDuration: '≈ 1.5 hours',
    distanceKm: 1.4,
    approxLocation: 'Wuppertal-Elberfeld (near Luisenviertel)',
    exactAddress: 'Luisenstraße 42, 42103 Wuppertal', // Revealed only after assignment
    dateSchedule: 'Saturday · 14:00',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.APPLICATION_REQUIRED,
    ageSuitability: 'Suitable for 14+',
    minAge: 14,
    moderation: 'SAFE',
    employer: {
      id: 'user_marcus',
      name: 'Dr. Marcus Lang',
      avatarText: 'ML',
      rating: 4.9,
      completedJobs: 24,
      isIdentityVerified: true
    },
    description: 'We have a standard 120m² front garden. Electric lawnmower and green waste bags are provided on site. Need lawn mowed and edges trimmed along the stone pathway.',
    requirements: ['Punctual', 'Garden gloves recommended', 'Responsible handling of electric mower'],
    applicantsCount: 2,
    applicants: [
      {
        id: 'user_jasper',
        name: 'Jasper Klein',
        avatarText: 'JK',
        age: 16,
        ageCategoryLabel: 'Youth · 14–17',
        rating: 4.9,
        completedJobs: 32,
        reliability: 97,
        hasParentConsent: true,
        appliedAt: '2 hours ago',
        pitch: 'Hallo Herr Dr. Lang! Ich helfe gerne im Garten, bringe eigene Handschuhe mit und bin pünktlich um 14:00 vor Ort.'
      },
      {
        id: 'user_sophia',
        name: 'Sophia Weber',
        avatarText: 'SW',
        age: 22,
        ageCategoryLabel: 'Young Worker · 18–25',
        rating: 5.0,
        completedJobs: 19,
        reliability: 100,
        appliedAt: '3 hours ago',
        pitch: 'Hallo, ich wohne um die Ecke und kann Samstag gerne beim Rasenmähen unterstützen.'
      }
    ],
    isBookmarked: false
  },
  {
    id: 'job_02',
    title: 'Help setting up new Smart TV & WiFi router',
    category: 'tech',
    payment: 35,
    estimatedDuration: '≈ 1 hour',
    distanceKm: 2.1,
    approxLocation: 'Wuppertal-Barmen',
    exactAddress: 'Wormser Str. 18, 42285 Wuppertal',
    dateSchedule: 'Friday · 16:30',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.DIRECT_ACCEPT,
    ageSuitability: 'Suitable for 14+',
    minAge: 14,
    moderation: 'SAFE',
    employer: {
      id: 'user_helga',
      name: 'Helga M.',
      avatarText: 'HM',
      rating: 5.0,
      completedJobs: 8,
      isIdentityVerified: true
    },
    description: 'Got a new Panasonic Smart TV. Need someone patient to connect it to our Telekom home WiFi, login to ARD Mediathek and show me how to switch HDMI channels.',
    requirements: ['Friendly & patient demeanor', 'Familiar with basic Smart TV setup'],
    applicantsCount: 0,
    applicants: [],
    isBookmarked: false
  },
  {
    id: 'job_03',
    title: 'Walk Golden Retriever "Barnaby" in Hardt Park',
    category: 'animals',
    payment: 20,
    estimatedDuration: '≈ 1 hour',
    distanceKm: 0.9,
    approxLocation: 'Wuppertal-Hardt',
    exactAddress: 'Reichsallee 7, 42107 Wuppertal',
    dateSchedule: 'Tomorrow · 15:00',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.DIRECT_ACCEPT,
    ageSuitability: 'Suitable for 14+',
    minAge: 14,
    moderation: 'SAFE',
    employer: {
      id: 'user_sarah',
      name: 'Sarah K.',
      avatarText: 'SK',
      rating: 4.9,
      completedJobs: 15,
      isIdentityVerified: true
    },
    description: 'Barnaby is a gentle, well-trained 4-year-old Golden Retriever. Just needs an afternoon walk around the Hardt botanical grounds. Leash and treats provided!',
    requirements: ['Comfortable with medium-large friendly dogs', 'Stout footwear'],
    applicantsCount: 1,
    applicants: [],
    isBookmarked: false
  },
  {
    id: 'job_04',
    title: 'Organize warehouse cable spools & label boxes',
    category: 'tech',
    payment: 55,
    estimatedDuration: '≈ 2.5 hours',
    distanceKm: 3.2,
    approxLocation: 'Wuppertal-Unterbarmen',
    exactAddress: 'Friedrich-Engels-Allee 112, 42285 Wuppertal',
    dateSchedule: 'Next Monday · 10:00',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.APPLICATION_REQUIRED,
    ageSuitability: '16+ (Parent consent required if under 18)',
    minAge: 16,
    moderation: 'SAFE',
    employer: {
      id: 'user_techcraft',
      name: 'TechCraft Digital GmbH',
      avatarText: 'TC',
      rating: 4.8,
      completedJobs: 45,
      isCompany: true,
      isIdentityVerified: true
    },
    description: 'TechCraft is sorting our delivery depot. Need help rolling patch cables, placing them in designated plastic bins, and printing QR label stickers.',
    requirements: ['Accurate attention to detail', 'Safety sneakers'],
    applicantsCount: 1,
    applicants: [
      {
        id: 'user_jasper',
        name: 'Jasper Klein',
        avatarText: 'JK',
        age: 16,
        ageCategoryLabel: 'Youth · 14–17',
        rating: 4.9,
        completedJobs: 32,
        reliability: 97,
        hasParentConsent: true,
        appliedAt: 'Yesterday',
        pitch: 'Hallo TechCraft-Team! Ich interessiere mich sehr für IT-Hardware und habe bereits beim letzten Inventar geholfen.'
      }
    ],
    isBookmarked: false
  },
  {
    id: 'job_05',
    title: 'Math tutoring 8th grade (Fractions & Linear equations)',
    category: 'tutoring',
    payment: 30,
    estimatedDuration: '≈ 1.5 hours',
    distanceKm: 1.8,
    approxLocation: 'Wuppertal-Elberfeld West',
    exactAddress: 'Nützenberger Str. 90, 42115 Wuppertal',
    dateSchedule: 'Thursday · 17:00',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.APPLICATION_REQUIRED,
    ageSuitability: 'Suitable for 16–25',
    minAge: 16,
    moderation: 'SAFE',
    employer: {
      id: 'user_stefan',
      name: 'Stefan B.',
      avatarText: 'SB',
      rating: 4.7,
      completedJobs: 11,
      isIdentityVerified: true
    },
    description: 'Looking for a patient student to help our 14-year-old son prepare for an upcoming math class test on linear equations and fraction arithmetic.',
    requirements: ['Good grades in secondary school mathematics', 'Calm explanatory style'],
    applicantsCount: 2,
    isBookmarked: false
  },
  {
    id: 'job_06',
    title: 'Carrying 6 relocation boxes down 2 flights of stairs',
    category: 'carrying',
    payment: 25,
    estimatedDuration: '≈ 45 min',
    distanceKm: 2.5,
    approxLocation: 'Wuppertal-Vohwinkel',
    exactAddress: 'Kaiserstraße 33, 42329 Wuppertal',
    dateSchedule: 'Saturday · 11:30',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.APPLICATION_REQUIRED,
    ageSuitability: '18+ Only (Heavy lifting safety regulation)',
    minAge: 18,
    moderation: 'SAFE',
    employer: {
      id: 'user_jonas',
      name: 'Jonas R.',
      avatarText: 'JR',
      rating: 4.9,
      completedJobs: 6,
      isIdentityVerified: true
    },
    description: 'Moving apartment. Large furniture is already handled by professionals. Just need a hand moving 6 sealed medium cardboard book boxes down to the van.',
    requirements: ['Adult (18+)', 'Physical fitness', 'Work gloves'],
    applicantsCount: 1,
    isBookmarked: false
  },
  {
    id: 'job_07',
    title: 'Grocery errand: REWE weekly run for senior couple',
    category: 'shopping',
    payment: 22,
    estimatedDuration: '≈ 1 hour',
    distanceKm: 0.8,
    approxLocation: 'Wuppertal-Elberfeld Herzogstraße',
    exactAddress: 'Herzogstraße 14, 42103 Wuppertal',
    dateSchedule: 'Friday · 10:00',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.DIRECT_ACCEPT,
    ageSuitability: 'Suitable for 14+',
    minAge: 14,
    moderation: 'SAFE',
    employer: {
      id: 'user_marcus',
      name: 'Dr. Marcus Lang',
      avatarText: 'ML',
      rating: 4.9,
      completedJobs: 24,
      isIdentityVerified: true
    },
    description: 'Pre-written grocery list of 12 items (fresh bread, milk, fruit, mineral water). Funds for groceries are transferred directly; €22 is your errand compensation.',
    requirements: ['Sturdy backpack or rolling cart', 'Careful grocery selection'],
    applicantsCount: 0,
    isBookmarked: false
  },
  {
    id: 'job_08',
    title: 'Cellar clearance: Carry old cardboard & broken shelves to container',
    category: 'disposal',
    payment: 40,
    estimatedDuration: '≈ 2 hours',
    distanceKm: 3.5,
    approxLocation: 'Wuppertal-Ronsdorf',
    exactAddress: 'Lüttringhauser Str. 55, 42369 Wuppertal',
    dateSchedule: 'Sunday · 13:00',
    state: JobStates.APPLICATIONS_OPEN,
    applicationMode: ApplicationModes.APPLICATION_REQUIRED,
    ageSuitability: '18+ Only (Bulk waste handling safety)',
    minAge: 18,
    moderation: 'SAFE',
    employer: {
      id: 'user_claudia',
      name: 'Claudia W.',
      avatarText: 'CW',
      rating: 5.0,
      completedJobs: 9,
      isIdentityVerified: true
    },
    description: 'Cleared out basement. Need wooden boards and dismantled IKEA shelves stacked neatly outside next to the registered municipal bulk waste container.',
    requirements: ['18+ Young worker or adult', 'Gloves and sturdy shoes'],
    applicantsCount: 2,
    isBookmarked: false
  }
];

export const initialConversations = [
  {
    id: 'conv_01',
    jobId: 'job_01',
    jobTitle: 'Mow front lawn & rake hedge clippings',
    jobPayment: 28,
    status: 'IN_PROGRESS',
    participant: {
      id: 'user_marcus',
      name: 'Dr. Marcus Lang',
      avatarText: 'ML',
      role: 'Employer'
    },
    messages: [
      {
        id: 'm1',
        senderId: 'user_marcus',
        senderName: 'Dr. Marcus Lang',
        text: 'Hello Jasper! Thanks for applying. Would Saturday at 14:00 suit your schedule?',
        timestamp: 'Yesterday 17:15',
        isMine: false
      },
      {
        id: 'm2',
        senderId: 'user_jasper',
        senderName: 'Jasper Klein',
        text: 'Hi Dr. Lang! Yes, 14:00 is perfect. I have my own gardening gloves and will bring them along.',
        timestamp: 'Yesterday 17:28',
        isMine: true
      },
      {
        id: 'm3',
        senderId: 'user_marcus',
        senderName: 'Dr. Marcus Lang',
        text: 'Wonderful. The electric mower is in the garden shed. Looking forward to meeting you on Saturday.',
        timestamp: 'Yesterday 18:02',
        isMine: false
      }
    ]
  },
  {
    id: 'conv_02',
    jobId: 'job_04',
    jobTitle: 'Organize warehouse cable spools & label boxes',
    jobPayment: 55,
    status: 'APPLICATIONS_OPEN',
    participant: {
      id: 'user_techcraft',
      name: 'TechCraft Digital GmbH',
      avatarText: 'TC',
      role: 'Company Employer'
    },
    messages: [
      {
        id: 'm4',
        senderId: 'user_techcraft',
        senderName: 'TechCraft Digital GmbH',
        text: 'Hi! We received your application. Since you are 16, please ensure your guardian consent is verified on your QuickJob profile.',
        timestamp: 'Today 09:30',
        isMine: false
      },
      {
        id: 'm5',
        senderId: 'user_jasper',
        senderName: 'Jasper Klein',
        text: 'Hello! Yes, my mother signed the digital QuickJob parental consent form, badge is active on my profile!',
        timestamp: 'Today 09:42',
        isMine: true
      }
    ]
  }
];
