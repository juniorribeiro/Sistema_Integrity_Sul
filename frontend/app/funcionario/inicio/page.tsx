'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brain, Apple, Scale, PiggyBank, CalendarDays, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

const SETORES = [
  { label: 'Psicologia', href: '/funcionario/psicologia', icon: Brain },
  { label: 'Nutrição', href: '/funcionario/nutricao', icon: Apple },
  { label: 'Jurídico', href: '/funcionario/juridico', icon: Scale },
  { label: 'Financeiro', href: '/funcionario/financeiro', icon: PiggyBank },
  { label: 'Agenda', href: '/funcionario/agenda', icon: CalendarDays },
];

export default function FuncionarioInicio() {
  const usuario = useAuthStore((s) => s.usuario);
  const [triagemConcluida, setTriagemConcluida] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get<{ concluida: boolean }>('/triagem/me')
      .then(({ data }) => setTriagemConcluida(data.concluida))
      .catch(() => setTriagemConcluida(null));
  }, []);

  return (
    <>
      <PageHeader title="Bem-vindo(a)!" description={usuario?.email} />

      {triagemConcluida === false && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Complete sua triagem de bem-estar</p>
                <p className="text-sm text-muted-foreground">Leva poucos minutos e é totalmente confidencial.</p>
              </div>
            </div>
            <Link href="/funcionario/triagem" className={buttonVariants()}>
              Responder agora
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {SETORES.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/30">
                <CardHeader className="flex flex-col items-center gap-2 py-8 text-center">
                  <Icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-base">{s.label}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
