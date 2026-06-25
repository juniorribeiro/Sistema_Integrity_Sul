import { z } from 'zod';

/**
 * Validação das variáveis de ambiente no startup.
 * O processo aborta se algo obrigatório estiver ausente/ inválido.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  GARAGE_ENDPOINT: z.string().url().default('http://localhost:3900'),
  GARAGE_REGION: z.string().default('garage'),
  GARAGE_ACCESS_KEY: z.string().optional().default(''),
  GARAGE_SECRET_KEY: z.string().optional().default(''),

  APP_URL: z.string().url().default('http://localhost:3000'),

  RESEND_API_KEY: z.string().optional().default(''),
  WHATSAPP_TOKEN: z.string().optional().default(''),
  WHATSAPP_PHONE_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
