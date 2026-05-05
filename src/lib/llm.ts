import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { FeatureSet, AnalysisResult, analysisResultSchema, reportSectionCriticalSchema, reportSectionQuickWinSchema } from "./schemas"; // Updated imports
import { calculateScores } from "./scoring";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function analyzeContent(
  data: FeatureSet,
  domain: string,
): Promise<AnalysisResult> {

  // 1. Deterministic Scoring
  const scoringResult = calculateScores(data);

  // 2. Prepare context for LLM
  // We send the scores and the issues found, so the LLM can write the summary and simulation.
  const prompt = `
    You are an expert in AEO (Answer Engine Optimization).

    Analyze the following features for the domain "${domain}".

    CURRENT SCORES (deterministically calculated):
    - Overall score: ${scoringResult.totalScore}/100
    - Meta & Tech: ${scoringResult.subScores.meta}/100
    - Structure: ${scoringResult.subScores.structure}/100
    - Entity & Offer: ${scoringResult.subScores.entity}/100
    - Trust: ${scoringResult.subScores.trust}/100
    - Answerability: ${scoringResult.subScores.answerability}/100

    FOUND ISSUES (details):
    Meta: ${scoringResult.details.meta.issues.join(", ") || "None"}
    Structure: ${scoringResult.details.structure.issues.join(", ") || "None"}
    Entity: ${scoringResult.details.entity.issues.join(", ") || "None"}
    Trust: ${scoringResult.details.trust.issues.join(", ") || "None"}
    Answerability: ${scoringResult.details.answerability.issues.join(", ") || "None"}

    CONTENT EXCERPT:
    ${data.bodyText.slice(0, 4000)}...

    TASK:
    Generate the narrative part of the report.
    1. Simulation: simulate 2-3 user queries. Use only facts from the text. If info is missing (e.g. pricing), say so.
    2. Summary: write a short summary (2-3 sentences) based on the score and the issues.
    3. CriticalIssues: take the "FOUND ISSUES" and turn them into clean JSON objects (title, impact, fix, severity). Do not invent facts.
    4. QuickWins: derive 3 easy "low effort" actions from the issues.
    5. LLM readability: rate "Structure depth", "Clarity", "Tonality" (text values).
  `;

  try {
    const completion = await getOpenAI().chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise AEO auditor. Reply in English. Do not hallucinate facts." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o",
      response_format: zodResponseFormat(analysisResultSchema, "analysis_result"),
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("Could not parse content");
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
      summary: "AI generation failed. The scores are still calculated correctly.",
      criticalIssues: [],
      quickWins: [],
      llmReadability: [],
      simulation: [] 
    };
  }
}
