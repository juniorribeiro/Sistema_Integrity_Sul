'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { api, apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { PORTAL_POR_ROLE, ROTA_INICIAL } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z
  .object({
    novaSenha: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
      .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula')
      .regex(/[0-9]/, 'Inclua ao menos um número'),
    confirmar: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: 'As senhas não coincidem',
    path: ['confirmar'],
  });
type FormData = z.infer<typeof schema>;

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const { usuario, accessToken, setPrimeiroLoginConcluido } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Protege a rota: precisa estar logado
  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await api.post('/auth/trocar-senha', { novaSenha: data.novaSenha });
      setPrimeiroLoginConcluido();
      toast.success('Senha definida com sucesso!');

      const role = usuario?.role;
      if (role) {
        const portal = PORTAL_POR_ROLE[role];
        router.push(ROTA_INICIAL[portal]);
      } else {
        router.push('/login');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível definir a senha.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primeiro acesso</CardTitle>
        <CardDescription>Defina uma nova senha para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <Input id="novaSenha" type="password" autoComplete="new-password" {...register('novaSenha')} />
            {errors.novaSenha && <p className="text-sm text-destructive">{errors.novaSenha.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirmar senha</Label>
            <Input id="confirmar" type="password" autoComplete="new-password" {...register('confirmar')} />
            {errors.confirmar && <p className="text-sm text-destructive">{errors.confirmar.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando…' : 'Definir senha e continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
