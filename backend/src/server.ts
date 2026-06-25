import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import Redis from 'ioredis';

import { env } from './env.js';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import garagePlugin from './plugins/garage.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './modules/auth/auth.routes.js';

async function build() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      // Nunca logar dados sensíveis (CPF, triagem, senha)
      redact: ['req.body.senha', 'req.body.cpf', 'req.headers.authorization'],
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
  });

  // CORS
  await app.register(cors, {
    origin: [env.APP_URL],
    credentials: true,
  });

  // Rate limit global (rotas públicas: 100/min/IP). Store no Redis.
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, connectionName: 'rate-limit' }),
    keyGenerator: (req) => req.ip,
  });

  // Upload de arquivos (multipart) — limite 25MB
  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });

  // Plugins de infraestrutura
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(garagePlugin);
  await app.register(authPlugin);

  // Healthcheck
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // Rotas dos módulos
  await app.register(authRoutes, { prefix: '/auth' });

  return app;
}

build()
  .then((app) =>
    app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
      app.log.info(`🚀 Backend Integrity Sul rodando na porta ${env.PORT}`);
    }),
  )
  .catch((err) => {
    console.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
  });
