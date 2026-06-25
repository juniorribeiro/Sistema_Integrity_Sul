'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Func {
  id: string;
  nome: string;
  cargo: string;
  usuario: { email: string; ativo: boolean };
  triagem?: { concluida: boolean } | null;
}

export default function FuncionariosClientePage() {
  const [lista, setLista] = useState<Func[] | null>(null);

  useEffect(() => {
    api
      .get<Func[]>('/funcionarios')
      .then(({ data }) => setLista(data))
      .catch(() => setLista([]));
  }, []);

  return (
    <>
      <PageHeader title="Funcionários" description="Colaboradores cadastrados via URL única" />
      {lista === null ? (
        <Skeleton className="h-64" />
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhum funcionário cadastrado ainda</p>
          <p className="text-sm text-muted-foreground">Compartilhe a URL de cadastro recebida por e-mail.</p>
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Triagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">{f.usuario.email}</TableCell>
                  <TableCell>{f.cargo}</TableCell>
                  <TableCell>
                    <Badge variant={f.triagem?.concluida ? 'default' : 'secondary'}>
                      {f.triagem?.concluida ? 'Concluída' : 'Pendente'}
                    </Badge>
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
