'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, ArrowLeft, UserPlus } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ETAPAS = ['TRIAGEM', 'ENTREVISTA', 'TESTE', 'PROPOSTA', 'CONTRATADO', 'REPROVADO'];
const STATUS_VAGA: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ABERTA: 'default', EM_ANDAMENTO: 'secondary', FECHADA: 'secondary', CANCELADA: 'destructive',
};

interface Vaga { id: string; titulo: string; area: string; status: string; _count: { candidatos: number } }

export function VagasTab() {
  const [lista, setLista] = useState<Vaga[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Record<string, string>>();

  async function carregar() {
    const { data } = await api.get<Vaga[]>('/curriculos/vagas');
    setLista(data);
  }
  useEffect(() => { carregar().catch(() => setLista([])); }, []);

  async function criar(d: Record<string, string>) {
    try {
      await api.post('/curriculos/vagas', d);
      toast.success('Vaga criada');
      setOpen(false); reset(); carregar();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  }

  if (sel) return <VagaPipeline id={sel} onVoltar={() => { setSel(null); carregar(); }} />;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="mr-1 h-4 w-4" /> Nova vaga</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nova vaga</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(criar)} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="titulo">Título</Label><Input id="titulo" {...register('titulo', { required: true })} /></div>
              <div className="space-y-1.5"><Label htmlFor="area">Área</Label><Input id="area" {...register('area', { required: true })} /></div>
              <div className="space-y-1.5"><Label htmlFor="descricao">Descrição</Label><Input id="descricao" {...register('descricao', { required: true })} /></div>
              <Button type="submit" className="w-full">Criar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lista === null ? (
        <Skeleton className="h-48" />
      ) : lista.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma vaga.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((v) => (
            <button key={v.id} onClick={() => setSel(v.id)} className="rounded-md border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">{v.titulo}</span>
                <Badge variant={STATUS_VAGA[v.status] ?? 'secondary'}>{v.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{v.area} · {v._count.candidatos} candidato(s)</p>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

interface PipelineItem { id: string; etapa: string; candidato: { id: string; nome: string; cargo: string } }
interface VagaDetalhe { id: string; titulo: string; area: string; status: string; candidatos: PipelineItem[] }

function VagaPipeline({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const [v, setV] = useState<VagaDetalhe | null>(null);
  const [cands, setCands] = useState<{ id: string; nome: string }[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [escolhido, setEscolhido] = useState('');

  async function carregar() {
    const { data } = await api.get<VagaDetalhe>(`/curriculos/vagas/${id}`);
    setV(data);
  }
  useEffect(() => {
    carregar().catch(() => toast.error('Erro'));
    api.get<{ id: string; nome: string }[]>('/curriculos/candidatos').then(({ data }) => setCands(data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function adicionar() {
    if (!escolhido) return;
    try {
      await api.post(`/curriculos/vagas/${id}/candidatos`, { candidatoId: escolhido });
      setAddOpen(false); setEscolhido(''); carregar();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  }
  async function mover(vcId: string, etapa: string) {
    try { await api.patch(`/curriculos/vaga-candidatos/${vcId}`, { etapa }); carregar(); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  }

  if (!v) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onVoltar} aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{v.titulo}</h2>
          <p className="text-sm text-muted-foreground">{v.area}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm"><UserPlus className="mr-1 h-4 w-4" /> Adicionar</Button>} />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Adicionar candidato</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={escolhido} onValueChange={(val) => setEscolhido(String(val ?? ''))}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {cands.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={adicionar}>Adicionar ao pipeline</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {v.candidatos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum candidato no pipeline. Use “Adicionar”.</p>
      ) : (
        <div className="space-y-2">
          {v.candidatos.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{p.candidato.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.candidato.cargo}</p>
                </div>
                <Select value={p.etapa} onValueChange={(val) => mover(p.id, String(val))}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ETAPAS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
