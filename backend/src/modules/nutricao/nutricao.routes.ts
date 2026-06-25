import type { FastifyInstance } from 'fastify';
import { validate, AppError } from '../../shared/errors.js';
import { createNutricaoService } from './nutricao.service.js';
import {
  criarProntuarioSchema,
  atualizarProntuarioSchema,
  criarConsultaSchema,
  criarEvolucaoSchema,
} from './nutricao.schemas.js';

const PROF = ['NUTRICIONISTA', 'DIRETORIA'] as const;

export default async function nutricaoRoutes(app: FastifyInstance) {
  const service = createNutricaoService(app);

  app.get('/funcionarios', { preHandler: app.authorize([...PROF]) }, async () => service.listarFuncionarios());

  app.post('/prontuarios', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const r = await service.criarProntuario(req.user.sub, validate(criarProntuarioSchema, req.body));
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

  app.post('/prontuarios/:id/consultas', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await service.adicionarConsulta(id, req.user.sub, req.user.role, validate(criarConsultaSchema, req.body));
    return reply.code(201).send(r);
  });

  app.post('/prontuarios/:id/evolucoes', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await service.adicionarEvolucao(id, req.user.sub, req.user.role, validate(criarEvolucaoSchema, req.body));
    return reply.code(201).send(r);
  });

  app.post('/prontuarios/:id/documentos', { preHandler: app.authorize([...PROF]) }, async (req, reply) => {
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

  app.delete('/consultas/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerConsulta((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/evolucoes/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerEvolucao((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/documentos/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerDocumento((req.params as { id: string }).id, req.user.sub, req.user.role),
  );
  app.delete('/prontuarios/:id', { preHandler: app.authorize([...PROF]) }, async (req) =>
    service.removerProntuario((req.params as { id: string }).id, req.user.sub, req.user.role),
  );

  app.get('/meu-prontuario', { preHandler: app.authorize(['FUNCIONARIO']) }, async (req) =>
    service.meuProntuario(req.user.sub),
  );
}
