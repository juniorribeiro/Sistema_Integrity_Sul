import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createEmpresasService } from './empresas.service.js';
import { criarEmpresaSchema, atualizarEmpresaSchema } from './empresas.schemas.js';

const GESTAO = ['DIRETORIA', 'CONSULTOR_RH'] as const;

export default async function empresasRoutes(app: FastifyInstance) {
  const service = createEmpresasService(app);

  // Pública: valida o token da URL de cadastro (usada pelo portal /cadastro/[token])
  app.get('/validar-token/:token', async (req) => {
    const { token } = req.params as { token: string };
    return service.validarToken(token);
  });

  app.post('/', { preHandler: app.authorize([...GESTAO]) }, async (req, reply) => {
    const input = validate(criarEmpresaSchema, req.body);
    const result = await service.criar(input);
    return reply.code(201).send(result);
  });

  app.get('/', { preHandler: app.authorize([...GESTAO]) }, async () => {
    return service.listar();
  });

  app.get('/:id', { preHandler: app.authorize([...GESTAO]) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.obter(id);
  });

  app.patch('/:id', { preHandler: app.authorize([...GESTAO]) }, async (req) => {
    const { id } = req.params as { id: string };
    const input = validate(atualizarEmpresaSchema, req.body);
    return service.atualizar(id, input);
  });

  app.post('/:id/regenerar-url', { preHandler: app.authorize([...GESTAO]) }, async (req) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { validadeDias?: number };
    return service.regenerarUrl(id, body.validadeDias ?? 30);
  });
}
