import { Redis } from "@upstash/redis";
import { Report } from "@/lib/schemas";

const redis = Redis.fromEnv();

const REPORT_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

const reportKey = (id: string) => `report:${id}`;

export async function saveReport(report: Report): Promise<void> {
  await redis.set(reportKey(report.id), report, { ex: REPORT_TTL_SECONDS });
}

export async function getReport(id: string): Promise<Report | null> {
  const data = await redis.get<Report>(reportKey(id));
  return data ?? null;
}
