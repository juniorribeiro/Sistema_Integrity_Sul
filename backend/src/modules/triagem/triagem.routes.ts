import type { FastifyInstance } from 'fastify';
import { validate } from '../../shared/errors.js';
import { createTriagemService } from './triagem.service.js';
import {
  triagemPsicologiaSchema,
  triagemNutricaoSchema,
  triagemJuridicoSchema,
  triagemFinanceiroSchema,
} from './triagem.schemas.js';

export default async function triagemRoutes(app: FastifyInstance) {
  const service = createTriagemService(app);
  const soFuncionario = { preHandler: app.authorize(['FUNCIONARIO']) };

  app.get('/me', soFuncionario, async (req) => service.status(req.user.sub));

  app.post('/psicologia', soFuncionario, async (req) =>
    service.salvarPsicologia(req.user.sub, validate(triagemPsicologiaSchema, req.body)),
  );

  app.post('/nutricao', soFuncionario, async (req) =>
    service.salvarNutricao(req.user.sub, validate(triagemNutricaoSchema, req.body)),
  );

  app.post('/juridico', soFuncionario, async (req) =>
    service.salvarJuridico(req.user.sub, validate(triagemJuridicoSchema, req.body)),
  );

  app.post('/financeiro', soFuncionario, async (req) =>
    service.salvarFinanceiro(req.user.sub, validate(triagemFinanceiroSchema, req.body)),
  );

  app.post('/concluir', soFuncionario, async (req) => service.concluir(req.user.sub));
}
