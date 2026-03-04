import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const provider = process.env.DATABASE_PROVIDER ?? "postgresql";
if (!["postgresql", "mysql"].includes(provider)) {
  console.error(`[db:init] Unsupported DATABASE_PROVIDER: ${provider}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("[db:init] DATABASE_URL is required");
  process.exit(1);
}

const schema = provider === "mysql" ? "prisma/schema.mysql.prisma" : "prisma/schema.prisma";

console.log(`[db:init] provider=${provider} schema=${schema}`);
run("npx", ["prisma", "generate", "--schema", schema]);
run("npx", ["prisma", "db", "push", "--schema", schema, "--skip-generate"]);
console.log("[db:init] schema initialized");
