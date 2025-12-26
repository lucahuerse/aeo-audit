import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { CrawledData } from "./crawler";
import { AnalysisResult, analysisResultSchema } from "./schemas";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeContent(
  data: CrawledData, 
  domain: string, 
  leadName: string
): Promise<AnalysisResult> {

  const prompt = `
    Du bist ein Experte für AEO (Answer Engine Optimization).
    Analysiere die folgenden Website-Daten für die Domain "${domain}".
    
    Website-Daten:
    - Titel: ${data.title}
    - Meta-Description: ${data.description}
    - H1s: ${JSON.stringify(data.h1)}
    - H2s (erste 5): ${JSON.stringify(data.h2.slice(0,5))}
    - Wortanzahl: ${data.wordCount}
    - Content-Auszug: ${data.bodyText.slice(0, 3000)}...

    Aufgabe:
    Erstelle einen detaillierten Bericht darüber, wie gut diese Website für LLMs (ChatGPT, Perplexity, Gemini) optimiert ist.
    Der Bericht MUSS auf DEUTSCH sein.

    Anleitungen:
    - "simulation": Denke dir 2-3 Nutzeranfragen aus, die für dieses Unternehmen relevant sind. Simuliere, wie ein LLM basierend auf dem Inhalt antworten *könnte*.
      Wenn wichtige Informationen fehlen (Preise, Ort, Leistungen), sollte das Ergebnis widerspiegeln, dass das LLM diese nicht finden kann.
    - "criticalIssues": Konzentriere dich auf semantische Struktur (H1s), Klarheit und Entitätsdefinition.
    - "quickWins": Einfache Korrekturen wie Meta-Tags oder klarere Überschriften.
    - "llmReadability": Metriken wie "Strukturtiefe", "Entitätsklarheit", "Tonalität".
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "Du bist ein hilfreicher AEO-Auditor. Antworte immer auf Deutsch." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o",
      response_format: zodResponseFormat(analysisResultSchema, "analysis_result"),
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("Inhalt konnte nicht geparst werden");
    }

    // Parse the JSON string manually - Structured Outputs guarantees it matches the schema
    const result = JSON.parse(content);
    return result as AnalysisResult;

  } catch (error) {
    console.error("LLM Analysis Error:", error);
    // Fallback if LLM fails
    return {
      score: 50,
      summary: "Automatische Analyse fehlgeschlagen. Seite wurde gecrawlt, aber die KI-Auswertung hat nicht funktioniert.",
      criticalIssues: [],
      quickWins: [],
      llmReadability: [],
      simulation: [] 
    };
  }
}
