import { z } from 'zod';

export const autocadastroSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().min(11),
  cargo: z.string().min(2),
  telefone: z.string().min(8),
  senha: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
    .regex(/[a-z]/, 'Inclua uma letra minúscula')
    .regex(/[0-9]/, 'Inclua um número'),
  aceiteLGPD: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar os termos LGPD' }) }),
});

export const atualizarFuncionarioSchema = z.object({
  nome: z.string().min(2).optional(),
  cargo: z.string().min(2).optional(),
  telefone: z.string().min(8).optional(),
  ativo: z.boolean().optional(),
});

export type AutocadastroInput = z.infer<typeof autocadastroSchema>;
export type AtualizarFuncionarioInput = z.infer<typeof atualizarFuncionarioSchema>;
