/**
 * QuickJob Central Authoritative Legal Eligibility Engine
 * Enforces German Youth Protection Law (JArbSchG), Child Labor Protection Ordinance (KindArbSchV),
 * and Civil Law Guardian Authorization requirements (BGB §§ 107, 113).
 *
 * This engine acts as the single source of truth for job eligibility across both UI and State.
 */

export const LegalAgeTiers = {
  UNDER_13: {
    id: 'UNDER_13',
    label: 'Kind unter 13 Jahren',
    minAge: 0,
    maxAge: 12,
    lawRef: '§ 5 Abs. 1 JArbSchG',
    description: 'Vollständiges gesetzliches Beschäftigungsverbot für Kinder unter 13 Jahren.'
  },
  CHILD_13_14: {
    id: 'CHILD_13_14',
    label: 'Kind 13–14 Jahre',
    minAge: 13,
    maxAge: 14,
    lawRef: '§ 5 Abs. 3 JArbSchG i.V.m. § 2 KindArbSchV',
    description: 'Nur leichte und geeignete Arbeiten bis max. 2 Std./Tag zwischen 08:00 und 18:00 Uhr mit Einwilligung der Personensorgeberechtigten.',
    maxHoursPerDay: 2.0,
    earliestHour: 8, // 08:00
    latestHour: 18,  // 18:00
    permittedCategories: ['garden', 'shopping', 'tutoring', 'animals', 'tech', 'household'],
    prohibitedCategories: ['disposal', 'carrying']
  },
  YOUTH_15_17: {
    id: 'YOUTH_15_17',
    label: 'Jugendlicher 15–17 Jahre',
    minAge: 15,
    maxAge: 17,
    lawRef: '§§ 8, 14, 22 JArbSchG',
    description: 'Arbeiten bis 8 Std./Tag zwischen 06:00 und 20:00 Uhr. Gefährliche Arbeiten, schwere Lasten und Akkordarbeit sind verboten.',
    maxHoursPerDay: 8.0,
    earliestHour: 6,  // 06:00
    latestHour: 20,   // 20:00
    permittedCategories: ['household', 'garden', 'shopping', 'animals', 'carrying', 'tech', 'tutoring', 'other'],
    prohibitedCategories: ['disposal']
  },
  ADULT_18_PLUS: {
    id: 'ADULT_18_PLUS',
    label: 'Volljährig (18+)',
    minAge: 18,
    maxAge: 99,
    lawRef: 'Arbeitszeitgesetz (ArbZG) & BGB',
    description: 'Volljährige Erwerbsperson ohne Beschränkungen des JArbSchG.'
  }
};

// Prohibited hazardous keywords under § 22 JArbSchG
export const HAZARDOUS_KEYWORDS_18_PLUS = [
  'kettensäge', 'chainsaw', 'dach', 'roof', 'leiter', 'ladder', 'gerüst', 'scaffold',
  'asbest', 'chemikalie', 'chemical', 'giftig', 'toxic', 'starkstrom', 'bohrhammer',
  'abbruch', 'demolition', 'schweißen', 'welding', 'beton', 'waschmaschine', 'klavier',
  'sperrmüll', 'hazardous waste', 'gefahrstoff'
];

export class LegalEligibilityEngine {
  /**
   * Determine the statutory age tier for a user.
   */
  static getAgeTier(age) {
    if (age === undefined || age === null || age < 13) return LegalAgeTiers.UNDER_13;
    if (age >= 13 && age <= 14) return LegalAgeTiers.CHILD_13_14;
    if (age >= 15 && age <= 17) return LegalAgeTiers.YOUTH_15_17;
    return LegalAgeTiers.ADULT_18_PLUS;
  }

