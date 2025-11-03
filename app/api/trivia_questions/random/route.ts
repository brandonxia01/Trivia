import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "../../DbHelpers";
import { mapQuestion } from "../QuestionsDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { books = [], minDifficulty = 1, maxDifficulty = 5 } = body;

    const params: any[] = [];
    let whereClauses: string[] = [];

    // 🎯 Difficulty range filter
    whereClauses.push(`difficulty BETWEEN $${params.length + 1} AND $${params.length + 2}`);
    params.push(minDifficulty, maxDifficulty);

    // 📖 Book filter (optional)
    if (Array.isArray(books) && books.length > 0) {
      const bookClauses = books.map((_, i) => `v.ref ILIKE $${params.length + i + 1} || '%'`);
      whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(verse_references) AS v(ref)
          WHERE ${bookClauses.join(" OR ")}
        )
      `);
      params.push(...books);
    }

    // 🧮 Build query dynamically
    const query = `
      SELECT * FROM trivia_questions
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const rows = await queryDb(query, params);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No matching questions found." }, { status: 404 });
    }

    const question = mapQuestion(rows[0]);
    return NextResponse.json(question);
  } catch (err: any) {
    console.error("Unable to get random question:", err);
    return NextResponse.json({ error: "Unable to retrieve question." }, { status: 500 });
  }
}
