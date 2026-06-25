import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { colaboradorIdDoUsuario, funcionarioIdDoUsuario, subirParaGarage, type ArquivoUpload } from '../../shared/setor.js';
import type {
  CriarProntuarioInput,
  AtualizarProntuarioInput,
  CriarConsultaInput,
  CriarEvolucaoInput,
} from './nutricao.schemas.js';

export function createNutricaoService(app: FastifyInstance) {
  async function carregarAutorizado(prontuarioId: string, usuarioId: string, role: string) {
    const pront = await app.prisma.prontuarioNutricao.findUnique({ where: { id: prontuarioId } });
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
        prontuarioNutricao: { select: { id: true } },
        triagem: { select: { nutricao: { select: { id: true } } } },
      },
    });
    return funcs.map((f) => ({
      id: f.id,
      nome: f.nome,
      cargo: f.cargo,
      empresa: f.empresa.razaoSocial,
      temTriagem: !!f.triagem?.nutricao,
      prontuarioId: f.prontuarioNutricao?.id ?? null,
    }));
  }

  async function criarProntuario(usuarioId: string, input: CriarProntuarioInput) {
    const profissionalId = await colaboradorIdDoUsuario(app, usuarioId);
    const existente = await app.prisma.prontuarioNutricao.findUnique({ where: { funcionarioId: input.funcionarioId } });
    if (existente) throw new AppError(409, 'Funcionário já possui prontuário de nutrição');
    return app.prisma.prontuarioNutricao.create({
      data: { funcionarioId: input.funcionarioId, profissionalId, planoAlimentar: input.planoAlimentar },
    });
  }

  async function obterProntuario(prontuarioId: string, usuarioId: string, role: string) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.prontuarioNutricao.findUnique({
      where: { id: prontuarioId },
      include: {
        funcionario: {
          select: {
            nome: true,
            cargo: true,
            empresa: { select: { razaoSocial: true } },
            triagem: { select: { nutricao: true } },
          },
        },
        profissional: { select: { nome: true, registro: true } },
        consultas: { orderBy: { data: 'desc' } },
        evolucoes: { orderBy: { data: 'desc' } },
        documentos: { orderBy: { criadoEm: 'desc' } },
      },
    });
  }

  async function atualizarProntuario(prontuarioId: string, usuarioId: string, role: string, input: AtualizarProntuarioInput) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.prontuarioNutricao.update({ where: { id: prontuarioId }, data: input });
  }

  async function adicionarConsulta(prontuarioId: string, usuarioId: string, role: string, input: CriarConsultaInput) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.consultaNutricao.create({ data: { prontuarioId, ...input } });
  }

  async function adicionarEvolucao(prontuarioId: string, usuarioId: string, role: string, input: CriarEvolucaoInput) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    return app.prisma.evolucaoNutricao.create({ data: { prontuarioId, ...input } });
  }

  async function adicionarDocumento(prontuarioId: string, usuarioId: string, role: string, file: ArquivoUpload) {
    await carregarAutorizado(prontuarioId, usuarioId, role);
    const meta = await subirParaGarage(app, 'NUTRICAO', prontuarioId, file);
    return app.prisma.documentoStorage.create({ data: { ...meta, prontuarioNutricaoId: prontuarioId } });
  }

  async function urlDownloadDocumento(docId: string, usuarioId: string, role: string) {
    const doc = await app.prisma.documentoStorage.findUnique({ where: { id: docId } });
    if (!doc || doc.setor !== 'NUTRICAO' || !doc.prontuarioNutricaoId) throw new AppError(404, 'Documento não encontrado');
    if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      const pront = await app.prisma.prontuarioNutricao.findUnique({ where: { id: doc.prontuarioNutricaoId } });
      if (pront?.funcionarioId !== funcId) throw new AppError(403, 'Acesso negado');
    } else {
      await carregarAutorizado(doc.prontuarioNutricaoId, usuarioId, role);
    }
    return { url: await app.garage.presignDownload(doc.bucket, doc.objectKey), nomeArq: doc.nomeArq };
  }

  async function meuProntuario(usuarioId: string) {
    const funcId = await funcionarioIdDoUsuario(app, usuarioId);
    return app.prisma.prontuarioNutricao.findUnique({
      where: { funcionarioId: funcId },
      include: {
        profissional: { select: { nome: true, registro: true } },
        consultas: { orderBy: { data: 'desc' }, select: { id: true, data: true, proximaData: true } },
        evolucoes: { orderBy: { data: 'desc' } },
        documentos: { orderBy: { criadoEm: 'desc' }, select: { id: true, nomeArq: true, criadoEm: true } },
      },
    });
  }

  return {
    listarFuncionarios,
    criarProntuario,
    obterProntuario,
    atualizarProntuario,
    adicionarConsulta,
    adicionarEvolucao,
    adicionarDocumento,
    urlDownloadDocumento,
    meuProntuario,
  };
}
