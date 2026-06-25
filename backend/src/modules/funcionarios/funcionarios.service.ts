import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { hashSenha, soDigitos } from '../../shared/password.js';
import { createEmpresasService } from '../empresas/empresas.service.js';
import type { AutocadastroInput } from './funcionarios.schemas.js';

const TERMOS_VERSAO = '2026-06-v1';

export function createFuncionariosService(app: FastifyInstance) {
  const empresas = createEmpresasService(app);

  async function autocadastro(
    token: string,
    input: AutocadastroInput,
    meta: { ip?: string; userAgent?: string },
  ) {
    const { empresaId, vagasDisponiveis } = await empresas.validarToken(token);
    if (vagasDisponiveis <= 0) {
      throw new AppError(409, 'Limite de funcionários da empresa atingido');
    }

    const email = input.email.toLowerCase();
    const cpf = soDigitos(input.cpf);
    const senhaHash = await hashSenha(input.senha);

    const funcionario = await app.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
          senhaHash,
          role: 'FUNCIONARIO',
          primeiroLogin: false, // senha já definida pelo próprio funcionário
          funcionario: {
            create: {
              empresaId,
              nome: input.nome,
              cpf,
              cargo: input.cargo,
              telefone: input.telefone,
              // cria a triagem vazia já vinculada (concluida=false)
              triagem: { create: {} },
            },
          },
          consentimentos: {
            create: { versao: TERMOS_VERSAO, ip: meta.ip, userAgent: meta.userAgent },
          },
        },
        include: { funcionario: true },
      });
      return usuario.funcionario!;
    });

    return { id: funcionario.id, nome: funcionario.nome, email };
  }

  async function empresaIdDoRH(usuarioId: string): Promise<string> {
    const rh = await app.prisma.rHCliente.findUnique({ where: { usuarioId } });
    if (!rh) throw new AppError(403, 'Usuário RH sem empresa vinculada');
    return rh.empresaId;
  }

  async function listar(filtroEmpresaId?: string) {
    return app.prisma.funcionario.findMany({
      where: filtroEmpresaId ? { empresaId: filtroEmpresaId } : undefined,
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        nome: true,
        cargo: true,
        telefone: true,
        criadoEm: true,
        empresa: { select: { id: true, razaoSocial: true } },
        usuario: { select: { email: true, ativo: true } },
        triagem: { select: { concluida: true } },
      },
    });
  }

  async function obter(id: string, restringirEmpresaId?: string) {
    const f = await app.prisma.funcionario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        cargo: true,
        telefone: true,
        empresaId: true,
        criadoEm: true,
        empresa: { select: { id: true, razaoSocial: true } },
        usuario: { select: { email: true, ativo: true } },
        triagem: { select: { concluida: true } },
      },
    });
    if (!f) throw new AppError(404, 'Funcionário não encontrado');
    if (restringirEmpresaId && f.empresaId !== restringirEmpresaId) {
      throw new AppError(403, 'Acesso negado a funcionário de outra empresa');
    }
    return f;
  }

  async function atualizar(
    id: string,
    input: { nome?: string; cargo?: string; telefone?: string; ativo?: boolean },
    restringirEmpresaId?: string,
  ) {
    await obter(id, restringirEmpresaId);
    const { ativo, ...dados } = input;
    const f = await app.prisma.funcionario.update({
      where: { id },
      data: {
        ...dados,
        ...(ativo !== undefined ? { usuario: { update: { ativo } } } : {}),
      },
      select: { id: true, nome: true, cargo: true, telefone: true },
    });
    return f;
  }

  /** Remove o funcionário e tudo vinculado (via cascata ao apagar o usuário). */
  async function remover(id: string, restringirEmpresaId?: string) {
    const f = await app.prisma.funcionario.findUnique({ where: { id }, select: { usuarioId: true, empresaId: true } });
    if (!f) throw new AppError(404, 'Funcionário não encontrado');
    if (restringirEmpresaId && f.empresaId !== restringirEmpresaId) {
      throw new AppError(403, 'Acesso negado a funcionário de outra empresa');
    }
    // Apagar o usuário cascateia: funcionário, triagem, prontuários, agendamentos, consentimentos
    await app.prisma.usuario.delete({ where: { id: f.usuarioId } });
    return { ok: true };
  }

  return { autocadastro, listar, obter, empresaIdDoRH, atualizar, remover };
}
