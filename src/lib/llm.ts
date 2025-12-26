import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { FeatureSet, AnalysisResult, analysisResultSchema, reportSectionCriticalSchema, reportSectionQuickWinSchema } from "./schemas"; // Updated imports
import { calculateScores } from "./scoring";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeContent(
  data: FeatureSet, 
  domain: string, 
  leadName: string
): Promise<AnalysisResult> {

  // 1. Deterministic Scoring
  const scoringResult = calculateScores(data);

  // 2. Prepare context for LLM
  // We send the scores and the issues found, so the LLM can write the summary and simulation.
  const prompt = `
    Du bist ein Experte für AEO (Answer Engine Optimization).
    
    Analysiere die folgenden Features für die Domain "${domain}".
    
    DERZEITIGE SCORES (Deterministisch berechnet):
    - Gesamtscore: ${scoringResult.totalScore}/100
    - Meta & Technik: ${scoringResult.subScores.meta}/100
    - Struktur: ${scoringResult.subScores.structure}/100
    - Entity & Angebot: ${scoringResult.subScores.entity}/100
    - Trust: ${scoringResult.subScores.trust}/100
    - Answerability: ${scoringResult.subScores.answerability}/100

    GEFUNDENE PROBLEME (Details):
    Meta: ${scoringResult.details.meta.issues.join(", ") || "Keine"}
    Struktur: ${scoringResult.details.structure.issues.join(", ") || "Keine"}
    Entity: ${scoringResult.details.entity.issues.join(", ") || "Keine"}
    Trust: ${scoringResult.details.trust.issues.join(", ") || "Keine"}
    Answerability: ${scoringResult.details.answerability.issues.join(", ") || "Keine"}

    CONTENT-AUSZUG:
    ${data.bodyText.slice(0, 4000)}...

    AUFGABE:
    Generiere den "Weichen" Teil des Reports.
    1. Simulation: Simuliere 2-3 Nutzeranfragen. Nutze nur Fakten aus dem Text. Wenn Info fehlt (z.B. Preis), sag es!
    2. Summary: Schreibe eine kurze Zusammenfassung (2-3 Sätze) basierend auf dem Score und den Problemen.
    3. CriticalIssues: Nimm die "GEFUNDENEN PROBLEME" und formuliere sie in saubere JSON-Objekte (title, impact, fix, severity). Erfinde keine neuen Fakten.
    4. QuickWins: Leite 3 einfache Maßnahmen ("Low Effort") aus den Problemen ab.
    5. LLM-Readability: Bewerte "Strukturtiefe", "Klarheit", "Tonality" (Text-Werte).
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "Du bist ein präziser AEO-Auditor. Antworte auf Deutsch. Halluziniere keine Fakten." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o",
      response_format: zodResponseFormat(analysisResultSchema, "analysis_result"),
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("Inhalt konnte nicht geparst werden");
    }

    const llmResult = JSON.parse(content) as AnalysisResult;

    // 3. Merge Deterministic Scores with LLM Narrative
    // We OVERWRITE the scores from LLM with our hard numbers to ensure determinism.
    // We accept the text generation (issues, simulation) from LLM but backed by our data constraints.
    return {
      ...llmResult,
      score: scoringResult.totalScore,
      subScores: scoringResult.subScores,
      details: scoringResult.details,
      // We rely on LLM to format the issues, but if we wanted to be super strict we could map scoringResult.details.issues manually.
      // For now, prompt instruction should be enough to align them.
    };

  } catch (error) {
    console.error("LLM Analysis Error:", error);
    // Fallback
    return {
      score: scoringResult.totalScore,
      subScores: scoringResult.subScores,
      details: scoringResult.details,
      summary: "Fehler bei der KI-Generierung. Die Scores sind jedoch korrekt berechnet.",
      criticalIssues: [],
      quickWins: [],
      llmReadability: [],
      simulation: [] 
    };
  }
}
