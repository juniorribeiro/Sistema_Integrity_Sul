'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Copy, Check, Building2 } from 'lucide-react';

import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
  setor: string;
  ativa: boolean;
  limiteFunc: number;
  _count?: { funcionarios: number };
}

const schema = z.object({
  razaoSocial: z.string().min(2, 'Informe a razão social'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  setor: z.string().min(2, 'Informe o setor'),
  responsavelNome: z.string().min(2, 'Informe o responsável'),
  responsavelEmail: z.string().email('E-mail inválido'),
  limiteFunc: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
});
type FormData = z.input<typeof schema>;

interface ResultadoCadastro {
  urlCadastro: string;
  rhSenhaTemporaria: string;
}

export default function ClientesPage() {
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [open, setOpen] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCadastro | null>(null);
  const [copiado, setCopiado] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function carregar() {
    const { data } = await api.get<Empresa[]>('/empresas');
    setEmpresas(data);
  }
  useEffect(() => {
    carregar().catch(() => setEmpresas([]));
  }, []);

  async function onSubmit(data: FormData) {
    try {
      const { data: res } = await api.post('/empresas', data);
      setResultado({ urlCadastro: res.urlCadastro, rhSenhaTemporaria: res.rhSenhaTemporaria });
      toast.success('Empresa cadastrada!');
      reset();
      carregar();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function fecharDialog() {
    setOpen(false);
    setResultado(null);
    setCopiado(false);
    reset();
  }

  async function copiarUrl() {
    if (!resultado) return;
    await navigator.clipboard.writeText(resultado.urlCadastro);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Empresas contratantes e suas URLs de cadastro"
        action={
          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : fecharDialog())}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Nova empresa
                </Button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              {!resultado ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Nova empresa cliente</DialogTitle>
                    <DialogDescription>
                      Será gerada uma URL única de cadastro e uma conta de RH para o responsável.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <Campo id="razaoSocial" label="Razão social" error={errors.razaoSocial?.message}>
                      <Input id="razaoSocial" {...register('razaoSocial')} />
                    </Campo>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Campo id="cnpj" label="CNPJ (somente números)" error={errors.cnpj?.message}>
                        <Input id="cnpj" inputMode="numeric" {...register('cnpj')} />
                      </Campo>
                      <Campo id="setor" label="Setor" error={errors.setor?.message}>
                        <Input id="setor" {...register('setor')} />
                      </Campo>
                    </div>
                    <Campo id="responsavelNome" label="Responsável (RH)" error={errors.responsavelNome?.message}>
                      <Input id="responsavelNome" {...register('responsavelNome')} />
                    </Campo>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Campo id="responsavelEmail" label="E-mail do RH" error={errors.responsavelEmail?.message}>
                        <Input id="responsavelEmail" type="email" {...register('responsavelEmail')} />
                      </Campo>
                      <Campo id="limiteFunc" label="Limite de funcionários" error={errors.limiteFunc?.message}>
                        <Input id="limiteFunc" type="number" placeholder="100" {...register('limiteFunc')} />
                      </Campo>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Cadastrando…' : 'Cadastrar empresa'}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Empresa cadastrada ✓</DialogTitle>
                    <DialogDescription>Compartilhe a URL de cadastro com os funcionários.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL única de cadastro</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={resultado.urlCadastro} className="font-mono text-xs" />
                        <Button type="button" variant="outline" size="icon" onClick={copiarUrl}>
                          {copiado ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="text-muted-foreground">Acesso do RH (senha temporária):</p>
                      <p className="font-mono font-semibold">{resultado.rhSenhaTemporaria}</p>
                    </div>
                    <Button className="w-full" onClick={fecharDialog}>
                      Concluir
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      {empresas === null ? (
        <Skeleton className="h-64" />
      ) : empresas.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Setor</TableHead>
                <TableHead>Funcionários</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.razaoSocial}</TableCell>
                  <TableCell className="hidden font-mono text-xs sm:table-cell">{e.cnpj}</TableCell>
                  <TableCell className="hidden md:table-cell">{e.setor}</TableCell>
                  <TableCell>
                    {e._count?.funcionarios ?? 0} / {e.limiteFunc}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.ativa ? 'default' : 'secondary'}>{e.ativa ? 'Ativa' : 'Inativa'}</Badge>
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

function Campo({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-center">
      <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="font-medium">Nenhuma empresa cadastrada</p>
      <p className="text-sm text-muted-foreground">Clique em “Nova empresa” para começar.</p>
    </div>
  );
}
