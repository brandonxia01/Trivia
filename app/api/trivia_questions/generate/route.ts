import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Bible trivia question generator. You output valid JSON objects that match a provided TypeScript interface.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    console.log("data = " + JSON.stringify(data));

    const content = data.choices?.[0]?.message?.content;

    return NextResponse.json({ result: content });
  } catch (error: any) {
    console.error("Error generating question:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
