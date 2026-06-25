'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Users, Pencil } from 'lucide-react';

import { api, apiErrorMessage } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/nav';
import type { Role } from '@/lib/types';
import { PageHeader } from '@/components/layouts/page-header';
import { ConfirmDelete } from '@/components/shared/confirm-delete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const ROLES_INTERNOS: Role[] = [
  'DIRETORIA',
  'CONSULTOR_RH',
  'PSICOLOGO',
  'NUTRICIONISTA',
  'JURIDICO',
  'FINANCEIRO_ATENDIMENTO',
  'FINANCEIRO_INTEGRITY',
];

interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string | null;
  registro?: string | null;
  setor: string | null;
  usuario: { email: string; role: Role; ativo: boolean };
}

const schema = z.object({
  nome: z.string().min(2, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  telefone: z.string().optional(),
  registro: z.string().optional(),
  role: z.enum(ROLES_INTERNOS as [Role, ...Role[]]),
});
type FormData = z.input<typeof schema>;

export default function ColaboradoresPage() {
  const [lista, setLista] = useState<Colaborador[] | null>(null);
  const [open, setOpen] = useState(false);
  const [senhaTemp, setSenhaTemp] = useState<string | null>(null);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', registro: '', ativo: true });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function carregar() {
    const { data } = await api.get<Colaborador[]>('/colaboradores');
    setLista(data);
  }
  useEffect(() => {
    carregar().catch(() => setLista([]));
  }, []);

  function abrirEdicao(c: Colaborador) {
    setEditForm({ nome: c.nome, telefone: c.telefone ?? '', registro: c.registro ?? '', ativo: c.usuario.ativo });
    setEditando(c);
  }
  async function salvarEdicao() {
    if (!editando) return;
    try {
      await api.patch(`/colaboradores/${editando.id}`, editForm);
      toast.success('Colaborador atualizado');
      setEditando(null);
      carregar();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }
  async function remover(id: string) {
    await api.delete(`/colaboradores/${id}`);
    toast.success('Colaborador removido');
    carregar();
  }

  async function onSubmit(data: FormData) {
    try {
      const { data: res } = await api.post('/colaboradores', data);
      setSenhaTemp(res.senhaTemporaria);
      toast.success('Colaborador cadastrado!');
      reset();
      carregar();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function fechar() {
    setOpen(false);
    setSenhaTemp(null);
    reset();
  }

  return (
    <>
      <PageHeader
        title="Colaboradores"
        description="Equipe interna da Integrity Sul"
        action={
          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : fechar())}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Novo colaborador
                </Button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              {!senhaTemp ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Novo colaborador</DialogTitle>
                    <DialogDescription>O setor de atendimento é definido automaticamente pelo perfil.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo</Label>
                      <Input id="nome" {...register('nome')} />
                      {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" {...register('email')} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" inputMode="numeric" {...register('cpf')} />
                        {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Perfil de acesso</Label>
                        <Controller
                          control={control}
                          name="role"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione…" />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES_INTERNOS.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {ROLE_LABEL[r]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.role && <p className="text-sm text-destructive">Selecione um perfil</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registro">Registro (CRP/CRN/OAB…)</Label>
                        <Input id="registro" {...register('registro')} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" {...register('telefone')} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Cadastrando…' : 'Cadastrar'}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Colaborador cadastrado ✓</DialogTitle>
                    <DialogDescription>Repasse a senha temporária. Ele trocará no primeiro acesso.</DialogDescription>
                  </DialogHeader>
                  <div className="rounded-md bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">Senha temporária</p>
                    <p className="font-mono text-lg font-semibold">{senhaTemp}</p>
                  </div>
                  <Button className="w-full" onClick={fechar}>
                    Concluir
                  </Button>
                </>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      {lista === null ? (
        <Skeleton className="h-64" />
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhum colaborador cadastrado</p>
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden md:table-cell">Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">{c.usuario.email}</TableCell>
                  <TableCell>{ROLE_LABEL[c.usuario.role]}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.setor ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={c.usuario.ativo ? 'default' : 'secondary'}>
                      {c.usuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEdicao(c)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete
                        onConfirm={() => remover(c.id)}
                        descricao={`Remover ${c.nome}? O acesso será desativado e a conta apagada.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo de edição */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>{editando?.usuario.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ed-nome">Nome</Label>
              <Input id="ed-nome" value={editForm.nome} onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ed-tel">Telefone</Label>
                <Input id="ed-tel" value={editForm.telefone} onChange={(e) => setEditForm((f) => ({ ...f, telefone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-reg">Registro</Label>
                <Input id="ed-reg" value={editForm.registro} onChange={(e) => setEditForm((f) => ({ ...f, registro: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.ativo ? 'sim' : 'nao'} onValueChange={(v) => setEditForm((f) => ({ ...f, ativo: v === 'sim' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Ativo</SelectItem>
                  <SelectItem value="nao">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={salvarEdicao}>Salvar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
