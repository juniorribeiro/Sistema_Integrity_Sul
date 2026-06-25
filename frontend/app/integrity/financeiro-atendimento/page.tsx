'use client';

import { WorkspaceSimples } from '@/components/atendimento/workspace-simples';
import { LinhaTriagem, type ProntuarioSimplesConfig } from '@/components/atendimento/prontuario-simples';

const LABEL: Record<string, string> = {
  ATE_2000: 'Até R$2.000', '2001_5000': 'R$2.001–5.000', '5001_10000': 'R$5.001–10.000', ACIMA_10000: 'Acima de R$10.000',
  NAO: 'Não', CONTROLADAS: 'Sim, controladas', DIFICULDADE: 'Sim, com dificuldade',
  SAIR_DIVIDAS: 'Sair das dívidas', RESERVA_EMERGENCIA: 'Reserva de emergência', INVESTIR: 'Investir',
  APOSENTADORIA: 'Aposentadoria', COMPRAR_IMOVEL: 'Comprar imóvel', OUTRO: 'Outro',
  POUPANCA: 'Poupança', RENDA_FIXA: 'Renda fixa', RENDA_VARIAVEL: 'Renda variável',
  NAO_CONTROLO: 'Não controlo', PARCIAL: 'Parcial', PLANILHA: 'Planilha', APLICATIVO: 'Aplicativo',
  SO_INSS: 'Só INSS', INSS_PRIVADA: 'INSS + privada', APENAS_PRIVADA: 'Apenas privada', NENHUMA: 'Nenhuma',
  UM: '1', DOIS: '2', TRES_MAIS: '3 ou mais',
};
const l = (v: unknown) => LABEL[String(v)] ?? String(v);

const config: ProntuarioSimplesConfig = {
  base: '/financeiro-atendimento',
  planoLabel: 'Plano de ação',
  planoField: 'planoAcao',
  planoValue: (p) => (p.planoAcao as string) ?? null,
  triagem: (p) => (p.funcionario.triagem as Record<string, Record<string, unknown>> | null)?.financeiro ?? null,
  renderTriagem: (t) => (
    <>
      <LinhaTriagem label="Faixa de renda" valor={l(t.faixaRenda)} />
      <LinhaTriagem label="Dívidas" valor={l(t.situacaoDividas)} />
      <LinhaTriagem label="Objetivo" valor={l(t.objetivoPrinc)} />
      <LinhaTriagem label="Investe" valor={l(t.investeAtual)} />
      <LinhaTriagem label="Controle de gastos" valor={l(t.controlGastos)} />
      <LinhaTriagem label="Previdência" valor={l(t.previdencia)} />
      <LinhaTriagem label="Dependentes" valor={l(t.dependentes)} />
    </>
  ),
};

export default function FinanceiroAtendimentoPage() {
  return <WorkspaceSimples titulo="Atendimentos — Financeiro" descricao="Assessoria financeira aos funcionários" config={config} />;
}
