import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async (app: FastifyInstance) => {
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  app.decorate('redis', redis);

  app.addHook('onClose', async (instance) => {
    await instance.redis.quit();
  });
});
