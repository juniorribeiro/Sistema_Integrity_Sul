import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';

export function createMetricasService(app: FastifyInstance) {
  /** Métricas da empresa do RH logado. */
  async function metricasCliente(usuarioId: string) {
    const rh = await app.prisma.rHCliente.findUnique({ where: { usuarioId }, select: { empresaId: true } });
    if (!rh) throw new AppError(403, 'Usuário RH sem empresa vinculada');
    const empresaId = rh.empresaId;
    const doFunc = { funcionario: { empresaId } };

    const [totalFuncionarios, triagensConcluidas, psicologia, nutricao, juridico, financeiro, agend] = await Promise.all([
      app.prisma.funcionario.count({ where: { empresaId } }),
      app.prisma.triagem.count({ where: { funcionario: { empresaId }, concluida: true } }),
      app.prisma.prontuarioPsicologia.count({ where: doFunc }),
      app.prisma.prontuarioNutricao.count({ where: doFunc }),
      app.prisma.prontuarioJuridico.count({ where: doFunc }),
      app.prisma.prontuarioFinanceiro.count({ where: doFunc }),
      app.prisma.agendamento.groupBy({ by: ['status'], where: doFunc, _count: true }),
    ]);

    return {
      totalFuncionarios,
      triagensConcluidas,
      taxaAdesaoTriagem: totalFuncionarios ? Math.round((triagensConcluidas / totalFuncionarios) * 100) : 0,
      atendimentosPorSetor: { psicologia, nutricao, juridico, financeiro },
      agendamentosPorStatus: Object.fromEntries(agend.map((a) => [a.status, a._count])),
    };
  }

  /** Métricas globais da Integrity Sul. */
  async function metricasIntegrity() {
    const ano = new Date().getFullYear();
    const inicio = new Date(Date.UTC(ano, 0, 1));
    const fim = new Date(Date.UTC(ano + 1, 0, 1));

    const [empresas, empresasAtivas, funcionarios, candidatos, psicologia, nutricao, juridico, financeiro, lancs] =
      await Promise.all([
        app.prisma.empresa.count(),
        app.prisma.empresa.count({ where: { ativa: true } }),
        app.prisma.funcionario.count(),
        app.prisma.candidato.groupBy({ by: ['status'], _count: true }),
        app.prisma.prontuarioPsicologia.count(),
        app.prisma.prontuarioNutricao.count(),
        app.prisma.prontuarioJuridico.count(),
        app.prisma.prontuarioFinanceiro.count(),
        app.prisma.lancamentoFinanceiro.findMany({
          where: { data: { gte: inicio, lt: fim }, status: { not: 'CANCELADO' } },
          select: { tipo: true, valor: true },
        }),
      ]);

    const receitas = lancs.filter((l) => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0);
    const despesas = lancs.filter((l) => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0);

    return {
      empresas,
      empresasAtivas,
      funcionarios,
      candidatosPorStatus: Object.fromEntries(candidatos.map((c) => [c.status, c._count])),
      atendimentosPorSetor: { psicologia, nutricao, juridico, financeiro },
      financeiro: { ano, receitas, despesas, saldo: receitas - despesas },
    };
  }

  return { metricasCliente, metricasIntegrity };
}
