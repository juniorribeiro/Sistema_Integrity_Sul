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
import { Skeleton } from '@/components/ui/skeleton';

interface Prontuario {
  id: string;
  planoTerapeutico: string | null;
  funcionario: {
    nome: string;
    cargo: string;
    empresa: { razaoSocial: string };
    triagem: { psicologia: TriagemPsi | null } | null;
  };
  sessoes: { id: string; data: string; evolucao: string; proximaData: string | null }[];
  metas: { id: string; descricao: string; atingida: boolean }[];
  documentos: { id: string; nomeArq: string; criadoEm: string }[];
}
interface TriagemPsi {
  saudeMentalNota: number;
  stressTrabNota: number;
  ansiedadeTristeza: number;
  qualidadeSono: string;
  acompanhamentoAnterior: boolean;
  medicacaoPsiq: boolean;
  medicacaoDetalhe: string | null;
  situacaoAtual: string | null;
  contatoEmergNome: string;
  contatoEmergTel: string;
  contatoEmergParent: string;
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function ProntuarioDetail({ prontuarioId, onVoltar }: { prontuarioId: string; onVoltar: () => void }) {
  const [pront, setPront] = useState<Prontuario | null>(null);
  const [plano, setPlano] = useState('');
  const [novaSessao, setNovaSessao] = useState({ data: '', evolucao: '', proximaData: '' });
  const [novaMeta, setNovaMeta] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const { data } = await api.get<Prontuario>(`/psicologia/prontuarios/${prontuarioId}`);
    setPront(data);
    setPlano(data.planoTerapeutico ?? '');
  }
  useEffect(() => {
    carregar().catch(() => toast.error('Erro ao carregar prontuário'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prontuarioId]);

  async function salvarPlano() {
    try {
      await api.patch(`/psicologia/prontuarios/${prontuarioId}`, { planoTerapeutico: plano });
      toast.success('Plano terapêutico salvo');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function addSessao() {
    if (!novaSessao.data || !novaSessao.evolucao) return toast.error('Informe data e evolução');
    try {
      await api.post(`/psicologia/prontuarios/${prontuarioId}/sessoes`, {
        data: novaSessao.data,
        evolucao: novaSessao.evolucao,
        proximaData: novaSessao.proximaData || undefined,
      });
      setNovaSessao({ data: '', evolucao: '', proximaData: '' });
      carregar();
      toast.success('Sessão registrada');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function addMeta() {
    if (!novaMeta) return;
    try {
      await api.post(`/psicologia/prontuarios/${prontuarioId}/metas`, { descricao: novaMeta });
      setNovaMeta('');
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function toggleMeta(id: string, atingida: boolean) {
    await api.patch(`/psicologia/metas/${id}`, { atingida: !atingida });
    carregar();
  }

  async function upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/psicologia/prontuarios/${prontuarioId}/documentos`, fd);
      carregar();
      toast.success('Documento enviado');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function baixar(docId: string) {
    try {
      const { data } = await api.get<{ url: string }>(`/psicologia/documentos/${docId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (!pront) return <Skeleton className="h-96" />;
  const t = pront.funcionario.triagem?.psicologia;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onVoltar} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{pront.funcionario.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {pront.funcionario.cargo} · {pront.funcionario.empresa.razaoSocial}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Triagem (sigilo do setor) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triagem de psicologia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {t ? (
              <>
                <Linha label="Saúde mental" valor={`${t.saudeMentalNota}/10`} />
                <Linha label="Estresse no trabalho" valor={`${t.stressTrabNota}/10`} />
                <Linha label="Ansiedade/tristeza" valor={`${t.ansiedadeTristeza}/10`} />
                <Linha label="Qualidade do sono" valor={t.qualidadeSono} />
                <Linha label="Acompanhamento anterior" valor={t.acompanhamentoAnterior ? 'Sim' : 'Não'} />
                <Linha label="Medicação psiquiátrica" valor={t.medicacaoPsiq ? t.medicacaoDetalhe || 'Sim' : 'Não'} />
                {t.situacaoAtual && <p className="pt-2 text-muted-foreground">“{t.situacaoAtual}”</p>}
                <div className="mt-3 rounded-md bg-muted p-2">
                  <p className="text-xs font-medium">Contato de emergência</p>
                  <p>
                    {t.contatoEmergNome} · {t.contatoEmergTel} ({t.contatoEmergParent})
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Funcionário ainda não preencheu a triagem.</p>
            )}
          </CardContent>
        </Card>

        {/* Plano terapêutico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plano terapêutico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={6} value={plano} onChange={(e) => setPlano(e.target.value)} placeholder="Descreva o plano…" />
            <Button size="sm" onClick={salvarPlano}>
              Salvar plano
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sessões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="datetime-local" value={novaSessao.data} onChange={(e) => setNovaSessao((s) => ({ ...s, data: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Evolução</Label>
              <Input value={novaSessao.evolucao} onChange={(e) => setNovaSessao((s) => ({ ...s, evolucao: e.target.value }))} placeholder="Anotação clínica" />
            </div>
            <div>
              <Label className="text-xs">Próxima</Label>
              <Input type="datetime-local" value={novaSessao.proximaData} onChange={(e) => setNovaSessao((s) => ({ ...s, proximaData: e.target.value }))} />
            </div>
            <Button size="sm" onClick={addSessao}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {pront.sessoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sessão registrada.</p>
          ) : (
            <ul className="divide-y">
              {pront.sessoes.map((s) => (
                <li key={s.id} className="py-2 text-sm">
                  <span className="font-medium">{fmt(s.data)}</span> — {s.evolucao}
                  {s.proximaData && <span className="text-muted-foreground"> · próxima: {fmt(s.proximaData)}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Metas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={novaMeta} onChange={(e) => setNovaMeta(e.target.value)} placeholder="Nova meta" />
              <Button size="sm" onClick={addMeta}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              {pront.metas.map((m) => (
                <li key={m.id}>
                  <button onClick={() => toggleMeta(m.id, m.atingida)} className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-muted">
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${m.atingida ? 'border-green-600 bg-green-600 text-white' : 'border-input'}`}>
                      {m.atingida && <Check className="h-3 w-3" />}
                    </span>
                    <span className={m.atingida ? 'text-muted-foreground line-through' : ''}>{m.descricao}</span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos & laudos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> Enviar arquivo
            </Button>
            {pront.documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento.</p>
            ) : (
              <ul className="space-y-1">
                {pront.documentos.map((d) => (
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

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{valor}</span>
    </div>
  );
}
