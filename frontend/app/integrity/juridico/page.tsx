'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Scale, FolderOpen, Plus } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { CasoDetail } from '@/components/juridico/caso-detail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const AREAS = ['TRABALHISTA', 'FAMILIA', 'CONSUMIDOR', 'CRIMINAL', 'PREVIDENCIARIO', 'CIVIL', 'OUTRO'];
const STATUS_LABEL: Record<string, string> = { ABERTO: 'Aberto', EM_ANDAMENTO: 'Em andamento', ENCERRADO: 'Encerrado' };

interface FuncItem {
  id: string;
  nome: string;
  cargo: string;
  empresa: string;
  temDemanda: boolean;
  casos: number;
}
interface Caso {
  id: string;
  titulo: string;
  areaDir: string;
  status: string;
}

export default function JuridicoPage() {
  const [funcs, setFuncs] = useState<FuncItem[] | null>(null);
  const [func, setFunc] = useState<FuncItem | null>(null);
  const [caso, setCaso] = useState<string | null>(null);

  async function carregar() {
    const { data } = await api.get<FuncItem[]>('/juridico/funcionarios');
    setFuncs(data);
  }
  useEffect(() => {
    carregar().catch(() => setFuncs([]));
  }, []);

  if (caso) return <CasoDetail casoId={caso} onVoltar={() => setCaso(null)} />;
  if (func) return <CasosDoFuncionario func={func} onVoltar={() => { setFunc(null); carregar(); }} onAbrir={setCaso} />;

  return (
    <>
      <PageHeader title="Atendimentos — Jurídico" description="Funcionários e seus casos jurídicos" />
      {funcs === null ? (
        <Skeleton className="h-64" />
      ) : funcs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <Scale className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhum funcionário disponível</p>
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead>Demanda</TableHead>
                <TableHead>Casos</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcs.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div className="font-medium">{f.nome}</div>
                    <div className="text-xs text-muted-foreground">{f.cargo}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{f.empresa}</TableCell>
                  <TableCell>
                    <Badge variant={f.temDemanda ? 'default' : 'secondary'}>{f.temDemanda ? 'Sim' : 'Não'}</Badge>
                  </TableCell>
                  <TableCell>{f.casos}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setFunc(f)}>
                      <FolderOpen className="mr-1 h-4 w-4" /> Casos
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function CasosDoFuncionario({ func, onVoltar, onAbrir }: { func: FuncItem; onVoltar: () => void; onAbrir: (id: string) => void }) {
  const [casos, setCasos] = useState<Caso[] | null>(null);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<{ areaDir: string; titulo: string; descricao?: string }>();

  async function carregar() {
    const { data } = await api.get<{ casos: Caso[] }>(`/juridico/funcionarios/${func.id}/casos`);
    setCasos(data.casos);
  }
  useEffect(() => {
    carregar().catch(() => setCasos([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [func.id]);

  async function criar(d: { areaDir: string; titulo: string; descricao?: string }) {
    try {
      const { data } = await api.post('/juridico/casos', { funcionarioId: func.id, ...d });
      setOpen(false);
      reset();
      onAbrir(data.id);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onVoltar} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{func.nome}</h2>
          <p className="text-sm text-muted-foreground">Casos jurídicos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> Novo caso
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo caso jurídico</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(criar)} className="space-y-4">
              <div className="space-y-2">
                <Label>Área do direito</Label>
                <Controller
                  control={control}
                  name="areaDir"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input id="titulo" {...register('titulo', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Input id="descricao" {...register('descricao')} />
              </div>
              <Button type="submit" className="w-full">
                Criar caso
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {casos === null ? (
        <Skeleton className="h-48" />
      ) : casos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum caso. Crie o primeiro com “Novo caso”.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {casos.map((c) => (
            <button
              key={c.id}
              onClick={() => onAbrir(c.id)}
              className="rounded-md border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.titulo}</span>
                <Badge variant="secondary">{STATUS_LABEL[c.status] ?? c.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.areaDir}</p>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
