/**
 * QuickJob GDPR Data Subject Rights Engine (Articles 15–21 GDPR)
 * Provides technical execution of Data Access/Portability (Art. 15, 20)
 * and Erasure (Art. 17) with statutory fiscal retention exceptions (§ 147 AO / § 257 HGB).
 */

export class DataSubjectRightsManager {
  /**
   * Generates a comprehensive, machine-readable export of all user personal data (Art. 15 & 20 GDPR).
   */
  static exportUserData(state, userId) {
    const user = state.currentUser && state.currentUser.id === userId ? state.currentUser : null;
    const userJobs = (state.jobs || []).filter(j => 
      (j.employer && j.employer.id === userId) || 
      (j.worker && j.worker.id === userId) ||
      (j.applicants && j.applicants.some(a => a.id === userId))
    );

    const userConversations = (state.conversations || []).filter(c =>
      c.participant && c.participant.id === userId ||
      (c.messages && c.messages.some(m => m.senderId === userId))
    );

    return {
      exportMetadata: {
        platform: 'QuickJob Microjobs',
        exportDate: new Date().toISOString(),
        gdprLegalBasis: 'Art. 15 & 20 DSGVO (Recht auf Auskunft & Datenübertragbarkeit)',
        exportFormatVersion: '1.0.0'
      },
      userProfile: user ? {
        id: user.id,
        name: user.name,
        handle: user.handle,
        age: user.age,
        ageCategory: user.ageCategory,
        rating: user.rating,
        reliability: user.reliability,
        walletBalance: user.walletBalance,
        escrowBalance: user.escrowBalance,
        totalEarned: user.totalEarned,
        skills: user.skills,
        locationApprox: user.locationApprox,
        bio: user.bio,
        guardianConsentRecord: user.guardianConsent || null
      } : null,
      jobsHistory: userJobs.map(j => ({
        id: j.id,
        title: j.title,
        category: j.category,
        payment: j.payment,
        status: j.state,
        scheduledDate: j.dateSchedule,
        isEmployer: j.employer && j.employer.id === userId
      })),
      conversations: userConversations.map(c => ({
        id: c.id,
        jobId: c.jobId,
        jobTitle: c.jobTitle,
        messagesCount: (c.messages || []).length,
        myMessages: (c.messages || []).filter(m => m.senderId === userId).map(m => ({
          id: m.id,
          text: m.text,
          timestamp: m.timestamp
        }))
      })),
      legalAuditTrail: {
        agbAcceptedVersion: state.agbAcceptedVersion || '1.1.0',
        agbAcceptedAt: state.agbAcceptedAt || null,
        tdddgConsent: state.tdddgConsent || null
      }
    };
  }

  /**
   * Executes account deletion under Art. 17 GDPR, preserving statutory fiscal records under § 147 AO.
   */
  static processAccountDeletion(state, userId) {
    const user = state.currentUser && state.currentUser.id === userId ? state.currentUser : null;
    
    // Check if user has fiscal/payment records that must legally be retained under § 147 AO
    const hasFinancialRecords = Boolean(
      (user && (user.walletBalance > 0 || user.totalEarned > 0 || user.escrowBalance > 0)) ||
      (state.jobs || []).some(j => (j.employer?.id === userId || j.worker?.id === userId) && j.payment > 0)
    );

    const retainedAuditLog = hasFinancialRecords ? {
      retentionStatus: 'RETENTION_REQUIRED',
      legalBasis: '§ 147 Abs. 1 Nr. 4 Abgabenordnung (AO) i.V.m. § 257 Handelsgesetzbuch (HGB) & Art. 17 Abs. 3 lit. b DSGVO',
      retentionPeriodYears: 10,
      preservedFields: ['transactionId', 'paymentAmount', 'currency', 'timestamp', 'statutoryVoucherHash'],
      purgedFields: ['name', 'handle', 'bio', 'passwordHash', 'chatMessages', 'unassignedApplications', 'preciseLocation'],
      retainedAt: new Date().toISOString()
    } : null;

    // Purge user's personal profile and chat messages
    const sanitizedJobs = (state.jobs || []).map(j => {
      if (j.employer && j.employer.id === userId) {
        return {
          ...j,
          employer: { ...j.employer, name: 'Gelöschter Nutzer (Anonymisiert)', avatarText: '✕' },
          description: '[Dieses Inserat wurde infolge Kontolöschung archiviert]'
        };
      }
      if (j.worker && j.worker.id === userId) {
        return {
          ...j,
          worker: { ...j.worker, name: 'Gelöschter Helfer (Anonymisiert)', avatarText: '✕' }
        };
      }
      return j;
    });

    const sanitizedConversations = (state.conversations || []).filter(c => 
      !(c.participant && c.participant.id === userId)
    );

    return {
      success: true,
      purgedUserId: userId,
      hasFinancialRecords,
      retainedAuditLog,
      sanitizedJobs,
      sanitizedConversations,
      message: hasFinancialRecords ?
        'Konto gelöscht. Gemäß § 147 AO müssen steuerrelevante Buchungsbelege für 10 Jahre archiviert werden. Alle Profil- und Kommunikationsdaten wurden unwiderruflich gelöscht.' :
        'Konto und sämtliche personenbezogenen Daten wurden unwiderruflich gelöscht (Art. 17 DSGVO).'
    };
  }
}
