'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Brain, Apple, Scale, PiggyBank, CheckCircle2, Loader2 } from 'lucide-react';

import { api, apiErrorMessage } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PsicologiaStep,
  NutricaoStep,
  JuridicoStep,
  FinanceiroStep,
} from '@/components/forms/triagem-steps';

const PASSOS = [
  { key: 'psicologia', label: 'Psicologia', icon: Brain },
  { key: 'nutricao', label: 'Nutrição', icon: Apple },
  { key: 'juridico', label: 'Jurídico', icon: Scale },
  { key: 'financeiro', label: 'Financeiro', icon: PiggyBank },
] as const;

export default function TriagemPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        const { data } = await api.get<{ concluida: boolean; secoes: Record<string, boolean> }>('/triagem/me');
        if (data.concluida) {
          router.replace('/funcionario/inicio');
          return;
        }
        // Posiciona no primeiro passo ainda não preenchido
        const idx = PASSOS.findIndex((p) => !data.secoes[p.key]);
        setPasso(idx === -1 ? 0 : idx);
      } catch {
        /* mantém no passo 0 */
      } finally {
        setCarregando(false);
      }
    }
    init();
  }, [router]);

  async function avancar() {
    if (passo < PASSOS.length - 1) {
      setPasso((p) => p + 1);
      return;
    }
    // Último passo concluído → conclui a triagem
    try {
      await api.post('/triagem/concluir');
      toast.success('Triagem concluída!');
      router.replace('/funcionario/inicio');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando triagem…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Triagem de bem-estar</h1>
        <p className="text-sm text-muted-foreground">
          Suas respostas são confidenciais e isoladas por setor. Etapa {passo + 1} de {PASSOS.length}.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between">
        {PASSOS.map((p, i) => {
          const Icon = p.icon;
          const ativo = i === passo;
          const feito = i < passo;
          return (
            <div key={p.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                  feito
                    ? 'border-green-600 bg-green-600 text-white'
                    : ativo
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground',
                ].join(' ')}
              >
                {feito ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={['text-xs', ativo ? 'font-medium text-foreground' : 'text-muted-foreground'].join(' ')}>
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{PASSOS[passo].label}</CardTitle>
          <CardDescription>Preencha os campos abaixo para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          {passo === 0 && <PsicologiaStep onDone={avancar} />}
          {passo === 1 && <NutricaoStep onDone={avancar} />}
          {passo === 2 && <JuridicoStep onDone={avancar} />}
          {passo === 3 && <FinanceiroStep onDone={avancar} ultimo />}
        </CardContent>
      </Card>
    </div>
  );
}
