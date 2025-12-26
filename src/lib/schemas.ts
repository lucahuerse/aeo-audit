import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, { message: "Name muss mindestens 2 Zeichen lang sein." }),
  company: z.string().min(2, { message: "Unternehmen muss mindestens 2 Zeichen lang sein." }),
  email: z.string().email({ message: "Bitte eine gültige E-Mail Adresse eingeben." }),
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

export const analysisResultSchema = z.object({
  score: z.number().min(0).max(100),
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
