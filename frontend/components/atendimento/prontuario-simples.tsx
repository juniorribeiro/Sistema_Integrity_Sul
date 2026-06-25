'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Download, Plus, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface ProntuarioSimplesConfig {
  base: string; // ex.: '/nutricao'
  planoLabel: string;
  planoValue: (p: Prontuario) => string | null;
  planoField: string; // ex.: 'planoAlimentar'
  triagem: (p: Prontuario) => Record<string, unknown> | null | undefined;
  renderTriagem: (t: Record<string, unknown>) => ReactNode;
  comEvolucoes?: boolean;
}

interface Prontuario {
  id: string;
  funcionario: { nome: string; cargo: string; empresa: { razaoSocial: string }; triagem: Record<string, unknown> | null };
  consultas: { id: string; data: string; anotacoes: string; proximaData: string | null }[];
  evolucoes?: { id: string; data: string; pesoKg: number; imc: number | null; observacoes: string | null }[];
  documentos: { id: string; nomeArq: string }[];
  [k: string]: unknown;
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function ProntuarioSimplesDetail({
  prontuarioId,
  onVoltar,
  config,
}: {
  prontuarioId: string;
  onVoltar: () => void;
  config: ProntuarioSimplesConfig;
}) {
  const [p, setP] = useState<Prontuario | null>(null);
  const [plano, setPlano] = useState('');
  const [consulta, setConsulta] = useState({ data: '', anotacoes: '', proximaData: '' });
  const [evol, setEvol] = useState({ data: '', pesoKg: '', imc: '', observacoes: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const { data } = await api.get<Prontuario>(`${config.base}/prontuarios/${prontuarioId}`);
    setP(data);
    setPlano(config.planoValue(data) ?? '');
  }
  useEffect(() => {
    carregar().catch(() => toast.error('Erro ao carregar prontuário'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prontuarioId]);

  async function salvarPlano() {
    try {
      await api.patch(`${config.base}/prontuarios/${prontuarioId}`, { [config.planoField]: plano });
      toast.success('Plano salvo');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function addConsulta() {
    if (!consulta.data || !consulta.anotacoes) return toast.error('Informe data e anotações');
    try {
      await api.post(`${config.base}/prontuarios/${prontuarioId}/consultas`, {
        data: consulta.data,
        anotacoes: consulta.anotacoes,
        proximaData: consulta.proximaData || undefined,
      });
      setConsulta({ data: '', anotacoes: '', proximaData: '' });
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function addEvolucao() {
    if (!evol.data || !evol.pesoKg) return toast.error('Informe data e peso');
    try {
      await api.post(`${config.base}/prontuarios/${prontuarioId}/evolucoes`, {
        data: evol.data,
        pesoKg: evol.pesoKg,
        imc: evol.imc || undefined,
        observacoes: evol.observacoes || undefined,
      });
      setEvol({ data: '', pesoKg: '', imc: '', observacoes: '' });
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`${config.base}/prontuarios/${prontuarioId}/documentos`, fd);
      carregar();
      toast.success('Documento enviado');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function baixar(docId: string) {
    try {
      const { data } = await api.get<{ url: string }>(`${config.base}/documentos/${docId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (!p) return <Skeleton className="h-96" />;
  const t = config.triagem(p);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onVoltar} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{p.funcionario.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {p.funcionario.cargo} · {p.funcionario.empresa.razaoSocial}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {t ? config.renderTriagem(t) : <p className="text-muted-foreground">Funcionário ainda não preencheu a triagem.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{config.planoLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={6} value={plano} onChange={(e) => setPlano(e.target.value)} placeholder="Descreva…" />
            <Button size="sm" onClick={salvarPlano}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="datetime-local" value={consulta.data} onChange={(e) => setConsulta((s) => ({ ...s, data: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Anotações</Label>
              <Input value={consulta.anotacoes} onChange={(e) => setConsulta((s) => ({ ...s, anotacoes: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Próxima</Label>
              <Input type="datetime-local" value={consulta.proximaData} onChange={(e) => setConsulta((s) => ({ ...s, proximaData: e.target.value }))} />
            </div>
            <Button size="sm" onClick={addConsulta}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {p.consultas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta.</p>
          ) : (
            <ul className="divide-y">
              {p.consultas.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <span className="font-medium">{fmt(c.data)}</span> — {c.anotacoes}
                  {c.proximaData && <span className="text-muted-foreground"> · próxima: {fmt(c.proximaData)}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {config.comEvolucoes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input type="datetime-local" value={evol.data} onChange={(e) => setEvol((s) => ({ ...s, data: e.target.value }))} />
                <Input type="number" placeholder="Peso (kg)" value={evol.pesoKg} onChange={(e) => setEvol((s) => ({ ...s, pesoKg: e.target.value }))} />
                <Input type="number" placeholder="IMC" value={evol.imc} onChange={(e) => setEvol((s) => ({ ...s, imc: e.target.value }))} />
                <Button size="sm" onClick={addEvolucao}>
                  <Plus className="mr-1 h-4 w-4" /> Registrar
                </Button>
              </div>
              <ul className="space-y-1 text-sm">
                {p.evolucoes?.map((e) => (
                  <li key={e.id}>
                    {fmt(e.data)}: <span className="font-medium">{e.pesoKg} kg</span>
                    {e.imc && ` · IMC ${e.imc}`}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className={config.comEvolucoes ? '' : 'lg:col-span-2'}>
          <CardHeader>
            <CardTitle className="text-base">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> Enviar arquivo
            </Button>
            {p.documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento.</p>
            ) : (
              <ul className="space-y-1">
                {p.documentos.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" /> {d.nomeArq}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => baixar(d.id)} aria-label="Baixar">
                      <Download className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Linha rótulo/valor para os renderizadores de triagem. */
export function LinhaTriagem({ label, valor }: { label: string; valor: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{valor}</span>
    </div>
  );
}
