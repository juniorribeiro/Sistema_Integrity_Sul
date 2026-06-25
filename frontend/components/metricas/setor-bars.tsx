import { Brain, Apple, Scale, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SETORES = [
  { key: 'psicologia', label: 'Psicologia', icon: Brain },
  { key: 'nutricao', label: 'Nutrição', icon: Apple },
  { key: 'juridico', label: 'Jurídico', icon: Scale },
  { key: 'financeiro', label: 'Financeiro', icon: PiggyBank },
] as const;

export function SetorBars({ dados }: { dados: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(dados));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Atendimentos por setor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {SETORES.map((s) => {
          const v = dados[s.key] ?? 0;
          const Icon = s.icon;
          return (
            <div key={s.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" /> {s.label}
                </span>
                <span className="font-medium">{v}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatBRL = (v: number) => BRL.format(v);
