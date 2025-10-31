import { NextRequest, NextResponse } from "next/server";
import { resolveFeedback, listFeedback } from "./FeedbackDb";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? "";
  try {
    const result = await listFeedback(status);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`Unable to get feedback list: ${err}.`);
    return NextResponse.json({ error: `Unable to retrieve feedback.` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  const resolution = params.get("resolution")
  if (id === null) {
    return NextResponse.json({ error: "id field required" }, { status: 400 });
  }
  if (resolution === null) {
    return NextResponse.json({ error: "resolution field required" }, { status: 400 });
  }
  try {
    const result = await resolveFeedback(id, resolution);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: `Error deleting ${id}: ${err}` }, { status: 400 });
  }
}