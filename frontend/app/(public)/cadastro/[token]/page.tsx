'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const schema = z
  .object({
    nome: z.string().min(2, 'Informe seu nome'),
    email: z.string().email('E-mail inválido'),
    cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
    cargo: z.string().min(2, 'Informe seu cargo'),
    telefone: z.string().min(8, 'Informe seu telefone'),
    senha: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Inclua uma maiúscula')
      .regex(/[a-z]/, 'Inclua uma minúscula')
      .regex(/[0-9]/, 'Inclua um número'),
    confirmar: z.string(),
    aceiteLGPD: z.boolean(),
  })
  .refine((d) => d.senha === d.confirmar, { message: 'As senhas não coincidem', path: ['confirmar'] })
  .refine((d) => d.aceiteLGPD, { message: 'É necessário aceitar os termos', path: ['aceiteLGPD'] });
type FormData = z.input<typeof schema>;

interface TokenInfo {
  razaoSocial: string;
  vagasDisponiveis: number;
}

export default function CadastroPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [estado, setEstado] = useState<'validando' | 'valido' | 'invalido' | 'concluido'>('validando');
  const [empresa, setEmpresa] = useState<TokenInfo | null>(null);
  const [erroToken, setErroToken] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { aceiteLGPD: false } });

  useEffect(() => {
    async function validar() {
      try {
        const { data } = await api.get<TokenInfo>(`/empresas/validar-token/${token}`);
        setEmpresa(data);
        setEstado('valido');
      } catch (err) {
        setErroToken(apiErrorMessage(err, 'Link inválido ou expirado.'));
        setEstado('invalido');
      }
    }
    validar();
  }, [token]);

  async function onSubmit(data: FormData) {
    try {
      const { confirmar, ...payload } = data;
      void confirmar;
      await api.post(`/funcionarios/cadastro/${token}`, payload);
      setEstado('concluido');
      toast.success('Cadastro realizado!');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const aceite = watch('aceiteLGPD');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary">Integrity Sul</h1>
          <p className="text-sm text-muted-foreground">Cadastro de colaborador</p>
        </div>

        {estado === 'validando' && (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Validando link…
            </CardContent>
          </Card>
        )}

        {estado === 'invalido' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="font-medium">{erroToken}</p>
              <p className="text-sm text-muted-foreground">Solicite um novo link ao RH da sua empresa.</p>
            </CardContent>
          </Card>
        )}

        {estado === 'concluido' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-lg font-semibold">Cadastro concluído!</p>
              <p className="text-sm text-muted-foreground">
                No primeiro acesso você responderá uma breve triagem de bem-estar.
              </p>
              <Button className="mt-2" onClick={() => router.push('/login')}>
                Ir para o login
              </Button>
            </CardContent>
          </Card>
        )}

        {estado === 'valido' && empresa && (
          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo(a) à {empresa.razaoSocial}</CardTitle>
              <CardDescription>Preencha seus dados para criar seu acesso.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Field id="nome" label="Nome completo" error={errors.nome?.message}>
                  <Input id="nome" {...register('nome')} />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="email" label="E-mail" error={errors.email?.message}>
                    <Input id="email" type="email" {...register('email')} />
                  </Field>
                  <Field id="cpf" label="CPF" error={errors.cpf?.message}>
                    <Input id="cpf" inputMode="numeric" {...register('cpf')} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="cargo" label="Cargo" error={errors.cargo?.message}>
                    <Input id="cargo" {...register('cargo')} />
                  </Field>
                  <Field id="telefone" label="Telefone" error={errors.telefone?.message}>
                    <Input id="telefone" inputMode="tel" {...register('telefone')} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="senha" label="Senha" error={errors.senha?.message}>
                    <Input id="senha" type="password" autoComplete="new-password" {...register('senha')} />
                  </Field>
                  <Field id="confirmar" label="Confirmar senha" error={errors.confirmar?.message}>
                    <Input id="confirmar" type="password" autoComplete="new-password" {...register('confirmar')} />
                  </Field>
                </div>

                <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
                  <Checkbox
                    id="aceiteLGPD"
                    checked={aceite}
                    onCheckedChange={(v) => setValue('aceiteLGPD', v === true, { shouldValidate: true })}
                  />
                  <Label htmlFor="aceiteLGPD" className="text-sm font-normal leading-snug">
                    Autorizo o tratamento dos meus dados pessoais conforme a LGPD, exclusivamente para fins de bem-estar
                    corporativo e atendimento nos setores contratados.
                  </Label>
                </div>
                {errors.aceiteLGPD && <p className="-mt-2 text-sm text-destructive">{errors.aceiteLGPD.message}</p>}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Cadastrando…' : 'Criar meu acesso'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({
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
