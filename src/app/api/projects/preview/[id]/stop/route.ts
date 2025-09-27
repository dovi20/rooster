import { NextRequest, NextResponse } from "next/server";
import { stop, status } from "../../_manager";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return new NextResponse("Missing id", { status: 400 });

  try {
    const s = status(id);
    if (!s.running) {
      return NextResponse.json({ stopped: false, reason: "not_running" });
    }
    const result = await stop(id);
    if (!result.stopped) {
      return new NextResponse(result.reason || "Failed to stop preview", { status: 500 });
    }
    return NextResponse.json({ stopped: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to stop preview", { status: 500 });
  }
}
