'use client';

import { useEffect, useState } from 'react';
import { Users, ClipboardList, Percent } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { SetorBars } from '@/components/metricas/setor-bars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Metricas {
  totalFuncionarios: number;
  triagensConcluidas: number;
  taxaAdesaoTriagem: number;
  atendimentosPorSetor: Record<string, number>;
  agendamentosPorStatus: Record<string, number>;
}

const STATUS_LABEL: Record<string, string> = {
  AGENDADO: 'Agendados', CONFIRMADO: 'Confirmados', REALIZADO: 'Realizados', CANCELADO: 'Cancelados',
};

export default function MetricasCliente() {
  const [m, setM] = useState<Metricas | null>(null);
  useEffect(() => {
    api.get<Metricas>('/metricas/cliente').then(({ data }) => setM(data)).catch(() => setM(null));
  }, []);

  if (!m) return <Skeleton className="h-96" />;

  return (
    <>
      <PageHeader title="Métricas" description="Bem-estar e adesão da sua equipe" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Funcionários" value={m.totalFuncionarios} icon={Users} />
        <StatCard title="Triagens concluídas" value={m.triagensConcluidas} icon={ClipboardList} />
        <StatCard title="Adesão à triagem" value={`${m.taxaAdesaoTriagem}%`} icon={Percent} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SetorBars dados={m.atendimentosPorSetor} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.keys(STATUS_LABEL).map((k) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{STATUS_LABEL[k]}</span>
                <span className="font-medium">{m.agendamentosPorStatus[k] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
