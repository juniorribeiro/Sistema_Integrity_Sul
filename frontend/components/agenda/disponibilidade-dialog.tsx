'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/auth-store';

/* ─── Types ─── */
export interface ColaboradorOption {
  id: string;
  nome: string;
  setor: string | null;
}

interface IndividualForm {
  inicio: string;
  duracao: string;
  modalidade: string;
  profissionalId?: string;
}

interface BlocoForm {
  data: string;
  horaInicio: string;
  horaFim: string;
  duracao: string;
  modalidade: string;
  profissionalId?: string;
}

interface SemanalForm {
  dias: boolean[];
  horaInicio: string;
  horaFim: string;
  duracao: string;
  semanas: number;
  modalidade: string;
  profissionalId?: string;
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

const DURACOES = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h30' },
];

/* ─── Component ─── */
export function DisponibilidadeDialog({
  open,
  onOpenChange,
  onSuccess,
  colaboradores = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  colaboradores?: ColaboradorOption[];
}) {
  const { usuario } = useAuthStore();
  const exibirProfissional = usuario?.role === 'DIRETORIA' || usuario?.role === 'SUPORTE';
  
  const [tab, setTab] = useState('individual');
  const [loading, setLoading] = useState(false);

  // Individual form
  const indForm = useForm<IndividualForm>({
    defaultValues: { duracao: '60', modalidade: 'PRESENCIAL' },
  });

  // Bloco form
  const blocoForm = useForm<BlocoForm>({
    defaultValues: { duracao: '60', modalidade: 'PRESENCIAL' },
  });

  // Semanal form
  const semanalForm = useForm<SemanalForm>({
    defaultValues: {
      dias: [true, true, true, true, true, false, false],
      duracao: '60',
      semanas: 4,
      modalidade: 'PRESENCIAL',
    },
  });

  async function submitIndividual(d: IndividualForm) {
    setLoading(true);
    try {
      const { data } = await api.post<{ criados: number }>('/agendamentos/disponibilidade', {
        modo: 'individual',
        inicio: d.inicio,
        duracaoMin: Number(d.duracao),
        modalidade: d.modalidade,
        profissionalId: d.profissionalId || undefined,
      });
      toast.success(`${data.criados} slot(s) criado(s)`);
      indForm.reset();
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function submitBloco(d: BlocoForm) {
    setLoading(true);
    try {
      const { data } = await api.post<{ criados: number }>('/agendamentos/disponibilidade', {
        modo: 'bloco',
        data: d.data,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
        duracaoMin: Number(d.duracao),
        modalidade: d.modalidade,
        profissionalId: d.profissionalId || undefined,
      });
      toast.success(`${data.criados} slot(s) criado(s)`);
      blocoForm.reset();
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function submitSemanal(d: SemanalForm) {
    setLoading(true);
    try {
      const diasSelecionados = d.dias
        .map((checked, i) => (checked ? i : -1))
        .filter((i) => i >= 0);
      const { data } = await api.post<{ criados: number }>('/agendamentos/disponibilidade', {
        modo: 'semanal',
        dias: diasSelecionados,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
        duracaoMin: Number(d.duracao),
        semanas: d.semanas,
        modalidade: d.modalidade,
        profissionalId: d.profissionalId || undefined,
      });
      toast.success(`${data.criados} slot(s) criado(s)`);
      semanalForm.reset();
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  /* ─── Duration Select (shared) ─── */
  function DuracaoSelect({ control: ctrl, name }: { control: any; name: 'duracao' }) {
    return (
      <Controller
        control={ctrl}
        name={name}
        rules={{ required: true }}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Duração" />
            </SelectTrigger>
            <SelectContent>
              {DURACOES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    );
  }

  /* ─── Modalidade Select (shared) ─── */
  function ModalidadeSelect({ control: ctrl, name }: { control: any; name: 'modalidade' }) {
    return (
      <Controller
        control={ctrl}
        name={name}
        rules={{ required: true }}
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
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Definir disponibilidade
          </DialogTitle>
          <DialogDescription>
            Crie horários disponíveis para atendimento.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="individual" className="flex-1">Individual</TabsTrigger>
            <TabsTrigger value="bloco" className="flex-1">Bloco</TabsTrigger>
            <TabsTrigger value="semanal" className="flex-1">Semanal</TabsTrigger>
          </TabsList>

          {/* Individual */}
          <TabsContent value="individual">
            <form onSubmit={indForm.handleSubmit(submitIndividual)} className="space-y-4 pt-2">
              {exibirProfissional && (
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Controller
                    control={indForm.control}
                    name="profissionalId"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o profissional…">
                            {colaboradores.find(c => c.id === field.value)
                              ? `${colaboradores.find(c => c.id === field.value)?.nome} (${colaboradores.find(c => c.id === field.value)?.setor})`
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {colaboradores.filter(c => c.setor !== null).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome} ({c.setor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="ind-inicio">Data e hora</Label>
                <Input id="ind-inicio" type="datetime-local" {...indForm.register('inicio', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Duração</Label>
                  <DuracaoSelect control={indForm.control} name="duracao" />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <ModalidadeSelect control={indForm.control} name="modalidade" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar slot
              </Button>
            </form>
          </TabsContent>

          {/* Bloco */}
          <TabsContent value="bloco">
            <form onSubmit={blocoForm.handleSubmit(submitBloco)} className="space-y-4 pt-2">
              {exibirProfissional && (
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Controller
                    control={blocoForm.control}
                    name="profissionalId"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o profissional…">
                            {colaboradores.find(c => c.id === field.value)
                              ? `${colaboradores.find(c => c.id === field.value)?.nome} (${colaboradores.find(c => c.id === field.value)?.setor})`
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {colaboradores.filter(c => c.setor !== null).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome} ({c.setor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="bloco-data">Data</Label>
                <Input id="bloco-data" type="date" {...blocoForm.register('data', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bloco-inicio">Início</Label>
                  <Input id="bloco-inicio" type="time" {...blocoForm.register('horaInicio', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloco-fim">Fim</Label>
                  <Input id="bloco-fim" type="time" {...blocoForm.register('horaFim', { required: true })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Duração do slot</Label>
                  <DuracaoSelect control={blocoForm.control} name="duracao" />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <ModalidadeSelect control={blocoForm.control} name="modalidade" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar bloco de slots
              </Button>
            </form>
          </TabsContent>

          {/* Semanal */}
          <TabsContent value="semanal">
            <form onSubmit={semanalForm.handleSubmit(submitSemanal)} className="space-y-4 pt-2">
              {exibirProfissional && (
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Controller
                    control={semanalForm.control}
                    name="profissionalId"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o profissional…">
                            {colaboradores.find(c => c.id === field.value)
                              ? `${colaboradores.find(c => c.id === field.value)?.nome} (${colaboradores.find(c => c.id === field.value)?.setor})`
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {colaboradores.filter(c => c.setor !== null).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome} ({c.setor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-3">
                  {DIAS_SEMANA.map((dia, i) => (
                    <Controller
                      key={dia}
                      control={semanalForm.control}
                      name={`dias.${i}`}
                      render={({ field }) => (
                        <label className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                          {dia}
                        </label>
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sem-inicio">Hora início</Label>
                  <Input id="sem-inicio" type="time" {...semanalForm.register('horaInicio', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sem-fim">Hora fim</Label>
                  <Input id="sem-fim" type="time" {...semanalForm.register('horaFim', { required: true })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Duração</Label>
                  <DuracaoSelect control={semanalForm.control} name="duracao" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sem-semanas">Semanas</Label>
                  <Input
                    id="sem-semanas"
                    type="number"
                    min={1}
                    max={12}
                    {...semanalForm.register('semanas', { required: true, valueAsNumber: true, min: 1, max: 12 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <ModalidadeSelect control={semanalForm.control} name="modalidade" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar disponibilidade semanal
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
