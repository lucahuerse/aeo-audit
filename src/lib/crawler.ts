import * as cheerio from "cheerio";

import { FeatureSet } from "./schemas";

export type CrawlErrorCode = "blocked" | "not_found" | "unreachable" | "unknown";

export class CrawlError extends Error {
  code: CrawlErrorCode;
  status?: number;
  constructor(code: CrawlErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function crawlUrl(url: string): Promise<FeatureSet> {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  };

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      headers,
      next: { revalidate: 0 },
    });
  } catch (err) {
    console.error(`Network error fetching ${url}:`, err);
    throw new CrawlError("unreachable", "Could not reach the website.");
  }

  if (!response.ok) {
    console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    if (response.status === 403 || response.status === 401 || response.status === 429 || response.status === 451) {
      throw new CrawlError(
        "blocked",
        "The website blocks automated requests (e.g. via Cloudflare bot protection).",
        response.status,
      );
    }
    if (response.status === 404 || response.status === 410) {
      throw new CrawlError("not_found", "Website not found.", response.status);
    }
    throw new CrawlError("unknown", `Website responded with status ${response.status}.`, response.status);
  }
  try {

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
      // Meta
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      hasCanonical: !!$('link[rel="canonical"]').attr("href"),
      ogTagsCount: $('meta[property^="og:"]').length,
      hasHtmlLang: !!$('html').attr("lang"),
      isNoIndex: ($('meta[name="robots"]').attr("content") || "").toLowerCase().includes("noindex"),

      // Structure
      h1Count: h1.length,
      h2Count: h2.length,
      h3Count: $('h3').length,
      h1s: h1,
      h2s: h2,
      hasHeadingGaps: h1.length > 0 && h2.length === 0 && $('h3').length > 0, // Very simple check
      wordCount,
      paragraphCount: $('p').length,
      avgParagraphLength: wordCount / ($('p').length || 1), // rudimentary
      hasLists: $('ul, ol').length > 0,
      hasTables: $('table').length > 0,

      // Entity
      bodyText: truncatedBody,
      hasBrandMentions: true, // Placeholder/Assumption: Crawled site usually mentions itself. 
      hasServiceKeywords: /leistung|angebot|service|lösung|produkt|solution|product|offering|what we do/i.test(bodyText),
      hasTargetAudienceKeywords: /für unternehmen|für privat|kunden|zielgruppe|for businesses|for teams|for individuals|for agencies|customers|clients/i.test(bodyText),
      hasPricingSignals: /€|\$|£|euro|preis|kosten|ab \d|price|pricing|cost|from \$|starts at/i.test(bodyText),
      hasFAQKeywords: /faq|häufige fragen|fragen.*antworten|frequently asked|common questions/i.test(bodyText),
      schemaTypes: $('script[type="application/ld+json"]').map((_: number, el: any) => {
        try {
            const text = $(el).text();
            if (!text) return null;
            const json = JSON.parse(text);
            return json["@type"] || "Unknown";
        } catch { return "Error"; }
      }).get().filter(Boolean),

      // Trust
      hasImprintIndexable: $('a[href*="impressum"], a[href*="legal"], a[href*="terms"], a[href*="imprint"]').length > 0,
      hasPrivacyIndexable: $('a[href*="datenschutz"], a[href*="privacy"]').length > 0,
      hasEmail: /mailto:/.test(html) || /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(bodyText),
      hasPhone: /tel:/.test(html) || /(\+\d{1,3})[\s.-]?\d|(\+49|0)[1-9]/.test(bodyText),
      hasAddress: (/str\.|straße|weg|platz \d|street|avenue|ave\.|road|rd\.|blvd|boulevard/i.test(bodyText)) && /\d{4,5}/.test(bodyText),
      hasSocialLinks: $('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com"]').length > 0,

      // Local / Answerability
      hasOpeningHours: /öffnungszeiten|mo-fr|uhr|opening hours|business hours|mon-fri|monday.*friday/i.test(bodyText),
      hasQuestionHeadings: h2.some(h => h.includes("?")) || $('h3').map((_: number, el: any) => $(el).text()).get().some((t: string) => t.includes("?")),
    };

  } catch (error) {
    console.error(`Crawl parse error for ${url}:`, error);
    throw new CrawlError("unknown", "Could not parse the website content.");
  }
}
