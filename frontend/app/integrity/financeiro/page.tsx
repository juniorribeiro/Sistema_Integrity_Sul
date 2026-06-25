'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { formatBRL } from '@/components/metricas/setor-bars';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Resumo {
  ano: number;
  receitas: number;
  despesas: number;
  saldo: number;
  aReceber: number;
  aPagar: number;
  fluxoMensal: { mes: number; receita: number; despesa: number }[];
}
interface Lancamento {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PAGO: 'default', PENDENTE: 'secondary', CANCELADO: 'destructive',
};

export default function FinanceiroInterno() {
  const ano = new Date().getFullYear();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [lancs, setLancs] = useState<Lancamento[] | null>(null);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<Record<string, string>>();

  async function carregar() {
    const [r, l] = await Promise.all([
      api.get<Resumo>(`/financeiro-integrity/resumo?ano=${ano}`),
      api.get<Lancamento[]>('/financeiro-integrity/lancamentos'),
    ]);
    setResumo(r.data);
    setLancs(l.data);
  }
  useEffect(() => {
    carregar().catch(() => { setResumo(null); setLancs([]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function criar(d: Record<string, string>) {
    try {
      await api.post('/financeiro-integrity/lancamentos', d);
      toast.success('Lançamento registrado');
      setOpen(false);
      reset();
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  const maxFluxo = resumo ? Math.max(1, ...resumo.fluxoMensal.flatMap((f) => [f.receita, f.despesa])) : 1;

  return (
    <>
      <PageHeader
        title="Financeiro"
        description={`Gestão financeira — ${ano}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-1 h-4 w-4" /> Novo lançamento</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo lançamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(criar)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Controller control={control} name="tipo" rules={{ required: true }} defaultValue="RECEITA"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RECEITA">Receita</SelectItem>
                            <SelectItem value="DESPESA">Despesa</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller control={control} name="status" defaultValue="PAGO"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PAGO">Pago</SelectItem>
                            <SelectItem value="PENDENTE">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input id="categoria" {...register('categoria', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" {...register('descricao', { required: true })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input id="valor" type="number" step="0.01" {...register('valor', { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <Input id="data" type="date" {...register('data', { required: true })} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Registrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {!resumo ? (
        <Skeleton className="h-28" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Receitas" value={formatBRL(resumo.receitas)} icon={TrendingUp} />
            <StatCard title="Despesas" value={formatBRL(resumo.despesas)} icon={TrendingDown} />
            <StatCard title="Saldo" value={formatBRL(resumo.saldo)} icon={Wallet} />
            <StatCard title="A receber / pagar" value={`${formatBRL(resumo.aReceber)}`} icon={TrendingUp} hint={`a pagar: ${formatBRL(resumo.aPagar)}`} />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Fluxo de caixa mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ height: 160 }}>
                {resumo.fluxoMensal.map((f) => (
                  <div key={f.mes} className="flex min-w-[36px] flex-1 flex-col items-center gap-1">
                    <div className="flex h-[120px] w-full items-end justify-center gap-0.5">
                      <div className="w-2.5 rounded-t bg-green-500" style={{ height: `${(f.receita / maxFluxo) * 100}%` }} title={`Receita ${formatBRL(f.receita)}`} />
                      <div className="w-2.5 rounded-t bg-red-400" style={{ height: `${(f.despesa / maxFluxo) * 100}%` }} title={`Despesa ${formatBRL(f.despesa)}`} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{MESES[f.mes - 1]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500" /> Receita</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-400" /> Despesa</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="mt-6">
        {lancs === null ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{new Date(l.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{l.descricao}</TableCell>
                    <TableCell className="hidden sm:table-cell">{l.categoria}</TableCell>
                    <TableCell className={l.tipo === 'RECEITA' ? 'text-green-600' : 'text-destructive'}>
                      {l.tipo === 'RECEITA' ? '+' : '−'} {formatBRL(l.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[l.status] ?? 'secondary'}>{l.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
