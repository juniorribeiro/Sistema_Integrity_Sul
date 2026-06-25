'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Brain, FileText, UserPlus } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { ProntuarioDetail } from '@/components/psicologia/prontuario-detail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface FuncItem {
  id: string;
  nome: string;
  cargo: string;
  empresa: string;
  temTriagem: boolean;
  prontuarioId: string | null;
}

export default function PsicologiaPage() {
  const [lista, setLista] = useState<FuncItem[] | null>(null);
  const [aberto, setAberto] = useState<string | null>(null); // prontuarioId aberto

  async function carregar() {
    const { data } = await api.get<FuncItem[]>('/psicologia/funcionarios');
    setLista(data);
  }
  useEffect(() => {
    carregar().catch(() => setLista([]));
  }, []);

  async function iniciar(funcionarioId: string) {
    try {
      const { data } = await api.post('/psicologia/prontuarios', { funcionarioId });
      await carregar();
      setAberto(data.id);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (aberto) {
    return (
      <ProntuarioDetail
        prontuarioId={aberto}
        onVoltar={() => {
          setAberto(null);
          carregar();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader title="Atendimentos — Psicologia" description="Funcionários sob seu acompanhamento" />
      {lista === null ? (
        <Skeleton className="h-64" />
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <Brain className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhum funcionário disponível</p>
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead>Triagem</TableHead>
                <TableHead className="text-right">Prontuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div className="font-medium">{f.nome}</div>
                    <div className="text-xs text-muted-foreground">{f.cargo}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{f.empresa}</TableCell>
                  <TableCell>
                    <Badge variant={f.temTriagem ? 'default' : 'secondary'}>
                      {f.temTriagem ? 'Preenchida' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {f.prontuarioId ? (
                      <Button size="sm" variant="outline" onClick={() => setAberto(f.prontuarioId)}>
                        <FileText className="mr-1 h-4 w-4" /> Abrir
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => iniciar(f.id)}>
                        <UserPlus className="mr-1 h-4 w-4" /> Iniciar
                      </Button>
                    )}
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
