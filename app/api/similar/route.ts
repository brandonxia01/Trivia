import { NextResponse } from "next/server";
import stringSimilarity from "string-similarity";

// Optional: if you have an OpenAI API key in your environment
// Add this to your .env.local: OPENAI_API_KEY=sk-...
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalize(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\b(years?|the|a|an|old)\b/g, "") // remove filler words
    .trim();
}

export async function POST(req: Request) {
  try {
    const { userInput, correctAnswer, threshold = 0.7 } = await req.json();

    if (!userInput || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🔹 Step 1: Quick heuristic check
    const normalizedUser = normalize(userInput);
    const normalizedCorrect = normalize(correctAnswer);
    const similarity = stringSimilarity.compareTwoStrings(normalizedUser, normalizedCorrect);

    if (similarity >= threshold) {
      return NextResponse.json({ similar: true, method: "heuristic", score: similarity });
    }

    // 🔹 Step 2: AI fallback check (only if below threshold)
    if (!process.env.OPENAI_API_KEY) {
      // No API key, fallback result
      return NextResponse.json({
        similar: false,
        method: "heuristic_only",
        score: similarity,
        note: "AI check unavailable (no API key)",
      });
    }

    const prompt = `
Compare these two text answers for semantic equivalence. 
Respond ONLY with "true" if they mean the same thing, or "false" if they do not.

User answer: "${userInput}"
Correct answer: "${correctAnswer}"
`;

    const aiResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.2,
    });
    console.log("ai reponse = " + aiResponse.text);
    const aiOutput = aiResponse.output_text.trim().toLowerCase();
    const aiResult = aiOutput.includes("true");

    return NextResponse.json({
      similar: aiResult,
      method: "ai",
      score: similarity,
    });
  } catch (err: any) {
    console.error("Similarity API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
