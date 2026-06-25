import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

/** Gera uma senha temporária legível (ex.: "A7x9-K2mb"). */
export function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(8);
  let senha = '';
  for (let i = 0; i < 8; i++) {
    senha += chars[bytes[i] % chars.length];
    if (i === 3) senha += '-';
  }
  return senha;
}

export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

/** Normaliza CPF/CNPJ removendo tudo que não é dígito. */
export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}
