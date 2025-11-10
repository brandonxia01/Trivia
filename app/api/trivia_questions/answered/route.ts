import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "../../DbHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, correct } = body;

    if (typeof id !== "number") {
      return NextResponse.json({ error: "Missing or invalid 'id'." }, { status: 400 });
    }

    // Build dynamic SQL for increment
    const query = `
      UPDATE trivia_questions
      SET 
        attempts = attempts + 1,
        correct_attempts = correct_attempts + (CASE WHEN $2::boolean THEN 1 ELSE 0 END)
      WHERE id = $1
      RETURNING id, attempts, correct_attempts;
    `;

    const values = [id, correct === true];

    const result = await queryDb(query, values);

    if (result.length === 0) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Answer recorded successfully.",
      question: result[0],
    });
  } catch (error) {
    console.error("Error updating question stats:", error);
    return NextResponse.json({ error: "Failed to update attempts." }, { status: 500 });
  }
}
