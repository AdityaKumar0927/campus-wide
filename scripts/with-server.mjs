/**
 * Starts the production server, waits for /api/health, runs the given command, then stops the server.
 * Cross-platform (Windows kills by PID, POSIX by process group). Used by `pnpm lighthouse:server` and CI.
 *   node scripts/with-server.mjs <command> [args...]
 */
import { execSync, spawn } from "node:child_process";

const port = Number(process.env.PORT ?? 3000);
const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("usage: node scripts/with-server.mjs <command> [args...]");
  process.exit(2);
}

const isWin = process.platform === "win32";
const server = spawn(isWin ? "npx.cmd" : "npx", ["next", "start", "-p", String(port)], {
  stdio: ["ignore", "inherit", "inherit"],
  shell: isWin,
  detached: !isWin,
});

async function waitForHealth() {
  const url = `http://localhost:${port}/api/health`;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
  }
  throw new Error(`server did not become healthy at ${url}`);
}

function stopServer() {
  try {
    if (isWin) {
      const out = execSync("netstat -ano", { encoding: "utf8" });
      const pids = new Set(
        out
          .split("\n")
          .filter((l) => l.includes(`:${port} `) && /LISTENING/i.test(l))
          .map((l) => Number(l.trim().split(/\s+/).pop()))
          .filter(Boolean),
      );
      for (const pid of pids) {
        try { process.kill(pid); } catch {}
      }
      try { process.kill(server.pid); } catch {}
    } else {
      process.kill(-server.pid, "SIGTERM");
    }
  } catch {}
}

let code = 1;
try {
  await waitForHealth();
  const child = spawn(cmd, args, { stdio: "inherit", shell: true });
  code = await new Promise((resolve) => child.on("exit", (c) => resolve(c ?? 1)));
} catch (err) {
  console.error(err);
} finally {
  stopServer();
}
process.exit(code);
