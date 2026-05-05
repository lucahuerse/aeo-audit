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

  if (!f.title) {
    score -= 30;
    issues.push("No page title found.");
  } else if (f.titleLength < 10 || f.titleLength > 70) {
    score -= 10;
    issues.push(`Page title length is suboptimal (${f.titleLength} chars). Aim for 10–60.`);
  } else {
    positive.push("Page title is well optimized.");
  }

  if (!f.description) {
    score -= 20;
    issues.push("No meta description found.");
  } else if (f.descriptionLength < 50 || f.descriptionLength > 160) {
    score -= 5;
    issues.push("Meta description length is suboptimal (ideal: 120–160 chars).");
  } else {
    positive.push("Meta description is present.");
  }

  if (f.isNoIndex) {
    score = 0;
    issues.push("FATAL: page is set to 'noindex'. LLMs will not crawl this page.");
  }
  if (!f.hasCanonical) {
    score -= 10;
    issues.push("No canonical tag (risk of duplicate content).");
  } else {
    positive.push("Canonical tag is set.");
  }

  if (f.ogTagsCount < 2) {
    score -= 5;
    issues.push("Few Open Graph tags (worse rendering when shared).");
  }

  return clampResult(score, issues, positive);
}

function calculateStructure(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  if (f.h1Count === 0) {
    score -= 30;
    issues.push("No H1 heading found. The main topic is unclear.");
  } else if (f.h1Count > 1) {
    score -= 10;
    issues.push("Multiple H1 headings found. Focus is diluted.");
  } else {
    positive.push("Exactly one H1 heading present.");
  }

  if (f.hasHeadingGaps) {
    score -= 15;
    issues.push("Inconsistent heading hierarchy (e.g. H1 followed by H3).");
  } else {
    positive.push("Heading structure looks logical.");
  }

  if (f.wordCount < 300) {
    score -= 20;
    issues.push(`Very little text (${f.wordCount} words). LLMs need context.`);
  } else if (f.wordCount > 800) {
    positive.push("Enough text for LLMs to understand the content.");
  }

  if (!f.hasLists && !f.hasTables) {
    score -= 10;
    issues.push("No lists or tables found. Walls of text are hard to parse.");
  } else {
    positive.push("Structured elements (lists/tables) present.");
  }

  return clampResult(score, issues, positive);
}

function calculateEntity(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  if (!f.hasServiceKeywords) {
    score -= 25;
    issues.push("No clear service/offer keywords found.");
  } else {
    positive.push("Service or offer is mentioned in the text.");
  }

  if (!f.hasPricingSignals) {
    score -= 15;
    issues.push("No pricing signals found. LLMs often answer 'price on request'.");
  } else {
    positive.push("Pricing signals detected (helps with concrete answers).");
  }

  if (!f.hasTargetAudienceKeywords) {
    score -= 10;
    issues.push("Target audience not explicitly stated (B2B/B2C unclear).");
  }

  if (f.schemaTypes.length === 0) {
    score -= 20;
    issues.push("No Schema.org markup found. Machine-readable data is missing.");
  } else {
    positive.push(`Schema markup found: ${f.schemaTypes.slice(0, 3).join(", ")}`);
  }

  return clampResult(score, issues, positive);
}

function calculateTrust(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  if (!f.hasImprintIndexable) {
    score -= 30;
    issues.push("No clear legal/imprint link found.");
  }

  let contactPoints = 0;
  if (f.hasEmail) contactPoints++;
  if (f.hasPhone) contactPoints++;
  if (f.hasAddress) contactPoints++;

  if (contactPoints === 0) {
    score -= 40;
    issues.push("No contact info (email, phone, address) detected in the text.");
  } else if (contactPoints < 2) {
    score -= 10;
    issues.push("Few contact options found.");
  } else {
    positive.push("Comprehensive contact info found.");
  }

  if (!f.hasSocialLinks) {
    score -= 5;
    issues.push("No social media links found.");
  }

  return clampResult(score, issues, positive);
}

function calculateAnswerability(f: FeatureSet): SectionDetail {
  let score = 100;
  const issues: string[] = [];
  const positive: string[] = [];

  if (!f.hasQuestionHeadings && !f.hasFAQKeywords) {
    score -= 30;
    issues.push("No question-style headings or FAQ section found.");
  } else {
    positive.push("Q&A-style content or FAQs detected.");
  }

  if (!f.hasOpeningHours && f.hasAddress) {
    score -= 10;
    issues.push("No opening hours found (relevant for 'is X open now?' queries).");
  }

  if (f.avgParagraphLength > 50) {
    score -= 10;
    issues.push("Very long paragraphs. Short, focused answers work better for LLMs.");
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
