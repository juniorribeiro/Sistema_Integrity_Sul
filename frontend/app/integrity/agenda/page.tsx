'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, CalendarDays } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AgendamentoCard, type Agendamento } from '@/components/agenda/agendamento-card';

interface FuncOpt {
  id: string;
  nome: string;
  empresa: string;
}

export default function AgendaProfissional() {
  const [lista, setLista] = useState<Agendamento[] | null>(null);
  const [funcs, setFuncs] = useState<FuncOpt[]>([]);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<{
    funcionarioId: string;
    dataHora: string;
    modalidade: string;
    linkOnline?: string;
    observacoes?: string;
  }>();

  async function carregar() {
    const { data } = await api.get<Agendamento[]>('/agendamentos');
    setLista(data);
  }
  useEffect(() => {
    carregar().catch(() => setLista([]));
    api.get<FuncOpt[]>('/agendamentos/funcionarios').then(({ data }) => setFuncs(data)).catch(() => {});
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
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function mudarStatus(id: string, status: string) {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function remover(id: string) {
    await api.delete(`/agendamentos/${id}`);
    toast.success('Agendamento removido');
    carregar();
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Seus atendimentos agendados"
        action={
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
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione…" />
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
        }
      />

      {lista === null ? (
        <Skeleton className="h-48" />
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhum agendamento</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((a) => (
            <AgendamentoCard key={a.id} agendamento={a} perfil="profissional" onStatus={mudarStatus} onRemover={remover} />
          ))}
        </div>
      )}
    </>
  );
}
