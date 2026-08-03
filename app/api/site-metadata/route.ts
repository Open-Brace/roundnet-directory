import { NextRequest, NextResponse } from "next/server";

import { fetchProposedTitle } from "@/lib/site-preview";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Enter a website address." }, { status: 400 });
  }

  try {
    const title = await fetchProposedTitle(url);
    return NextResponse.json({ title });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview that website.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
