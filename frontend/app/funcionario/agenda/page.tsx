'use client';

import { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarioSemanal, type Slot } from '@/components/agenda/calendario-semanal';
import { ReservarDialog } from '@/components/agenda/reservar-dialog';
import type { Agendamento } from '@/components/agenda/agendamento-card';

const SETORES = [
  { value: 'PSICOLOGIA', label: 'Psicologia' },
  { value: 'NUTRICAO', label: 'Nutrição' },
  { value: 'JURIDICO', label: 'Jurídico' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
];

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

export default function AgendaFuncionario() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[] | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [setor, setSetor] = useState<string>('PSICOLOGIA');
  const [semanaAtual, setSemanaAtual] = useState<Date>(() => getMonday(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

  async function carregar(monday: Date, currentSetor: string) {
    const de = monday.toISOString();
    const ate = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
    try {
      const { data } = await api.get<{ agendamentos: Agendamento[]; slots: Slot[] }>(
        `/agendamentos/calendario?de=${de}&ate=${ate}&setor=${currentSetor}`
      );
      setAgendamentos(data.agendamentos);
      // Somente slots LIVRES devem ser mostrados para funcionários
      setSlots(data.slots.filter(s => s.status === 'LIVRE'));
    } catch (e) {
      toast.error(apiErrorMessage(e));
      setAgendamentos([]);
      setSlots([]);
    }
  }

  useEffect(() => {
    carregar(semanaAtual, setor).catch(() => {
      setAgendamentos([]);
      setSlots([]);
    });
  }, [semanaAtual, setor]);

  async function mudarStatus(id: string, status: string) {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      toast.success(`Status atualizado para ${status}`);
      carregar(semanaAtual, setor);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Seus atendimentos e horários livres por setor"
        action={
          <div className="flex items-center gap-2">
            <Label htmlFor="setor-select" className="sr-only">Setor</Label>
            <Select value={setor} onValueChange={(val) => val && setSetor(val)}>
              <SelectTrigger id="setor-select" className="w-[180px]">
                <SelectValue placeholder="Selecione o Setor" />
              </SelectTrigger>
              <SelectContent>
                {SETORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {agendamentos === null ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : (
        <CalendarioSemanal
          agendamentos={agendamentos}
          slots={slots}
          modo="reservar"
          semanaAtual={semanaAtual}
          onSemanaChange={setSemanaAtual}
          onSlotClick={setSelectedSlot}
          onAgendamentoClick={setSelectedAgendamento}
        />
      )}

      {/* Dialog para Reservar Horário */}
      <ReservarDialog
        slot={selectedSlot}
        open={!!selectedSlot}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
        onSuccess={() => carregar(semanaAtual, setor)}
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
                <div><strong>Profissional:</strong> {selectedAgendamento.profissional?.nome ?? 'Não informado'}</div>
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

              {selectedAgendamento.status !== 'REALIZADO' && selectedAgendamento.status !== 'CANCELADO' && (
                <div className="flex gap-2 justify-end pt-2">
                  {selectedAgendamento.status === 'AGENDADO' && (
                    <Button size="sm" onClick={async () => {
                      await mudarStatus(selectedAgendamento.id, 'CONFIRMADO');
                      setSelectedAgendamento(null);
                    }}>
                      Confirmar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                    await mudarStatus(selectedAgendamento.id, 'CANCELADO');
                    setSelectedAgendamento(null);
                  }}>
                    Cancelar Agendamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
