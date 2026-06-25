import type { FastifyInstance } from 'fastify';
import type { Setor } from '@prisma/client';
import { AppError } from '../../shared/errors.js';
import { funcionarioIdDoUsuario } from '../../shared/setor.js';
import { enviarEmail } from '../../shared/email.js';
import { enviarWhatsApp } from '../../shared/whatsapp.js';
import { criarEventoAgenda } from '../../shared/google-calendar.js';
import type { CriarAgendamentoInput, AtualizarStatusInput } from './agendamentos.schemas.js';

const SETOR_LABEL: Record<Setor, string> = {
  PSICOLOGIA: 'Psicologia',
  NUTRICAO: 'Nutrição',
  JURIDICO: 'Jurídico',
  FINANCEIRO: 'Financeiro',
};

const fmtData = (d: Date) =>
  d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function createAgendamentosService(app: FastifyInstance) {
  async function profissional(usuarioId: string) {
    const colab = await app.prisma.colaborador.findUnique({
      where: { usuarioId },
      select: { id: true, setor: true, nome: true },
    });
    if (!colab) throw new AppError(403, 'Usuário não é um profissional');
    return colab;
  }

  async function criar(usuarioId: string, role: string, input: CriarAgendamentoInput) {
    const colab = await profissional(usuarioId);
    const setor: Setor | null = colab.setor ?? (input.setor as Setor | undefined) ?? null;
    if (!setor) throw new AppError(400, 'Setor não definido para este profissional; informe o setor');

    const func = await app.prisma.funcionario.findUnique({
      where: { id: input.funcionarioId },
      select: { nome: true, telefone: true, usuario: { select: { email: true } } },
    });
    if (!func) throw new AppError(404, 'Funcionário não encontrado');

    const googleCalId = await criarEventoAgenda({
      titulo: `Atendimento ${SETOR_LABEL[setor]} — ${func.nome}`,
      descricao: input.observacoes,
      inicio: input.dataHora,
    });

    const agendamento = await app.prisma.agendamento.create({
      data: {
        funcionarioId: input.funcionarioId,
        profissionalId: colab.id,
        setor,
        dataHora: input.dataHora,
        modalidade: input.modalidade,
        linkOnline: input.linkOnline,
        observacoes: input.observacoes,
        googleCalId,
        criadoPor: usuarioId,
      },
    });

    // Notificações (e-mail + WhatsApp) com fallback de dev
    const quando = fmtData(input.dataHora);
    const modal = input.modalidade === 'ONLINE' ? `online${input.linkOnline ? ` (${input.linkOnline})` : ''}` : 'presencial';
    const msg = `Olá ${func.nome}! Seu atendimento de ${SETOR_LABEL[setor]} foi agendado para ${quando} (${modal}).`;
    await Promise.allSettled([
      enviarEmail({
        to: func.usuario.email,
        subject: `Atendimento de ${SETOR_LABEL[setor]} agendado`,
        html: `<p>${msg}</p><p>Você pode confirmar pelo portal Integrity Sul.</p>`,
      }),
      enviarWhatsApp(func.telefone, msg),
    ]);

    return agendamento;
  }

  async function listar(usuarioId: string, role: string) {
    if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      return app.prisma.agendamento.findMany({
        where: { funcionarioId: funcId },
        orderBy: { dataHora: 'asc' },
        include: { profissional: { select: { nome: true } } },
      });
    }
    if (role === 'DIRETORIA') {
      return app.prisma.agendamento.findMany({
        orderBy: { dataHora: 'asc' },
        include: { funcionario: { select: { nome: true } }, profissional: { select: { nome: true } } },
      });
    }
    const colab = await profissional(usuarioId);
    return app.prisma.agendamento.findMany({
      where: { profissionalId: colab.id },
      orderBy: { dataHora: 'asc' },
      include: { funcionario: { select: { nome: true } } },
    });
  }

  async function atualizarStatus(id: string, usuarioId: string, role: string, input: AtualizarStatusInput) {
    const ag = await app.prisma.agendamento.findUnique({ where: { id } });
    if (!ag) throw new AppError(404, 'Agendamento não encontrado');

    if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      if (ag.funcionarioId !== funcId) throw new AppError(403, 'Acesso negado');
      // Funcionário só pode confirmar ou cancelar
      if (!['CONFIRMADO', 'CANCELADO'].includes(input.status)) {
        throw new AppError(403, 'Funcionário só pode confirmar ou cancelar');
      }
    } else if (role !== 'DIRETORIA') {
      const colab = await profissional(usuarioId);
      if (ag.profissionalId !== colab.id) throw new AppError(403, 'Acesso negado');
    }

    return app.prisma.agendamento.update({ where: { id }, data: { status: input.status } });
  }

  async function remover(id: string, usuarioId: string, role: string) {
    const ag = await app.prisma.agendamento.findUnique({ where: { id } });
    if (!ag) throw new AppError(404, 'Agendamento não encontrado');
    if (role !== 'DIRETORIA') {
      const colab = await profissional(usuarioId);
      if (ag.profissionalId !== colab.id) throw new AppError(403, 'Acesso negado');
    }
    await app.prisma.agendamento.delete({ where: { id } });
    return { ok: true };
  }

  /** Funcionários disponíveis para agendar (seletor do formulário do profissional). */
  async function listarFuncionarios() {
    const funcs = await app.prisma.funcionario.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, cargo: true, empresa: { select: { razaoSocial: true } } },
    });
    return funcs.map((f) => ({ id: f.id, nome: f.nome, cargo: f.cargo, empresa: f.empresa.razaoSocial }));
  }

  return { criar, listar, atualizarStatus, remover, listarFuncionarios };
}
