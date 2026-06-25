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

/** Normaliza texto: minúsculas, sem acentos, sem espaços nas pontas. */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Tokens significativos (>= 3 chars) para correspondência parcial. */
function tokens(s: string): string[] {
  return normalizar(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

/**
 * Um candidato "combina" com a vaga se a área for igual OU se houver correspondência
 * parcial entre o título da vaga e o cargo do candidato (token em comum ou substring).
 */
function combina(vaga: { titulo: string; area: string }, cand: { area: string; cargo: string }): boolean {
  if (normalizar(cand.area) === normalizar(vaga.area)) return true;
  const tituloTokens = tokens(vaga.titulo);
  const cargoTokens = tokens(cand.cargo);
  if (tituloTokens.some((t) => cargoTokens.includes(t))) return true;
  const nt = normalizar(vaga.titulo);
  const nc = normalizar(cand.cargo);
  return nt.length > 0 && nc.length > 0 && (nc.includes(nt) || nt.includes(nc));
}

/** Comparador que prioriza candidatos na mesma localidade da vaga, depois por localidade. */
function ordenarPorLocalidade(vagaLocalidade: string | null) {
  const loc = vagaLocalidade ? normalizar(vagaLocalidade) : null;
  return (a: string | null, b: string | null): number => {
    if (loc) {
      const am = normalizar(a ?? '') === loc ? 0 : 1;
      const bm = normalizar(b ?? '') === loc ? 0 : 1;
      if (am !== bm) return am - bm;
    }
    return (a ?? '').localeCompare(b ?? '', 'pt-BR');
  };
}

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
    const vaga = await app.prisma.vaga.create({ data: input });

    // Match automático: currículos elegíveis (DISPONIVEL/INATIVO) que combinam com a vaga
    const elegiveis = await app.prisma.candidato.findMany({
      where: { status: { in: ['DISPONIVEL', 'INATIVO'] } },
      select: { id: true, cargo: true, area: true, localidade: true },
    });
    const matches = elegiveis.filter((c) => combina(vaga, c));

    // Prioriza por localidade (mesma localidade da vaga primeiro)
    const cmp = ordenarPorLocalidade(vaga.localidade);
    matches.sort((a, b) => cmp(a.localidade, b.localidade));

    if (matches.length > 0) {
      const ids = matches.map((m) => m.id);
      await app.prisma.$transaction([
        app.prisma.vagaCandidato.createMany({
          data: matches.map((m) => ({ vagaId: vaga.id, candidatoId: m.id })),
          skipDuplicates: true,
        }),
        app.prisma.candidato.updateMany({ where: { id: { in: ids } }, data: { status: 'EM_PROCESSO' } }),
      ]);
    }

    return { ...vaga, candidatosAdicionados: matches.length };
  }

  async function obterVaga(id: string) {
    const v = await app.prisma.vaga.findUnique({
      where: { id },
      include: {
        candidatos: {
          orderBy: { criadoEm: 'asc' },
          include: { candidato: { select: { id: true, nome: true, cargo: true, status: true, localidade: true } } },
        },
      },
    });
    if (!v) throw new AppError(404, 'Vaga não encontrada');
    // Prioriza a listagem do pipeline pela localidade da vaga
    const cmp = ordenarPorLocalidade(v.localidade);
    v.candidatos.sort((a, b) => cmp(a.candidato.localidade, b.candidato.localidade));
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

  async function removerCandidato(id: string) {
    const cand = await app.prisma.candidato.findUnique({ where: { id }, select: { curriculoKey: true } });
    if (!cand) throw new AppError(404, 'Candidato não encontrado');
    if (cand.curriculoKey) await app.garage.deleteObject(BUCKET, cand.curriculoKey).catch(() => {});
    await app.prisma.candidato.delete({ where: { id } }); // cascateia avaliações e itens de pipeline
    return { ok: true };
  }

  async function removerAvaliacao(avaliacaoId: string) {
    const a = await app.prisma.avaliacaoCandidato.findUnique({ where: { id: avaliacaoId } });
    if (!a) throw new AppError(404, 'Avaliação não encontrada');
    await app.prisma.avaliacaoCandidato.delete({ where: { id: avaliacaoId } });
    return { ok: true };
  }

  async function removerVaga(id: string) {
    const v = await app.prisma.vaga.findUnique({ where: { id } });
    if (!v) throw new AppError(404, 'Vaga não encontrada');
    await app.prisma.vaga.delete({ where: { id } }); // cascateia itens de pipeline
    return { ok: true };
  }

  async function removerDoPipeline(vagaCandidatoId: string) {
    const vc = await app.prisma.vagaCandidato.findUnique({ where: { id: vagaCandidatoId } });
    if (!vc) throw new AppError(404, 'Item de pipeline não encontrado');
    await app.prisma.vagaCandidato.delete({ where: { id: vagaCandidatoId } });
    return { ok: true };
  }

  return {
    listarCandidatos,
    criarCandidato,
    obterCandidato,
    atualizarCandidato,
    removerCandidato,
    removerAvaliacao,
    removerVaga,
    removerDoPipeline,
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
