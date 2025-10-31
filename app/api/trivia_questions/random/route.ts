import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "../../DbHelpers";
import { mapQuestion } from "../QuestionsDb";

export async function GET(request: NextRequest) {
  try {
    const rows = await queryDb(`
      SELECT * FROM trivia_questions
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No questions found." }, { status: 404 });
    }

    const question = mapQuestion(rows[0]);
    return NextResponse.json(question);
  } catch (err: any) {
    console.error(`Unable to get random question: ${err}`);
    return NextResponse.json({ error: "Unable to retrieve question." }, { status: 500 });
  }
}
