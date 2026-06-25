import { z } from 'zod';

export const criarEmpresaSchema = z.object({
  razaoSocial: z.string().min(2),
  cnpj: z.string().min(14),
  setor: z.string().min(2),
  responsavelNome: z.string().min(2),
  responsavelEmail: z.string().email(),
  limiteFunc: z.coerce.number().int().positive().optional(),
  /** Dias de validade da URL de cadastro (padrão 30). */
  validadeDias: z.coerce.number().int().positive().max(365).optional(),
});

export const atualizarEmpresaSchema = z.object({
  razaoSocial: z.string().min(2).optional(),
  setor: z.string().min(2).optional(),
  responsavelNome: z.string().min(2).optional(),
  responsavelEmail: z.string().email().optional(),
  limiteFunc: z.coerce.number().int().positive().optional(),
  ativa: z.boolean().optional(),
});

export type CriarEmpresaInput = z.infer<typeof criarEmpresaSchema>;
export type AtualizarEmpresaInput = z.infer<typeof atualizarEmpresaSchema>;
