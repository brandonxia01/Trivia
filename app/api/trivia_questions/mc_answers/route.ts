import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, correctAnswer } = body;

    if (!question || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields: question, correctAnswer" }, { status: 400 });
    }

    // Prompt for generating wrong answers
    const prompt = `
You are generating multiple-choice distractor answers for a Bible trivia game.

Rules:
- Generate exactly **3** incorrect but reasonable-sounding answers.
- They must be **plausible**, but **not the correct answer**.
- Do NOT repeat or modify the correct answer.
- Do NOT include explanations.
- Return ONLY valid JSON in this format:

{
  "options": ["Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"]
}

Question: "${question}"
Correct Answer: "${correctAnswer}"
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 200,
    });

    const raw = completion.choices[0].message.content;

    // Attempt to safely parse JSON
    let parsed;
    try {
      parsed = JSON.parse(raw!);
    } catch (err) {
      console.error("JSON parse error:", err, "Raw response:", raw);
      return NextResponse.json({ error: "Invalid JSON returned from AI", raw }, { status: 500 });
    }

    // Additional safety: remove any accidental duplicates or the correct answer
    const filtered = parsed.options
      .filter(
        (opt: string, idx: number, arr: string[]) =>
          opt.trim().toLowerCase() !== correctAnswer.trim().toLowerCase() && arr.indexOf(opt) === idx
      )
      .slice(0, 3);

    // If filtering drops answers, fill with generic but safe fallbacks
    while (filtered.length < 3) {
      filtered.push(`Option ${filtered.length + 1}`);
    }

    return NextResponse.json({ options: filtered }, { status: 200 });
  } catch (error) {
    console.error("Error in mc_answers route:", error);
    return NextResponse.json({ error: "Server error generating multiple-choice answers" }, { status: 500 });
  }
}
