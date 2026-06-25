import type { FastifyInstance } from 'fastify';
import { ZodError, z, type ZodTypeAny } from 'zod';

/** Erro de aplicação com status HTTP. O handler global converte em resposta JSON. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public detalhes?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Valida `data` contra um schema Zod; lança AppError(400) com os erros de campo. */
export function validate<T extends ZodTypeAny>(schema: T, data: unknown): z.output<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(400, 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  return parsed.data;
}

/** Registra o handler global de erros (AppError, Zod, Prisma unique, fallback 500). */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: Error, req, reply) => {
    // Erro de validação do próprio Fastify/Zod
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Dados inválidos', detalhes: error.flatten().fieldErrors });
    }
    // AppError e qualquer erro com statusCode (ex.: AuthError, rate-limit)
    const status = (error as { statusCode?: number }).statusCode;
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ error: error.message, detalhes: error.detalhes });
    }
    // Violação de unicidade do Prisma
    if ((error as { code?: string }).code === 'P2002') {
      const alvo = (error as { meta?: { target?: string[] } }).meta?.target?.join(', ') ?? 'campo';
      return reply.code(409).send({ error: `Já existe um registro com este ${alvo}` });
    }
    if (status && status < 500) {
      return reply.code(status).send({ error: error.message });
    }
    req.log.error(error);
    return reply.code(500).send({ error: 'Erro interno do servidor' });
  });
}
