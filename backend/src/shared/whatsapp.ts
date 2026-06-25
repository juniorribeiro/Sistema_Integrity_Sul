import { env } from '../env.js';

/**
 * Envia mensagem de texto via WhatsApp Cloud API (Meta).
 * Em dev (sem WHATSAPP_TOKEN/PHONE_ID) faz fallback: loga e retorna não-enviado.
 */
export async function enviarWhatsApp(telefone: string, mensagem: string): Promise<{ enviado: boolean }> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
    console.log(`📱 [DEV/whatsapp não enviado] Para: ${telefone} | ${mensagem}`);
    return { enviado: false };
  }
  const to = telefone.replace(/\D/g, '');
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: mensagem },
    }),
  });
  if (!res.ok) {
    console.error('Falha ao enviar WhatsApp:', await res.text());
    return { enviado: false };
  }
  return { enviado: true };
}
