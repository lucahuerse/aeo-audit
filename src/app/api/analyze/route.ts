import { NextRequest, NextResponse } from "next/server";
import { leadSchema, Report } from "@/lib/schemas";
import { reportStore } from "@/lib/store";
import { crawlUrl } from "@/lib/crawler";
import { analyzeContent } from "@/lib/llm";

// Simple uuid polyfill
const generateId = () => crypto.randomUUID();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = leadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const lead = parseResult.data;
    const { domain, name } = lead;

    // 1. CRAWL (Real Data)
    console.log(`Crawling ${domain}...`);
    const crawledData = await crawlUrl(domain);

    if (!crawledData) {
        // Fallback if crawl fails (e.g. 403 or bad domain)
        return NextResponse.json({ error: "Could not crawl website. Check the URL." }, { status: 422 });
    }

    // 2. ANALYZE (LLM)
    console.log(`Analyzing content for ${domain}...`);
    const analysis = await analyzeContent(crawledData, domain, name);

    const id = generateId();
    
    // 3. CONSTRUCT REPORT
    const report: Report = {
      id,
      createdAt: new Date().toISOString(),
      lead,
      score: analysis.score,
      subScores: analysis.subScores, // Add subScores
      details: analysis.details,     // Add details
      summary: analysis.summary,
      sections: {
        criticalIssues: analysis.criticalIssues || [],
        quickWins: analysis.quickWins || [],
        llmReadability: analysis.llmReadability || [],
        simulation: analysis.simulation || [],
      },
      cta: {
        bookingUrl: "https://calendly.com/huerse/30min",
      },
    };

    reportStore.add(report);

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
