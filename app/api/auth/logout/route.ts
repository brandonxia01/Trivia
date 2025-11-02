import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", serialize("session", "", { path: "/", maxAge: 0 }));
  return res;
}
