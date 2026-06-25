'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, UserCheck, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layouts/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { SetorBars, formatBRL } from '@/components/metricas/setor-bars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Metricas {
  empresas: number;
  empresasAtivas: number;
  funcionarios: number;
  candidatosPorStatus: Record<string, number>;
  atendimentosPorSetor: Record<string, number>;
  financeiro: { ano: number; receitas: number; despesas: number; saldo: number };
}

export default function MetricasIntegrity() {
  const [m, setM] = useState<Metricas | null>(null);
  useEffect(() => {
    api.get<Metricas>('/metricas/integrity').then(({ data }) => setM(data)).catch(() => setM(null));
  }, []);

  if (!m) return <Skeleton className="h-96" />;

  return (
    <>
      <PageHeader title="Métricas" description="Visão geral da operação" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Empresas" value={m.empresas} icon={Building2} hint={`${m.empresasAtivas} ativas`} />
        <StatCard title="Funcionários" value={m.funcionarios} icon={Users} />
        <StatCard title="Candidatos contratados" value={m.candidatosPorStatus.CONTRATADO ?? 0} icon={UserCheck} />
        <StatCard title={`Saldo ${m.financeiro.ano}`} value={formatBRL(m.financeiro.saldo)} icon={Wallet} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SetorBars dados={m.atendimentosPorSetor} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financeiro {m.financeiro.ano}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Linha label="Receitas" valor={formatBRL(m.financeiro.receitas)} cor="text-green-600" />
            <Linha label="Despesas" valor={formatBRL(m.financeiro.despesas)} cor="text-destructive" />
            <div className="border-t pt-2">
              <Linha label="Saldo" valor={formatBRL(m.financeiro.saldo)} bold />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Linha({ label, valor, cor, bold }: { label: string; valor: string; cor?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${cor ?? ''} ${bold ? 'font-bold' : 'font-medium'}`}>{valor}</span>
    </div>
  );
}
