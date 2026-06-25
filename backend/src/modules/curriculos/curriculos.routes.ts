import type { FastifyInstance } from 'fastify';
import { validate, AppError } from '../../shared/errors.js';
import { createCurriculosService } from './curriculos.service.js';
import {
  criarCandidatoSchema,
  atualizarCandidatoSchema,
  avaliacaoSchema,
  criarVagaSchema,
  atualizarVagaSchema,
  moverEtapaSchema,
} from './curriculos.schemas.js';

const RH = ['DIRETORIA', 'CONSULTOR_RH'] as const;

export default async function curriculosRoutes(app: FastifyInstance) {
  const service = createCurriculosService(app);
  const guard = { preHandler: app.authorize([...RH]) };

  // Candidatos
  app.get('/candidatos', guard, async (req) => {
    const q = req.query as { area?: string; status?: string; q?: string };
    return service.listarCandidatos(q);
  });
  app.post('/candidatos', guard, async (req, reply) => {
    const r = await service.criarCandidato(validate(criarCandidatoSchema, req.body));
    return reply.code(201).send(r);
  });
  app.get('/candidatos/:id', guard, async (req) => service.obterCandidato((req.params as { id: string }).id));
  app.patch('/candidatos/:id', guard, async (req) =>
    service.atualizarCandidato((req.params as { id: string }).id, validate(atualizarCandidatoSchema, req.body)),
  );
  app.post('/candidatos/:id/curriculo', guard, async (req, reply) => {
    const data = await req.file();
    if (!data) throw new AppError(400, 'Nenhum arquivo enviado');
    const r = await service.uploadCurriculo((req.params as { id: string }).id, {
      filename: data.filename,
      mimetype: data.mimetype,
      buffer: await data.toBuffer(),
    });
    return reply.code(201).send(r);
  });
  app.get('/candidatos/:id/curriculo', guard, async (req) => service.urlCurriculo((req.params as { id: string }).id));
  app.post('/candidatos/:id/avaliacoes', guard, async (req, reply) => {
    const r = await service.avaliar((req.params as { id: string }).id, req.user.sub, validate(avaliacaoSchema, req.body));
    return reply.code(201).send(r);
  });
  app.delete('/candidatos/:id', guard, async (req) => service.removerCandidato((req.params as { id: string }).id));
  app.delete('/avaliacoes/:id', guard, async (req) => service.removerAvaliacao((req.params as { id: string }).id));

  // Vagas / pipeline
  app.get('/vagas', guard, async () => service.listarVagas());
  app.post('/vagas', guard, async (req, reply) => {
    const r = await service.criarVaga(validate(criarVagaSchema, req.body));
    return reply.code(201).send(r);
  });
  app.get('/vagas/:id', guard, async (req) => service.obterVaga((req.params as { id: string }).id));
  app.patch('/vagas/:id', guard, async (req) =>
    service.atualizarVaga((req.params as { id: string }).id, validate(atualizarVagaSchema, req.body)),
  );
  app.post('/vagas/:id/candidatos', guard, async (req, reply) => {
    const { candidatoId } = req.body as { candidatoId: string };
    if (!candidatoId) throw new AppError(400, 'candidatoId é obrigatório');
    const r = await service.adicionarCandidatoVaga((req.params as { id: string }).id, candidatoId);
    return reply.code(201).send(r);
  });
  app.patch('/vaga-candidatos/:id', guard, async (req) =>
    service.moverEtapa((req.params as { id: string }).id, validate(moverEtapaSchema, req.body)),
  );
  app.delete('/vaga-candidatos/:id', guard, async (req) => service.removerDoPipeline((req.params as { id: string }).id));
  app.delete('/vagas/:id', guard, async (req) => service.removerVaga((req.params as { id: string }).id));
}
