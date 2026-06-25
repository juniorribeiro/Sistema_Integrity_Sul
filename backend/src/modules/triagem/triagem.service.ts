import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import type {
  TriagemPsicologiaInput,
  TriagemNutricaoInput,
  TriagemJuridicoInput,
  TriagemFinanceiroInput,
} from './triagem.schemas.js';

export function createTriagemService(app: FastifyInstance) {
  /** Resolve a triagem do funcionário logado (cria se ainda não existir). */
  async function triagemDoUsuario(usuarioId: string) {
    const func = await app.prisma.funcionario.findUnique({
      where: { usuarioId },
      include: { triagem: true },
    });
    if (!func) throw new AppError(403, 'Apenas funcionários possuem triagem');
    if (func.triagem) return func.triagem;
    return app.prisma.triagem.create({ data: { funcionarioId: func.id } });
  }

  async function status(usuarioId: string) {
    const t = await triagemDoUsuario(usuarioId);
    const [psi, nut, jur, fin] = await Promise.all([
      app.prisma.triagemPsicologia.findUnique({ where: { triagemId: t.id }, select: { id: true } }),
      app.prisma.triagemNutricao.findUnique({ where: { triagemId: t.id }, select: { id: true } }),
      app.prisma.triagemJuridico.findUnique({ where: { triagemId: t.id }, select: { id: true } }),
      app.prisma.triagemFinanceiro.findUnique({ where: { triagemId: t.id }, select: { id: true } }),
    ]);
    return {
      concluida: t.concluida,
      secoes: {
        psicologia: !!psi,
        nutricao: !!nut,
        juridico: !!jur,
        financeiro: !!fin,
      },
    };
  }

  async function salvarPsicologia(usuarioId: string, data: TriagemPsicologiaInput) {
    const t = await triagemDoUsuario(usuarioId);
    await app.prisma.triagemPsicologia.upsert({
      where: { triagemId: t.id },
      create: { triagemId: t.id, ...data },
      update: data,
    });
    return { ok: true, secao: 'psicologia' };
  }

  async function salvarNutricao(usuarioId: string, data: TriagemNutricaoInput) {
    const t = await triagemDoUsuario(usuarioId);
    await app.prisma.triagemNutricao.upsert({
      where: { triagemId: t.id },
      create: { triagemId: t.id, ...data },
      update: data,
    });
    return { ok: true, secao: 'nutricao' };
  }

  async function salvarJuridico(usuarioId: string, data: TriagemJuridicoInput) {
    const t = await triagemDoUsuario(usuarioId);
    await app.prisma.triagemJuridico.upsert({
      where: { triagemId: t.id },
      create: { triagemId: t.id, ...data },
      update: data,
    });
    return { ok: true, secao: 'juridico' };
  }

  async function salvarFinanceiro(usuarioId: string, data: TriagemFinanceiroInput) {
    const t = await triagemDoUsuario(usuarioId);
    await app.prisma.triagemFinanceiro.upsert({
      where: { triagemId: t.id },
      create: { triagemId: t.id, ...data },
      update: data,
    });
    return { ok: true, secao: 'financeiro' };
  }

  async function concluir(usuarioId: string) {
    const st = await status(usuarioId);
    const faltantes = Object.entries(st.secoes)
      .filter(([, ok]) => !ok)
      .map(([s]) => s);
    if (faltantes.length > 0) {
      throw new AppError(400, `Triagem incompleta. Faltam: ${faltantes.join(', ')}`);
    }
    const t = await triagemDoUsuario(usuarioId);
    await app.prisma.triagem.update({ where: { id: t.id }, data: { concluida: true } });
    return { ok: true, concluida: true };
  }

  return {
    status,
    salvarPsicologia,
    salvarNutricao,
    salvarJuridico,
    salvarFinanceiro,
    concluir,
  };
}
