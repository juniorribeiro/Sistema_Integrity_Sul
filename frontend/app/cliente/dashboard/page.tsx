'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

interface Func {
  id: string;
  triagem?: { concluida: boolean } | null;
  usuario: { ativo: boolean };
}

export default function ClienteDashboard() {
  const [funcs, setFuncs] = useState<Func[] | null>(null);

  useEffect(() => {
    api
      .get<Func[]>('/funcionarios')
      .then(({ data }) => setFuncs(data))
      .catch(() => setFuncs([]));
  }, []);

  const total = funcs?.length ?? 0;
  const ativos = funcs?.filter((f) => f.usuario.ativo).length ?? 0;
  const comTriagem = funcs?.filter((f) => f.triagem?.concluida).length ?? 0;

  return (
    <>
      <PageHeader title="Dashboard" description="Acompanhamento da sua empresa" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {funcs ? (
          <>
            <StatCard title="Funcionários" value={total} icon={Users} />
            <StatCard title="Ativos" value={ativos} icon={UserCheck} />
            <StatCard title="Triagem concluída" value={comTriagem} icon={ClipboardList} />
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        )}
      </div>
    </>
  );
}
