import { NextRequest, NextResponse } from "next/server";
import { leadSchema, Report } from "@/lib/schemas";
import { crawlUrl } from "@/lib/crawler";
import { analyzeContent } from "@/lib/llm";
import { saveReport } from "@/lib/store";

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
    const { domain } = lead;

    console.log(`Crawling ${domain}...`);
    const crawledData = await crawlUrl(domain);

    if (!crawledData) {
      return NextResponse.json({ error: "Could not crawl website. Check the URL." }, { status: 422 });
    }

    console.log(`Analyzing content for ${domain}...`);
    const analysis = await analyzeContent(crawledData, domain);

    const id = body.id || generateId();

    const report: Report = {
      id,
      createdAt: new Date().toISOString(),
      lead,
      score: analysis.score,
      subScores: analysis.subScores,
      details: analysis.details,
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

    try {
      await saveReport(report);
    } catch (dbError) {
      console.error("Failed to save report to KV", dbError);
      return NextResponse.json({ error: "Failed to save report." }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
