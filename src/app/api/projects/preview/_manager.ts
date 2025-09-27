import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import net from "net";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

type ProcInfo = {
  id: string;
  proc: ChildProcessWithoutNullStreams;
  port: number;
  startedAt: string;
  cwd: string;
  cmd: string;
  args: string[];
  logFile: string;
};

const processes = new Map<string, ProcInfo>();
// נעקוב גם אחרי מיפוי פורט -> פרויקט כדי למנוע בלבול בין תהליכים
const portToProject = new Map<number, string>();

function getWorkspaceRoot() {
  const projectRoot = process.cwd();
  return path.join(projectRoot, "..", "workspaces", "projects");
}

export async function findFreePort(start = 4000, end = 4999): Promise<number> {
  // בדיקה אמיתית של מערכת ההפעלה אם הפורט פנוי ע"י ניסיון bind
  async function isFree(port: number) {
    return await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      // חשוב: האזן על 0.0.0.0 ולא 127.0.0.1 כדי לגלות גם תפיסה על IPv6 :::port
      server.listen(port, "0.0.0.0");
    });
  }

  // נסה כמה סבבים כדי להתמודד עם מצב race (השתחרר בין בדיקה להרצה)
  for (let attempt = 0; attempt < 2; attempt++) {
    for (let p = start; p <= end; p++) {
      // דלג אם ידוע לנו שכבר שייך לתהליך אחר שנוהל ע"י המערכת
      if (portToProject.has(p)) continue;
      if (await isFree(p)) return p;
    }
    // עיכוב קצר לפני ניסיון נוסף
    await new Promise((r) => setTimeout(r, 150));
  }

  throw new Error("No free port found in range 4000-4999");
}

export function getProjectDir(id: string) {
  return path.join(getWorkspaceRoot(), id, "mvp");
}

function getLogsDir(id: string) {
  return path.join(getWorkspaceRoot(), id, "logs");
}

function isWin() {
  return process.platform === "win32";
}

