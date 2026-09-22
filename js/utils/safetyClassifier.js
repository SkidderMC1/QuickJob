/**
 * QuickJob Intelligent Automatic Age & Safety Classification Engine
 * Analyzes microjob category, keywords, duration, and time schedule
 * according to child & youth labor protection principles (JArbSchG).
 */

export function classifyJobSafety({ category = 'other', title = '', description = '', estimatedDuration = '≈ 1 hour', dateSchedule = '' }) {
  const combinedText = `${title} ${description} ${dateSchedule}`.toLowerCase();
  
  // Extract hours from estimatedDuration string (e.g. "≈ 1.5 hours", "≈ 45 min", "≈ 3 hours")
  let hours = 1.0;
  if (estimatedDuration.includes('45 min') || estimatedDuration.includes('30 min')) {
    hours = 0.75;
  } else if (estimatedDuration.includes('1.5')) {
    hours = 1.5;
  } else if (estimatedDuration.includes('2.5')) {
    hours = 2.5;
  } else if (estimatedDuration.includes('3.5')) {
    hours = 3.5;
  } else {
    const match = estimatedDuration.match(/(\d+(\.\d+)?)/);
    if (match) {
      hours = parseFloat(match[1]);
    }
  }

  // 1. HARD 18+ CATEGORIES: Bulk disposal, hazardous materials, demolition
  if (category === 'disposal') {
    return {
      minAge: 18,
      ageSuitability: '18+ Only (Heavy waste & hazardous material safety)',
      badgeClass: 'badge-danger',
      badgeText: '⚠️ Nur ab 18 Jahren',
      reason: 'Sperrmüll- & Entsorgungsarbeiten enthalten Verletzungsrisiken (Scherben, Schadstoffe, schwere Lasten) und sind für Minderjährige gesetzlich unzulässig.',
      lawRef: '§ 22 JArbSchG (Gefährliche Arbeiten)',
      riskLevel: 'HIGH'
    };
  }

  // 2. HARD 18+ KEYWORDS: Heavy lifting, dangerous machinery, roof/heights, late night
  const dangerousKeywords = [
    'kettensäge', 'chainsaw', 'dach', 'roof', 'leiter hoch', 'gerüst', 'scaffold', 
    'asbest', 'chemikalie', 'giftig', 'starkstrom', 'bohrhammer', 'abbruch',
    'waschmaschine', 'klavier', 'schwerer umzug', 'beton', 'schweißen'
  ];

  for (const word of dangerousKeywords) {
    if (combinedText.includes(word)) {
      return {
        minAge: 18,
        ageSuitability: '18+ Only (Safety hazard / heavy machinery detected)',
        badgeClass: 'badge-danger',
        badgeText: '⚠️ Nur ab 18 Jahren',
        reason: `Aufgrund von Sicherheitsfaktoren (${word}) ist diese Aufgabe ausschließlich für volljährige Helfer zugelassen.`,
        lawRef: '§ 22 JArbSchG (Unfallgefahren & gefährliche Maschinen)',
        riskLevel: 'HIGH'
      };
    }
  }

  // 3. LATE NIGHT TIME RESTRICTIONS (after 20:00)
  const lateHours = ['20:00', '20:30', '21:00', '21:30', '22:00', '23:00', 'spätabend', 'nachts'];
  for (const timeStr of lateHours) {
    if (combinedText.includes(timeStr)) {
      return {
        minAge: 18,
        ageSuitability: '18+ Only (Late evening schedule)',
        badgeClass: 'badge-danger',
        badgeText: '⚠️ Nur ab 18 Jahren',
        reason: 'Aufgaben nach 20:00 Uhr dürfen nach deutschem Jugendarbeitsschutz nicht von Jugendlichen ausgeführt werden.',
        lawRef: '§ 14 JArbSchG (Nachtruhe)',
        riskLevel: 'MEDIUM'
      };
    }
  }

  // 4. HEAVY CARRYING OR LONG DURATION (> 2.5 hours)
  if (category === 'carrying' || hours > 2.5) {
    if (hours > 3 || combinedText.includes('schwer') || combinedText.includes('heavy') || combinedText.includes('treppe')) {
      return {
        minAge: 18,
        ageSuitability: '18+ Only (Physical strain / over 3 hours)',
        badgeClass: 'badge-danger',
        badgeText: '⚠️ Nur ab 18 Jahren',
        reason: 'Körperlich schwere Tragearbeiten über Treppen oder Tätigkeiten über 3 Stunden sind Volljährigen vorbehalten.',
        lawRef: '§ 23 JArbSchG (Körperliche Überbeanspruchung)',
        riskLevel: 'MEDIUM'
      };
    }
    return {
      minAge: 16,
      ageSuitability: '16+ (Youth with parental consent)',
      badgeClass: 'badge-info',
      badgeText: '⚡ Ab 16 Jahren',
      reason: 'Mittelschwere Aufgabe (1,5 bis 2,5 Stunden). Geeignet für Jugendliche ab 16 Jahren mit digitaler Einverständniserklärung der Eltern.',
      lawRef: '§ 5 Abs. 2 JArbSchG (Jugendliche 16–17 Jahre)',
      riskLevel: 'LOW'
    };
  }

  // 5. MODERATE DURATION (between 2 and 2.5 hours)
  if (hours > 2.0) {
    return {
      minAge: 16,
      ageSuitability: '16+ (Duration over 2 hours)',
      badgeClass: 'badge-info',
      badgeText: '⚡ Ab 16 Jahren',
      reason: 'Tätigkeiten über 2 Stunden überschreiten die gesetzliche Höchstdauer für 14- bis 15-Jährige und erfordern ein Mindestalter von 16 Jahren.',
      lawRef: '§ 5 Abs. 3 JArbSchG (Höchstarbeitszeit für Schulpflichtige)',
      riskLevel: 'LOW'
    };
  }

  // 6. LIGHT SAFE TASKS (<= 2 hours in safe categories)
  return {
    minAge: 14,
    ageSuitability: 'Suitable for 14+ (Light neighborhood microjob)',
    badgeClass: 'badge-purple',
    badgeText: '🛡️ Geeignet ab 14 Jahren',
    reason: 'Leichte, ungefährliche Nachbarschaftshilfe unter 2 Stunden (z. B. Rasenmähen, Gassigehen, Nachhilfe, Einkauf). Ideal für Taschengeld.',
    lawRef: '§ 5 Abs. 3 JArbSchG (Leichte & geeignete Arbeiten für Kinder ab 14)',
    riskLevel: 'SAFE'
  };
}
