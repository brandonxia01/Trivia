import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { queryDb } from "../../DbHelpers";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const users = await queryDb("SELECT * FROM users WHERE username = $1", [username]);
    const user = users[0];
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // set cookie
    const cookie = serialize("session", String(user.id), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    const res = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
