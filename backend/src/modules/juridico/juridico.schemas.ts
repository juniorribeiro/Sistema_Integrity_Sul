import { z } from 'zod';

export const AREAS = ['TRABALHISTA', 'FAMILIA', 'CONSUMIDOR', 'CRIMINAL', 'PREVIDENCIARIO', 'CIVIL', 'OUTRO'] as const;
export const STATUS = ['ABERTO', 'EM_ANDAMENTO', 'ENCERRADO'] as const;

export const criarCasoSchema = z.object({
  funcionarioId: z.string().min(1),
  areaDir: z.enum(AREAS),
  titulo: z.string().min(2),
  descricao: z.string().optional(),
});

export const atualizarCasoSchema = z.object({
  descricao: z.string().optional(),
  numeroProcesso: z.string().optional(),
  fase: z.string().optional(),
  status: z.enum(STATUS).optional(),
});

export const criarPrazoSchema = z.object({
  descricao: z.string().min(1),
  data: z.coerce.date(),
});

export const atualizarPrazoSchema = z.object({
  descricao: z.string().min(1).optional(),
  cumprido: z.boolean().optional(),
});

export type CriarCasoInput = z.infer<typeof criarCasoSchema>;
export type AtualizarCasoInput = z.infer<typeof atualizarCasoSchema>;
export type CriarPrazoInput = z.infer<typeof criarPrazoSchema>;
export type AtualizarPrazoInput = z.infer<typeof atualizarPrazoSchema>;
