'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, FileText, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { PageHeader } from '@/components/layouts/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function IntegrityDashboard() {
  const usuario = useAuthStore((s) => s.usuario);
  const [stats, setStats] = useState<{ empresas: number; colaboradores: number; funcionarios: number } | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [empresas, colaboradores] = await Promise.all([
          api.get('/empresas'),
          api.get('/colaboradores').catch(() => ({ data: [] })),
        ]);
        const funcionarios = empresas.data.reduce(
          (acc: number, e: { _count?: { funcionarios: number } }) => acc + (e._count?.funcionarios ?? 0),
          0,
        );
        setStats({ empresas: empresas.data.length, colaboradores: colaboradores.data.length, funcionarios });
      } catch {
        setStats({ empresas: 0, colaboradores: 0, funcionarios: 0 });
      }
    }
    carregar();
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" description={`Bem-vindo(a), ${usuario?.email ?? ''}`} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats ? (
          <>
            <StatCard title="Empresas clientes" value={stats.empresas} icon={Building2} />
            <StatCard title="Funcionários ativos" value={stats.funcionarios} icon={Users} />
            <StatCard title="Colaboradores internos" value={stats.colaboradores} icon={FileText} />
            <StatCard title="Financeiro" value="—" icon={Wallet} hint="Em breve" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        )}
      </div>
    </>
  );
}
