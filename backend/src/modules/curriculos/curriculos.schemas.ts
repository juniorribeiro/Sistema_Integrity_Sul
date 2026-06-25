import { z } from 'zod';

export const STATUS_CAND = ['DISPONIVEL', 'EM_PROCESSO', 'CONTRATADO', 'INATIVO'] as const;
export const STATUS_VAGA = ['ABERTA', 'EM_ANDAMENTO', 'FECHADA', 'CANCELADA'] as const;
export const ETAPAS = ['TRIAGEM', 'ENTREVISTA', 'TESTE', 'PROPOSTA', 'CONTRATADO', 'REPROVADO'] as const;

export const criarCandidatoSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().min(11),
  telefone: z.string().min(8),
  cargo: z.string().min(2),
  area: z.string().min(2),
  nivelExp: z.string().min(1),
  localidade: z.string().min(2),
  pretensao: z.coerce.number().positive().optional(),
  disponibilidade: z.string().min(1),
});

export const atualizarCandidatoSchema = z.object({
  cargo: z.string().min(2).optional(),
  area: z.string().min(2).optional(),
  nivelExp: z.string().optional(),
  localidade: z.string().optional(),
  pretensao: z.coerce.number().positive().optional(),
  disponibilidade: z.string().optional(),
  status: z.enum(STATUS_CAND).optional(),
});

export const avaliacaoSchema = z.object({
  nota: z.coerce.number().int().min(1).max(5),
  comentario: z.string().optional(),
});

export const criarVagaSchema = z.object({
  titulo: z.string().min(2),
  area: z.string().min(2),
  localidade: z.string().optional(),
  descricao: z.string().min(1),
  empresaId: z.string().optional(),
});

export const atualizarVagaSchema = z.object({
  status: z.enum(STATUS_VAGA).optional(),
  localidade: z.string().optional(),
  descricao: z.string().optional(),
});

export const moverEtapaSchema = z.object({
  etapa: z.enum(ETAPAS),
  observacoes: z.string().optional(),
});

export type CriarCandidatoInput = z.infer<typeof criarCandidatoSchema>;
export type AtualizarCandidatoInput = z.infer<typeof atualizarCandidatoSchema>;
export type AvaliacaoInput = z.infer<typeof avaliacaoSchema>;
export type CriarVagaInput = z.infer<typeof criarVagaSchema>;
export type AtualizarVagaInput = z.infer<typeof atualizarVagaSchema>;
export type MoverEtapaInput = z.infer<typeof moverEtapaSchema>;
