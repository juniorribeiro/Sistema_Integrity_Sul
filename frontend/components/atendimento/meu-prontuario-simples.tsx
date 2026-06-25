'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Inbox, Download, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Prontuario {
  profissional: { nome: string; registro: string | null };
  consultas: { id: string; data: string; proximaData: string | null }[];
  evolucoes?: { id: string; data: string; pesoKg: number; imc: number | null }[];
  documentos: { id: string; nomeArq: string }[];
  [k: string]: unknown;
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function MeuProntuarioSimples({
  titulo,
  base,
  planoLabel,
  planoField,
  comEvolucoes,
}: {
  titulo: string;
  base: string;
  planoLabel: string;
  planoField: string;
  comEvolucoes?: boolean;
}) {
  const [p, setP] = useState<Prontuario | null | undefined>(undefined);

  useEffect(() => {
    api
      .get<Prontuario | null>(`${base}/meu-prontuario`)
      .then(({ data }) => setP(data))
      .catch(() => setP(null));
  }, [base]);

  async function baixar(docId: string) {
    try {
      const { data } = await api.get<{ url: string }>(`${base}/documentos/${docId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (p === undefined) return <Skeleton className="h-64" />;

  return (
    <>
      <PageHeader title={titulo} description="Seu acompanhamento" />
      {!p ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Você ainda não está em acompanhamento</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profissional</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{p.profissional.nome}</p>
              {p.profissional.registro && <p className="text-muted-foreground">{p.profissional.registro}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{planoLabel}</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
              {(p[planoField] as string) || 'Ainda não definido.'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consultas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {p.consultas.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma consulta ainda.</p>
              ) : (
                <ul className="space-y-1">
                  {p.consultas.map((c) => (
                    <li key={c.id}>
                      {fmt(c.data)}
                      {c.proximaData && <span className="text-muted-foreground"> · próxima: {fmt(c.proximaData)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {comEvolucoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {!p.evolucoes || p.evolucoes.length === 0 ? (
                  <p className="text-muted-foreground">Sem registros.</p>
                ) : (
                  <ul className="space-y-1">
                    {p.evolucoes.map((e) => (
                      <li key={e.id}>
                        {fmt(e.data)}: <span className="font-medium">{e.pesoKg} kg</span>
                        {e.imc && ` · IMC ${e.imc}`}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
          <Card className={comEvolucoes ? 'lg:col-span-2' : ''}>
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
