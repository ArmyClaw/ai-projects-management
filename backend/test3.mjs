import Fastify from 'fastify';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyCompress from '@fastify/compress';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

await fastify.register(cors, { origin: true });
await fastify.register(jwt, { secret: 'test' });
await fastify.register(fastifyCompress, { threshold: 1024 });
await fastify.register(swagger, { openapi: { info: { title: 'API', version: '1.0.0' } } });
await fastify.register(swaggerUi, { routePrefix: '/docs' });

// Try importing one route
const { getProjectsRoute } = await import('./src/routes/projects.js');
await getProjectsRoute(fastify);

fastify.get('/', async () => ({ hello: 'world' }));

fastify.listen({ port: 4000, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Server at http://0.0.0.0:4000');
});

setInterval(() => {}, 1000);
