import type { FastifyInstance } from 'fastify';
import type { Setor } from '@prisma/client';
import { AppError } from '../../shared/errors.js';
import { funcionarioIdDoUsuario } from '../../shared/setor.js';
import { enviarEmail } from '../../shared/email.js';
import { enviarWhatsApp } from '../../shared/whatsapp.js';
import { criarEventoAgenda } from '../../shared/google-calendar.js';
import type {
  CriarAgendamentoInput,
  AtualizarStatusInput,
  CriarDisponibilidadeInput,
  ReservarSlotInput,
  CalendarioQuery,
} from './agendamentos.schemas.js';

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
    let colabId: string;
    let colabNome: string;
    let setor: Setor;

    if (role === 'DIRETORIA' || role === 'SUPORTE') {
      if (!input.profissionalId) {
        throw new AppError(400, 'profissionalId é obrigatório para diretoria/suporte');
      }
      const targetColab = await app.prisma.colaborador.findUnique({
        where: { id: input.profissionalId },
        include: { usuario: true },
      });
      if (!targetColab) throw new AppError(404, 'Profissional não encontrado');
      if (role === 'SUPORTE' && targetColab.usuario.role === 'DIRETORIA') {
        throw new AppError(403, 'Acesso negado: suporte não pode agendar para diretoria');
      }
      colabId = targetColab.id;
      colabNome = targetColab.nome;
      const resolvedSetor = targetColab.setor ?? (input.setor as Setor | undefined) ?? null;
      if (!resolvedSetor) {
        throw new AppError(400, 'Setor do profissional não definido; informe o setor');
      }
      setor = resolvedSetor;
    } else {
      const colab = await profissional(usuarioId);
      colabId = colab.id;
      colabNome = colab.nome;
      const resolvedSetor = colab.setor ?? (input.setor as Setor | undefined) ?? null;
      if (!resolvedSetor) {
        throw new AppError(400, 'Setor não definido para este profissional; informe o setor');
      }
      setor = resolvedSetor;
    }

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

    const agendamento = await app.prisma.$transaction(async (tx) => {
      const slot = await tx.disponibilidade.findFirst({
        where: {
          profissionalId: colabId,
          inicio: input.dataHora,
          status: 'LIVRE',
        },
      });

      if (!slot) {
        throw new AppError(400, 'Não há horário disponível cadastrado para este profissional nesta data/hora.');
      }

      const ag = await tx.agendamento.create({
        data: {
          funcionarioId: input.funcionarioId,
          profissionalId: colabId,
          setor,
          dataHora: input.dataHora,
          modalidade: input.modalidade,
          observacoes: input.observacoes,
          googleCalId,
          criadoPor: usuarioId,
        },
      });

      let link = input.linkOnline;
      if (input.modalidade === 'ONLINE') {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        link = `${appUrl}/reuniao/${ag.id}`;
        await tx.agendamento.update({
          where: { id: ag.id },
          data: { linkOnline: link },
        });
        ag.linkOnline = link;
      }

      await tx.disponibilidade.update({
        where: { id: slot.id },
        data: {
          status: 'RESERVADO',
          agendamentoId: ag.id,
        },
      });

      return ag;
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
    if (role === 'DIRETORIA' || role === 'SUPORTE') {
      return app.prisma.agendamento.findMany({
        where: role === 'SUPORTE' ? { profissional: { usuario: { role: { not: 'DIRETORIA' as const } } } } : undefined,
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
    const ag = await app.prisma.agendamento.findUnique({
      where: { id },
      include: { profissional: { include: { usuario: true } } },
    });
    if (!ag) throw new AppError(404, 'Agendamento não encontrado');

    if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      if (ag.funcionarioId !== funcId) throw new AppError(403, 'Acesso negado');
      // Funcionário só pode confirmar ou cancelar
      if (!['CONFIRMADO', 'CANCELADO'].includes(input.status)) {
        throw new AppError(403, 'Funcionário só pode confirmar ou cancelar');
      }
    } else if (role === 'SUPORTE') {
      if (ag.profissional.usuario.role === 'DIRETORIA') {
        throw new AppError(403, 'Acesso negado: suporte não pode alterar agendamento da diretoria');
      }
    } else if (role !== 'DIRETORIA') {
      const colab = await profissional(usuarioId);
      if (ag.profissionalId !== colab.id) throw new AppError(403, 'Acesso negado');
    }

    const updated = await app.prisma.agendamento.update({ where: { id }, data: { status: input.status } });

    // Liberar slot de disponibilidade ao cancelar
    if (input.status === 'CANCELADO') {
      const slot = await app.prisma.disponibilidade.findFirst({ where: { agendamentoId: id } });
      if (slot) {
        await app.prisma.disponibilidade.update({
          where: { id: slot.id },
          data: { status: 'LIVRE', agendamentoId: null },
        });
      }
    }

    return updated;
  }

  async function remover(id: string, usuarioId: string, role: string) {
    const ag = await app.prisma.agendamento.findUnique({
      where: { id },
      include: { profissional: { include: { usuario: true } } },
    });
    if (!ag) throw new AppError(404, 'Agendamento não encontrado');
    if (role === 'SUPORTE') {
      if (ag.profissional.usuario.role === 'DIRETORIA') {
        throw new AppError(403, 'Acesso negado: suporte não pode remover agendamento da diretoria');
      }
    } else if (role !== 'DIRETORIA') {
      const colab = await profissional(usuarioId);
      if (ag.profissionalId !== colab.id) throw new AppError(403, 'Acesso negado');
    }

    // Liberar slot de disponibilidade vinculado
    const slot = await app.prisma.disponibilidade.findFirst({ where: { agendamentoId: id } });
    if (slot) {
      await app.prisma.disponibilidade.update({
        where: { id: slot.id },
        data: { status: 'LIVRE', agendamentoId: null },
      });
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

  // ─── Disponibilidade ───────────────────────────────────────────────

  async function gerarDisponibilidade(usuarioId: string, role: string, input: CriarDisponibilidadeInput) {
    let colab: { id: string; setor: Setor | null; nome: string };

    if ((role === 'DIRETORIA' || role === 'SUPORTE') && input.profissionalId) {
      const targetColab = await app.prisma.colaborador.findUnique({
        where: { id: input.profissionalId },
        include: { usuario: true },
      });
      if (!targetColab) throw new AppError(404, 'Profissional não encontrado');
      if (role === 'SUPORTE' && targetColab.usuario.role === 'DIRETORIA') {
        throw new AppError(403, 'Acesso negado: suporte não pode gerenciar disponibilidade da diretoria');
      }
      colab = targetColab;
    } else {
      colab = await profissional(usuarioId);
    }

    if (!colab.setor) throw new AppError(400, 'Profissional sem setor definido');
    const setor = colab.setor;

    // Expand input into concrete slot intervals [inicio, fim]
    const intervals: { inicio: Date; fim: Date }[] = [];

    if (input.modo === 'individual') {
      const inicio = new Date(input.inicio);
      const fim = new Date(inicio.getTime() + input.duracaoMin * 60_000);
      intervals.push({ inicio, fim });
    } else if (input.modo === 'bloco') {
      const dayStart = new Date(`${input.data}T${input.horaInicio}:00`);
      const dayEnd = new Date(`${input.data}T${input.horaFim}:00`);
      let cursor = dayStart.getTime();
      while (cursor + input.duracaoMin * 60_000 <= dayEnd.getTime()) {
        intervals.push({ inicio: new Date(cursor), fim: new Date(cursor + input.duracaoMin * 60_000) });
        cursor += input.duracaoMin * 60_000;
      }
    } else {
      // semanal
      const now = new Date();
      for (const dia of input.diasSemana) {
        for (let w = 0; w < input.semanas; w++) {
          // Find next occurrence of `dia` from today + w weeks
          const base = new Date(now);
          base.setDate(base.getDate() + ((dia - base.getDay() + 7) % 7) + w * 7);
          // If first week and the day is today but already past, skip to next week handled by modular
          if (w === 0 && base <= now) base.setDate(base.getDate() + 7);

          const dayStr = base.toISOString().slice(0, 10);
          const dayStart = new Date(`${dayStr}T${input.horaInicio}:00`);
          const dayEnd = new Date(`${dayStr}T${input.horaFim}:00`);
          let cursor = dayStart.getTime();
          while (cursor + input.duracaoMin * 60_000 <= dayEnd.getTime()) {
            intervals.push({ inicio: new Date(cursor), fim: new Date(cursor + input.duracaoMin * 60_000) });
            cursor += input.duracaoMin * 60_000;
          }
        }
      }
    }

    if (intervals.length === 0) return { criados: 0 };

    // Find overall range for overlap query
    const minInicio = new Date(Math.min(...intervals.map((i) => i.inicio.getTime())));
    const maxFim = new Date(Math.max(...intervals.map((i) => i.fim.getTime())));

    const existing = await app.prisma.disponibilidade.findMany({
      where: {
        profissionalId: colab.id,
        inicio: { lt: maxFim },
        fim: { gt: minInicio },
      },
      select: { inicio: true, fim: true },
    });

    // Filter out intervals that overlap with any existing slot
    const nonOverlapping = intervals.filter((slot) =>
      !existing.some((ex) => slot.inicio < ex.fim && slot.fim > ex.inicio),
    );

    if (nonOverlapping.length === 0) return { criados: 0 };

    const result = await app.prisma.disponibilidade.createMany({
      data: nonOverlapping.map((s) => ({
        profissionalId: colab.id,
        setor,
        inicio: s.inicio,
        fim: s.fim,
        status: 'LIVRE' as const,
      })),
    });

    return { criados: result.count };
  }

  async function listarDisponibilidade(usuarioId: string, role: string, de: Date, ate: Date, profissionalId?: string) {
    let targetProfId: string;
    if ((role === 'DIRETORIA' || role === 'SUPORTE') && profissionalId) {
      const targetColab = await app.prisma.colaborador.findUnique({
        where: { id: profissionalId },
        include: { usuario: true },
      });
      if (!targetColab) throw new AppError(404, 'Profissional não encontrado');
      if (role === 'SUPORTE' && targetColab.usuario.role === 'DIRETORIA') {
        throw new AppError(403, 'Acesso negado: suporte não pode acessar disponibilidade da diretoria');
      }
      targetProfId = targetColab.id;
    } else {
      const colab = await profissional(usuarioId);
      targetProfId = colab.id;
    }
    return app.prisma.disponibilidade.findMany({
      where: {
        profissionalId: targetProfId,
        inicio: { gte: de, lte: ate },
      },
      orderBy: { inicio: 'asc' },
    });
  }

  async function removerDisponibilidade(id: string, usuarioId: string, role: string) {
    const slot = await app.prisma.disponibilidade.findUnique({
      where: { id },
      include: { profissional: { include: { usuario: true } } },
    });
    if (!slot) throw new AppError(404, 'Slot não encontrado');
    if (slot.status !== 'LIVRE') throw new AppError(409, 'Slot reservado não pode ser removido');
    if (role === 'SUPORTE') {
      if (slot.profissional.usuario.role === 'DIRETORIA') {
        throw new AppError(403, 'Acesso negado: suporte não pode remover disponibilidade da diretoria');
      }
    } else if (role !== 'DIRETORIA') {
      const colab = await profissional(usuarioId);
      if (slot.profissionalId !== colab.id) throw new AppError(403, 'Acesso negado');
    }
    await app.prisma.disponibilidade.delete({ where: { id } });
    return { ok: true };
  }

  async function slotsLivres({ setor, de, ate }: { setor?: string; de: Date; ate: Date }) {
    return app.prisma.disponibilidade.findMany({
      where: {
        ...(setor ? { setor: setor as Setor } : {}),
        status: 'LIVRE',
        inicio: { gte: de },
        fim: { lte: ate },
      },
      orderBy: { inicio: 'asc' },
      include: { profissional: { select: { nome: true } } },
    });
  }

  async function reservarSlot(slotId: string, usuarioId: string, input: ReservarSlotInput) {
    const agendamento = await app.prisma.$transaction(async (tx) => {
      const updated = await tx.disponibilidade.updateMany({
        where: { id: slotId, status: 'LIVRE' },
        data: { status: 'RESERVADO' },
      });
      if (updated.count === 0) throw new AppError(409, 'Horário já reservado');

      const slot = await tx.disponibilidade.findUniqueOrThrow({ where: { id: slotId } });
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);

      const modalidade = input.modalidade ?? 'PRESENCIAL';
      const ag = await tx.agendamento.create({
        data: {
          funcionarioId: funcId,
          profissionalId: slot.profissionalId,
          setor: slot.setor,
          dataHora: slot.inicio,
          modalidade,
          observacoes: input.observacoes,
          criadoPor: usuarioId,
        },
      });

      let link = null;
      if (modalidade === 'ONLINE') {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        link = `${appUrl}/reuniao/${ag.id}`;
        await tx.agendamento.update({
          where: { id: ag.id },
          data: { linkOnline: link },
        });
        ag.linkOnline = link;
      }

      await tx.disponibilidade.update({
        where: { id: slotId },
        data: { agendamentoId: ag.id },
      });

      return ag;
    });

    // Post-transaction: notifications
    const slot = await app.prisma.disponibilidade.findUnique({
      where: { id: slotId },
      include: { profissional: { select: { nome: true, usuarioId: true } } },
    });
    const func = await app.prisma.funcionario.findUnique({
      where: { id: agendamento.funcionarioId },
      select: { nome: true, telefone: true, usuario: { select: { email: true } } },
    });

    if (slot && func) {
      const profUser = await app.prisma.usuario.findUnique({
        where: { id: slot.profissional.usuarioId },
        select: { email: true },
      });
      const profColab = await app.prisma.colaborador.findUnique({
        where: { usuarioId: slot.profissional.usuarioId },
        select: { telefone: true },
      });

      const quando = fmtData(agendamento.dataHora);
      const setorLabel = SETOR_LABEL[agendamento.setor];
      const msg = `Novo agendamento: ${func.nome} reservou ${setorLabel} para ${quando}.`;

      await Promise.allSettled([
        profUser
          ? enviarEmail({
              to: profUser.email,
              subject: `Novo agendamento de ${setorLabel}`,
              html: `<p>${msg}</p>`,
            })
          : Promise.resolve(),
        profColab?.telefone ? enviarWhatsApp(profColab.telefone, msg) : Promise.resolve(),
      ]);

      await criarEventoAgenda({
        titulo: `Atendimento ${setorLabel} — ${func.nome}`,
        descricao: agendamento.observacoes ?? undefined,
        inicio: agendamento.dataHora,
      });
    }

    return agendamento;
  }

  async function calendario(usuarioId: string, role: string, filtros: CalendarioQuery) {
    const { de, ate, setor, profissionalId } = filtros;
    const PROF_ROLES = ['PSICOLOGO', 'NUTRICIONISTA', 'JURIDICO', 'FINANCEIRO_ATENDIMENTO'];

    let agWhere: Record<string, unknown> = { dataHora: { gte: de, lte: ate } };
    let slotWhere: Record<string, unknown> = { inicio: { gte: de, lte: ate } };

    if (role === 'DIRETORIA' || role === 'SUPORTE') {
      if (role === 'SUPORTE') {
        agWhere.profissional = { usuario: { role: { not: 'DIRETORIA' as const } } };
        slotWhere.profissional = { usuario: { role: { not: 'DIRETORIA' as const } } };
      }
      if (setor) {
        agWhere.setor = setor;
        slotWhere.setor = setor;
      }
      if (profissionalId) {
        agWhere.profissionalId = profissionalId;
        slotWhere.profissionalId = profissionalId;
      }
    } else if (PROF_ROLES.includes(role)) {
      const colab = await profissional(usuarioId);
      agWhere.profissionalId = colab.id;
      slotWhere.profissionalId = colab.id;
    } else {
      // FUNCIONARIO
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      agWhere.funcionarioId = funcId;
      slotWhere.status = 'LIVRE';
      if (setor) slotWhere.setor = setor;
    }

    const [agendamentos, slots] = await Promise.all([
      app.prisma.agendamento.findMany({
        where: agWhere,
        orderBy: { dataHora: 'asc' },
        include: {
          funcionario: { select: { nome: true } },
          profissional: { select: { nome: true } },
        },
      }),
      app.prisma.disponibilidade.findMany({
        where: slotWhere,
        orderBy: { inicio: 'asc' },
        include: { profissional: { select: { nome: true } } },
      }),
    ]);

    return { agendamentos, slots };
  }

  async function obterReuniaoToken(agendamentoId: string, usuarioId: string, role: string) {
    const ag = await app.prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        funcionario: true,
        profissional: true,
      },
    });

    if (!ag) throw new AppError(404, 'Agendamento não encontrado');

    let autorizado = false;
    let nomeParticipante = 'Usuário';

    if (role === 'DIRETORIA' || role === 'SUPORTE') {
      autorizado = true;
      const user = await app.prisma.usuario.findUnique({ where: { id: usuarioId }, include: { colaborador: true } });
      nomeParticipante = user?.colaborador?.nome ?? 'Administrador';
    } else if (role === 'FUNCIONARIO') {
      const funcId = await funcionarioIdDoUsuario(app, usuarioId);
      if (ag.funcionarioId === funcId) {
        autorizado = true;
        nomeParticipante = ag.funcionario.nome;
      }
    } else {
      const colab = await profissional(usuarioId);
      if (ag.profissionalId === colab.id) {
        autorizado = true;
        nomeParticipante = colab.nome;
      }
    }

    if (!autorizado) throw new AppError(403, 'Acesso negado');

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secretsecret';
    
    const { AccessToken } = await import('livekit-server-sdk');
    
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${nomeParticipante} (${role === 'FUNCIONARIO' ? 'Cliente' : 'Profissional'})`,
    });
    
    const roomName = `room-${ag.id}`;
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

    return {
      token,
      serverUrl,
      roomName,
    };
  }

  return {
    criar,
    listar,
    atualizarStatus,
    remover,
    listarFuncionarios,
    gerarDisponibilidade,
    listarDisponibilidade,
    removerDisponibilidade,
    slotsLivres,
    reservarSlot,
    calendario,
    obterReuniaoToken,
  };
}
