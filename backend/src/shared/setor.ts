import { randomUUID } from 'node:crypto';
import type { Setor } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { AppError } from './errors.js';

/** Bucket do Garage por setor de atendimento. */
export const BUCKET_POR_SETOR: Record<Setor, string> = {
  PSICOLOGIA: 'laudos-psicologia',
  NUTRICAO: 'exames-nutricao',
  JURIDICO: 'docs-juridico',
  FINANCEIRO: 'docs-financeiro',
};

/** Resolve o id do Colaborador (profissional) a partir do usuário autenticado. */
export async function colaboradorIdDoUsuario(app: FastifyInstance, usuarioId: string): Promise<string> {
  const colab = await app.prisma.colaborador.findUnique({ where: { usuarioId }, select: { id: true } });
  if (!colab) throw new AppError(403, 'Usuário não é um profissional da Integrity');
  return colab.id;
}

/** Resolve o id do Funcionário a partir do usuário autenticado. */
export async function funcionarioIdDoUsuario(app: FastifyInstance, usuarioId: string): Promise<string> {
  const func = await app.prisma.funcionario.findUnique({ where: { usuarioId }, select: { id: true } });
  if (!func) throw new AppError(403, 'Usuário não é um funcionário');
  return func.id;
}

export interface ArquivoUpload {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

/** Sobe um arquivo ao bucket do setor e retorna os metadados para gravar em DocumentoStorage. */
export async function subirParaGarage(
  app: FastifyInstance,
  setor: Setor,
  prontuarioId: string,
  file: ArquivoUpload,
) {
  const bucket = BUCKET_POR_SETOR[setor];
  const objectKey = `${prontuarioId}/${randomUUID()}-${file.filename}`;
  await app.garage.putObject(bucket, objectKey, file.buffer, file.mimetype);
  return {
    bucket,
    objectKey,
    nomeArq: file.filename,
    mimeType: file.mimetype,
    tamanho: file.buffer.length,
    setor,
  };
}
