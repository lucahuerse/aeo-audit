import { FeatureSet, ScoringResult, SectionDetail } from "./schemas";

export function calculateScores(features: FeatureSet): ScoringResult {
  const meta = calculateMeta(features);
  const structure = calculateStructure(features);
  const entity = calculateEntity(features);
  const trust = calculateTrust(features);
  const answerability = calculateAnswerability(features);

  const totalScore = Math.round(
    meta.score * 0.2 +
    structure.score * 0.25 +
    entity.score * 0.25 +
    trust.score * 0.15 +
    answerability.score * 0.15
  );

  return {
    totalScore,
    subScores: {
      meta: meta.score,
      structure: structure.score,
      entity: entity.score,
      trust: trust.score,
      answerability: answerability.score,
    },
    details: {
      meta,
      structure,
      entity,
      trust,
      answerability,
    },
  };
}

function calculateMeta(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  // Title
  if (!f.title) {
    score -= 30;
    issues.push("Kein Seitentitel gefunden.");
  } else if (f.titleLength < 10 || f.titleLength > 70) {
    score -= 10;
    issues.push(`Seitentitel ist nicht optimal (${f.titleLength} Zeichen). Ideal sind 10-60 Zeichen.`);
  } else {
    positive.push("Seitentitel ist gut optimiert.");
  }

  // Description
  if (!f.description) {
    score -= 20;
    issues.push("Keine Meta-Description gefunden.");
  } else if (f.descriptionLength < 50 || f.descriptionLength > 160) {
    score -= 5;
    issues.push("Meta-Description Länge nicht optimal (Ideal: 120-160 Zeichen).");
  } else {
    positive.push("Meta-Description ist vorhanden.");
  }

  // Tech
  if (f.isNoIndex) {
    score = 0; // Critical
    issues.push("FATAL: Seite ist auf 'noindex' gesetzt! LLMs werden diese Seite nicht crawlen.");
  }
  if (!f.hasCanonical) {
    score -= 10;
    issues.push("Kein Canonical Tag (Duplicate Content Gefahr).");
  } else {
    positive.push("Canonical Tag ist gesetzt.");
  }

  if (f.ogTagsCount < 2) {
    score -= 5;
    issues.push("Wenig Open Graph Tags (schlechtere Darstellung beim Teilen).");
  }

  return clampResult(score, issues, positive);
}

function calculateStructure(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  // H1
  if (f.h1Count === 0) {
    score -= 30;
    issues.push("Keine H1-Überschrift gefunden. Das Hauptthema ist unklar.");
  } else if (f.h1Count > 1) {
    score -= 10;
    issues.push("Mehrere H1-Überschriften gefunden. Fokus verwässert.");
  } else {
    positive.push("Genau eine H1-Überschrift vorhanden (Top).");
  }

  // Hierarchy
  if (f.hasHeadingGaps) {
    score -= 15;
    issues.push("Sprunghafte Hierarchie (z.B. H1 gefolgt von H3).");
  } else {
    positive.push("Überschriften-Struktur wirkt logisch.");
  }

  // Content Depth
  if (f.wordCount < 300) {
    score -= 20;
    issues.push(`Sehr wenig Text (${f.wordCount} Wörter). LLMs brauchen Kontext.`);
  } else if (f.wordCount > 800) {
    positive.push("Ausreichend Text für LLM-Verständnis vorhanden.");
  }

  // Readability/Formatting
  if (!f.hasLists && !f.hasTables) {
    score -= 10;
    issues.push("Keine Listen oder Tabellen gefunden. Textwüsten sind schwer zu parsen.");
  } else {
    positive.push("Strukturierte Elemente (Listen/Tabellen) vorhanden.");
  }

  return clampResult(score, issues, positive);
}

function calculateEntity(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  if (!f.hasServiceKeywords) {
    score -= 25;
    issues.push("Keine klaren Leistungs-Keywords gefunden (Angebot, Service, etc.).");
  } else {
    positive.push("Dienstleistung wird im Text erwähnt.");
  }

  if (!f.hasPricingSignals) {
    score -= 15;
    issues.push("Keine Preissignale gefunden. LLMs antworten oft 'Preise auf Anfrage'.");
  } else {
    positive.push("Preis-Signale erkannt (hilft für konkrete Antworten).");
  }

  if (!f.hasTargetAudienceKeywords) {
    score -= 10;
    issues.push("Zielgruppe nicht explizit genannt (B2B/B2C unklar).");
  }

  if (f.schemaTypes.length === 0) {
    score -= 20;
    issues.push("Kein Schema.org Markup gefunden. Maschinenlesbare Daten fehlen.");
  } else {
    positive.push(`Schema Markups gefunden: ${f.schemaTypes.slice(0,3).join(", ")}`);
  }

  return clampResult(score, issues, positive);
}

function calculateTrust(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  if (!f.hasImprintIndexable) {
    score -= 30; // Legal risk / trust issue
    issues.push("Kein Impressum-Link eindeutig gefunden.");
  }
  
  // Contacts
  let contactPoints = 0;
  if (f.hasEmail) contactPoints++;
  if (f.hasPhone) contactPoints++;
  if (f.hasAddress) contactPoints++;

  if (contactPoints === 0) {
    score -= 40;
    issues.push("Keine Kontaktmöglichkeiten (Mail, Tel, Adresse) im Text erkannt.");
  } else if (contactPoints < 2) {
    score -= 10;
    issues.push("Wenig Kontaktoptionen gefunden.");
  } else {
    positive.push("Umfassende Kontaktmöglichkeiten gefunden.");
  }

  if (!f.hasSocialLinks) {
    score -= 5;
    issues.push("Keine Social Media Verlinkungen gefunden.");
  }

  return clampResult(score, issues, positive);
}

function calculateAnswerability(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  if (!f.hasQuestionHeadings && !f.hasFAQKeywords) {
    score -= 30;
    issues.push("Keine Fragen in Überschriften ('W-Fragen') oder FAQ-Bereich gefunden.");
  } else {
    positive.push("Inhalte in Frage-Antwort-Form oder FAQs erkannt.");
  }

  if (!f.hasOpeningHours && f.hasAddress) {
    // Only penalty if it looks like a physical business
    score -= 10;
    issues.push("Keine Öffnungszeiten gefunden (relevant für 'Ist X jetzt offen?').");
  }

  if (f.avgParagraphLength > 50) {
    score -= 10;
    issues.push("Sehr lange Absätze. Kurze, prägnante Antworten sind besser für LLMs.");
  }

  return clampResult(score, issues, positive);
}

function clampResult(score: number, issues: string[], positive: string[]): SectionDetail {
  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    positive,
  };
}
