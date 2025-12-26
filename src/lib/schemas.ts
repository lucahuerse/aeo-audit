import { z } from "zod";

export interface FeatureSet {
  // Meta
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  hasCanonical: boolean;
  ogTagsCount: number;
  hasHtmlLang: boolean;
  isNoIndex: boolean;

  // Structure
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h1s: string[];
  h2s: string[];
  hasHeadingGaps: boolean; // e.g. H1 -> H3
  wordCount: number;
  paragraphCount: number;
  avgParagraphLength: number;
  hasLists: boolean;
  hasTables: boolean;
  
  // Entity & Content
  bodyText: string; // Truncated
  hasBrandMentions: boolean;
  hasServiceKeywords: boolean; // simple heuristic
  hasTargetAudienceKeywords: boolean;
  hasPricingSignals: boolean; // "€", "Preis", "Kosten"
  hasFAQKeywords: boolean;
  schemaTypes: string[]; // e.g. ["Organization", "FAQPage"]

  // Trust
  hasImprintIndexable: boolean; // Found link to Impressum/Legal
  hasPrivacyIndexable: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  hasSocialLinks: boolean;

  // Local/Answerability
  hasOpeningHours: boolean;
  hasQuestionHeadings: boolean;
}

export interface ScoringResult {
  totalScore: number;
  subScores: {
    meta: number;
    structure: number;
    entity: number;
    trust: number;
    answerability: number;
  };
  details: {
    meta: SectionDetail;
    structure: SectionDetail;
    entity: SectionDetail;
    trust: SectionDetail;
    answerability: SectionDetail;
  };
}

export interface SectionDetail {
  score: number;
  issues: string[]; // "Warum dieser Score?" / "Was fehlt?"
  positive: string[];
}


export const leadSchema = z.object({
  name: z.string().min(2, { message: "Name muss mindestens 2 Zeichen lang sein." }),
  company: z.string().min(2, { message: "Unternehmen muss mindestens 2 Zeichen lang sein." }),
  email: z.string().email({ message: "Bitte eine gültige E-Mail Adresse eingeben." }).optional().or(z.literal("")),
  domain: z.string().min(3, { message: "Bitte eine gültige Domain eingeben." }).transform((val) => {
    let url = val.toLowerCase().trim();
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }
    // Remove trailing slash
    return url.replace(/\/$/, "");
  }),
});

export type Lead = z.infer<typeof leadSchema>;

export type Report = z.infer<typeof reportSchema>;

// Zod schemas for Structured Outputs
export const reportSectionCriticalSchema = z.object({
  title: z.string(),
  impact: z.string(),
  fix: z.string(),
  severity: z.enum(["high", "medium", "low"]),
});

export const reportSectionQuickWinSchema = z.object({
  title: z.string(),
  effort: z.enum(["low", "medium", "high"]),
  why: z.string(),
  how: z.string(),
});

export const reportSectionLlmReadabilitySchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  note: z.string().nullable(),
});

export const reportSectionSimulationSchema = z.object({
  query: z.string(),
  expected: z.string(),
  result: z.string(),
  note: z.string(),
});

export const scoreDetailSchema = z.object({
  score: z.number(),
  issues: z.array(z.string()),
  positive: z.array(z.string()),
});

export const analysisResultSchema = z.object({
  score: z.number().min(0).max(100),
  subScores: z.object({
    meta: z.number(),
    structure: z.number(),
    entity: z.number(),
    trust: z.number(),
    answerability: z.number(),
  }),
  details: z.object({
    meta: scoreDetailSchema,
    structure: scoreDetailSchema,
    entity: scoreDetailSchema,
    trust: scoreDetailSchema,
    answerability: scoreDetailSchema,
  }),
  summary: z.string(),
  criticalIssues: z.array(reportSectionCriticalSchema),
  quickWins: z.array(reportSectionQuickWinSchema),
  llmReadability: z.array(reportSectionLlmReadabilitySchema),
  simulation: z.array(reportSectionSimulationSchema),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Keep the interface as it's used in the app, but define it via Zod now or keep compatible
export const reportSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  lead: leadSchema,
  score: z.number(),
  subScores: z.object({
    meta: z.number(),
    structure: z.number(),
    entity: z.number(),
    trust: z.number(),
    answerability: z.number(),
  }).optional(), // Optional for backward compatibility with old reports
  details: z.object({
    meta: scoreDetailSchema,
    structure: scoreDetailSchema,
    entity: scoreDetailSchema,
    trust: scoreDetailSchema,
    answerability: scoreDetailSchema,
  }).optional(),
  summary: z.string(),
  sections: z.object({
    criticalIssues: z.array(reportSectionCriticalSchema),
    quickWins: z.array(reportSectionQuickWinSchema),
    llmReadability: z.array(reportSectionLlmReadabilitySchema),
    simulation: z.array(reportSectionSimulationSchema),
  }),
  cta: z.object({
    bookingUrl: z.string(),
  }),
});
