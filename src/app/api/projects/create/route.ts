import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

// Workspace root OUTSIDE the app source so generated projects are separated
function getWorkspaceRoot() {
  // Project root is two levels up from this file at runtime, but we stay defensive:
  const projectRoot = process.cwd(); // should be .../builder
  return path.join(projectRoot, "..", "workspaces", "projects");
}

type GenResponse = {
  projectName: string;
  description?: string;
  files: { path: string; content: string }[];
  postInstall?: string[];
  runHint?: string;
};

function sanitizeRelative(p: string) {
  const norm = p.replace(/\\/g, "/");
  if (norm.startsWith("/") || norm.includes("..")) {
    throw new Error(`Illegal file path: ${p}`);
  }
  return norm;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function POST(req: NextRequest) {
  const debugCtx: Record<string, any> = { step: "init" };
  const apiKey = req.headers.get("x-openrouter-key") || "";
  debugCtx.apiKeyPresent = Boolean(apiKey);
  const modelId = (req.headers.get("x-model-id") || "").trim();
  debugCtx.modelId = modelId || "openrouter/auto";
  if (!apiKey) return new NextResponse("Missing x-openrouter-key", { status: 400 });

  const body = await req.json().catch((e) => {
    debugCtx.bodyParseError = e?.message || String(e);
    return null;
  }) as { idea?: string } | null;
  const idea = body?.idea?.trim() || "";
  if (!idea) return new NextResponse("Missing idea", { status: 400 });

  const id = randomUUID();
  debugCtx.projectId = id;
  const workspaceRoot = getWorkspaceRoot();
  const projectDir = path.join(workspaceRoot, id, "mvp");
  const metaPath = path.join(workspaceRoot, id, "meta.json");

  try {
    debugCtx.step = "ensureDir";
    await ensureDir(projectDir);

    // Build a strict prompting envelope asking for JSON only
    const prompt = [
      {
        role: "system",
    content:
      "You are an expert Next.js 14 architect. Your task is to generate a full, minimal but complete Next.js 14 project using the App Router with TypeScript. " +
      "Return ONLY a JSON object with the following fields: projectName, description, files[], postInstall[], runHint. " +
      "Each files[] item must include the path (relative to project root) and the full file content. " +
      "The generated project must be immediately runnable after npm install. " +
      "Ensure the project includes:\n" +
      "- package.json with scripts (dev, build, start, lint, type-check)\n" +
      "- next.config.js with default config\n" +
      "- tsconfig.json for TypeScript setup\n" +
      "- tailwind.config.js and postcss.config.js if Tailwind is included\n" +
      "- .eslintrc.json with minimal config\n" +
      "- app/layout.tsx with metadata and global layout\n" +
      "- app/page.tsx with a demo UI (not just plain text)\n" +
      "- app/api/hello/route.ts with a sample API endpoint\n" +
      "- public/ with favicon\n" +
      "- styles/globals.css with some base styles\n" +
      "- README.md explaining how to install and run the project\n" +
      "Dependencies must be minimal but sufficient for Next.js + TypeScript (+ Tailwind if chosen). " +
      "The output must be strictly JSON, no explanations, no markdown fences."
  },
      {
        role: "user",
        content:
          `Idea:\n${idea}\n\nConstraints:\n- Next.js App Router\n- TypeScript\n- Tailwind optional\n- Minimal dependencies\n- Provide package.json, next.config, basic app/page.tsx, README.md`
      }
    ];

    const chatReq = {
      model: modelId || "openrouter/auto",
      messages: prompt,
      temperature: 0.3,
    };

    debugCtx.step = "openrouterRequest";
    // הבטחת כותרות מדויקות כפי ש-OpenRouter דורש
    const trimmedKey = apiKey.trim();
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
        "Content-Type": "application/json",
        // הכותרות להקצאת קצב/זיהוי אפליקציה - לא חובה אך מומלץ
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Rooster MVP Builder",
      } as any,
      body: JSON.stringify(chatReq),
    });

    if (!res.ok) {
      const text = await res.text();
      debugCtx.openrouterHttpStatus = res.status;
      debugCtx.openrouterErrorBody = text?.slice(0, 2000);
      throw new Error(text || `OpenRouter request failed with ${res.status}`);
    }

    debugCtx.step = "parseOpenrouterResponse";
    const data = await res.json() as any;
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.delta?.content ??
      "";
    debugCtx.rawContentPreview = typeof content === "string" ? content.slice(0, 500) : typeof content;

    // Attempt to parse as JSON; if it includes code fences, strip them
    const jsonText = String(content).replace(/```json|```/g, "").trim();
    let parsed: GenResponse | null = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      debugCtx.jsonParseError = e?.message || String(e);
      debugCtx.jsonTextPreview = jsonText.slice(0, 1000);
      throw new Error("Model did not return valid JSON for project scaffold.");
    }

    if (!parsed?.files?.length) {
      throw new Error("Generated result missing files.");
    }

    // Write files safely
    debugCtx.step = "writeFiles";
    debugCtx.filesCount = parsed.files.length;
    for (const f of parsed.files) {
      const rel = sanitizeRelative(f.path);
      const abs = path.join(projectDir, rel);
      await ensureDir(path.dirname(abs));
      await fs.writeFile(abs, f.content ?? "", "utf8");
    }

    // Post-process: enforce minimal runnable Next.js project
    debugCtx.step = "postprocess";
    const pkgPath = path.join(projectDir, "package.json");
    let pkg: any = {};
    try {
      const raw = await fs.readFile(pkgPath, "utf8");
      pkg = JSON.parse(raw);
    } catch {
      pkg = { name: parsed.projectName || id, private: true, version: "0.0.0" };
    }
    pkg.scripts = pkg.scripts || {};
    if (!pkg.scripts.dev) pkg.scripts.dev = "next dev";
    if (!pkg.scripts.build) pkg.scripts.build = "next build";
    if (!pkg.scripts.start) pkg.scripts.start = "next start";

    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};

    // Ensure minimal deps
    const ensureDep = (obj: any, name: string, version: string) => {
      if (!obj[name]) obj[name] = version;
    };
    ensureDep(pkg.dependencies, "next", "latest");
    ensureDep(pkg.dependencies, "react", "latest");
    ensureDep(pkg.dependencies, "react-dom", "latest");
    ensureDep(pkg.devDependencies, "typescript", "latest");

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), "utf8");

    // Normalize Next config: enforce JS/MJS only, remove TS config if present anywhere (even nested)
    const nextConfigPathJs = path.join(projectDir, "next.config.js");
    const nextConfigPathMjs = path.join(projectDir, "next.config.mjs");
    const nextConfigPathCjs = path.join(projectDir, "next.config.cjs");
    const nextConfigPathTs = path.join(projectDir, "next.config.ts");

    // Remove TS config at root if exists
    await fs.unlink(nextConfigPathTs).catch(() => {});

    // Also scan and remove any stray next.config.ts under the project tree (defensive)
    try {
      // very light recursive scan for next.config.ts (depth-limited)
      const scan = async (dir: string, depth = 0) => {
        if (depth > 3) return; // limit for performance
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) {
            // skip node_modules/.next for speed
            if (e.name === "node_modules" || e.name === ".next") continue;
            await scan(p, depth + 1);
          } else if (e.isFile() && e.name === "next.config.ts") {
            await fs.unlink(p).catch(() => {});
          }
        }
      };
      await scan(projectDir, 0);
    } catch {}

    const hasJs = await fs.access(nextConfigPathJs).then(() => true).catch(() => false);
    const hasMjs = await fs.access(nextConfigPathMjs).then(() => true).catch(() => false);
    const hasCjs = await fs.access(nextConfigPathCjs).then(() => true).catch(() => false);

    if (!hasJs && !hasMjs && !hasCjs) {
      // prefer CommonJS for widest compatibility, avoid typedRoutes to prevent Turbopack warnings
      await fs.writeFile(
        nextConfigPathJs,
        `/** Auto-generated to ensure Next runs */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: false }
};
module.exports = nextConfig;
`,
        "utf8"
      );
    } else {
      // If user/model generated a next.config.js with experimental.typedRoutes = true, disable it to avoid Turbopack incompat warning
      if (hasJs) {
        try {
          const cfg = await fs.readFile(nextConfigPathJs, "utf8");
          // הימנע משימוש בדגלי RegExp מתקדמים שלא נתמכים ביעד TS הנוכחי
          const hasTypedRoutes = new RegExp("experimental\\s*:\\s*{[^}]*typedRoutes\\s*:\\s*true", "g").test(cfg);
          if (hasTypedRoutes) {
            const patched = cfg.replace(new RegExp("typedRoutes\\s*:\\s*true", "g"), "typedRoutes: false");
            await fs.writeFile(nextConfigPathJs, patched, "utf8");
          }
        } catch {}
      }
    }

    // Ensure tsconfig.json
    const tsConfigPath = path.join(projectDir, "tsconfig.json");
    if (!(await fs
      .access(tsConfigPath)
      .then(() => true)
      .catch(() => false))) {
      await fs.writeFile(
        tsConfigPath,
        JSON.stringify(
          {
            compilerOptions: {
              target: "ES2020",
              lib: ["ES2020", "DOM", "DOM.Iterable"],
              jsx: "preserve",
              module: "ESNext",
              moduleResolution: "Bundler",
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              forceConsistentCasingInFileNames: true,
              baseUrl: ".",
              paths: { "@/*": ["./*"] }
            },
            include: ["**/*.ts", "**/*.tsx"],
            exclude: ["node_modules"]
          },
          null,
          2
        ),
        "utf8"
      );
    }

    // Ensure basic app/page.tsx if missing
    const appDir = path.join(projectDir, "app");
    const appPage = path.join(appDir, "page.tsx");
    if (!(await fs
      .access(appPage)
      .then(() => true)
      .catch(() => false))) {
      await ensureDir(appDir);
      await fs.writeFile(
        appPage,
        `"use client";
export default function Page() {
  return <main style={{padding:16}}><h1>Generated MVP</h1><p>This page was added automatically to ensure the project runs.</p></main>;
}
`,
        "utf8"
      );
    }

    // Run npm install to ensure deps
    debugCtx.step = "installDeps";
    const { spawn } = await import("child_process");
    // Windows יכול לזרוק EINVAL אם shell=false עם .cmd; נשתמש shell:true לעקיפה בטוחה
    const install = await new Promise<{ ok: boolean; code: number | null; err: string }>((resolve) => {
      const p = spawn(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["install", "--no-audit", "--no-fund"],
        { cwd: projectDir, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
      );
      let err = "";
      p.stderr.on("data", (d) => (err += d.toString()));
      p.on("exit", (code) => resolve({ ok: code === 0, code, err }));
    });
    // אם עדיין לא הצליח, ננסה fallback ל-npx --yes
    if (!install.ok) {
      const fallback = await new Promise<{ ok: boolean; code: number | null; err: string }>((resolve) => {
        const p = spawn(
          process.platform === "win32" ? "npx.cmd" : "npx",
          ["--yes", "npm", "install", "--no-audit", "--no-fund"],
          { cwd: projectDir, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
        );
        let err = "";
        p.stderr.on("data", (d) => (err += d.toString()));
        p.on("exit", (code) => resolve({ ok: code === 0, code, err }));
      });
      if (!fallback.ok) {
        debugCtx.installError = fallback.err.slice(0, 2000);
        throw new Error("Dependency installation failed during postprocess");
      }
    }
    if (!install.ok) {
      debugCtx.installError = install.err.slice(0, 2000);
      throw new Error("Dependency installation failed during postprocess");
    }

    const meta = {
      id,
      projectName: parsed.projectName || id,
      description: parsed.description || "",
      createdAt: new Date().toISOString(),
      runHint: parsed.runHint || "npm run dev",
      postInstall: parsed.postInstall || [],
      status: "generated",
      model: modelId || "openrouter/auto",
      paths: {
        projectDir,
      },
    };
    await ensureDir(path.dirname(metaPath));
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

    debugCtx.step = "done";
    return NextResponse.json(meta);
  } catch (e: any) {
    const payload = {
      error: e?.message || "Generation failed",
      debug: debugCtx,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
