import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { gerarSenhaTemporaria, hashSenha, soDigitos } from '../../shared/password.js';
import { enviarEmail, templateUrlCadastro } from '../../shared/email.js';
import { env } from '../../env.js';
import type { CriarEmpresaInput, AtualizarEmpresaInput } from './empresas.schemas.js';

const CADASTRO_PREFIX = 'cadastro:';

export function createEmpresasService(app: FastifyInstance) {
  function urlDeCadastro(token: string) {
    return `${env.APP_URL}/cadastro/${token}`;
  }

  async function gravarTokenRedis(token: string, empresaId: string, expiresAt: Date) {
    const ttl = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    await app.redis.set(`${CADASTRO_PREFIX}${token}`, empresaId, 'EX', ttl);
  }

  async function criar(input: CriarEmpresaInput) {
    const cnpj = soDigitos(input.cnpj);
    const token = randomBytes(24).toString('hex');
    const validadeDias = input.validadeDias ?? 30;
    const expiresAt = new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000);
    const responsavelEmail = input.responsavelEmail.toLowerCase();

    const senhaTempRH = gerarSenhaTemporaria();
    const senhaHashRH = await hashSenha(senhaTempRH);

    // Cria empresa + conta do RH responsável em uma transação
    const empresa = await app.prisma.$transaction(async (tx) => {
      const emp = await tx.empresa.create({
        data: {
          razaoSocial: input.razaoSocial,
          cnpj,
          setor: input.setor,
          responsavelNome: input.responsavelNome,
          responsavelEmail,
          urlToken: token,
          urlExpiresAt: expiresAt,
          ...(input.limiteFunc ? { limiteFunc: input.limiteFunc } : {}),
        },
      });

      await tx.usuario.create({
        data: {
          email: responsavelEmail,
          senhaHash: senhaHashRH,
          role: 'RH_CLIENTE',
          primeiroLogin: true,
          rhCliente: {
            create: { nome: input.responsavelNome, empresaId: emp.id },
          },
        },
      });

      return emp;
    });

    await gravarTokenRedis(token, empresa.id, expiresAt);

    const url = urlDeCadastro(token);
    await enviarEmail({
      to: responsavelEmail,
      subject: `Cadastro Integrity Sul — ${input.razaoSocial}`,
      html:
        templateUrlCadastro(input.razaoSocial, url) +
        `<hr/><p>Seu acesso de RH:<br/>E-mail: <strong>${responsavelEmail}</strong><br/>Senha temporária: <strong>${senhaTempRH}</strong></p>`,
    });

    return {
      empresa,
      urlCadastro: url,
      urlExpiresAt: expiresAt,
      rhSenhaTemporaria: senhaTempRH,
    };
  }

  async function listar() {
    return app.prisma.empresa.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { _count: { select: { funcionarios: true } }, pacoteAtivo: true },
    });
  }

  async function obter(id: string) {
    const emp = await app.prisma.empresa.findUnique({
      where: { id },
      include: { _count: { select: { funcionarios: true } }, pacoteAtivo: true, rhClientes: true },
    });
    if (!emp) throw new AppError(404, 'Empresa não encontrada');
    return { ...emp, urlCadastro: urlDeCadastro(emp.urlToken) };
  }

  async function atualizar(id: string, input: AtualizarEmpresaInput) {
    const emp = await app.prisma.empresa.findUnique({ where: { id } });
    if (!emp) throw new AppError(404, 'Empresa não encontrada');
    return app.prisma.empresa.update({ where: { id }, data: input });
  }

  async function regenerarUrl(id: string, validadeDias = 30) {
    const emp = await app.prisma.empresa.findUnique({ where: { id } });
    if (!emp) throw new AppError(404, 'Empresa não encontrada');

    // Invalida o token anterior no Redis
    await app.redis.del(`${CADASTRO_PREFIX}${emp.urlToken}`);

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000);
    await app.prisma.empresa.update({ where: { id }, data: { urlToken: token, urlExpiresAt: expiresAt } });
    await gravarTokenRedis(token, emp.id, expiresAt);

    return { urlCadastro: urlDeCadastro(token), urlExpiresAt: expiresAt };
  }

  /** Valida um token de cadastro (Redis com fallback no banco). Retorna dados públicos da empresa. */
  async function validarToken(token: string) {
    let empresaId = await app.redis.get(`${CADASTRO_PREFIX}${token}`);

    if (!empresaId) {
      const emp = await app.prisma.empresa.findUnique({ where: { urlToken: token } });
      if (!emp || !emp.urlExpiresAt || emp.urlExpiresAt < new Date()) {
        throw new AppError(404, 'Link de cadastro inválido ou expirado');
      }
      empresaId = emp.id;
      await gravarTokenRedis(token, emp.id, emp.urlExpiresAt); // re-aquece o cache
    }

    const empresa = await app.prisma.empresa.findUnique({
      where: { id: empresaId },
      include: { _count: { select: { funcionarios: true } } },
    });
    if (!empresa || !empresa.ativa) {
      throw new AppError(404, 'Link de cadastro inválido ou empresa inativa');
    }
    return {
      empresaId: empresa.id,
      razaoSocial: empresa.razaoSocial,
      vagasDisponiveis: empresa.limiteFunc - empresa._count.funcionarios,
    };
  }

  return { criar, listar, obter, atualizar, regenerarUrl, validarToken };
}
