'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, ArrowLeft, Upload, Download, Star, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Candidato {
  id: string;
  nome: string;
  cargo: string;
  area: string;
  status: string;
  curriculoKey?: string | null;
}
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  DISPONIVEL: 'default', EM_PROCESSO: 'secondary', CONTRATADO: 'outline', INATIVO: 'secondary',
};

export function CandidatosTab() {
  const [lista, setLista] = useState<Candidato[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Record<string, string>>();

  async function carregar() {
    const { data } = await api.get<Candidato[]>('/curriculos/candidatos');
    setLista(data);
  }
  useEffect(() => {
    carregar().catch(() => setLista([]));
  }, []);

  async function criar(d: Record<string, string>) {
    try {
      await api.post('/curriculos/candidatos', d);
      toast.success('Candidato cadastrado');
      setOpen(false);
      reset();
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (sel) return <CandidatoDetail id={sel} onVoltar={() => { setSel(null); carregar(); }} />;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="mr-1 h-4 w-4" /> Novo candidato</Button>} />
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>Novo candidato</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(criar)} className="space-y-3">
              <Campo id="nome" label="Nome" reg={register('nome', { required: true })} />
              <div className="grid grid-cols-2 gap-3">
                <Campo id="email" label="E-mail" type="email" reg={register('email', { required: true })} />
                <Campo id="cpf" label="CPF" reg={register('cpf', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo id="telefone" label="Telefone" reg={register('telefone', { required: true })} />
                <Campo id="cargo" label="Cargo" reg={register('cargo', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo id="area" label="Área" reg={register('area', { required: true })} />
                <Campo id="nivelExp" label="Nível" reg={register('nivelExp', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo id="localidade" label="Localidade" reg={register('localidade', { required: true })} />
                <Campo id="pretensao" label="Pretensão (R$)" type="number" reg={register('pretensao')} />
              </div>
              <Campo id="disponibilidade" label="Disponibilidade" reg={register('disponibilidade', { required: true })} />
              <Button type="submit" className="w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lista === null ? (
        <Skeleton className="h-64" />
      ) : lista.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nenhum candidato cadastrado.</p>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Área</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSel(c.id)}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.area}</TableCell>
                  <TableCell>{c.cargo}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status] ?? 'secondary'}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function Campo({ id, label, reg, type }: { id: string; label: string; reg: ReturnType<ReturnType<typeof useForm>['register']>; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...reg} />
    </div>
  );
}

interface Detalhe extends Candidato {
  email: string;
  telefone: string;
  nivelExp: string;
  localidade: string;
  pretensao: number | null;
  disponibilidade: string;
  avaliacoes: { id: string; nota: number; comentario: string | null }[];
}

function CandidatoDetail({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const [c, setC] = useState<Detalhe | null>(null);
  const [aval, setAval] = useState({ nota: '5', comentario: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const { data } = await api.get<Detalhe>(`/curriculos/candidatos/${id}`);
    setC(data);
  }
  useEffect(() => {
    carregar().catch(() => toast.error('Erro ao carregar'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/curriculos/candidatos/${id}/curriculo`, fd);
      carregar();
      toast.success('Currículo enviado');
    } catch (e) { toast.error(apiErrorMessage(e)); }
  }
  async function baixar() {
    try {
      const { data } = await api.get<{ url: string }>(`/curriculos/candidatos/${id}/curriculo`);
      window.open(data.url, '_blank');
    } catch (e) { toast.error(apiErrorMessage(e)); }
  }
  async function avaliar() {
    try {
      await api.post(`/curriculos/candidatos/${id}/avaliacoes`, { nota: Number(aval.nota), comentario: aval.comentario || undefined });
      setAval({ nota: '5', comentario: '' });
      carregar();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  }

  if (!c) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onVoltar} aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">{c.nome}</h2>
          <p className="text-sm text-muted-foreground">{c.cargo} · {c.area} · {c.localidade}</p>
        </div>
        <Badge className="ml-auto" variant={STATUS_VARIANT[c.status] ?? 'secondary'}>{c.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Dados</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{c.email} · {c.telefone}</p>
            <p className="text-muted-foreground">Nível: {c.nivelExp} · Disponibilidade: {c.disponibilidade}</p>
            {c.pretensao != null && <p className="text-muted-foreground">Pretensão: R$ {c.pretensao.toLocaleString('pt-BR')}</p>}
            <div className="pt-3">
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-4 w-4" /> Enviar CV</Button>
                {c.curriculoKey && <Button size="sm" variant="ghost" onClick={baixar}><Download className="mr-1 h-4 w-4" /> Baixar CV</Button>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Avaliações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={aval.nota} onChange={(e) => setAval((a) => ({ ...a, nota: e.target.value }))}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
              <Input placeholder="Comentário" value={aval.comentario} onChange={(e) => setAval((a) => ({ ...a, comentario: e.target.value }))} />
              <Button size="sm" onClick={avaliar}>Avaliar</Button>
            </div>
            <ul className="space-y-1 text-sm">
              {c.avaliacoes.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <span className="flex items-center text-amber-500">
                    {Array.from({ length: a.nota }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </span>
                  <span className="text-muted-foreground">{a.comentario}</span>
                </li>
              ))}
              {c.avaliacoes.length === 0 && <li className="text-muted-foreground">Sem avaliações.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
