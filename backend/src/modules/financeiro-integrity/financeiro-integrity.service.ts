import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import type { CriarLancamentoInput, AtualizarLancamentoInput } from './financeiro-integrity.schemas.js';

export function createFinanceiroIntegrityService(app: FastifyInstance) {
  async function listar(filtros: { tipo?: string; status?: string; de?: string; ate?: string }) {
    return app.prisma.lancamentoFinanceiro.findMany({
      where: {
        tipo: (filtros.tipo as never) || undefined,
        status: (filtros.status as never) || undefined,
        data:
          filtros.de || filtros.ate
            ? { gte: filtros.de ? new Date(filtros.de) : undefined, lte: filtros.ate ? new Date(filtros.ate) : undefined }
            : undefined,
      },
      orderBy: { data: 'desc' },
      include: { empresa: { select: { razaoSocial: true } } },
    });
  }

  async function criar(input: CriarLancamentoInput) {
    return app.prisma.lancamentoFinanceiro.create({ data: input });
  }

  async function atualizar(id: string, input: AtualizarLancamentoInput) {
    const l = await app.prisma.lancamentoFinanceiro.findUnique({ where: { id } });
    if (!l) throw new AppError(404, 'Lançamento não encontrado');
    return app.prisma.lancamentoFinanceiro.update({ where: { id }, data: input });
  }

  async function remover(id: string) {
    const l = await app.prisma.lancamentoFinanceiro.findUnique({ where: { id } });
    if (!l) throw new AppError(404, 'Lançamento não encontrado');
    await app.prisma.lancamentoFinanceiro.delete({ where: { id } });
    return { ok: true };
  }

  /** DRE simplificado + fluxo de caixa mensal do ano. Ignora lançamentos CANCELADOS. */
  async function resumo(ano: number) {
    const inicio = new Date(Date.UTC(ano, 0, 1));
    const fim = new Date(Date.UTC(ano + 1, 0, 1));
    const lancs = await app.prisma.lancamentoFinanceiro.findMany({
      where: { data: { gte: inicio, lt: fim }, status: { not: 'CANCELADO' } },
      select: { tipo: true, categoria: true, valor: true, data: true, status: true },
    });

    let receitas = 0;
    let despesas = 0;
    let aReceber = 0;
    let aPagar = 0;
    const porCategoria: Record<string, { receita: number; despesa: number }> = {};
    const fluxoMensal = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, receita: 0, despesa: 0 }));

    for (const l of lancs) {
      const mes = l.data.getUTCMonth();
      porCategoria[l.categoria] ??= { receita: 0, despesa: 0 };
      if (l.tipo === 'RECEITA') {
        receitas += l.valor;
        porCategoria[l.categoria].receita += l.valor;
        fluxoMensal[mes].receita += l.valor;
        if (l.status === 'PENDENTE') aReceber += l.valor;
      } else {
        despesas += l.valor;
        porCategoria[l.categoria].despesa += l.valor;
        fluxoMensal[mes].despesa += l.valor;
        if (l.status === 'PENDENTE') aPagar += l.valor;
      }
    }

    return {
      ano,
      receitas,
      despesas,
      saldo: receitas - despesas,
      aReceber,
      aPagar,
      porCategoria: Object.entries(porCategoria).map(([categoria, v]) => ({ categoria, ...v })),
      fluxoMensal,
    };
  }

  return { listar, criar, atualizar, remover, resumo };
}
