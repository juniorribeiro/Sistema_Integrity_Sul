import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { BUCKET_POR_SETOR, colaboradorIdDoUsuario, funcionarioIdDoUsuario } from '../../shared/setor.js';
import type {
  CriarProntuarioInput,
  AtualizarProntuarioInput,
  CriarSessaoInput,
  CriarMetaInput,
  AtualizarMetaInput,
} from './psicologia.schemas.js';

const BUCKET = BUCKET_POR_SETOR.PSICOLOGIA;

export function createPsicologiaService(app: FastifyInstance) {
  /**
   * Carrega o prontuário garantindo o sigilo por setor: somente o profissional
   * responsável (ou a DIRETORIA) pode acessá-lo.
   */
  async function carregarProntuarioAutorizado(prontuarioId: string, usuarioId: string, role: string) {
    const pront = await app.prisma.prontuarioPsicologia.findUnique({ where: { id: prontuarioId } });
    if (!pront) throw new AppError(404, 'Prontuário não encontrado');
    if (role !== 'DIRETORIA') {
      const colabId = await colaboradorIdDoUsuario(app, usuarioId);
      if (pront.profissionalId !== colabId) {
        throw new AppError(403, 'Você não é o profissional responsável por este prontuário');
      }
    }
    return pront;
  }

  /** Lista funcionários atendíveis pelo setor de psicologia (com status do prontuário). */
  async function listarFuncionarios() {
    const funcs = await app.prisma.funcionario.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        cargo: true,
        empresa: { select: { razaoSocial: true } },
        prontuarioPsicologia: { select: { id: true, profissionalId: true } },
        triagem: { select: { psicologia: { select: { id: true } } } },
      },
    });
    return funcs.map((f) => ({
      id: f.id,
      nome: f.nome,
      cargo: f.cargo,
      empresa: f.empresa.razaoSocial,
      temTriagem: !!f.triagem?.psicologia,
      prontuarioId: f.prontuarioPsicologia?.id ?? null,
    }));
  }

  async function criarProntuario(usuarioId: string, input: CriarProntuarioInput) {
    const profissionalId = await colaboradorIdDoUsuario(app, usuarioId);
    const existente = await app.prisma.prontuarioPsicologia.findUnique({
      where: { funcionarioId: input.funcionarioId },
    });
    if (existente) throw new AppError(409, 'Funcionário já possui prontuário de psicologia');

    return app.prisma.prontuarioPsicologia.create({
      data: {
        funcionarioId: input.funcionarioId,
        profissionalId,
        planoTerapeutico: input.planoTerapeutico,
      },
    });
  }

  /** Detalhe do prontuário incluindo a triagem de psicologia (sigilo do setor). */
  async function obterProntuario(prontuarioId: string, usuarioId: string, role: string) {
    await carregarProntuarioAutorizado(prontuarioId, usuarioId, role);
    const pront = await app.prisma.prontuarioPsicologia.findUnique({
      where: { id: prontuarioId },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            telefone: true,
            empresa: { select: { razaoSocial: true } },
            triagem: { select: { psicologia: true } }, // somente a triagem de PSICOLOGIA
          },
        },
        profissional: { select: { nome: true, registro: true } },
        sessoes: { orderBy: { data: 'desc' } },
        metas: { orderBy: { criadoEm: 'desc' } },
        documentos: { orderBy: { criadoEm: 'desc' } },
      },
    });
    return pront;
  }

  async function atualizarProntuario(prontuarioId: string, usuarioId: string, role: string, input: AtualizarProntuarioInput) {
    await carregarProntuarioAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.prontuarioPsicologia.update({ where: { id: prontuarioId }, data: input });
  }

  async function adicionarSessao(prontuarioId: string, usuarioId: string, role: string, input: CriarSessaoInput) {
    await carregarProntuarioAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.sessaoPsicologia.create({ data: { prontuarioId, ...input } });
  }

  async function adicionarMeta(prontuarioId: string, usuarioId: string, role: string, input: CriarMetaInput) {
    await carregarProntuarioAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.metaPsicologia.create({ data: { prontuarioId, ...input } });
  }

  async function atualizarMeta(metaId: string, usuarioId: string, role: string, input: AtualizarMetaInput) {
    const meta = await app.prisma.metaPsicologia.findUnique({ where: { id: metaId } });
    if (!meta) throw new AppError(404, 'Meta não encontrada');
    await carregarProntuarioAutorizado(meta.prontuarioId, usuarioId, role);
    return app.prisma.metaPsicologia.update({ where: { id: metaId }, data: input });
  }

  // ----- Documentos (Garage) -----

  async function adicionarDocumento(
    prontuarioId: string,
    usuarioId: string,
    role: string,
    file: { filename: string; mimetype: string; buffer: Buffer },
  ) {
    await carregarProntuarioAutorizado(prontuarioId, usuarioId, role);
    const objectKey = `${prontuarioId}/${randomUUID()}-${file.filename}`;
    await app.garage.putObject(BUCKET, objectKey, file.buffer, file.mimetype);
    return app.prisma.documentoStorage.create({
      data: {
        bucket: BUCKET,
        objectKey,
        nomeArq: file.filename,
        mimeType: file.mimetype,
        tamanho: file.buffer.length,
        setor: 'PSICOLOGIA',
        prontuarioPsicologiaId: prontuarioId,
      },
    });
  }

  async function urlDownloadDocumento(docId: string, usuarioId: string, role: string) {
    const doc = await app.prisma.documentoStorage.findUnique({ where: { id: docId } });
    if (!doc || doc.setor !== 'PSICOLOGIA' || !doc.prontuarioPsicologiaId) {
      throw new AppError(404, 'Documento não encontrado');
    }
    // Autoriza por prontuário (profissional) OU pelo próprio funcionário dono
    if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      const pront = await app.prisma.prontuarioPsicologia.findUnique({ where: { id: doc.prontuarioPsicologiaId } });
      if (pront?.funcionarioId !== funcId) throw new AppError(403, 'Acesso negado');
    } else {
      await carregarProntuarioAutorizado(doc.prontuarioPsicologiaId, usuarioId, role);
    }
    const url = await app.garage.presignDownload(doc.bucket, doc.objectKey);
    return { url, nomeArq: doc.nomeArq };
  }

  // ----- Visão do funcionário (seu próprio prontuário) -----

  async function meuProntuario(usuarioId: string) {
    const funcId = await funcionarioIdDoUsuario(app, usuarioId);
    const pront = await app.prisma.prontuarioPsicologia.findUnique({
      where: { funcionarioId: funcId },
      include: {
        profissional: { select: { nome: true, registro: true } },
        sessoes: { orderBy: { data: 'desc' }, select: { id: true, data: true, proximaData: true } },
        metas: { orderBy: { criadoEm: 'desc' } },
        documentos: { orderBy: { criadoEm: 'desc' }, select: { id: true, nomeArq: true, criadoEm: true } },
      },
    });
    // Não expõe a evolução clínica (sensível) ao funcionário — apenas datas/plano/metas/docs
    return pront;
  }

  async function removerSessao(sessaoId: string, usuarioId: string, role: string) {
    const s = await app.prisma.sessaoPsicologia.findUnique({ where: { id: sessaoId } });
    if (!s) throw new AppError(404, 'Sessão não encontrada');
    await carregarProntuarioAutorizado(s.prontuarioId, usuarioId, role);
    await app.prisma.sessaoPsicologia.delete({ where: { id: sessaoId } });
    return { ok: true };
  }

  async function removerMeta(metaId: string, usuarioId: string, role: string) {
    const m = await app.prisma.metaPsicologia.findUnique({ where: { id: metaId } });
    if (!m) throw new AppError(404, 'Meta não encontrada');
    await carregarProntuarioAutorizado(m.prontuarioId, usuarioId, role);
    await app.prisma.metaPsicologia.delete({ where: { id: metaId } });
    return { ok: true };
  }

  async function removerDocumento(docId: string, usuarioId: string, role: string) {
    const doc = await app.prisma.documentoStorage.findUnique({ where: { id: docId } });
    if (!doc || doc.setor !== 'PSICOLOGIA' || !doc.prontuarioPsicologiaId) throw new AppError(404, 'Documento não encontrado');
    await carregarProntuarioAutorizado(doc.prontuarioPsicologiaId, usuarioId, role);
    await app.garage.deleteObject(doc.bucket, doc.objectKey).catch(() => {});
    await app.prisma.documentoStorage.delete({ where: { id: docId } });
    return { ok: true };
  }

  async function removerProntuario(prontuarioId: string, usuarioId: string, role: string) {
    await carregarProntuarioAutorizado(prontuarioId, usuarioId, role);
    const docs = await app.prisma.documentoStorage.findMany({ where: { prontuarioPsicologiaId: prontuarioId }, select: { bucket: true, objectKey: true } });
    await Promise.allSettled(docs.map((d) => app.garage.deleteObject(d.bucket, d.objectKey)));
    await app.prisma.prontuarioPsicologia.delete({ where: { id: prontuarioId } });
    return { ok: true };
  }

  return {
    listarFuncionarios,
    criarProntuario,
    obterProntuario,
    atualizarProntuario,
    adicionarSessao,
    adicionarMeta,
    atualizarMeta,
    adicionarDocumento,
    urlDownloadDocumento,
    meuProntuario,
    removerSessao,
    removerMeta,
    removerDocumento,
    removerProntuario,
  };
}
