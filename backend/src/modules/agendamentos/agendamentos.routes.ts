import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createAgendamentosService } from './agendamentos.service.js';
import { criarAgendamentoSchema, atualizarStatusSchema } from './agendamentos.schemas.js';

const PROF = ['PSICOLOGO', 'NUTRICIONISTA', 'JURIDICO', 'FINANCEIRO_ATENDIMENTO', 'DIRETORIA'] as const;
const TODOS = [...PROF, 'FUNCIONARIO'] as const;

export default async function agendamentosRoutes(app: FastifyInstance) {
  const service = createAgendamentosService(app);

  app.get('/', { preHandler: app.authorize([...TODOS]) }, async (req) =>
    service.listar(req.user.sub, req.user.role),
  );

  app.get('/funcionarios', { preHandler: app.authorize([...PROF]) }, async () => service.listarFuncionarios());

  app.post('/', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const r = await service.criar(req.user.sub, req.user.role, validate(criarAgendamentoSchema, req.body));
    return reply.code(201).send(r);
  });

  app.patch('/:id/status', { preHandler: app.authorize([...TODOS]) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.atualizarStatus(id, req.user.sub, req.user.role, validate(atualizarStatusSchema, req.body));
  });
}