  /**
   * Parse scheduled hour (0-23) from dateSchedule string (e.g. "Saturday · 14:00" -> 14).
   */
  static parseScheduledHour(dateSchedule) {
    if (!dateSchedule) return null;
    const match = dateSchedule.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  /**
   * Parse estimated hours from duration string (e.g. "≈ 1.5 hours" -> 1.5).
   */
  static parseDurationHours(durationStr) {
    if (!durationStr) return 1.0;
    if (durationStr.includes('30 min')) return 0.5;
    if (durationStr.includes('45 min')) return 0.75;
    const match = durationStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 1.0;
  }

  /**
   * Authoritative eligibility evaluation.
   * Evaluates if a given user is legally permitted to accept or apply to a job.
   */
  static evaluateEligibility(user, job) {
    const age = user ? user.age : null;
    const ageTier = this.getAgeTier(age);
    const durationHours = this.parseDurationHours(job.estimatedDuration);
    const scheduledHour = this.parseScheduledHour(job.dateSchedule);
    const combinedText = `${job.title} ${job.description} ${job.requirements ? job.requirements.join(' ') : ''}`.toLowerCase();

    const reasons = [];
    const legalBases = [];

    // TIER 1: UNDER 13 YEARS -> COMPLETE EMPLOYMENT BAN
    if (ageTier.id === LegalAgeTiers.UNDER_13.id) {
      return {
        isEligible: false,
        ageTier: ageTier.id,
        reasonCode: 'PROHIBITED_UNDER_13',
        reasons: ['Kinder unter 13 Jahren dürfen nach deutschem Recht nicht beschäftigt werden.'],
        legalBases: ['§ 5 Abs. 1 JArbSchG (Verbot der Kinderarbeit)'],
        requiresGuardianConsent: true,
        isHardBlocked: true
      };
    }

    // TIER 4: ADULT 18+ -> NO JArbSchG RESTRICTIONS
    if (ageTier.id === LegalAgeTiers.ADULT_18_PLUS.id) {
      return {
        isEligible: true,
        ageTier: ageTier.id,
        reasonCode: 'ELIGIBLE_ADULT',
        reasons: ['Volljährig. Keine Einschränkungen nach dem Jugendarbeitsschutzgesetz.'],
        legalBases: ['ArbZG / BGB'],
        requiresGuardianConsent: false,
        isHardBlocked: false
      };
    }

    // GENERAL MINOR CHECKS (13–17 YEARS)
    // 1. Guardian Consent Requirement under BGB §§ 107, 113
    const hasGuardianConsent = Boolean(user.hasParentConsent || (user.guardianConsent && user.guardianConsent.status === 'ACTIVE'));
    if (!hasGuardianConsent) {
      reasons.push('Für Minderjährige ist eine digitale Einwilligung der Personensorgeberechtigten erforderlich.');
      legalBases.push('§§ 107, 113 BGB i.V.m. § 5 Abs. 3 JArbSchG');
    }

    // 2. Hazardous tasks & 18+ restricted keywords under § 22 JArbSchG
    for (const kw of HAZARDOUS_KEYWORDS_18_PLUS) {
      if (combinedText.includes(kw)) {
        return {
          isEligible: false,
          ageTier: ageTier.id,
          reasonCode: 'HAZARDOUS_WORK_PROHIBITED',
          reasons: [`Gefährliche Arbeit erkannt (${kw}). Diese Tätigkeit birgt Unfallrisiken und ist nur für Volljährige zulässig.`],
          legalBases: ['§ 22 JArbSchG (Gefährliche Arbeiten)'],
          requiresGuardianConsent: true,
          isHardBlocked: true
        };
      }
    }

    // 3. Category prohibitions
    if (job.category === 'disposal') {
      return {
        isEligible: false,
        ageTier: ageTier.id,
        reasonCode: 'CATEGORY_PROHIBITED_DISPOSAL',
        reasons: ['Sperrmüll- und Entsorgungsarbeiten bergen erhöhte Verletzungsgefahren und sind für Minderjährige gesetzlich unzulässig.'],
        legalBases: ['§ 22 JArbSchG'],
        requiresGuardianConsent: true,
        isHardBlocked: true
      };
    }

    // TIER 2: CHILDREN AGED 13–14 (KindArbSchV & § 5 Abs. 3 JArbSchG)
    if (ageTier.id === LegalAgeTiers.CHILD_13_14.id) {
      // Prohibited categories for 13–14
      if (LegalAgeTiers.CHILD_13_14.prohibitedCategories.includes(job.category)) {
        return {
          isEligible: false,
          ageTier: ageTier.id,
          reasonCode: 'CATEGORY_PROHIBITED_CHILD',
          reasons: [`Die Kategorie "${job.category}" ist für Kinder im Alter von 13–14 Jahren nach der Kinderarbeitsschutzverordnung unzulässig.`],
          legalBases: ['§ 5 Abs. 3 JArbSchG i.V.m. § 2 KindArbSchV'],
          requiresGuardianConsent: true,
          isHardBlocked: true
        };
      }

      // Max duration: 2.0 hours daily
      if (durationHours > 2.0) {
        return {
          isEligible: false,
          ageTier: ageTier.id,
          reasonCode: 'DURATION_EXCEEDED_CHILD',
          reasons: [`Dauer (${durationHours}h) überschreitet das gesetzliche Maximum von 2 Stunden täglich für 13–14-Jährige.`],
          legalBases: ['§ 5 Abs. 3 Satz 2 JArbSchG'],
          requiresGuardianConsent: true,
          isHardBlocked: true
        };
      }

      // Time window: strictly between 08:00 and 18:00
      if (scheduledHour !== null && (scheduledHour < 8 || scheduledHour >= 18)) {
        return {
          isEligible: false,
          ageTier: ageTier.id,
          reasonCode: 'TIME_WINDOW_VIOLATION_CHILD',
          reasons: [`Uhrzeit (${scheduledHour}:00) liegt außerhalb des zulässigen Zeitfensters von 08:00 bis 18:00 Uhr für Kinder.`],
          legalBases: ['§ 5 Abs. 3 Satz 2 JArbSchG'],
          requiresGuardianConsent: true,
          isHardBlocked: true
        };
      }

      return {
        isEligible: reasons.length === 0,
        ageTier: ageTier.id,
        reasonCode: reasons.length === 0 ? 'ELIGIBLE_CHILD' : 'GUARDIAN_CONSENT_PENDING',
        reasons: reasons.length === 0 ? ['Zulässige leichte Arbeit nach KindArbSchV § 2.'] : reasons,
        legalBases: ['§ 5 Abs. 3 JArbSchG', '§ 2 KindArbSchV', ...legalBases],
        requiresGuardianConsent: true,
        isHardBlocked: false
      };
    }

    // TIER 3: YOUTH AGED 15–17 (JArbSchG §§ 8, 14, 22)
    if (ageTier.id === LegalAgeTiers.YOUTH_15_17.id) {
      // Time window: strictly between 06:00 and 20:00 (§ 14 JArbSchG)
      if (scheduledHour !== null && (scheduledHour < 6 || scheduledHour >= 20)) {
        return {
          isEligible: false,
          ageTier: ageTier.id,
          reasonCode: 'TIME_WINDOW_VIOLATION_YOUTH',
          reasons: [`Nachtruhe: Jugendliche dürfen nach 20:00 Uhr und vor 06:00 Uhr nicht beschäftigt werden.`],
          legalBases: ['§ 14 Abs. 1 JArbSchG (Nachtruhe)'],
          requiresGuardianConsent: true,
          isHardBlocked: true
        };
      }

      // Max continuous task duration for a single microjob
      if (durationHours > 4.5 && !job.hasBreaks) {
        reasons.push('Bei mehr als 4,5 Stunden Arbeitszeit sind nach § 11 JArbSchG gesetzliche Ruhepausen zwingend.');
        legalBases.push('§ 11 JArbSchG (Ruhepausen)');
      }

      return {
        isEligible: reasons.length === 0,
        ageTier: ageTier.id,
        reasonCode: reasons.length === 0 ? 'ELIGIBLE_YOUTH' : 'GUARDIAN_CONSENT_PENDING',
        reasons: reasons.length === 0 ? ['Geeignete Jugendtätigkeit unter Einhaltung des JArbSchG.'] : reasons,
        legalBases: ['§§ 8, 14, 22 JArbSchG', ...legalBases],
        requiresGuardianConsent: true,
        isHardBlocked: false
      };
    }

    return {
      isEligible: false,
      ageTier: 'UNKNOWN',
      reasonCode: 'UNDETERMINED',
      reasons: ['Altersfreigabe konnte nicht verifiziert werden.'],
      legalBases: ['JArbSchG'],
      requiresGuardianConsent: true,
      isHardBlocked: true
    };
  }

  /**
   * Audit job posting data during creation for employer compliance.
   */
  static auditJobPosting(jobData) {
    const text = `${jobData.title || ''} ${jobData.description || ''}`.toLowerCase();
    const durationHours = this.parseDurationHours(jobData.estimatedDuration);
    const scheduledHour = this.parseScheduledHour(jobData.dateSchedule);

    // 1. Check for 18+ hard requirements
    if (jobData.category === 'disposal') {
      return {
        recommendedMinAge: 18,
        isSafeForMinors: false,
        flag: 'DISPOSAL_HAZARD',
        reason: 'Sperrmüll- & Entsorgungsarbeiten bergen Verletzungsrisiken (§ 22 JArbSchG). Mindestalter 18 Jahre.',
        legalRef: '§ 22 JArbSchG'
      };
    }

    for (const kw of HAZARDOUS_KEYWORDS_18_PLUS) {
      if (text.includes(kw)) {
        return {
          recommendedMinAge: 18,
          isSafeForMinors: false,
          flag: 'HAZARDOUS_KEYWORD',
          reason: `Gefahrenmerkmal "${kw}" erkannt. Nur für Volljährige zugelassen (§ 22 JArbSchG).`,
          legalRef: '§ 22 JArbSchG'
        };
      }
    }

    // 2. Evening schedule
    if (scheduledHour !== null && scheduledHour >= 20) {
      return {
        recommendedMinAge: 18,
        isSafeForMinors: false,
        flag: 'NIGHT_HOURS',
        reason: 'Uhrzeit nach 20:00 Uhr unterliegt der Nachtruhe für Jugendliche (§ 14 JArbSchG).',
        legalRef: '§ 14 JArbSchG'
      };
    }

    // 3. Heavy physical work / long duration
    if (jobData.category === 'carrying' || durationHours > 2.5) {
      if (durationHours > 3.0 || text.includes('schwer') || text.includes('heavy')) {
        return {
          recommendedMinAge: 18,
          isSafeForMinors: false,
          flag: 'PHYSICAL_STRAIN',
          reason: 'Körperlich schwere Lasten oder mehr als 3 Stunden Tragearbeit sind Volljährigen vorbehalten.',
          legalRef: '§ 23 JArbSchG'
        };
      }
      return {
        recommendedMinAge: 16,
        isSafeForMinors: true,
        flag: 'MODERATE_YOUTH_16',
        reason: 'Mittelschwere Aufgabe (1,5 bis 2,5 Std.). Geeignet für Jugendliche ab 16 Jahren mit Elterneinwilligung.',
        legalRef: '§ 5 Abs. 2 JArbSchG'
      };
    }

    // 4. Over 2 hours -> Not for 13–14
    if (durationHours > 2.0) {
      return {
        recommendedMinAge: 16,
        isSafeForMinors: true,
        flag: 'YOUTH_16_HOURS',
        reason: 'Über 2 Stunden Dauer: Überschreitet die Höchstdauer für 13–14-Jährige gem. § 5 Abs. 3 JArbSchG.',
        legalRef: '§ 5 Abs. 3 JArbSchG'
      };
    }

    // 5. Light microjob suitable for 14+
    return {
      recommendedMinAge: 14,
      isSafeForMinors: true,
      flag: 'LIGHT_SAFE_JOB',
      reason: 'Leichte, geeignete Nachbarschaftshilfe unter 2 Stunden gem. KindArbSchV § 2.',
      legalRef: 'KindArbSchV § 2'
    };
  }
}
