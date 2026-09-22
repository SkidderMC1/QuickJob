/**
 * QuickJob TDDDG § 25 & GDPR Consent Management Architecture
 * Enforces statutory consent for terminal device storage without dark patterns.
 * Strictly necessary storage is exempt under § 25 Abs. 2 Nr. 2 TDDDG.
 */

const CONSENT_STORAGE_KEY = 'quickjob_tdddg_consent_v1';
const CONSENT_VERSION = '1.1.0';

export const ConsentCategories = {
  STRICTLY_NECESSARY: {
    id: 'strictly_necessary',
    label: 'Technisch zwingend erforderlich',
    description: 'Notwendig für Grundfunktionen wie Anmeldung, Sicherheitsüberprüfungen, Jugendschutz-Filter (§ 22 JArbSchG) und Speicherung Ihres Zustimmungsstatus.',
    legalBasis: '§ 25 Abs. 2 Nr. 2 TDDDG',
    required: true,
    isAlwaysActive: true
  },
  FUNCTIONAL_PREFERENCES: {
    id: 'functional_preferences',
    label: 'Funktionale Einstellungen & Personalisierung',
    description: 'Ermöglicht das Merken von Gerätedarstellung (z. B. Smartphone-Bezel vs. Vollbild) und Sortierpräferenzen.',
    legalBasis: 'Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TDDDG',
    required: false,
    isAlwaysActive: false
  },
  ANONYMOUS_ANALYTICS: {
    id: 'anonymous_analytics',
    label: 'Anonymisierte Reichweitenmessung & Fehlertracking',
    description: 'Hilft uns, Fehler der PWA zu erkennen und die Zuverlässigkeit zu verbessern. Keine Erstellung von Werbeprofilen.',
    legalBasis: 'Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TDDDG',
    required: false,
    isAlwaysActive: false
  }
};

export class ConsentManager {
  static getConsentState() {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read consent record', e);
    }
    return {
      hasDecided: false,
      version: CONSENT_VERSION,
      timestamp: null,
      categories: {
        strictly_necessary: true,
        functional_preferences: false,
        anonymous_analytics: false
      }
    };
  }

  static hasDecided() {
    const state = this.getConsentState();
    return Boolean(state && state.hasDecided);
  }

  static isCategoryAllowed(categoryId) {
    if (categoryId === 'strictly_necessary') return true;
    const state = this.getConsentState();
    return Boolean(state && state.categories && state.categories[categoryId]);
  }

  static saveConsent(categories) {
    const payload = {
      hasDecided: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      categories: {
        strictly_necessary: true, // Always true under § 25 Abs. 2 Nr. 2 TDDDG
        functional_preferences: Boolean(categories.functional_preferences),
        anonymous_analytics: Boolean(categories.anonymous_analytics)
      }
    };
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist consent', e);
    }
    return payload;
  }

  static acceptAll() {
    return this.saveConsent({
      functional_preferences: true,
      anonymous_analytics: true
    });
  }

  static rejectOptional() {
    return this.saveConsent({
      functional_preferences: false,
      anonymous_analytics: false
    });
  }

  static revokeConsent() {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to revoke consent', e);
    }
    return this.getConsentState();
  }
}
