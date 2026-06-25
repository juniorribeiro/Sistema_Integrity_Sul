import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@prisma/client';
import { env } from '../env.js';

export interface JwtUser {
  sub: string; // usuario.id
  role: Role;
  primeiroLogin: boolean;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** preHandler: exige access token válido. */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** factory de preHandler: exige token válido + um dos roles informados. */
    authorize: (roles: Role[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '15m' },
  });

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Não autenticado' });
    }
  });

  app.decorate('authorize', (roles: Role[]) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch {
        return reply.code(401).send({ error: 'Não autenticado' });
      }
      if (!roles.includes(req.user.role)) {
        return reply.code(403).send({ error: 'Acesso negado para o seu perfil' });
      }
    };
  });
});
