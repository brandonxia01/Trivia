import { NextRequest } from "next/server";
import { parse } from "cookie";

export function requireAuth(req: NextRequest) {
  const cookies = parse(req.headers.get("cookie") || "");
  const userId = cookies.session;
  if (!userId) return null;
  return userId;
}
