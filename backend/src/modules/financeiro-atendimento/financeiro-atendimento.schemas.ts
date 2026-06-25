import { z } from 'zod';

export const criarProntuarioSchema = z.object({
  funcionarioId: z.string().min(1),
  planoAcao: z.string().optional(),
});

export const atualizarProntuarioSchema = z.object({
  planoAcao: z.string().optional(),
});

export const criarConsultaSchema = z.object({
  data: z.coerce.date(),
  anotacoes: z.string().min(1, 'Descreva a consulta'),
  proximaData: z.coerce.date().optional(),
});

export type CriarProntuarioInput = z.infer<typeof criarProntuarioSchema>;
export type AtualizarProntuarioInput = z.infer<typeof atualizarProntuarioSchema>;
export type CriarConsultaInput = z.infer<typeof criarConsultaSchema>;
