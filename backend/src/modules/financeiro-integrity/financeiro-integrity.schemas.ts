import { z } from 'zod';

export const criarLancamentoSchema = z.object({
  tipo: z.enum(['RECEITA', 'DESPESA']),
  categoria: z.string().min(1),
  descricao: z.string().min(1),
  valor: z.coerce.number().positive(),
  data: z.coerce.date(),
  empresaId: z.string().optional(),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO']).optional(),
  nfNumero: z.string().optional(),
});

export const atualizarLancamentoSchema = z.object({
  categoria: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  valor: z.coerce.number().positive().optional(),
  data: z.coerce.date().optional(),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO']).optional(),
  nfNumero: z.string().optional(),
});

export type CriarLancamentoInput = z.infer<typeof criarLancamentoSchema>;
export type AtualizarLancamentoInput = z.infer<typeof atualizarLancamentoSchema>;
