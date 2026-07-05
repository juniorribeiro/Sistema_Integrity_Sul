import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import { gerarSenhaTemporaria, hashSenha, soDigitos } from '../../shared/password.js';
import { enviarEmail } from '../../shared/email.js';
import { SETOR_POR_ROLE, type CriarColaboradorInput, type AtualizarColaboradorInput } from './colaboradores.schemas.js';

export function createColaboradoresService(app: FastifyInstance) {
  async function criar(input: CriarColaboradorInput, roleRequisitante?: string) {
    if (roleRequisitante === 'SUPORTE' && input.role === 'DIRETORIA') {
      throw new AppError(403, 'Acesso negado: suporte não pode criar diretores');
    }

    const email = input.email.toLowerCase();
    const cpf = soDigitos(input.cpf);

    const senha = input.senha || gerarSenhaTemporaria();
    const senhaHash = await hashSenha(senha);
    const setor = SETOR_POR_ROLE[input.role] ?? null;

    const usuario = await app.prisma.usuario.create({
      data: {
        email,
        senhaHash,
        role: input.role,
        primeiroLogin: true,
        colaborador: {
          create: {
            nome: input.nome,
            cpf,
            telefone: input.telefone,
            registro: input.registro,
            setor,
          },
        },
      },
      include: { colaborador: true },
    });

    await enviarEmail({
      to: email,
      subject: 'Seu acesso à Integrity Sul',
      html: `<p>Olá ${input.nome}, sua conta foi criada.</p>
             <p>E-mail: <strong>${email}</strong><br/>Senha de acesso: <strong>${senha}</strong></p>
             <p>Você deverá trocar a senha no primeiro acesso.</p>`,
    });

    return {
      id: usuario.colaborador!.id,
      usuarioId: usuario.id,
      nome: usuario.colaborador!.nome,
      email: usuario.email,
      role: usuario.role,
      setor,
      senhaTemporaria: senha, // retornada para a Diretoria/Suporte repassar
    };
  }

  async function listar(roleRequisitante?: string) {
    const where = roleRequisitante === 'SUPORTE' ? { usuario: { role: { not: 'DIRETORIA' as const } } } : undefined;
    return app.prisma.colaborador.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: { usuario: { select: { email: true, role: true, ativo: true } } },
    });
  }

  async function obter(id: string, roleRequisitante?: string) {
    const c = await app.prisma.colaborador.findUnique({
      where: { id },
      include: { usuario: { select: { email: true, role: true, ativo: true } } },
    });
    if (!c) throw new AppError(404, 'Colaborador não encontrado');
    if (roleRequisitante === 'SUPORTE' && c.usuario.role === 'DIRETORIA') {
      throw new AppError(403, 'Acesso negado');
    }
    return c;
  }

  async function atualizar(id: string, input: AtualizarColaboradorInput, roleRequisitante?: string) {
    const c = await app.prisma.colaborador.findUnique({
      where: { id },
      include: { usuario: { select: { role: true } } },
    });
    if (!c) throw new AppError(404, 'Colaborador não encontrado');
    if (roleRequisitante === 'SUPORTE' && c.usuario.role === 'DIRETORIA') {
      throw new AppError(403, 'Acesso negado');
    }

    const { ativo, senha, ...dadosColab } = input;
    const updateUsuario: any = {};
    if (ativo !== undefined) updateUsuario.ativo = ativo;
    if (senha !== undefined) {
      updateUsuario.senhaHash = await hashSenha(senha);
    }

    return app.prisma.colaborador.update({
      where: { id },
      data: {
        ...dadosColab,
        ...(Object.keys(updateUsuario).length > 0 ? { usuario: { update: updateUsuario } } : {}),
      },
      include: { usuario: { select: { email: true, role: true, ativo: true } } },
    });
  }

  /** Remove o colaborador. Bloqueia (409) se houver atendimentos vinculados — nesse caso, desative pela edição. */
  async function remover(id: string, roleRequisitante?: string) {
    const c = await app.prisma.colaborador.findUnique({
      where: { id },
      include: { usuario: { select: { role: true } } },
    });
    if (!c) throw new AppError(404, 'Colaborador não encontrado');
    if (roleRequisitante === 'SUPORTE' && c.usuario.role === 'DIRETORIA') {
      throw new AppError(403, 'Acesso negado');
    }
    try {
      await app.prisma.usuario.delete({ where: { id: c.usuarioId } }); // cascateia o colaborador
    } catch (e) {
      if ((e as { code?: string }).code === 'P2003') {
        throw new AppError(409, 'Este profissional possui atendimentos ou agendamentos vinculados. Desative-o (na edição) em vez de remover.');
      }
      throw e;
    }
    return { ok: true };
  }

  return { criar, listar, obter, atualizar, remover };
}
