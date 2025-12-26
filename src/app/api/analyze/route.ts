import { NextRequest, NextResponse } from "next/server";
import { leadSchema, Report } from "@/lib/schemas";
import { crawlUrl } from "@/lib/crawler";
import { analyzeContent } from "@/lib/llm";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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

    // Use provided ID or generate one
    const id = body.id || generateId();
    
    // 3. CONSTRUCT REPORT
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

    // DB Insert
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        
        const { error } = await supabase.from('reports').insert({
            id: report.id,
            domain: report.lead.domain,
            company_name: report.lead.company,
            contact_name: report.lead.name,
            email: report.lead.email || null,
            score: report.score,
            sub_scores: report.subScores,
            details: report.details,
            summary: report.summary,
            sections: report.sections,
            cta: report.cta,
            lead_metadata: {
                name: report.lead.name,
                company: report.lead.company,
            }
        });

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

    } catch(dbError) {
        console.error("Failed to save report to DB", dbError); 
        // We might still return the ID so the user sees the result, 
        // but report retrieval will fail if not saved.
        // For now, let's treat it as a hard error.
        return NextResponse.json({ error: "Failed to save report." }, { status: 500 });
    }


    // REPORT SAVED


    return NextResponse.json({ id });

  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
