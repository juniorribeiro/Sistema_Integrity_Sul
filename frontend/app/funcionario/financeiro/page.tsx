'use client';

import { MeuProntuarioSimples } from '@/components/atendimento/meu-prontuario-simples';

export default function MeuFinanceiro() {
  return <MeuProntuarioSimples titulo="Financeiro" base="/financeiro-atendimento" planoLabel="Plano de ação" planoField="planoAcao" />;
}
