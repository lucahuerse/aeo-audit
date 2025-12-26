import * as cheerio from "cheerio";

export interface CrawledData {
  title: string;
  description: string;
  h1: string[];
  h2: string[];
  bodyText: string; // Truncated for LLM
  wordCount: number;
}

export async function crawlUrl(url: string): Promise<CrawledData | null> {
  try {
    // Add protocol if missing (already done in Zod usually, but good for safety)
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;

    // Common fake headers to avoid immediate 403s
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    };

    const response = await fetch(targetUrl, { 
        headers, 
        next: { revalidate: 0 } // No cache for fresh analysis
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Metadata
    const title = $("title").text().trim() || "";
    const description = $('meta[name="description"]').attr("content") || 
                        $('meta[property="og:description"]').attr("content") || "";

    // Extract Headings
    const h1 = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h2 = $("h2").map((_, el) => $(el).text().trim()).get().filter(Boolean);

    // Extract Body Text (cleanup scripts/styles)
    $("script, style, noscript, svg, iframe, nav, footer, header").remove();
    // Get text, collapse whitespace
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    
    // Simple word count
    const wordCount = bodyText.split(" ").length;

    // Limit body text for LLM (approx 1500 words or 6-8k chars is usually enough context)
    const truncatedBody = bodyText.slice(0, 10000);

    return {
      title,
      description,
      h1,
      h2,
      bodyText: truncatedBody,
      wordCount,
    };

  } catch (error) {
    console.error(`Crawl error for ${url}:`, error);
    return null;
  }
}
