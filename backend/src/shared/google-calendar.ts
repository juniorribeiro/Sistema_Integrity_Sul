import { env } from '../env.js';

interface EventoAgenda {
  titulo: string;
  descricao?: string;
  inicio: Date;
  fimMinutos?: number; // duração (padrão 60)
}

/**
 * Cria um evento no Google Calendar do profissional.
 *
 * Integração real exige OAuth por profissional (tokens armazenados). Enquanto
 * GOOGLE_CLIENT_ID/SECRET não estão configurados, faz fallback: loga e retorna
 * null (o agendamento funciona normalmente, apenas sem evento no Google).
 */
export async function criarEventoAgenda(evento: EventoAgenda): Promise<string | null> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.log(`📅 [DEV/google-calendar não criado] ${evento.titulo} @ ${evento.inicio.toISOString()}`);
    return null;
  }
  // TODO: implementar criação real via googleapis com o refresh token do profissional.
  // Mantido como ponto de extensão para quando o OAuth estiver configurado.
  console.warn('Google Calendar configurado, mas a criação real de evento ainda não foi implementada.');
  return null;
}
