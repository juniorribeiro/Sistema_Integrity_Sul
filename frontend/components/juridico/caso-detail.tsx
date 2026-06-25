'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Download, Plus, Check, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LinhaTriagem } from '@/components/atendimento/prontuario-simples';

interface Caso {
  id: string;
  titulo: string;
  areaDir: string;
  descricao: string | null;
  numeroProcesso: string | null;
  fase: string | null;
  status: string;
  funcionario: { nome: string; cargo: string; empresa: { razaoSocial: string }; triagem: { juridico: Record<string, unknown> | null } | null };
  prazos: { id: string; descricao: string; data: string; cumprido: boolean }[];
  documentos: { id: string; nomeArq: string }[];
}

const STATUS = [
  { v: 'ABERTO', l: 'Aberto' },
  { v: 'EM_ANDAMENTO', l: 'Em andamento' },
  { v: 'ENCERRADO', l: 'Encerrado' },
];
const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function CasoDetail({ casoId, onVoltar }: { casoId: string; onVoltar: () => void }) {
  const [c, setC] = useState<Caso | null>(null);
  const [form, setForm] = useState({ descricao: '', numeroProcesso: '', fase: '', status: 'ABERTO' });
  const [prazo, setPrazo] = useState({ descricao: '', data: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const { data } = await api.get<Caso>(`/juridico/casos/${casoId}`);
    setC(data);
    setForm({
      descricao: data.descricao ?? '',
      numeroProcesso: data.numeroProcesso ?? '',
      fase: data.fase ?? '',
      status: data.status,
    });
  }
  useEffect(() => {
    carregar().catch(() => toast.error('Erro ao carregar caso'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casoId]);

  async function salvar() {
    try {
      await api.patch(`/juridico/casos/${casoId}`, {
        descricao: form.descricao || undefined,
        numeroProcesso: form.numeroProcesso || undefined,
        fase: form.fase || undefined,
        status: form.status,
      });
      carregar();
      toast.success('Caso atualizado');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function addPrazo() {
    if (!prazo.descricao || !prazo.data) return toast.error('Informe descrição e data');
    try {
      await api.post(`/juridico/casos/${casoId}/prazos`, prazo);
      setPrazo({ descricao: '', data: '' });
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function togglePrazo(id: string, cumprido: boolean) {
    await api.patch(`/juridico/prazos/${id}`, { cumprido: !cumprido });
    carregar();
  }
  async function upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/juridico/casos/${casoId}/documentos`, fd);
      carregar();
      toast.success('Documento enviado');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function baixar(docId: string) {
    try {
      const { data } = await api.get<{ url: string }>(`/juridico/documentos/${docId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (!c) return <Skeleton className="h-96" />;
  const t = c.funcionario.triagem?.juridico;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onVoltar} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{c.titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {c.areaDir} · {c.funcionario.nome} · {c.funcionario.empresa.razaoSocial}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do caso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: String(v ?? 'ABERTO') }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => (
                      <SelectItem key={s.v} value={s.v}>
                        {s.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Fase</Label>
                <Input value={form.fase} onChange={(e) => setForm((f) => ({ ...f, fase: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Nº do processo</Label>
              <Input value={form.numeroProcesso} onChange={(e) => setForm((f) => ({ ...f, numeroProcesso: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea rows={4} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </div>
            <Button size="sm" onClick={salvar}>
              Salvar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triagem jurídica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {t ? (
              <>
                <LinhaTriagem label="Tem demanda" valor={t.temDemanda ? 'Sim' : 'Não'} />
                {t.areaDir != null && <LinhaTriagem label="Área" valor={String(t.areaDir)} />}
                {t.urgencia != null && <LinhaTriagem label="Urgência" valor={String(t.urgencia)} />}
                <LinhaTriagem label="Processo em andamento" valor={t.processoAndamento ? 'Sim' : 'Não'} />
                <LinhaTriagem label="Possui documentação" valor={t.temDocumentacao ? 'Sim' : 'Não'} />
                {typeof t.descricao === 'string' && t.descricao && (
                  <p className="pt-2 text-muted-foreground">“{t.descricao}”</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Funcionário ainda não preencheu a triagem.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prazos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Input placeholder="Descrição" value={prazo.descricao} onChange={(e) => setPrazo((p) => ({ ...p, descricao: e.target.value }))} />
              <Input type="date" value={prazo.data} onChange={(e) => setPrazo((p) => ({ ...p, data: e.target.value }))} />
              <Button size="sm" onClick={addPrazo}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              {c.prazos.map((pz) => (
                <li key={pz.id}>
                  <button onClick={() => togglePrazo(pz.id, pz.cumprido)} className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-muted">
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${pz.cumprido ? 'border-green-600 bg-green-600 text-white' : 'border-input'}`}>
                      {pz.cumprido && <Check className="h-3 w-3" />}
                    </span>
                    <span className={pz.cumprido ? 'text-muted-foreground line-through' : ''}>
                      {pz.descricao} — {fmt(pz.data)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> Enviar arquivo
            </Button>
            {c.documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento.</p>
            ) : (
              <ul className="space-y-1">
                {c.documentos.map((d) => (
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
