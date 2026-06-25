import { z } from 'zod';

export const criarProntuarioSchema = z.object({
  funcionarioId: z.string().min(1),
  planoTerapeutico: z.string().optional(),
});

export const atualizarProntuarioSchema = z.object({
  planoTerapeutico: z.string().optional(),
});

export const criarSessaoSchema = z.object({
  data: z.coerce.date(),
  evolucao: z.string().min(1, 'Descreva a evolução da sessão'),
  proximaData: z.coerce.date().optional(),
});

export const criarMetaSchema = z.object({
  descricao: z.string().min(1),
  prazo: z.coerce.date().optional(),
});

export const atualizarMetaSchema = z.object({
  descricao: z.string().min(1).optional(),
  atingida: z.boolean().optional(),
});

export type CriarProntuarioInput = z.infer<typeof criarProntuarioSchema>;
export type AtualizarProntuarioInput = z.infer<typeof atualizarProntuarioSchema>;
export type CriarSessaoInput = z.infer<typeof criarSessaoSchema>;
export type CriarMetaInput = z.infer<typeof criarMetaSchema>;
export type AtualizarMetaInput = z.infer<typeof atualizarMetaSchema>;
