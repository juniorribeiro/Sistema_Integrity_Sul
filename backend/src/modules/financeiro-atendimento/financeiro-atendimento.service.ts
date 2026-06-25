import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { colaboradorIdDoUsuario, funcionarioIdDoUsuario, subirParaGarage, type ArquivoUpload } from '../../shared/setor.js';
import type { CriarProntuarioInput, AtualizarProntuarioInput, CriarConsultaInput } from './financeiro-atendimento.schemas.js';

export function createFinanceiroAtendimentoService(app: FastifyInstance) {
  async function carregarAutorizado(prontuarioId: string, usuarioId: string, role: string) {
    const pront = await app.prisma.prontuarioFinanceiro.findUnique({ where: { id: prontuarioId } });
    if (!pront) throw new AppError(404, 'Prontuário não encontrado');
    if (role !== 'DIRETORIA') {
      const colabId = await colaboradorIdDoUsuario(app, usuarioId);
      if (pront.profissionalId !== colabId) throw new AppError(403, 'Você não é o profissional responsável');
    }
    return pront;
  }

  async function listarFuncionarios() {
    const funcs = await app.prisma.funcionario.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        cargo: true,
        empresa: { select: { razaoSocial: true } },
        prontuarioFinanceiro: { select: { id: true } },
        triagem: { select: { financeiro: { select: { id: true } } } },
      },
    });
    return funcs.map((f) => ({
      id: f.id,
      nome: f.nome,
      cargo: f.cargo,
      empresa: f.empresa.razaoSocial,
      temTriagem: !!f.triagem?.financeiro,
      prontuarioId: f.prontuarioFinanceiro?.id ?? null,
    }));
  }

  async function criarProntuario(usuarioId: string, input: CriarProntuarioInput) {
    const profissionalId = await colaboradorIdDoUsuario(app, usuarioId);
    const existente = await app.prisma.prontuarioFinanceiro.findUnique({ where: { funcionarioId: input.funcionarioId } });
    if (existente) throw new AppError(409, 'Funcionário já possui prontuário financeiro');
    return app.prisma.prontuarioFinanceiro.create({
      data: { funcionarioId: input.funcionarioId, profissionalId, planoAcao: input.planoAcao },
    });
  }

  async function obterProntuario(prontuarioId: string, usuarioId: string, role: string) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.prontuarioFinanceiro.findUnique({
      where: { id: prontuarioId },
      include: {
        funcionario: {
          select: {
            nome: true,
            cargo: true,
            empresa: { select: { razaoSocial: true } },
            triagem: { select: { financeiro: true } },
          },
        },
        profissional: { select: { nome: true, registro: true } },
        consultas: { orderBy: { data: 'desc' } },
        documentos: { orderBy: { criadoEm: 'desc' } },
      },
    });
  }

  async function atualizarProntuario(prontuarioId: string, usuarioId: string, role: string, input: AtualizarProntuarioInput) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.prontuarioFinanceiro.update({ where: { id: prontuarioId }, data: input });
  }

  async function adicionarConsulta(prontuarioId: string, usuarioId: string, role: string, input: CriarConsultaInput) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.consultaFinanceira.create({ data: { prontuarioId, ...input } });
  }

  async function adicionarDocumento(prontuarioId: string, usuarioId: string, role: string, file: ArquivoUpload) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    const meta = await subirParaGarage(app, 'FINANCEIRO', prontuarioId, file);
    return app.prisma.documentoStorage.create({ data: { ...meta, prontuarioFinanceiroId: prontuarioId } });
  }

  async function urlDownloadDocumento(docId: string, usuarioId: string, role: string) {
    const doc = await app.prisma.documentoStorage.findUnique({ where: { id: docId } });
    if (!doc || doc.setor !== 'FINANCEIRO' || !doc.prontuarioFinanceiroId) throw new AppError(404, 'Documento não encontrado');
    if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      const pront = await app.prisma.prontuarioFinanceiro.findUnique({ where: { id: doc.prontuarioFinanceiroId } });
      if (pront?.funcionarioId !== funcId) throw new AppError(403, 'Acesso negado');
    } else {
      await carregarAutorizado(doc.prontuarioFinanceiroId, usuarioId, role);
    }
    return { url: await app.garage.presignDownload(doc.bucket, doc.objectKey), nomeArq: doc.nomeArq };
  }

  async function meuProntuario(usuarioId: string) {
    const funcId = await funcionarioIdDoUsuario(app, usuarioId);
    return app.prisma.prontuarioFinanceiro.findUnique({
      where: { funcionarioId: funcId },
      include: {
        profissional: { select: { nome: true, registro: true } },
        consultas: { orderBy: { data: 'desc' }, select: { id: true, data: true, proximaData: true } },
        documentos: { orderBy: { criadoEm: 'desc' }, select: { id: true, nomeArq: true, criadoEm: true } },
      },
    });
  }

  async function removerConsulta(consultaId: string, usuarioId: string, role: string) {
    const c = await app.prisma.consultaFinanceira.findUnique({ where: { id: consultaId } });
    if (!c) throw new AppError(404, 'Consulta não encontrada');
    await carregarAutorizado(c.prontuarioId, usuarioId, role);
    await app.prisma.consultaFinanceira.delete({ where: { id: consultaId } });
    return { ok: true };
  }
  async function removerDocumento(docId: string, usuarioId: string, role: string) {
    const doc = await app.prisma.documentoStorage.findUnique({ where: { id: docId } });
    if (!doc || doc.setor !== 'FINANCEIRO' || !doc.prontuarioFinanceiroId) throw new AppError(404, 'Documento não encontrado');
    await carregarAutorizado(doc.prontuarioFinanceiroId, usuarioId, role);
    await app.garage.deleteObject(doc.bucket, doc.objectKey).catch(() => {});
    await app.prisma.documentoStorage.delete({ where: { id: docId } });
    return { ok: true };
  }
  async function removerProntuario(prontuarioId: string, usuarioId: string, role: string) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    const docs = await app.prisma.documentoStorage.findMany({ where: { prontuarioFinanceiroId: prontuarioId }, select: { bucket: true, objectKey: true } });
    await Promise.allSettled(docs.map((d) => app.garage.deleteObject(d.bucket, d.objectKey)));
    await app.prisma.prontuarioFinanceiro.delete({ where: { id: prontuarioId } });
    return { ok: true };
  }

  return {
    listarFuncionarios,
    criarProntuario,
    obterProntuario,
    atualizarProntuario,
    adicionarConsulta,
    adicionarDocumento,
    urlDownloadDocumento,
    meuProntuario,
    removerConsulta,
    removerDocumento,
    removerProntuario,
  };
}
