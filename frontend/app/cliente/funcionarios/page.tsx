'use client';

import { useEffect, useState } from 'react';
import { Users, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Func {
  id: string;
  nome: string;
  cargo: string;
  telefone?: string;
  usuario: { email: string; ativo: boolean };
  triagem?: { concluida: boolean } | null;
}

export default function FuncionariosClientePage() {
  const [lista, setLista] = useState<Func[] | null>(null);
  const [editando, setEditando] = useState<Func | null>(null);
  const [form, setForm] = useState({ nome: '', cargo: '', telefone: '', ativo: true });

  async function carregar() {
    const { data } = await api.get<Func[]>('/funcionarios');
    setLista(data);
  }
  useEffect(() => {
    carregar().catch(() => setLista([]));
  }, []);

  function abrirEdicao(f: Func) {
    setForm({ nome: f.nome, cargo: f.cargo, telefone: f.telefone ?? '', ativo: f.usuario.ativo });
    setEditando(f);
  }
  async function salvar() {
    if (!editando) return;
    try {
      await api.patch(`/funcionarios/${editando.id}`, form);
      toast.success('Funcionário atualizado');
      setEditando(null);
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function remover(id: string) {
    await api.delete(`/funcionarios/${id}`);
    toast.success('Funcionário removido');
    carregar();
  }

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
                <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEdicao(f)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete onConfirm={() => remover(f.id)} descricao={`Remover ${f.nome}? Todos os dados de atendimento serão apagados.`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar funcionário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ef-nome">Nome</Label>
              <Input id="ef-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ef-cargo">Cargo</Label>
                <Input id="ef-cargo" value={form.cargo} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ef-tel">Telefone</Label>
                <Input id="ef-tel" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.ativo ? 'sim' : 'nao'} onValueChange={(v) => setForm((f) => ({ ...f, ativo: v === 'sim' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Ativo</SelectItem>
                  <SelectItem value="nao">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={salvar}>Salvar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
