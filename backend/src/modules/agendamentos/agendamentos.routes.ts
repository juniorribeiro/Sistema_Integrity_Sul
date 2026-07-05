import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createAgendamentosService } from './agendamentos.service.js';
import {
  criarAgendamentoSchema,
  atualizarStatusSchema,
  criarDisponibilidadeSchema,
  reservarSlotSchema,
  calendarioQuerySchema,
} from './agendamentos.schemas.js';

const PROF = ['PSICOLOGO', 'NUTRICIONISTA', 'JURIDICO', 'FINANCEIRO_ATENDIMENTO', 'DIRETORIA'] as const;
const TODOS = [...PROF, 'FUNCIONARIO'] as const;

export default async function agendamentosRoutes(app: FastifyInstance) {
  const service = createAgendamentosService(app);

  app.get('/', { preHandler: app.authorize([...TODOS, 'SUPORTE']) }, async (req) =>
    service.listar(req.user.sub, req.user.role),
  );

  app.get('/funcionarios', { preHandler: app.authorize([...PROF, 'SUPORTE']) }, async () => service.listarFuncionarios());

  app.post('/', { preHandler: app.authorize([...PROF, 'SUPORTE']) }, async (req, reply) => {
    const r = await service.criar(req.user.sub, req.user.role, validate(criarAgendamentoSchema, req.body));
    return reply.code(201).send(r);
  });

  // ─── Disponibilidade & Calendário ────────────────────────────────

  app.get('/calendario', { preHandler: app.authorize([...TODOS, 'SUPORTE']) }, async (req) =>
    service.calendario(req.user.sub, req.user.role, validate(calendarioQuerySchema, req.query)),
  );

  app.post('/disponibilidade', { preHandler: app.authorize([...PROF, 'SUPORTE']) }, async (req, reply) => {
    const r = await service.gerarDisponibilidade(req.user.sub, req.user.role, validate(criarDisponibilidadeSchema, req.body));
    return reply.code(201).send(r);
  });

  app.get('/disponibilidade', { preHandler: app.authorize([...PROF, 'SUPORTE']) }, async (req) => {
    const { de, ate, profissionalId } = req.query as { de: string; ate: string; profissionalId?: string };
    return service.listarDisponibilidade(req.user.sub, req.user.role, new Date(de), new Date(ate), profissionalId);
  });

  app.delete('/disponibilidade/:id', { preHandler: app.authorize([...PROF, 'SUPORTE']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.removerDisponibilidade(id, req.user.sub, req.user.role);
  });

  app.get('/slots-livres', { preHandler: app.authorize([...TODOS, 'SUPORTE']) }, async (req) => {
    const { setor, de, ate } = req.query as { setor?: string; de: string; ate: string };
    return service.slotsLivres({ setor, de: new Date(de), ate: new Date(ate) });
  });

  app.post('/slots/:id/reservar', { preHandler: app.authorize(['FUNCIONARIO']) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await service.reservarSlot(id, req.user.sub, validate(reservarSlotSchema, req.body));
    return reply.code(201).send(r);
  });

  app.patch('/:id/status', { preHandler: app.authorize([...TODOS, 'SUPORTE']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.atualizarStatus(id, req.user.sub, req.user.role, validate(atualizarStatusSchema, req.body));
  });

  app.delete('/:id', { preHandler: app.authorize([...PROF, 'SUPORTE']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.remover(id, req.user.sub, req.user.role);
  });

  app.get('/:id/reuniao-token', { preHandler: app.authorize([...TODOS, 'SUPORTE']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.obterReuniaoToken(id, req.user.sub, req.user.role);
  });
}
