import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { colaboradorIdDoUsuario, funcionarioIdDoUsuario, subirParaGarage, type ArquivoUpload } from '../../shared/setor.js';
import type { CriarCasoInput, AtualizarCasoInput, CriarPrazoInput, AtualizarPrazoInput } from './juridico.schemas.js';

export function createJuridicoService(app: FastifyInstance) {
  async function carregarCasoAutorizado(casoId: string, usuarioId: string, role: string) {
    const caso = await app.prisma.prontuarioJuridico.findUnique({ where: { id: casoId } });
    if (!caso) throw new AppError(404, 'Caso não encontrado');
    if (role !== 'DIRETORIA') {
      const colabId = await colaboradorIdDoUsuario(app, usuarioId);
      if (caso.profissionalId !== colabId) throw new AppError(403, 'Você não é o profissional responsável');
    }
    return caso;
  }

  /** Lista funcionários com a quantidade de casos jurídicos. */
  async function listarFuncionarios() {
    const funcs = await app.prisma.funcionario.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        cargo: true,
        empresa: { select: { razaoSocial: true } },
        triagem: { select: { juridico: { select: { temDemanda: true } } } },
        _count: { select: { prontuarioJuridico: true } },
      },
    });
    return funcs.map((f) => ({
      id: f.id,
      nome: f.nome,
      cargo: f.cargo,
      empresa: f.empresa.razaoSocial,
      temDemanda: f.triagem?.juridico?.temDemanda ?? false,
      casos: f._count.prontuarioJuridico,
    }));
  }

  /** Casos de um funcionário (+ a triagem jurídica, sigilo do setor). */
  async function listarCasosDoFuncionario(funcionarioId: string) {
    const [funcionario, casos] = await Promise.all([
      app.prisma.funcionario.findUnique({
        where: { id: funcionarioId },
        select: { nome: true, cargo: true, triagem: { select: { juridico: true } } },
      }),
      app.prisma.prontuarioJuridico.findMany({
        where: { funcionarioId },
        orderBy: { criadoEm: 'desc' },
        select: { id: true, titulo: true, areaDir: true, status: true, criadoEm: true },
      }),
    ]);
    if (!funcionario) throw new AppError(404, 'Funcionário não encontrado');
    return { funcionario, casos };
  }

  async function criarCaso(usuarioId: string, input: CriarCasoInput) {
    const profissionalId = await colaboradorIdDoUsuario(app, usuarioId);
    return app.prisma.prontuarioJuridico.create({
      data: {
        funcionarioId: input.funcionarioId,
        profissionalId,
        areaDir: input.areaDir,
        titulo: input.titulo,
        descricao: input.descricao,
      },
    });
  }

  async function obterCaso(casoId: string, usuarioId: string, role: string) {
    await carregarCasoAutorizado(casoId, usuarioId, role);
    return app.prisma.prontuarioJuridico.findUnique({
      where: { id: casoId },
      include: {
        funcionario: {
          select: {
            nome: true,
            cargo: true,
            empresa: { select: { razaoSocial: true } },
            triagem: { select: { juridico: true } },
          },
        },
        profissional: { select: { nome: true, registro: true } },
        prazos: { orderBy: { data: 'asc' } },
        documentos: { orderBy: { criadoEm: 'desc' } },
      },
    });
  }

  async function atualizarCaso(casoId: string, usuarioId: string, role: string, input: AtualizarCasoInput) {
    await carregarCasoAutorizado(casoId, usuarioId, role);
    return app.prisma.prontuarioJuridico.update({ where: { id: casoId }, data: input });
  }

  async function adicionarPrazo(casoId: string, usuarioId: string, role: string, input: CriarPrazoInput) {
    await carregarCasoAutorizado(casoId, usuarioId, role);
    return app.prisma.prazoJuridico.create({ data: { prontuarioId: casoId, ...input } });
  }

  async function atualizarPrazo(prazoId: string, usuarioId: string, role: string, input: AtualizarPrazoInput) {
    const prazo = await app.prisma.prazoJuridico.findUnique({ where: { id: prazoId } });
    if (!prazo) throw new AppError(404, 'Prazo não encontrado');
    await carregarCasoAutorizado(prazo.prontuarioId, usuarioId, role);
    return app.prisma.prazoJuridico.update({ where: { id: prazoId }, data: input });
  }

  async function adicionarDocumento(casoId: string, usuarioId: string, role: string, file: ArquivoUpload) {
    await carregarCasoAutorizado(casoId, usuarioId, role);
    const meta = await subirParaGarage(app, 'JURIDICO', casoId, file);
    return app.prisma.documentoStorage.create({ data: { ...meta, prontuarioJuridicoId: casoId } });
  }

  async function urlDownloadDocumento(docId: string, usuarioId: string, role: string) {
    const doc = await app.prisma.documentoStorage.findUnique({ where: { id: docId } });
    if (!doc || doc.setor !== 'JURIDICO' || !doc.prontuarioJuridicoId) throw new AppError(404, 'Documento não encontrado');
    if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      const caso = await app.prisma.prontuarioJuridico.findUnique({ where: { id: doc.prontuarioJuridicoId } });
      if (caso?.funcionarioId !== funcId) throw new AppError(403, 'Acesso negado');
    } else {
      await carregarCasoAutorizado(doc.prontuarioJuridicoId, usuarioId, role);
    }
    return { url: await app.garage.presignDownload(doc.bucket, doc.objectKey), nomeArq: doc.nomeArq };
  }

  async function meusCasos(usuarioId: string) {
    const funcId = await funcionarioIdDoUsuario(app, usuarioId);
    return app.prisma.prontuarioJuridico.findMany({
      where: { funcionarioId: funcId },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        areaDir: true,
        status: true,
        fase: true,
        numeroProcesso: true,
        profissional: { select: { nome: true, registro: true } },
        prazos: { orderBy: { data: 'asc' } },
        documentos: { orderBy: { criadoEm: 'desc' }, select: { id: true, nomeArq: true } },
      },
    });
  }

  async function removerPrazo(prazoId: string, usuarioId: string, role: string) {
    const p = await app.prisma.prazoJuridico.findUnique({ where: { id: prazoId } });
    if (!p) throw new AppError(404, 'Prazo não encontrado');
    await carregarCasoAutorizado(p.prontuarioId, usuarioId, role);
    await app.prisma.prazoJuridico.delete({ where: { id: prazoId } });
    return { ok: true };
  }
  async function removerDocumento(docId: string, usuarioId: string, role: string) {
    const doc = await app.prisma.documentoStorage.findUnique({ where: { id: docId } });
    if (!doc || doc.setor !== 'JURIDICO' || !doc.prontuarioJuridicoId) throw new AppError(404, 'Documento não encontrado');
    await carregarCasoAutorizado(doc.prontuarioJuridicoId, usuarioId, role);
    await app.garage.deleteObject(doc.bucket, doc.objectKey).catch(() => {});
    await app.prisma.documentoStorage.delete({ where: { id: docId } });
    return { ok: true };
  }
  async function removerCaso(casoId: string, usuarioId: string, role: string) {
    await carregarCasoAutorizado(casoId, usuarioId, role);
    const docs = await app.prisma.documentoStorage.findMany({ where: { prontuarioJuridicoId: casoId }, select: { bucket: true, objectKey: true } });
    await Promise.allSettled(docs.map((d) => app.garage.deleteObject(d.bucket, d.objectKey)));
    await app.prisma.prontuarioJuridico.delete({ where: { id: casoId } });
    return { ok: true };
  }

  return {
    listarFuncionarios,
    listarCasosDoFuncionario,
    criarCaso,
    obterCaso,
    atualizarCaso,
    adicionarPrazo,
    atualizarPrazo,
    adicionarDocumento,
    urlDownloadDocumento,
    meusCasos,
    removerPrazo,
    removerDocumento,
    removerCaso,
  };
}
