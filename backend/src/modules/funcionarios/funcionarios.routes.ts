import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createFuncionariosService } from './funcionarios.service.js';
import { autocadastroSchema } from './funcionarios.schemas.js';

export default async function funcionariosRoutes(app: FastifyInstance) {
  const service = createFuncionariosService(app);

  // Pública: autocadastro via token da URL única
  app.post('/cadastro/:token', async (req, reply) => {
    const { token } = req.params as { token: string };
    const input = validate(autocadastroSchema, req.body);
    const result = await service.autocadastro(token, input, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return reply.code(201).send(result);
  });

  // Listar — DIRETORIA/CONSULTOR veem todos; RH_CLIENTE vê só a sua empresa
  app.get(
    '/',
    { preHandler: app.authorize(['DIRETORIA', 'CONSULTOR_RH', 'RH_CLIENTE']) },
    async (req) => {
      if (req.user.role === 'RH_CLIENTE') {
        const empresaId = await service.empresaIdDoRH(req.user.sub);
        return service.listar(empresaId);
      }
      return service.listar();
    },
  );

  app.get(
    '/:id',
    { preHandler: app.authorize(['DIRETORIA', 'CONSULTOR_RH', 'RH_CLIENTE']) },
    async (req) => {
      const { id } = req.params as { id: string };
      const restricao =
        req.user.role === 'RH_CLIENTE' ? await service.empresaIdDoRH(req.user.sub) : undefined;
      return service.obter(id, restricao);
    },
  );
}
