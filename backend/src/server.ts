import Fastify from "fastify";
import cors from "@fastify/cors";
import { agentRoutes } from "./routes/agents.js";
import { auditRoutes } from "./routes/audits.js";
import { bootstrapRoutes } from "./routes/bootstrap.js";
import { modelRoutes } from "./routes/models.js";
import { skillRoutes } from "./routes/skills.js";
import { prisma } from "./services/prisma.js";
import { seedIfEmpty } from "./services/seed.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true }));

await app.register(modelRoutes);
await app.register(skillRoutes);
await app.register(agentRoutes);
await app.register(bootstrapRoutes);
await app.register(auditRoutes);

await seedIfEmpty();

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

const port = Number(process.env.PORT || 4000);
try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
