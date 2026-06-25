'use client';

import { WorkspaceSimples } from '@/components/atendimento/workspace-simples';
import { LinhaTriagem, type ProntuarioSimplesConfig } from '@/components/atendimento/prontuario-simples';

const LABEL: Record<string, string> = {
  MUITO_RUINS: 'Muito ruins', RUINS: 'Ruins', REGULARES: 'Regulares', BONS: 'Bons', MUITO_BONS: 'Muito bons',
  PERDER_PESO: 'Perder peso', GANHAR_MASSA: 'Ganhar massa', MELHORAR_ENERGIA: 'Melhorar energia',
  CONTROLAR_DOENCA: 'Controlar doença', MANUTENCAO: 'Manutenção', OUTRO: 'Outro',
  NAO: 'Não', '1_2X': '1–2x/sem', '3_4X': '3–4x/sem', '5_MAIS': '5+/sem',
  MENOS_1L: '< 1L', '1_2L': '1–2L', MAIS_2L: '> 2L',
};
const l = (v: unknown) => LABEL[String(v)] ?? String(v);

const config: ProntuarioSimplesConfig = {
  base: '/nutricao',
  planoLabel: 'Plano alimentar',
  planoField: 'planoAlimentar',
  planoValue: (p) => (p.planoAlimentar as string) ?? null,
  comEvolucoes: true,
  triagem: (p) => (p.funcionario.triagem as Record<string, Record<string, unknown>> | null)?.nutricao ?? null,
  renderTriagem: (t) => (
    <>
      <LinhaTriagem label="Peso / Altura" valor={`${t.pesoKg} kg · ${t.alturaCm} cm`} />
      <LinhaTriagem label="Hábitos alimentares" valor={l(t.habitosAlimentares)} />
      <LinhaTriagem label="Objetivo" valor={l(t.objetivo)} />
      <LinhaTriagem label="Atividade física" valor={l(t.atividadeFisica)} />
      <LinhaTriagem label="Refeições/dia" valor={String(t.refeicoesDia)} />
      <LinhaTriagem label="Consumo de água" valor={l(t.consumoAgua)} />
      <LinhaTriagem label="Restrições" valor={(t.restricoes as string[])?.join(', ') || '—'} />
      <LinhaTriagem label="Condições de saúde" valor={(t.condicoesSaude as string[])?.join(', ') || '—'} />
    </>
  ),
};

export default function NutricaoPage() {
  return <WorkspaceSimples titulo="Atendimentos — Nutrição" descricao="Funcionários sob seu acompanhamento" config={config} />;
}
