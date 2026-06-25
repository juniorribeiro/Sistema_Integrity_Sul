import type { FastifyInstance } from 'fastify';
import { createMetricasService } from './metricas.service.js';

export default async function metricasRoutes(app: FastifyInstance) {
  const service = createMetricasService(app);

  app.get('/cliente', { preHandler: app.authorize(['RH_CLIENTE']) }, async (req) =>
    service.metricasCliente(req.user.sub),
  );

  app.get('/integrity', { preHandler: app.authorize(['DIRETORIA', 'CONSULTOR_RH']) }, async () =>
    service.metricasIntegrity(),
  );
}
