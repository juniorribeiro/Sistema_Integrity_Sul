import { env } from '../env.js';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envia e-mail transacional via Resend.
 * Em dev (sem RESEND_API_KEY) faz fallback: apenas loga no console e retorna ok.
 */
export async function enviarEmail({ to, subject, html }: EmailParams): Promise<{ enviado: boolean }> {
  if (!env.RESEND_API_KEY) {
    console.log(`📧 [DEV/email não enviado] Para: ${to} | Assunto: ${subject}`);
    return { enviado: false };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Integrity Sul <nao-responder@integritysul.com.br>',
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Falha ao enviar e-mail via Resend:', await res.text());
    return { enviado: false };
  }
  return { enviado: true };
}

/** Template do e-mail com a URL única de cadastro enviado ao RH da empresa. */
export function templateUrlCadastro(razaoSocial: string, url: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
      <h2 style="color:#1a1a1a;">Integrity Sul Consultoria</h2>
      <p>Olá! A empresa <strong>${razaoSocial}</strong> foi cadastrada em nossa plataforma de bem-estar corporativo.</p>
      <p>Compartilhe o link abaixo com seus colaboradores para que realizem o autocadastro:</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
          Acessar cadastro
        </a>
      </p>
      <p style="color:#666;font-size:13px;">Ou copie e cole: ${url}</p>
    </div>
  `;
}
