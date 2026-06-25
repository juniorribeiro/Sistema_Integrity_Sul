import { z } from 'zod';

export const criarProntuarioSchema = z.object({
  funcionarioId: z.string().min(1),
  planoAlimentar: z.string().optional(),
});

export const atualizarProntuarioSchema = z.object({
  planoAlimentar: z.string().optional(),
});

export const criarConsultaSchema = z.object({
  data: z.coerce.date(),
  anotacoes: z.string().min(1, 'Descreva a consulta'),
  proximaData: z.coerce.date().optional(),
});

export const criarEvolucaoSchema = z.object({
  data: z.coerce.date(),
  pesoKg: z.coerce.number().positive(),
  imc: z.coerce.number().positive().optional(),
  observacoes: z.string().optional(),
});

export type CriarProntuarioInput = z.infer<typeof criarProntuarioSchema>;
export type AtualizarProntuarioInput = z.infer<typeof atualizarProntuarioSchema>;
export type CriarConsultaInput = z.infer<typeof criarConsultaSchema>;
export type CriarEvolucaoInput = z.infer<typeof criarEvolucaoSchema>;
