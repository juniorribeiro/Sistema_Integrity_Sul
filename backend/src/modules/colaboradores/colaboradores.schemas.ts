import { z } from 'zod';
import type { Role, Setor } from '@prisma/client';

export const ROLES_INTERNOS = [
  'DIRETORIA',
  'CONSULTOR_RH',
  'PSICOLOGO',
  'NUTRICIONISTA',
  'JURIDICO',
  'FINANCEIRO_ATENDIMENTO',
  'FINANCEIRO_INTEGRITY',
  'SUPORTE',
] as const;

/** Setor de atendimento derivado do role (null para perfis sem atendimento). */
export const SETOR_POR_ROLE: Partial<Record<Role, Setor>> = {
  PSICOLOGO: 'PSICOLOGIA',
  NUTRICIONISTA: 'NUTRICAO',
  JURIDICO: 'JURIDICO',
  FINANCEIRO_ATENDIMENTO: 'FINANCEIRO',
};

export const criarColaboradorSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().min(11),
  telefone: z.string().optional(),
  registro: z.string().optional(),
  role: z.enum(ROLES_INTERNOS),
  senha: z.string().min(6).optional(),
});

export const atualizarColaboradorSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  registro: z.string().optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6).optional(),
});

export type CriarColaboradorInput = z.infer<typeof criarColaboradorSchema>;
export type AtualizarColaboradorInput = z.infer<typeof atualizarColaboradorSchema>;