async function hasDevScript(cwd: string) {
  try {
    const pkgRaw = await fs.readFile(path.join(cwd, "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw);
    return Boolean(pkg?.scripts?.dev);
  } catch {
    return false;
  }
}

export function status(id: string) {
  const info = processes.get(id);
  if (!info) return { running: false };
  const running = !info.proc.killed;
  return { running, port: info.port, startedAt: info.startedAt, cwd: info.cwd, cmd: info.cmd, args: info.args };
}

async function ensureDeps(cwd: string) {
  if (existsSync(path.join(cwd, "node_modules"))) return { installed: false, reason: "already_present" };
  // אם אין node_modules נבצע התקנה עם npm ci ואם נכשל ננסה npm install
  const useCmd = isWin() ? "npm.cmd" : "npm";
  const run = (args: string[]) =>
    new Promise<{ ok: boolean; code: number | null; stderr: string }>((resolve) => {
      const p = spawn(useCmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: false });
      let err = "";
      p.stderr.on("data", (d) => (err += d.toString()));
      p.on("exit", (code) => resolve({ ok: code === 0, code, stderr: err }));
    });

  let r = await run(["ci", "--no-audit", "--no-fund"]);
  if (!r.ok) {
    r = await run(["install", "--no-audit", "--no-fund"]);
    if (!r.ok) {
      throw new Error(`dependency install failed: ${r.stderr.slice(0, 2000)}`);
    }
  }
  return { installed: true, reason: "installed" };
}

export async function start(id: string) {
  // ensure logs dir
  const logsDir = getLogsDir(id);
  await fs.mkdir(logsDir, { recursive: true });
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = path.join(logsDir, `preview-${runId}.log`);
  const existing = processes.get(id);
  if (existing && !existing.proc.killed) {
    return { port: existing.port, alreadyRunning: true };
  }
  // ודא שאין תהליך "יתום" שרץ על אותו פורט מפרויקט אחר
  // אם כן – לא נשתמש באותו פורט, ונקצה פורט חדש.

  const cwd = getProjectDir(id);
  // התקן תלויות אוטומטית אם צריך
  await ensureDeps(cwd);
  // אם הפרויקט כבר היה רץ בעבר, נעדיף לשחרר את הפורט שלו ולא למחזר את 4000
  const port = await findFreePort(4000, 4999);

  // Strategy:
  // 1) If scripts.dev exists, run: npm run dev -- --port <port>  (שימו לב: עבור Next 14, --port ו/או -p נתמכים)
  // 2) Fallback: npx next dev -p <port>
  let cmd = "";
  let args: string[] = [];
  if (await hasDevScript(cwd)) {
    cmd = isWin() ? "npm.cmd" : "npm";
    // נסה קודם --port, ואם נאתר לוג של "Unknown argument" נבצע ריספאון עם -p
    args = ["run", "dev", "--", "--port", String(port)];
  } else {
    // נסה קודם להפעיל דרך npx next dev
    cmd = isWin() ? "npx.cmd" : "npx";
    args = ["--yes", "next", "dev", "-p", String(port)];
  }

  // Extra safety: Windows often throws EINVAL when cmd or args invalid.
  // Log full command and cwd through status() for debugging.
  // ב-Windows נריץ עם shell:true כדי למנוע שגיאת EINVAL בעת הרצת *.cmd
  let proc = spawn(cmd, args, {
    cwd,
    env: { ...process.env, PORT: String(port), NODE_ENV: "development" },
    stdio: "pipe",
    shell: isWin(),
  });

  const info: ProcInfo = {
    id,
    proc,
    port,
    startedAt: new Date().toISOString(),
    cwd,
    cmd,
    args,
    logFile,
  };
  processes.set(id, info);
  portToProject.set(port, id);

  let stderrBuf = "";
  let stdoutBuf = "";
  // write logs to file as well as keep a short buffer
  const append = async (text: string) => {
    try {
      await fs.appendFile(logFile, text);
    } catch {}
  };

  await append(`[${new Date().toISOString()}] START cmd="${cmd}" args="${args.join(" ")}" cwd="${cwd}" port=${port}\n`);
  proc.stdout.on("data", (d) => {
    const s = d.toString();
    stdoutBuf = (stdoutBuf + s).slice(-4000);
    append(s);
  });
  proc.stderr.on("data", (d) => {
    const s = d.toString();
    stderrBuf = (stderrBuf + s).slice(-4000);
    append(s);
  });
  proc.on("exit", (code) => {
    // אם התהליך נסגר, ננקה מיפויים כדי שלא נחשוב שהוא עדיין חי
    if (!processes.has(id)) return;
    processes.delete(id);
    if (portToProject.get(port) === id) {
      portToProject.delete(port);
    }
  });

  // המתנה קצרה לראות אם התהליך קרס מידית (למשל next לא מותקן / אין script)
  await new Promise((r) => setTimeout(r, 1400));
  // אם התהליך עדיין חי אבל אנו מזהים בעיות ארגומנט/פורט בשימוש – ננסה מחדש עם פורט חדש
  if (proc.exitCode === null) {
    const combinedTail = (stdoutBuf + "\n" + stderrBuf).slice(-4000).toLowerCase();
    const unknownArg = args.includes("--port") && combinedTail.includes("unknown") && combinedTail.includes("argument");
    const addrInUse = combinedTail.includes("eaddrinuse") || combinedTail.includes("address already in use");

    if (unknownArg || addrInUse) {
      try { proc.kill(); } catch {}
      if (portToProject.get(port) === id) portToProject.delete(port);

      // הקצה פורט חדש וננסה שוב
      const newPort = await findFreePort(4000, 4999);
      portToProject.set(newPort, id);

      // החלף את הארגומנטים בהתאם למצב
      if (unknownArg && args.includes("--port")) {
        const idx = args.indexOf("--port");
        if (idx !== -1) args = args.slice(0, idx).concat(["-p", String(newPort)]);
      } else {
        // במקרה של EADDRINUSE רק נחליף את הערך של הפורט בארגומנטים
        const idxLong = args.indexOf("--port");
        const idxShort = args.indexOf("-p");
        if (idxLong !== -1 && args[idxLong + 1]) {
          args[idxLong + 1] = String(newPort);
        } else if (idxShort !== -1 && args[idxShort + 1]) {
          args[idxShort + 1] = String(newPort);
        } else {
          // אם משום מה אין דגל – הוסף -p
          args = args.concat(["-p", String(newPort)]);
        }
      }

      proc = spawn(cmd, args, {
        cwd,
        env: { ...process.env, PORT: String(newPort), NODE_ENV: "development" },
        stdio: "pipe",
        shell: isWin(),
      });
      processes.set(id, { ...info, proc, args, port: newPort });
      await append(`\n[${new Date().toISOString()}] RETRY on new port ${newPort} with args="${args.join(" ")}"\n`);

      // אפס זנבות ו-listeners מחדש
      stderrBuf = "";
      stdoutBuf = "";
      proc.stdout.on("data", (d) => {
        const s = d.toString();
        stdoutBuf = (stdoutBuf + s).slice(-4000);
        append(s);
      });
      proc.stderr.on("data", (d) => {
        const s = d.toString();
        stderrBuf = (stderrBuf + s).slice(-4000);
        append(s);
      });
      proc.on("exit", (code) => {
        if (!processes.has(id)) return;
        processes.delete(id);
        if (portToProject.get(newPort) === id) portToProject.delete(newPort);
      });

      // עדכן משתנה ה-port המקומי למעקב לוגי
      (info as any).port = newPort;
    }
  }

  if (proc.exitCode !== null) {
    // נסה fallback נוסף: הרצה ישירה דרך bin של next המקומי
    const localNextBin = path.join(cwd, "node_modules", ".bin", isWin() ? "next.cmd" : "next");
    if (existsSync(localNextBin)) {
      stderrBuf = "";
      stdoutBuf = "";
      cmd = localNextBin;
      args = ["dev", "-p", String(port)];
      proc = spawn(cmd, args, {
        cwd,
        env: { ...process.env, PORT: String(port), NODE_ENV: "development" },
        stdio: "pipe",
        shell: isWin(),
      });
      processes.set(id, { ...info, proc, cmd, args });
      portToProject.set(port, id);
      await append(`\n[${new Date().toISOString()}] FALLBACK to local next bin: "${cmd}" ${args.join(" ")}\n`);

      proc.stdout.on("data", (d) => {
        const s = d.toString();
        stdoutBuf = (stdoutBuf + s).slice(-4000);
        append(s);
      });
      proc.stderr.on("data", (d) => {
        const s = d.toString();
        stderrBuf = (stderrBuf + s).slice(-4000);
        append(s);
      });
      proc.on("exit", async () => {
        if (!processes.has(id)) return;
        processes.delete(id);
        if (portToProject.get(port) === id) {
          portToProject.delete(port);
        }
        await append(`\n[${new Date().toISOString()}] PROCESS EXITED (fallback)\n`);
      });

      await new Promise((r) => setTimeout(r, 1200));
      if (proc.exitCode === null) {
        return { port, cmd, args, cwd };
      }
    }

    await append(`\n[${new Date().toISOString()}] EARLY EXIT code=${proc.exitCode}\n`);
    await append(`stderr (tail):\n${stderrBuf}\n---\nstdout (tail):\n${stdoutBuf}\n`);
    throw new Error(
      `Preview process exited early (code ${proc.exitCode}). cmd="${cmd}" args="${args.join(" ")}" cwd="${cwd}" logFile="${logFile}"\n` +
      `stderr:\n${stderrBuf}\n---\nstdout:\n${stdoutBuf}`
    );
  }

  await append(`[${new Date().toISOString()}] RUNNING on http://localhost:${port}\n`);
  return { port, cmd, args, cwd, logFile };
}

export async function stop(id: string) {
  const info = processes.get(id);
  if (!info) return { stopped: false, reason: "not_running" };
  try {
    info.proc.kill();
    processes.delete(id);
    // נקה גם את מיפוי הפורט כדי שלא יישמר לשימוש עתידי בתור "כבר רץ"
    if (portToProject.get(info.port) === id) {
      portToProject.delete(info.port);
    }
    return { stopped: true };
  } catch (e: any) {
    return { stopped: false, reason: e?.message || "kill_failed" };
  }
}
