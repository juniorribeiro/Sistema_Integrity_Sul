import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { JwtUser } from '../../plugins/auth.js';

const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias
const REFRESH_PREFIX = 'refresh:';

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function createAuthService(app: FastifyInstance) {
  function signAccess(user: JwtUser): string {
    return app.jwt.sign({ sub: user.sub, role: user.role, primeiroLogin: user.primeiroLogin });
  }

  async function issueRefresh(usuarioId: string): Promise<string> {
    const token = randomBytes(48).toString('hex');
    await app.redis.set(`${REFRESH_PREFIX}${token}`, usuarioId, 'EX', REFRESH_TTL_SECONDS);
    return token;
  }

  async function login(email: string, senha: string) {
    const usuario = await app.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    if (!usuario || !usuario.ativo) {
      throw new AuthError(401, 'Credenciais inválidas');
    }
    const ok = await bcrypt.compare(senha, usuario.senhaHash);
    if (!ok) {
      throw new AuthError(401, 'Credenciais inválidas');
    }

    const payload: JwtUser = { sub: usuario.id, role: usuario.role, primeiroLogin: usuario.primeiroLogin };
    const accessToken = signAccess(payload);
    const refreshToken = await issueRefresh(usuario.id);

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        primeiroLogin: usuario.primeiroLogin,
      },
    };
  }

  async function refresh(refreshToken: string) {
    const key = `${REFRESH_PREFIX}${refreshToken}`;
    const usuarioId = await app.redis.get(key);
    if (!usuarioId) {
      throw new AuthError(401, 'Refresh token inválido ou expirado');
    }
    const usuario = await app.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || !usuario.ativo) {
      await app.redis.del(key);
      throw new AuthError(401, 'Usuário inválido');
    }

    // Rotação: invalida o token usado e emite um novo
    await app.redis.del(key);
    const payload: JwtUser = { sub: usuario.id, role: usuario.role, primeiroLogin: usuario.primeiroLogin };
    const accessToken = signAccess(payload);
    const newRefresh = await issueRefresh(usuario.id);

    return { accessToken, refreshToken: newRefresh };
  }

  async function logout(refreshToken: string) {
    await app.redis.del(`${REFRESH_PREFIX}${refreshToken}`);
  }

  async function trocarSenha(usuarioId: string, novaSenha: string, senhaAtual?: string) {
    const usuario = await app.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new AuthError(404, 'Usuário não encontrado');
    }
    // Fora do primeiro acesso, exige a senha atual
    if (!usuario.primeiroLogin) {
      if (!senhaAtual || !(await bcrypt.compare(senhaAtual, usuario.senhaHash))) {
        throw new AuthError(400, 'Senha atual incorreta');
      }
    }
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await app.prisma.usuario.update({
      where: { id: usuarioId },
      data: { senhaHash, primeiroLogin: false },
    });
  }

  async function me(usuarioId: string) {
    const usuario = await app.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { colaborador: true, funcionario: true, rhCliente: true },
    });
    if (!usuario) throw new AuthError(404, 'Usuário não encontrado');
    const { senhaHash, ...safe } = usuario;
    return safe;
  }

  async function resetarSenhaOutroUsuario(
    requerenteId: string,
    requerenteRole: string,
    targetEmail: string,
    novaSenha: string
  ) {
    const targetUser = await app.prisma.usuario.findUnique({
      where: { email: targetEmail.toLowerCase() }
    });

    if (!targetUser) {
      throw new AuthError(404, 'Usuário não encontrado');
    }

    if (requerenteRole === 'SUPORTE' && targetUser.role === 'DIRETORIA') {
      throw new AuthError(403, 'Acesso negado: suporte não pode resetar senha da diretoria');
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await app.prisma.usuario.update({
      where: { id: targetUser.id },
      data: {
        senhaHash,
        primeiroLogin: true, // força alteração no primeiro acesso
      }
    });
  }

  return { login, refresh, logout, trocarSenha, me, resetarSenhaOutroUsuario };
}
