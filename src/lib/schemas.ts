import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  company: z.string().min(2, { message: "Company must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  domain: z.string().min(3, { message: "Please enter a valid domain." }).transform((val) => {
    let url = val.toLowerCase().trim();
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }
    // Remove trailing slash
    return url.replace(/\/$/, "");
  }),
});

export type Lead = z.infer<typeof leadSchema>;

export type Severity = "high" | "medium" | "low";
export type Effort = "low" | "medium" | "high";

export interface ReportSectionCritical {
  title: string;
  impact: string;
  fix: string;
  severity: Severity;
}

export interface ReportSectionQuickWin {
  title: string;
  effort: Effort;
  why: string;
  how: string;
}

export interface ReportSectionLlmReadability {
  label: string;
  value: string | number;
  note?: string;
}

export interface ReportSectionSimulation {
  query: string;
  expected: string;
  result: string;
  note: string;
}

export interface Report {
  id: string;
  createdAt: string;
  lead: Lead;
  score: number;
  summary: string;
  sections: {
    criticalIssues: ReportSectionCritical[];
    quickWins: ReportSectionQuickWin[];
    llmReadability: ReportSectionLlmReadability[];
    simulation: ReportSectionSimulation[];
  };
}
