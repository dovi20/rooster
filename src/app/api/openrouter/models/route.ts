import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-openrouter-key") || "";
  if (!apiKey) {
    return new NextResponse("Missing x-openrouter-key header", { status: 400 });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost",
        "X-Title": "Rooster MVP Builder",
        "Content-Type": "application/json",
      },
      // Avoid caching so user sees fresh list
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return new NextResponse(text || "Failed to fetch models", { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return new NextResponse(e?.message || "Unexpected error", { status: 500 });
  }
}
