import { NextRequest, NextResponse } from "next/server";
import { status } from "../../_manager";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return new NextResponse("Missing id", { status: 400 });

  try {
    const s = status(id);
    return NextResponse.json(s);
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to get status", { status: 500 });
  }
}
