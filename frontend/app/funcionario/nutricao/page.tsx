'use client';

import { MeuProntuarioSimples } from '@/components/atendimento/meu-prontuario-simples';

export default function MinhaNutricao() {
  return <MeuProntuarioSimples titulo="Nutrição" base="/nutricao" planoLabel="Plano alimentar" planoField="planoAlimentar" comEvolucoes />;
}
