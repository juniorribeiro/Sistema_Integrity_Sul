import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createColaboradoresService } from './colaboradores.service.js';
import { criarColaboradorSchema, atualizarColaboradorSchema } from './colaboradores.schemas.js';

export default async function colaboradoresRoutes(app: FastifyInstance) {
  const service = createColaboradoresService(app);

  // Criar — apenas DIRETORIA e SUPORTE (com restrições)
  app.post('/', { preHandler: app.authorize(['DIRETORIA', 'SUPORTE']) }, async (req, reply) => {
    const input = validate(criarColaboradorSchema, req.body);
    const result = await service.criar(input, req.user.role);
    return reply.code(201).send(result);
  });

  // Listar — DIRETORIA, CONSULTOR_RH e SUPORTE
  app.get('/', { preHandler: app.authorize(['DIRETORIA', 'CONSULTOR_RH', 'SUPORTE']) }, async (req) => {
    return service.listar(req.user.role);
  });

  app.get('/:id', { preHandler: app.authorize(['DIRETORIA', 'CONSULTOR_RH', 'SUPORTE']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.obter(id, req.user.role);
  });

  app.patch('/:id', { preHandler: app.authorize(['DIRETORIA', 'SUPORTE']) }, async (req) => {
    const { id } = req.params as { id: string };
    const input = validate(atualizarColaboradorSchema, req.body);
    return service.atualizar(id, input, req.user.role);
  });

  app.delete('/:id', { preHandler: app.authorize(['DIRETORIA', 'SUPORTE']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.remover(id, req.user.role);
  });
}
