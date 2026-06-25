'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { AgendamentoCard, type Agendamento } from '@/components/agenda/agendamento-card';

export default function AgendaFuncionario() {
  const [lista, setLista] = useState<Agendamento[] | null>(null);

  async function carregar() {
    const { data } = await api.get<Agendamento[]>('/agendamentos');
    setLista(data);
  }
  useEffect(() => {
    carregar().catch(() => setLista([]));
  }, []);

  async function mudarStatus(id: string, status: string) {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <>
      <PageHeader title="Agenda" description="Seus atendimentos" />
      {lista === null ? (
        <Skeleton className="h-48" />
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhum atendimento agendado</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((a) => (
            <AgendamentoCard key={a.id} agendamento={a} perfil="funcionario" onStatus={mudarStatus} />
          ))}
        </div>
      )}
    </>
  );
}
