import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const backendDir = path.join(rootDir, "backend");

const children = [];

const run = (cmd, args, cwd, name) => {
  const child = spawn(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });
  children.push(child);
  return child;
};

let shuttingDown = false;
const shutdown = (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(exitCode);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev:all] starting backend on :4000 and web on :5173");
run("node", ["dist/server.js"], backendDir, "backend");
run("npm", ["--workspace", "web", "run", "dev"], rootDir, "web");
