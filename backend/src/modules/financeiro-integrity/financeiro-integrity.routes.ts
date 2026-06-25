import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createFinanceiroIntegrityService } from './financeiro-integrity.service.js';
import { criarLancamentoSchema, atualizarLancamentoSchema } from './financeiro-integrity.schemas.js';

const FIN = ['DIRETORIA', 'FINANCEIRO_INTEGRITY'] as const;

export default async function financeiroIntegrityRoutes(app: FastifyInstance) {
  const service = createFinanceiroIntegrityService(app);
  const guard = { preHandler: app.authorize([...FIN]) };

  app.get('/lancamentos', guard, async (req) => service.listar(req.query as Record<string, string>));

  app.post('/lancamentos', guard, async (req, reply) => {
    const r = await service.criar(validate(criarLancamentoSchema, req.body));
    return reply.code(201).send(r);
  });

  app.patch('/lancamentos/:id', guard, async (req) =>
    service.atualizar((req.params as { id: string }).id, validate(atualizarLancamentoSchema, req.body)),
  );

  app.delete('/lancamentos/:id', guard, async (req) => service.remover((req.params as { id: string }).id));

  app.get('/resumo', guard, async (req) => {
    const { ano } = req.query as { ano?: string };
    return service.resumo(ano ? Number(ano) : new Date().getFullYear());
  });
}
