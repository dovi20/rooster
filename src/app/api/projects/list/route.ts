import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

function getWorkspaceRoot() {
  const projectRoot = process.cwd();
  return path.join(projectRoot, "..", "workspaces", "projects");
}

export async function GET() {
  const root = getWorkspaceRoot();
  try {
    await fs.mkdir(root, { recursive: true });
    const dirs = await fs.readdir(root, { withFileTypes: true });
    const metas = await Promise.all(
      dirs
        .filter((d) => d.isDirectory())
        .map(async (d) => {
          const metaPath = path.join(root, d.name, "meta.json");
          try {
            const raw = await fs.readFile(metaPath, "utf8");
            const meta = JSON.parse(raw);
            return {
              id: meta.id ?? d.name,
              projectName: meta.projectName ?? d.name,
              createdAt: meta.createdAt ?? new Date(0).toISOString(),
              status: meta.status ?? "unknown",
              model: meta.model ?? "",
            };
          } catch {
            return null;
          }
        })
    );
    const list = metas.filter(Boolean);
    return NextResponse.json(list);
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to list projects", { status: 500 });
  }
}
