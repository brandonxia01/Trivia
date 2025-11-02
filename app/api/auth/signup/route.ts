import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { queryDb } from "../../DbHelpers";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await queryDb("INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username", [
      username,
      hash,
    ]);

    return NextResponse.json(result[0]);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
