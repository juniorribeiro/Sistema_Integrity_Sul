import { z } from 'zod';

export const SETORES = ['PSICOLOGIA', 'NUTRICAO', 'JURIDICO', 'FINANCEIRO'] as const;

export const criarAgendamentoSchema = z.object({
  funcionarioId: z.string().min(1),
  dataHora: z.coerce.date(),
  modalidade: z.enum(['PRESENCIAL', 'ONLINE']),
  linkOnline: z.string().url().optional(),
  observacoes: z.string().optional(),
  // obrigatório apenas para DIRETORIA (profissionais derivam do próprio setor)
  setor: z.enum(SETORES).optional(),
});

export const atualizarStatusSchema = z.object({
  status: z.enum(['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO']),
});

export type CriarAgendamentoInput = z.infer<typeof criarAgendamentoSchema>;
export type AtualizarStatusInput = z.infer<typeof atualizarStatusSchema>;
