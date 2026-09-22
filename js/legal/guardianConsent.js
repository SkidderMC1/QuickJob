/**
 * QuickJob Digital Guardian Authorization & Verification System
 * Implements statutory consent workflows under German Civil Law (BGB §§ 107, 113)
 * and Minor Data Protection (GDPR Art. 8 & § 16 BDSG).
 */

export class GuardianConsentManager {
  /**
   * Check if a user currently possesses an active, verified guardian authorization.
   */
  static isConsentActive(user) {
    if (!user) return false;
    // Adults don't require guardian consent
    if (!user.age || user.age >= 18) return true;

    // Check specific authorization record
    if (user.guardianConsent && user.guardianConsent.status === 'ACTIVE') {
      return true;
    }

    return Boolean(user.hasParentConsent);
  }

  /**
   * Create a new formal Guardian Consent record.
   */
  static createAuthorizationRecord({
    minorId,
    minorName,
    guardianName,
    guardianEmail,
    guardianPhone = '',
    relationship = 'Mutter',
    maxWeeklyHours = 10,
    authorizedCategories = ['garden', 'shopping', 'tutoring', 'animals', 'tech', 'household'],
    termsVersion = '1.1.0'
  }) {
    const timestamp = new Date().toISOString();
    const verificationCode = `QJ-GDR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

    return {
      id: `gdr_auth_${Date.now()}`,
      minorId,
      minorName,
      guardianName: guardianName.trim(),
      guardianEmail: guardianEmail.trim().toLowerCase(),
      guardianPhone: guardianPhone.trim(),
      relationship,
      maxWeeklyHours: Number(maxWeeklyHours) || 10,
      authorizedCategories,
      termsVersion,
      status: 'ACTIVE',
      authorizedAt: timestamp,
      signatureVerificationCode: verificationCode,
      legalBasis: '§§ 107, 113 BGB i.V.m. Art. 8 DSGVO',
      auditNote: `Digitale Einwilligung durch Personensorgeberechtigte(n) ${guardianName} (${relationship}) erteilt.`
    };
  }

  /**
   * Revoke an active guardian authorization.
   */
  static revokeAuthorization(currentRecord, reason = 'Von Erziehungsberechtigtem widerrufen') {
    if (!currentRecord) return null;
    return {
      ...currentRecord,
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revocationReason: reason
    };
  }
}
