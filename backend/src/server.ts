import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";
import { agentRoutes } from "./routes/agents.js";
import { auditRoutes } from "./routes/audits.js";
import { bootstrapRoutes } from "./routes/bootstrap.js";
import { hallRoutes } from "./routes/hall.js";
import { mcpRoutes } from "./routes/mcps.js";
import { modelRoutes } from "./routes/models.js";
import { skillRoutes } from "./routes/skills.js";
import { taskRoutes } from "./routes/tasks.js";
import { prisma } from "./services/prisma.js";
import { authGuard } from "./services/auth.js";
import { seedIfEmpty } from "./services/seed.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
app.addHook("preHandler", authGuard);

app.get("/health", async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(modelRoutes);
await app.register(skillRoutes);
await app.register(mcpRoutes);
await app.register(agentRoutes);
await app.register(bootstrapRoutes);
await app.register(taskRoutes);
await app.register(hallRoutes);
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
