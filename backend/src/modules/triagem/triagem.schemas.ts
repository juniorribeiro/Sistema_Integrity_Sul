import { z } from 'zod';

const nota1a10 = z.coerce.number().int().min(1).max(10);

export const triagemPsicologiaSchema = z.object({
  saudeMentalNota: nota1a10,
  acompanhamentoAnterior: z.boolean(),
  acompanhamentoDetalhe: z.string().optional(),
  medicacaoPsiq: z.boolean(),
  medicacaoDetalhe: z.string().optional(),
  stressTrabNota: nota1a10,
  qualidadeSono: z.enum(['MUITO_BOA', 'BOA', 'REGULAR', 'RUIM', 'MUITO_RUIM']),
  ansiedadeTristeza: nota1a10,
  situacaoAtual: z.string().optional(),
  contatoEmergNome: z.string().min(2),
  contatoEmergTel: z.string().min(8),
  contatoEmergParent: z.string().min(2),
});

export const triagemNutricaoSchema = z.object({
  pesoKg: z.coerce.number().positive(),
  alturaCm: z.coerce.number().positive(),
  restricoes: z.array(z.string()).default([]),
  condicoesSaude: z.array(z.string()).default([]),
  habitosAlimentares: z.enum(['MUITO_RUINS', 'RUINS', 'REGULARES', 'BONS', 'MUITO_BONS']),
  objetivo: z.enum(['PERDER_PESO', 'GANHAR_MASSA', 'MELHORAR_ENERGIA', 'CONTROLAR_DOENCA', 'MANUTENCAO', 'OUTRO']),
  atividadeFisica: z.enum(['NAO', '1_2X', '3_4X', '5_MAIS']),
  refeicoesDia: z.coerce.number().int().min(1).max(12),
  consumoAgua: z.enum(['MENOS_1L', '1_2L', 'MAIS_2L']),
});

export const triagemJuridicoSchema = z.object({
  temDemanda: z.boolean(),
  areaDir: z.enum(['TRABALHISTA', 'FAMILIA', 'CONSUMIDOR', 'CRIMINAL', 'PREVIDENCIARIO', 'CIVIL', 'OUTRO']).optional(),
  urgencia: z.enum(['URGENTE', 'MODERADO', 'AGUARDAR']).optional(),
  processoAndamento: z.boolean().optional(),
  processoFase: z.string().optional(),
  outraParte: z.string().optional(),
  temDocumentacao: z.boolean().optional(),
  descricao: z.string().optional(),
});

export const triagemFinanceiroSchema = z.object({
  faixaRenda: z.enum(['ATE_2000', '2001_5000', '5001_10000', 'ACIMA_10000']),
  situacaoDividas: z.enum(['NAO', 'CONTROLADAS', 'DIFICULDADE']),
  objetivoPrinc: z.enum(['SAIR_DIVIDAS', 'RESERVA_EMERGENCIA', 'INVESTIR', 'APOSENTADORIA', 'COMPRAR_IMOVEL', 'OUTRO']),
  investeAtual: z.enum(['NAO', 'POUPANCA', 'RENDA_FIXA', 'RENDA_VARIAVEL']),
  controlGastos: z.enum(['NAO_CONTROLO', 'PARCIAL', 'PLANILHA', 'APLICATIVO']),
  previdencia: z.enum(['SO_INSS', 'INSS_PRIVADA', 'NENHUMA', 'APENAS_PRIVADA']),
  dependentes: z.enum(['NAO', 'UM', 'DOIS', 'TRES_MAIS']),
});

export type TriagemPsicologiaInput = z.infer<typeof triagemPsicologiaSchema>;
export type TriagemNutricaoInput = z.infer<typeof triagemNutricaoSchema>;
export type TriagemJuridicoInput = z.infer<typeof triagemJuridicoSchema>;
export type TriagemFinanceiroInput = z.infer<typeof triagemFinanceiroSchema>;
