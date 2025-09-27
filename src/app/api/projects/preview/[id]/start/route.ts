import { NextRequest, NextResponse } from "next/server";
import { start, status } from "../../_manager";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return new NextResponse("Missing id", { status: 400 });

  try {
    const s = status(id);
    if (s.running) {
      return NextResponse.json({ port: s.port, alreadyRunning: true, cmd: s.cmd, args: s.args, cwd: s.cwd });
    }
    const result = await start(id);
    return NextResponse.json({ port: result.port, alreadyRunning: false, cmd: result.cmd, args: result.args, cwd: result.cwd });
  } catch (e: any) {
    // החזר פרטים מדויקים ללקוח לניטור מהיר
    const errMsg = e?.message || "Failed to start preview";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
