// /api/trivia_questions/verify/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "../../DbHelpers";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) throw new Error("Missing id");

    await queryDb("UPDATE trivia_questions SET verified = true WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
