import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { createAuthService, AuthError } from './auth.service.js';
import { loginSchema, refreshSchema, trocarSenhaSchema } from './auth.schemas.js';

export default async function authRoutes(app: FastifyInstance) {
  const service = createAuthService(app);

  app.post('/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors });
    }
    try {
      const result = await service.login(parsed.data.email, parsed.data.senha);
      return reply.send(result);
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.post('/refresh', async (req, reply) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos' });
    try {
      return reply.send(await service.refresh(parsed.data.refreshToken));
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.post('/logout', async (req, reply) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (parsed.success) await service.logout(parsed.data.refreshToken);
    return reply.send({ ok: true });
  });

  // Troca de senha (também usada no primeiro acesso obrigatório)
  app.post('/trocar-senha', { preHandler: app.authenticate }, async (req, reply) => {
    const parsed = trocarSenhaSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors });
    }
    try {
      await service.trocarSenha(req.user.sub, parsed.data.novaSenha, parsed.data.senhaAtual);
      return reply.send({ ok: true, message: 'Senha atualizada' });
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.get('/me', { preHandler: app.authenticate }, async (req, reply) => {
    try {
      return reply.send(await service.me(req.user.sub));
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // Reset de senha de outro usuário por administrador/suporte
  app.post('/reset-senha', { preHandler: app.authorize(['DIRETORIA', 'SUPORTE']) }, async (req, reply) => {
    const resetSchema = z.object({
      email: z.string().email(),
      novaSenha: z.string().min(6),
    });
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors });
    }
    try {
      await service.resetarSenhaOutroUsuario(
        req.user.sub,
        req.user.role,
        parsed.data.email,
        parsed.data.novaSenha
      );
      return reply.send({ ok: true, message: 'Senha resetada com sucesso' });
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
