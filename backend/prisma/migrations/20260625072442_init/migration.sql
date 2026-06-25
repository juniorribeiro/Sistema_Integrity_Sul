-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRETORIA', 'CONSULTOR_RH', 'PSICOLOGO', 'NUTRICIONISTA', 'JURIDICO', 'FINANCEIRO_ATENDIMENTO', 'FINANCEIRO_INTEGRITY', 'RH_CLIENTE', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "Setor" AS ENUM ('PSICOLOGIA', 'NUTRICAO', 'JURIDICO', 'FINANCEIRO');

-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('PRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "StatusAgend" AS ENUM ('AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusCand" AS ENUM ('DISPONIVEL', 'EM_PROCESSO', 'CONTRATADO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusVaga" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'FECHADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EtapaPipeline" AS ENUM ('TRIAGEM', 'ENTREVISTA', 'TESTE', 'PROPOSTA', 'CONTRATADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "TipoLanc" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "StatusPag" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "primeiroLogin" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "registro" TEXT,
    "setor" "Setor",
    "avatarKey" TEXT,
    "googleCalToken" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RHCliente" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RHCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "responsavelNome" TEXT NOT NULL,
    "responsavelEmail" TEXT NOT NULL,
    "urlToken" TEXT NOT NULL,
    "urlExpiresAt" TIMESTAMP(3),
    "limiteFunc" INTEGER NOT NULL DEFAULT 100,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacoteEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "setores" "Setor"[],
    "valorMensal" DOUBLE PRECISION NOT NULL,
    "vigenciaIni" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PacoteEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoAvulso" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "setor" "Setor" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" "StatusPag" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicoAvulso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricaEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "setor" "Setor" NOT NULL,
    "competencia" TEXT NOT NULL,
    "atendimentos" INTEGER NOT NULL DEFAULT 0,
    "funcAtivos" INTEGER NOT NULL DEFAULT 0,
    "satisfacao" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricaEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "avatarKey" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Triagem" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Triagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriagemPsicologia" (
    "id" TEXT NOT NULL,
    "triagemId" TEXT NOT NULL,
    "saudeMentalNota" INTEGER NOT NULL,
    "acompanhamentoAnterior" BOOLEAN NOT NULL,
    "acompanhamentoDetalhe" TEXT,
    "medicacaoPsiq" BOOLEAN NOT NULL,
    "medicacaoDetalhe" TEXT,
    "stressTrabNota" INTEGER NOT NULL,
    "qualidadeSono" TEXT NOT NULL,
    "ansiedadeTristeza" INTEGER NOT NULL,
    "situacaoAtual" TEXT,
    "contatoEmergNome" TEXT NOT NULL,
    "contatoEmergTel" TEXT NOT NULL,
    "contatoEmergParent" TEXT NOT NULL,

    CONSTRAINT "TriagemPsicologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriagemNutricao" (
    "id" TEXT NOT NULL,
    "triagemId" TEXT NOT NULL,
    "pesoKg" DOUBLE PRECISION NOT NULL,
    "alturaCm" DOUBLE PRECISION NOT NULL,
    "restricoes" TEXT[],
    "condicoesSaude" TEXT[],
    "habitosAlimentares" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "atividadeFisica" TEXT NOT NULL,
    "refeicoesDia" INTEGER NOT NULL,
    "consumoAgua" TEXT NOT NULL,

    CONSTRAINT "TriagemNutricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriagemJuridico" (
    "id" TEXT NOT NULL,
    "triagemId" TEXT NOT NULL,
    "temDemanda" BOOLEAN NOT NULL,
    "areaDir" TEXT,
    "urgencia" TEXT,
    "processoAndamento" BOOLEAN,
    "processoFase" TEXT,
    "outraParte" TEXT,
    "temDocumentacao" BOOLEAN,
    "descricao" TEXT,

    CONSTRAINT "TriagemJuridico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriagemFinanceiro" (
    "id" TEXT NOT NULL,
    "triagemId" TEXT NOT NULL,
    "faixaRenda" TEXT NOT NULL,
    "situacaoDividas" TEXT NOT NULL,
    "objetivoPrinc" TEXT NOT NULL,
    "investeAtual" TEXT NOT NULL,
    "controlGastos" TEXT NOT NULL,
    "previdencia" TEXT NOT NULL,
    "dependentes" TEXT NOT NULL,

    CONSTRAINT "TriagemFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioPsicologia" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "planoTerapeutico" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioPsicologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoPsicologia" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "evolucao" TEXT NOT NULL,
    "proximaData" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessaoPsicologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaPsicologia" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "atingida" BOOLEAN NOT NULL DEFAULT false,
    "prazo" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaPsicologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioNutricao" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "planoAlimentar" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioNutricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaNutricao" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "anotacoes" TEXT NOT NULL,
    "proximaData" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaNutricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolucaoNutricao" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "pesoKg" DOUBLE PRECISION NOT NULL,
    "imc" DOUBLE PRECISION,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvolucaoNutricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioJuridico" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "areaDir" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "numeroProcesso" TEXT,
    "fase" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioJuridico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrazoJuridico" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "cumprido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrazoJuridico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProntuarioFinanceiro" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "planoAcao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProntuarioFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaFinanceira" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "anotacoes" TEXT NOT NULL,
    "proximaData" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoStorage" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "nomeArq" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "setor" "Setor" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prontuarioPsicologiaId" TEXT,
    "prontuarioNutricaoId" TEXT,
    "prontuarioJuridicoId" TEXT,
    "prontuarioFinanceiroId" TEXT,

    CONSTRAINT "DocumentoStorage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "setor" "Setor" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "modalidade" "Modalidade" NOT NULL,
    "status" "StatusAgend" NOT NULL DEFAULT 'AGENDADO',
    "linkOnline" TEXT,
    "observacoes" TEXT,
    "googleCalId" TEXT,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidato" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "nivelExp" TEXT NOT NULL,
    "localidade" TEXT NOT NULL,
    "pretensao" DOUBLE PRECISION,
    "disponibilidade" TEXT NOT NULL,
    "curriculoKey" TEXT,
    "status" "StatusCand" NOT NULL DEFAULT 'DISPONIVEL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoCandidato" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliacaoCandidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaga" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresaId" TEXT,
    "area" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusVaga" NOT NULL DEFAULT 'ABERTA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VagaCandidato" (
    "id" TEXT NOT NULL,
    "vagaId" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "etapa" "EtapaPipeline" NOT NULL DEFAULT 'TRIAGEM',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VagaCandidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLanc" NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT,
    "status" "StatusPag" NOT NULL DEFAULT 'PENDENTE',
    "nfNumero" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentimentoLGPD" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "aceitoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentimentoLGPD_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_usuarioId_key" ON "Colaborador"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_cpf_key" ON "Colaborador"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "RHCliente_usuarioId_key" ON "RHCliente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_urlToken_key" ON "Empresa"("urlToken");

-- CreateIndex
CREATE UNIQUE INDEX "PacoteEmpresa_empresaId_key" ON "PacoteEmpresa"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricaEmpresa_empresaId_setor_competencia_key" ON "MetricaEmpresa"("empresaId", "setor", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_usuarioId_key" ON "Funcionario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_cpf_key" ON "Funcionario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Triagem_funcionarioId_key" ON "Triagem"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "TriagemPsicologia_triagemId_key" ON "TriagemPsicologia"("triagemId");

-- CreateIndex
CREATE UNIQUE INDEX "TriagemNutricao_triagemId_key" ON "TriagemNutricao"("triagemId");

-- CreateIndex
CREATE UNIQUE INDEX "TriagemJuridico_triagemId_key" ON "TriagemJuridico"("triagemId");

-- CreateIndex
CREATE UNIQUE INDEX "TriagemFinanceiro_triagemId_key" ON "TriagemFinanceiro"("triagemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioPsicologia_funcionarioId_key" ON "ProntuarioPsicologia"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioNutricao_funcionarioId_key" ON "ProntuarioNutricao"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ProntuarioFinanceiro_funcionarioId_key" ON "ProntuarioFinanceiro"("funcionarioId");

-- CreateIndex
CREATE INDEX "Agendamento_profissionalId_dataHora_idx" ON "Agendamento"("profissionalId", "dataHora");

-- CreateIndex
CREATE INDEX "Agendamento_funcionarioId_idx" ON "Agendamento"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_email_key" ON "Candidato"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_cpf_key" ON "Candidato"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "VagaCandidato_vagaId_candidatoId_key" ON "VagaCandidato"("vagaId", "candidatoId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_data_idx" ON "LancamentoFinanceiro"("data");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_tipo_status_idx" ON "LancamentoFinanceiro"("tipo", "status");

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RHCliente" ADD CONSTRAINT "RHCliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RHCliente" ADD CONSTRAINT "RHCliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacoteEmpresa" ADD CONSTRAINT "PacoteEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoAvulso" ADD CONSTRAINT "ServicoAvulso_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricaEmpresa" ADD CONSTRAINT "MetricaEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Triagem" ADD CONSTRAINT "Triagem_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriagemPsicologia" ADD CONSTRAINT "TriagemPsicologia_triagemId_fkey" FOREIGN KEY ("triagemId") REFERENCES "Triagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriagemNutricao" ADD CONSTRAINT "TriagemNutricao_triagemId_fkey" FOREIGN KEY ("triagemId") REFERENCES "Triagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriagemJuridico" ADD CONSTRAINT "TriagemJuridico_triagemId_fkey" FOREIGN KEY ("triagemId") REFERENCES "Triagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriagemFinanceiro" ADD CONSTRAINT "TriagemFinanceiro_triagemId_fkey" FOREIGN KEY ("triagemId") REFERENCES "Triagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioPsicologia" ADD CONSTRAINT "ProntuarioPsicologia_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioPsicologia" ADD CONSTRAINT "ProntuarioPsicologia_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoPsicologia" ADD CONSTRAINT "SessaoPsicologia_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "ProntuarioPsicologia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPsicologia" ADD CONSTRAINT "MetaPsicologia_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "ProntuarioPsicologia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioNutricao" ADD CONSTRAINT "ProntuarioNutricao_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioNutricao" ADD CONSTRAINT "ProntuarioNutricao_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaNutricao" ADD CONSTRAINT "ConsultaNutricao_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "ProntuarioNutricao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolucaoNutricao" ADD CONSTRAINT "EvolucaoNutricao_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "ProntuarioNutricao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioJuridico" ADD CONSTRAINT "ProntuarioJuridico_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioJuridico" ADD CONSTRAINT "ProntuarioJuridico_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrazoJuridico" ADD CONSTRAINT "PrazoJuridico_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "ProntuarioJuridico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioFinanceiro" ADD CONSTRAINT "ProntuarioFinanceiro_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProntuarioFinanceiro" ADD CONSTRAINT "ProntuarioFinanceiro_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaFinanceira" ADD CONSTRAINT "ConsultaFinanceira_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "ProntuarioFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoStorage" ADD CONSTRAINT "DocumentoStorage_prontuarioPsicologiaId_fkey" FOREIGN KEY ("prontuarioPsicologiaId") REFERENCES "ProntuarioPsicologia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoStorage" ADD CONSTRAINT "DocumentoStorage_prontuarioNutricaoId_fkey" FOREIGN KEY ("prontuarioNutricaoId") REFERENCES "ProntuarioNutricao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoStorage" ADD CONSTRAINT "DocumentoStorage_prontuarioJuridicoId_fkey" FOREIGN KEY ("prontuarioJuridicoId") REFERENCES "ProntuarioJuridico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoStorage" ADD CONSTRAINT "DocumentoStorage_prontuarioFinanceiroId_fkey" FOREIGN KEY ("prontuarioFinanceiroId") REFERENCES "ProntuarioFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoCandidato" ADD CONSTRAINT "AvaliacaoCandidato_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VagaCandidato" ADD CONSTRAINT "VagaCandidato_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "Vaga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VagaCandidato" ADD CONSTRAINT "VagaCandidato_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentimentoLGPD" ADD CONSTRAINT "ConsentimentoLGPD_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

