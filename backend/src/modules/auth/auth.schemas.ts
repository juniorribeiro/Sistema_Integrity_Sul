import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1).optional(), // opcional no primeiro acesso
    novaSenha: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Precisa de ao menos uma letra maiúscula')
      .regex(/[a-z]/, 'Precisa de ao menos uma letra minúscula')
      .regex(/[0-9]/, 'Precisa de ao menos um número'),
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>;
