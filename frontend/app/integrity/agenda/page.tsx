'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, CalendarDays, Loader2, Video } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { CalendarioSemanal, type Slot } from '@/components/agenda/calendario-semanal';
import { DisponibilidadeDialog } from '@/components/agenda/disponibilidade-dialog';
import type { Agendamento } from '@/components/agenda/agendamento-card';

interface FuncOpt {
  id: string;
  nome: string;
  empresa: string;
}

const SETOR_LABEL: Record<string, string> = {
  PSICOLOGIA: 'Psicologia',
  NUTRICAO: 'Nutrição',
  JURIDICO: 'Jurídico',
  FINANCEIRO: 'Financeiro',
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function AgendaProfissional() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[] | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [funcs, setFuncs] = useState<FuncOpt[]>([]);
  
  const [open, setOpen] = useState(false);
  const [dispoOpen, setDispoOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  
  const [semanaAtual, setSemanaAtual] = useState<Date>(() => getMonday(new Date()));

  const { register, handleSubmit, control, reset } = useForm<{
    funcionarioId: string;
    dataHora: string;
    modalidade: string;
    linkOnline?: string;
    observacoes?: string;
  }>();

  async function carregar(monday: Date) {
    const de = monday.toISOString();
    const ate = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
    try {
      const { data } = await api.get<{ agendamentos: Agendamento[]; slots: Slot[] }>(
        `/agendamentos/calendario?de=${de}&ate=${ate}`
      );
      setAgendamentos(data.agendamentos);
      setSlots(data.slots);
    } catch (e) {
      toast.error(apiErrorMessage(e));
      setAgendamentos([]);
      setSlots([]);
    }
  }

  useEffect(() => {
    carregar(semanaAtual).catch(() => {
      setAgendamentos([]);
      setSlots([]);
    });
  }, [semanaAtual]);

  useEffect(() => {
    api.get<FuncOpt[]>('/agendamentos/funcionarios')
      .then(({ data }) => setFuncs(data))
      .catch(() => {});
  }, []);

  async function criar(d: {
    funcionarioId: string;
    dataHora: string;
    modalidade: string;
    linkOnline?: string;
    observacoes?: string;
  }) {
    try {
      await api.post('/agendamentos', {
        funcionarioId: d.funcionarioId,
        dataHora: d.dataHora,
        modalidade: d.modalidade,
        linkOnline: d.linkOnline || undefined,
        observacoes: d.observacoes || undefined,
      });
      toast.success('Agendamento criado — funcionário notificado');
      setOpen(false);
      reset();
      carregar(semanaAtual);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function mudarStatus(id: string, status: string) {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      toast.success(`Status alterado para ${status}`);
      carregar(semanaAtual);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function remover(id: string) {
    try {
      await api.delete(`/agendamentos/${id}`);
      toast.success('Agendamento removido');
      carregar(semanaAtual);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function removerSlot() {
    if (!selectedSlot) return;
    try {
      await api.delete(`/agendamentos/disponibilidade/${selectedSlot.id}`);
      toast.success('Disponibilidade removida');
      setSelectedSlot(null);
      carregar(semanaAtual);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Seus atendimentos agendados e horários disponíveis"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setDispoOpen(true)}>
              Definir disponibilidade
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={
                  <Button>
                    <Plus className="mr-1 h-4 w-4" /> Novo agendamento
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo agendamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(criar)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Funcionário</Label>
                    <Controller
                      control={control}
                      name="funcionarioId"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione…">
                              {funcs.find(f => f.id === field.value)
                                ? `${funcs.find(f => f.id === field.value)?.nome} · ${funcs.find(f => f.id === field.value)?.empresa}`
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {funcs.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nome} · {f.empresa}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataHora">Data e hora</Label>
                    <Input id="dataHora" type="datetime-local" {...register('dataHora', { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Modalidade</Label>
                    <Controller
                      control={control}
                      name="modalidade"
                      rules={{ required: true }}
                      defaultValue="PRESENCIAL"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                            <SelectItem value="ONLINE">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkOnline">Link (se online)</Label>
                    <Input id="linkOnline" placeholder="https://…" {...register('linkOnline')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input id="observacoes" {...register('observacoes')} />
                  </div>
                  <Button type="submit" className="w-full">
                    Agendar e notificar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {agendamentos === null ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : (
        <CalendarioSemanal
          agendamentos={agendamentos}
          slots={slots}
          modo="gerenciar"
          semanaAtual={semanaAtual}
          onSemanaChange={setSemanaAtual}
          onSlotClick={setSelectedSlot}
          onAgendamentoClick={setSelectedAgendamento}
        />
      )}

      {/* Dialog para Criar Disponibilidade */}
      <DisponibilidadeDialog
        open={dispoOpen}
        onOpenChange={setDispoOpen}
        onSuccess={() => carregar(semanaAtual)}
      />

      {/* Dialog Detalhes do Agendamento */}
      <Dialog open={!!selectedAgendamento} onOpenChange={(open) => !open && setSelectedAgendamento(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAgendamento && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2 text-sm">
                <div><strong>Funcionário:</strong> {selectedAgendamento.funcionario?.nome ?? 'Não informado'}</div>
                <div><strong>Setor:</strong> {SETOR_LABEL[selectedAgendamento.setor] ?? selectedAgendamento.setor}</div>
                <div><strong>Data/Hora:</strong> {new Date(selectedAgendamento.dataHora).toLocaleString('pt-BR')}</div>
                <div><strong>Modalidade:</strong> {selectedAgendamento.modalidade === 'ONLINE' ? 'Online' : 'Presencial'}</div>
                {selectedAgendamento.linkOnline && (
                  <div className="pt-2">
                    <Button
                      render={<a href={selectedAgendamento.linkOnline} target="_blank" rel="noreferrer" />}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200"
                    >
                      <Video className="h-4 w-4" /> Entrar na Reunião
                    </Button>
                  </div>
                )}
                {selectedAgendamento.observacoes && (
                  <div><strong>Observações:</strong> {selectedAgendamento.observacoes}</div>
                )}
                <div>
                  <strong>Status:</strong>{' '}
                  <Badge variant={selectedAgendamento.status === 'CONFIRMADO' ? 'default' : selectedAgendamento.status === 'AGENDADO' ? 'secondary' : selectedAgendamento.status === 'REALIZADO' ? 'outline' : 'destructive'}>
                    {selectedAgendamento.status}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {selectedAgendamento.status !== 'REALIZADO' && selectedAgendamento.status !== 'CANCELADO' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={async () => {
                      await mudarStatus(selectedAgendamento.id, 'REALIZADO');
                      setSelectedAgendamento(null);
                    }}>
                      Realizado
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                      await mudarStatus(selectedAgendamento.id, 'CANCELADO');
                      setSelectedAgendamento(null);
                    }}>
                      Cancelar
                    </Button>
                  </div>
                ) : <div />}

                <ConfirmDelete
                  onConfirm={async () => {
                    await remover(selectedAgendamento.id);
                    setSelectedAgendamento(null);
                  }}
                  descricao="Remover este agendamento?"
                  size="sm"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes da Disponibilidade */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Disponibilidade</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2 text-sm">
                <div><strong>Setor:</strong> {SETOR_LABEL[selectedSlot.setor] ?? selectedSlot.setor}</div>
                <div><strong>Início:</strong> {new Date(selectedSlot.inicio).toLocaleString('pt-BR')}</div>
                <div><strong>Fim:</strong> {new Date(selectedSlot.fim).toLocaleString('pt-BR')}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 animate-fade-in">
                    Livre (Disponível)
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                <Button
                  variant="destructive"
                  onClick={removerSlot}
                >
                  Remover Disponibilidade
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
