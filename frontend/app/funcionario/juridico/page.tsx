'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Scale, Download, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Caso {
  id: string;
  titulo: string;
  areaDir: string;
  status: string;
  fase: string | null;
  numeroProcesso: string | null;
  profissional: { nome: string; registro: string | null };
  prazos: { id: string; descricao: string; data: string; cumprido: boolean }[];
  documentos: { id: string; nomeArq: string }[];
}

const STATUS_LABEL: Record<string, string> = { ABERTO: 'Aberto', EM_ANDAMENTO: 'Em andamento', ENCERRADO: 'Encerrado' };
const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function MeusCasos() {
  const [casos, setCasos] = useState<Caso[] | null>(null);

  useEffect(() => {
    api
      .get<Caso[]>('/juridico/meus-casos')
      .then(({ data }) => setCasos(data))
      .catch(() => setCasos([]));
  }, []);

  async function baixar(docId: string) {
    try {
      const { data } = await api.get<{ url: string }>(`/juridico/documentos/${docId}/download`);
      window.open(data.url, '_blank');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (casos === null) return <Skeleton className="h-64" />;

  return (
    <>
      <PageHeader title="Jurídico" description="Seus casos jurídicos" />
      {casos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <Scale className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Você não possui casos jurídicos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {casos.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.titulo}</CardTitle>
                  <Badge variant="secondary">{STATUS_LABEL[c.status] ?? c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.areaDir}
                  {c.fase && ` · ${c.fase}`}
                  {c.numeroProcesso && ` · proc. ${c.numeroProcesso}`} · {c.profissional.nome}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {c.prazos.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium">Prazos</p>
                    <ul className="space-y-1">
                      {c.prazos.map((p) => (
                        <li key={p.id} className={p.cumprido ? 'text-muted-foreground line-through' : ''}>
                          {p.descricao} — {fmt(p.data)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {c.documentos.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium">Documentos</p>
                    <ul className="space-y-1">
                      {c.documentos.map((d) => (
                        <li key={d.id} className="flex items-center justify-between rounded border px-2 py-1.5">
                          <span className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" /> {d.nomeArq}
                          </span>
                          <Button size="icon" variant="ghost" onClick={() => baixar(d.id)} aria-label="Baixar">
                            <Download className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
