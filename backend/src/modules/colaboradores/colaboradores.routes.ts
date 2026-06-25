import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createColaboradoresService } from './colaboradores.service.js';
import { criarColaboradorSchema, atualizarColaboradorSchema } from './colaboradores.schemas.js';

export default async function colaboradoresRoutes(app: FastifyInstance) {
  const service = createColaboradoresService(app);

  // Criar — apenas DIRETORIA
  app.post('/', { preHandler: app.authorize(['DIRETORIA']) }, async (req, reply) => {
    const input = validate(criarColaboradorSchema, req.body);
    const result = await service.criar(input);
    return reply.code(201).send(result);
  });

  // Listar — DIRETORIA e CONSULTOR_RH
  app.get('/', { preHandler: app.authorize(['DIRETORIA', 'CONSULTOR_RH']) }, async () => {
    return service.listar();
  });

  app.get('/:id', { preHandler: app.authorize(['DIRETORIA', 'CONSULTOR_RH']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.obter(id);
  });

  app.patch('/:id', { preHandler: app.authorize(['DIRETORIA']) }, async (req) => {
    const { id } = req.params as { id: string };
    const input = validate(atualizarColaboradorSchema, req.body);
    return service.atualizar(id, input);
  });

  app.delete('/:id', { preHandler: app.authorize(['DIRETORIA']) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.remover(id);
  });
}
