'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { api, apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { PORTAL_POR_ROLE, ROTA_INICIAL, type LoginResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe sua senha'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const { data: res } = await api.post<LoginResponse>('/auth/login', data);
      setSession(res);

      if (res.usuario.primeiroLogin) {
        router.push('/primeiro-acesso');
        return;
      }
      const portal = PORTAL_POR_ROLE[res.usuario.role];
      router.push(ROTA_INICIAL[portal]);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível entrar.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="voce@empresa.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" autoComplete="current-password" {...register('senha')} />
            {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
