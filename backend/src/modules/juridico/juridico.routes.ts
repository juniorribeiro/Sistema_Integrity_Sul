import type { FastifyInstance } from 'fastify';
import { validate, AppError } from '../../shared/errors.js';
import { createJuridicoService } from './juridico.service.js';
import {
  criarCasoSchema,
  atualizarCasoSchema,
  criarPrazoSchema,
  atualizarPrazoSchema,
} from './juridico.schemas.js';

const PROF = ['JURIDICO', 'DIRETORIA'] as const;

export default async function juridicoRoutes(app: FastifyInstance) {
  const service = createJuridicoService(app);

  app.get('/funcionarios', { preHandler: app.authorize([...PROF]) }, async () => service.listarFuncionarios());

  app.get('/funcionarios/:funcId/casos', { preHandler: app.authorize([...PROF]) }, async (req) => {
    const { funcId } = req.params as { funcId: string };
    return service.listarCasosDoFuncionario(funcId);
  });

  app.post('/casos', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const r = await service.criarCaso(req.user.sub, validate(criarCasoSchema, req.body));
    return reply.code(201).send(r);
  });

  app.get('/casos/:id', { preHandler: app.authorize([...PROF]) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.obterCaso(id, req.user.sub, req.user.role);
  });

  app.patch('/casos/:id', { preHandler: app.authorize([...PROF]) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.atualizarCaso(id, req.user.sub, req.user.role, validate(atualizarCasoSchema, req.body));
  });

  app.post('/casos/:id/prazos', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await service.adicionarPrazo(id, req.user.sub, req.user.role, validate(criarPrazoSchema, req.body));
    return reply.code(201).send(r);
  });

  app.patch('/prazos/:prazoId', { preHandler: app.authorize([...PROF]) }, async (req) => {
    const { prazoId } = req.params as { prazoId: string };
    return service.atualizarPrazo(prazoId, req.user.sub, req.user.role, validate(atualizarPrazoSchema, req.body));
  });

  app.post('/casos/:id/documentos', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = await req.file();
    if (!data) throw new AppError(400, 'Nenhum arquivo enviado');
    const doc = await service.adicionarDocumento(id, req.user.sub, req.user.role, {
      filename: data.filename,
      mimetype: data.mimetype,
      buffer: await data.toBuffer(),
    });
    return reply.code(201).send(doc);
  });

  app.get('/documentos/:docId/download', { preHandler: app.authorize([...PROF, 'FUNCIONARIO']) }, async (req) => {
    const { docId } = req.params as { docId: string };
    return service.urlDownloadDocumento(docId, req.user.sub, req.user.role);
  });

  app.delete('/prazos/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerPrazo((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/documentos/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerDocumento((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/casos/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerCaso((req.params as { id: string }).id, req.user.sub, req.user.role),
  );

  app.get('/meus-casos', { preHandler: app.authorize(['FUNCIONARIO']) }, async (req) => service.meusCasos(req.user.sub));
}
