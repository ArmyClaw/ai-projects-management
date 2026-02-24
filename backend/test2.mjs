import Fastify from 'fastify';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

await fastify.register(import('@fastify/cors'), { origin: true });
await fastify.register(import('@fastify/jwt'), { secret: 'test' });
await fastify.register(import('@fastify/compress'), { threshold: 1024 });
await fastify.register(import('@fastify/swagger'), { openapi: { info: { title: 'API', version: '1.0.0' } } });
await fastify.register(import('@fastify/swagger-ui'), { routePrefix: '/docs' });

fastify.get('/', async () => ({ hello: 'world' }));

fastify.listen({ port: 4000, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Server at http://0.0.0.0:4000');
});

setInterval(() => {}, 1000);
