import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

function getWorkspaceRoot() {
  const projectRoot = process.cwd();
  return path.join(projectRoot, "..", "workspaces", "projects");
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const metaPath = path.join(getWorkspaceRoot(), id, "meta.json");
  try {
    const metaRaw = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(metaRaw);
    return NextResponse.json(meta);
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(e?.message || "Failed to read meta", { status: 500 });
  }
}
