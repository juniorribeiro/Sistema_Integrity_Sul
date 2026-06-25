import type { FastifyInstance } from 'fastify';
import { validate, AppError } from '../../shared/errors.js';
import { createPsicologiaService } from './psicologia.service.js';
import {
  criarProntuarioSchema,
  atualizarProntuarioSchema,
  criarSessaoSchema,
  criarMetaSchema,
  atualizarMetaSchema,
} from './psicologia.schemas.js';

const PROF = ['PSICOLOGO', 'DIRETORIA'] as const;

export default async function psicologiaRoutes(app: FastifyInstance) {
  const service = createPsicologiaService(app);

  // ---- Profissional ----
  app.get('/funcionarios', { preHandler: app.authorize([...PROF]) }, async () => service.listarFuncionarios());

  app.post('/prontuarios', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const input = validate(criarProntuarioSchema, req.body);
    const r = await service.criarProntuario(req.user.sub, input);
    return reply.code(201).send(r);
  });

  app.get('/prontuarios/:id', { preHandler: app.authorize([...PROF]) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.obterProntuario(id, req.user.sub, req.user.role);
  });

  app.patch('/prontuarios/:id', { preHandler: app.authorize([...PROF]) }, async (req) => {
    const { id } = req.params as { id: string };
    return service.atualizarProntuario(id, req.user.sub, req.user.role, validate(atualizarProntuarioSchema, req.body));
  });

  app.post('/prontuarios/:id/sessoes', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await service.adicionarSessao(id, req.user.sub, req.user.role, validate(criarSessaoSchema, req.body));
    return reply.code(201).send(r);
  });

  app.post('/prontuarios/:id/metas', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await service.adicionarMeta(id, req.user.sub, req.user.role, validate(criarMetaSchema, req.body));
    return reply.code(201).send(r);
  });

  app.patch('/metas/:metaId', { preHandler: app.authorize([...PROF]) }, async (req) => {
    const { metaId } = req.params as { metaId: string };
    return service.atualizarMeta(metaId, req.user.sub, req.user.role, validate(atualizarMetaSchema, req.body));
  });

  // Upload de documento (multipart) — laudo/prontuário
  app.post('/prontuarios/:id/documentos', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = await req.file();
    if (!data) throw new AppError(400, 'Nenhum arquivo enviado');
    const buffer = await data.toBuffer();
    const doc = await service.adicionarDocumento(id, req.user.sub, req.user.role, {
      filename: data.filename,
      mimetype: data.mimetype,
      buffer,
    });
    return reply.code(201).send(doc);
  });

  // Download via presigned URL — profissional OU o próprio funcionário
  app.get(
    '/documentos/:docId/download',
    { preHandler: app.authorize([...PROF, 'FUNCIONARIO']) },
    async (req) => {
      const { docId } = req.params as { docId: string };
      return service.urlDownloadDocumento(docId, req.user.sub, req.user.role);
    },
  );

  app.delete('/sessoes/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerSessao((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/metas/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerMeta((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/documentos/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerDocumento((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/prontuarios/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerProntuario((req.params as { id: string }).id, req.user.sub, req.user.role),
  );

  // ---- Funcionário (visão do próprio prontuário) ----
  app.get('/meu-prontuario', { preHandler: app.authorize(['FUNCIONARIO']) }, async (req) =>
    service.meuProntuario(req.user.sub),
  );
}
