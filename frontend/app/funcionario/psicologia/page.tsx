'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Brain, Download, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface MeuProntuario {
  planoTerapeutico: string | null;
  profissional: { nome: string; registro: string | null };
  sessoes: { id: string; data: string; proximaData: string | null }[];
  metas: { id: string; descricao: string; atingida: boolean }[];
  documentos: { id: string; nomeArq: string }[];
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function MeuPsicologia() {
  const [p, setP] = useState<MeuProntuario | null | undefined>(undefined);

  useEffect(() => {
    api
      .get<MeuProntuario | null>('/psicologia/meu-prontuario')
      .then(({ data }) => setP(data))
      .catch(() => setP(null));
  }, []);

  async function baixar(docId: string) {
    try {
      const { data } = await api.get<{ url: string }>(`/psicologia/documentos/${docId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (p === undefined) return <Skeleton className="h-64" />;

  return (
    <>
      <PageHeader title="Psicologia" description="Seu acompanhamento psicológico" />
      {!p ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <Brain className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Você ainda não está em acompanhamento</p>
          <p className="text-sm text-muted-foreground">Assim que um profissional iniciar, aparecerá aqui.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profissional responsável</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{p.profissional.nome}</p>
              {p.profissional.registro && <p className="text-muted-foreground">{p.profissional.registro}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plano terapêutico</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
              {p.planoTerapeutico || 'Ainda não definido.'}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessões</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {p.sessoes.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma sessão ainda.</p>
              ) : (
                <ul className="space-y-1">
                  {p.sessoes.map((s) => (
                    <li key={s.id}>
                      {fmt(s.data)}
                      {s.proximaData && <span className="text-muted-foreground"> · próxima: {fmt(s.proximaData)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {p.metas.length === 0 ? (
                <p className="text-muted-foreground">Sem metas definidas.</p>
              ) : (
                <ul className="space-y-1">
                  {p.metas.map((m) => (
                    <li key={m.id} className={m.atingida ? 'text-muted-foreground line-through' : ''}>
                      {m.descricao}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {p.documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum documento disponível.</p>
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
      )}
    </>
  );
}
