import { z } from 'zod';

export const SETORES = ['PSICOLOGIA', 'NUTRICAO', 'JURIDICO', 'FINANCEIRO'] as const;

export const criarAgendamentoSchema = z.object({
  funcionarioId: z.string().min(1),
  profissionalId: z.string().optional(),
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

export const criarDisponibilidadeSchema = z.discriminatedUnion('modo', [
  z.object({
    modo: z.literal('individual'),
    inicio: z.coerce.date(),
    duracaoMin: z.number().int().min(15).default(60),
    modalidade: z.enum(['PRESENCIAL', 'ONLINE']).default('PRESENCIAL'),
    profissionalId: z.string().optional(),
  }),
  z.object({
    modo: z.literal('bloco'),
    data: z.string(), // YYYY-MM-DD
    horaInicio: z.string(), // HH:mm
    horaFim: z.string(), // HH:mm
    duracaoMin: z.number().int().min(15).default(60),
    modalidade: z.enum(['PRESENCIAL', 'ONLINE']).default('PRESENCIAL'),
    profissionalId: z.string().optional(),
  }),
  z.object({
    modo: z.literal('semanal'),
    diasSemana: z.array(z.number().int().min(0).max(6)).min(1),
    horaInicio: z.string(), // HH:mm
    horaFim: z.string(), // HH:mm
    duracaoMin: z.number().int().min(15).default(60),
    semanas: z.number().int().min(1).max(12).default(4),
    modalidade: z.enum(['PRESENCIAL', 'ONLINE']).default('PRESENCIAL'),
    profissionalId: z.string().optional(),
  }),
]);

export const reservarSlotSchema = z.object({
  observacoes: z.string().optional(),
  modalidade: z.enum(['PRESENCIAL', 'ONLINE']).optional(),
});

export const calendarioQuerySchema = z.object({
  de: z.coerce.date(),
  ate: z.coerce.date(),
  setor: z.enum(SETORES).optional(),
  profissionalId: z.string().optional(),
});

export type CriarAgendamentoInput = z.infer<typeof criarAgendamentoSchema>;
export type AtualizarStatusInput = z.infer<typeof atualizarStatusSchema>;
export type CriarDisponibilidadeInput = z.infer<typeof criarDisponibilidadeSchema>;
export type ReservarSlotInput = z.infer<typeof reservarSlotSchema>;
export type CalendarioQuery = z.infer<typeof calendarioQuerySchema>;
