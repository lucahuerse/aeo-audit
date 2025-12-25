import { Report } from "./schemas";

// In-memory store (Global variable to persist across hot reloads in dev if possible, though mostly per-request in serverless)
// Note: In a real serverless env (Vercel), this will be cleared. For MVP local demo it works.
// We use globalThis to survive HMR in development.

const globalStore = globalThis as unknown as {
  reports: Map<string, Report>;
};

if (!globalStore.reports) {
  globalStore.reports = new Map();
}

export const reportStore = {
  add: (report: Report) => {
    globalStore.reports.set(report.id, report);
  },
  get: (id: string) => {
    return globalStore.reports.get(id);
  },
};
