import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { soDigitos } from '../../shared/password.js';
import type { ArquivoUpload } from '../../shared/setor.js';
import type {
  CriarCandidatoInput,
  AtualizarCandidatoInput,
  AvaliacaoInput,
  CriarVagaInput,
  AtualizarVagaInput,
  MoverEtapaInput,
} from './curriculos.schemas.js';

const BUCKET = 'curriculos';

export function createCurriculosService(app: FastifyInstance) {
  // ----- Candidatos -----
  async function listarCandidatos(filtros: { area?: string; status?: string; q?: string }) {
    return app.prisma.candidato.findMany({
      where: {
        area: filtros.area || undefined,
        status: (filtros.status as never) || undefined,
        ...(filtros.q
          ? { OR: [{ nome: { contains: filtros.q, mode: 'insensitive' } }, { cargo: { contains: filtros.q, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { criadoEm: 'desc' },
      select: { id: true, nome: true, cargo: true, area: true, nivelExp: true, localidade: true, status: true, curriculoKey: true },
    });
  }

  async function criarCandidato(input: CriarCandidatoInput) {
    return app.prisma.candidato.create({
      data: { ...input, email: input.email.toLowerCase(), cpf: soDigitos(input.cpf) },
    });
  }

  async function obterCandidato(id: string) {
    const c = await app.prisma.candidato.findUnique({
      where: { id },
      include: { avaliacoes: { orderBy: { criadoEm: 'desc' } }, vagas: { include: { vaga: { select: { titulo: true } } } } },
    });
    if (!c) throw new AppError(404, 'Candidato não encontrado');
    return c;
  }

  async function atualizarCandidato(id: string, input: AtualizarCandidatoInput) {
    await obterCandidato(id);
    return app.prisma.candidato.update({ where: { id }, data: input });
  }

  async function uploadCurriculo(id: string, file: ArquivoUpload) {
    const cand = await app.prisma.candidato.findUnique({ where: { id } });
    if (!cand) throw new AppError(404, 'Candidato não encontrado');
    const objectKey = `${id}/${randomUUID()}-${file.filename}`;
    await app.garage.putObject(BUCKET, objectKey, file.buffer, file.mimetype);
    return app.prisma.candidato.update({ where: { id }, data: { curriculoKey: objectKey }, select: { id: true, curriculoKey: true } });
  }

  async function urlCurriculo(id: string) {
    const cand = await app.prisma.candidato.findUnique({ where: { id }, select: { curriculoKey: true } });
    if (!cand?.curriculoKey) throw new AppError(404, 'Currículo não enviado');
    return { url: await app.garage.presignDownload(BUCKET, cand.curriculoKey) };
  }

  async function avaliar(id: string, autorId: string, input: AvaliacaoInput) {
    await obterCandidato(id);
    return app.prisma.avaliacaoCandidato.create({ data: { candidatoId: id, autorId, ...input } });
  }

  // ----- Vagas / pipeline -----
  async function listarVagas() {
    return app.prisma.vaga.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { _count: { select: { candidatos: true } } },
    });
  }

  async function criarVaga(input: CriarVagaInput) {
    return app.prisma.vaga.create({ data: input });
  }

  async function obterVaga(id: string) {
    const v = await app.prisma.vaga.findUnique({
      where: { id },
      include: {
        candidatos: {
          orderBy: { criadoEm: 'asc' },
          include: { candidato: { select: { id: true, nome: true, cargo: true, status: true } } },
        },
      },
    });
    if (!v) throw new AppError(404, 'Vaga não encontrada');
    return v;
  }

  async function atualizarVaga(id: string, input: AtualizarVagaInput) {
    await obterVaga(id);
    return app.prisma.vaga.update({ where: { id }, data: input });
  }

  async function adicionarCandidatoVaga(vagaId: string, candidatoId: string) {
    await obterVaga(vagaId);
    const existe = await app.prisma.vagaCandidato.findUnique({ where: { vagaId_candidatoId: { vagaId, candidatoId } } });
    if (existe) throw new AppError(409, 'Candidato já está nesta vaga');
    // ao entrar num processo, marca o candidato como EM_PROCESSO
    await app.prisma.candidato.update({ where: { id: candidatoId }, data: { status: 'EM_PROCESSO' } });
    return app.prisma.vagaCandidato.create({ data: { vagaId, candidatoId } });
  }

  async function moverEtapa(vagaCandidatoId: string, input: MoverEtapaInput) {
    const vc = await app.prisma.vagaCandidato.findUnique({ where: { id: vagaCandidatoId } });
    if (!vc) throw new AppError(404, 'Item de pipeline não encontrado');
    // sincroniza o status do candidato com a etapa final
    if (input.etapa === 'CONTRATADO') {
      await app.prisma.candidato.update({ where: { id: vc.candidatoId }, data: { status: 'CONTRATADO' } });
    } else if (input.etapa === 'REPROVADO') {
      await app.prisma.candidato.update({ where: { id: vc.candidatoId }, data: { status: 'DISPONIVEL' } });
    }
    return app.prisma.vagaCandidato.update({ where: { id: vagaCandidatoId }, data: input });
  }

  return {
    listarCandidatos,
    criarCandidato,
    obterCandidato,
    atualizarCandidato,
    uploadCurriculo,
    urlCurriculo,
    avaliar,
    listarVagas,
    criarVaga,
    obterVaga,
    atualizarVaga,
    adicionarCandidatoVaga,
    moverEtapa,
  };
}
