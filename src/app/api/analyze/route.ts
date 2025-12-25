import { NextRequest, NextResponse } from "next/server";
import { leadSchema, Report } from "@/lib/schemas";
import { reportStore } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

// Simple uuid polyfill if uuid package not installed, but I'll try to use crypto.randomUUID
const generateId = () => crypto.randomUUID();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = leadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const lead = parseResult.data;

    // Simulate analysis delay (optional, but let's just generate directly)
    // The frontend will handle the "waiting" animation experience.

    const id = generateId();
    
    // Heuristic Simulation / Mocking
    // We base some randomness on the domain name length to make it deterministic-ish for the same URL if we wanted, 
    // but random is fine for MVP.
    const score = Math.floor(Math.random() * (85 - 40 + 1)) + 40; 

    // Generate Mock Report
    const report: Report = {
      id,
      createdAt: new Date().toISOString(),
      lead,
      score,
      summary: `Deine Website ist zu ${score}% bereit für AI-Search-Engines. Es fehlen wichtige semantische Signale.`,
      sections: {
        criticalIssues: [
          {
            title: "Fehlende Schema.org Strukturdaten",
            impact: "LLMs verstehen deine Dienstleistung nicht eindeutig.",
            fix: "Füge 'Service' und 'Organization' Schema Markup hinzu.",
            severity: "high",
          },
          {
            title: "H1 und Title Tag mismatch",
            impact: "Widersprüchliche Signale zur Relevanz.",
            fix: "Title Tag und H1 sollten das Hauptkeyword enthalten.",
            severity: "medium",
          },
          {
            title: "Kontrastverhältnis unzureichend für Vision-Modelle",
            impact: "Multimodale LLMs können wichtige Buttons übersehen.",
            fix: "Erhöhe den Kontrast auf mindestens 4.5:1.",
            severity: "medium",
          }
        ],
        quickWins: [
          {
            title: "Meta Description optimieren",
            effort: "low",
            why: "Wird oft als erster Context benutzt.",
            how: "Ergänze eine prägnante Zusammenfassung (max 160 Zeichen).",
          },
          {
            title: "Bild-Alt-Tags ergänzen",
            effort: "medium",
            why: "Wichtig für Accessibility und Image Search.",
            how: "Beschreibe den Bildinhalt in 3-5 Wörtern.",
          }
        ],
        llmReadability: [
          { label: "Word Count", value: 450, note: "Etwas wenig Content für tiefe Analyse." },
          { label: "Structure Depth", value: "Flach", note: "Nur H1/H2 gefunden." },
          { label: "Entity Density", value: "Mittel", note: "Klare Nennung von 'Agentur'." },
        ],
        simulation: [
          {
            query: "Wer bietet AI Consulting in [Stadt]?",
            expected: "Deine Agentur wird genannt.",
            result: "Nicht genannt.",
            note: "Lokaler Bezug fehlt im Content.",
          },
          {
            query: "Preise für Website Audit",
            expected: "Kostenschätzung verfügbar.",
            result: "Keine Daten.",
            note: "LLMs halluzinieren hier oft ohne Daten.",
          }
        ],
      },
      cta: {
        bookingUrl: "https://calendly.com/huerse/30min", // Example
      },
    };

    reportStore.add(report);

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
