// app/api/trivia_questions/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "../../DbHelpers";

/**
 * GET /api/trivia_questions/count
 * Returns the total number of rows in the trivia_questions table
 */
export async function GET(req: NextRequest) {
  try {
    const result = await queryDb("SELECT COUNT(*) as count FROM trivia_questions");
    const count = result[0]?.count ?? 0;

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("Failed to get trivia questions count:", error);
    return NextResponse.json({ error: "Failed to fetch count" }, { status: 500 });
  }
}
