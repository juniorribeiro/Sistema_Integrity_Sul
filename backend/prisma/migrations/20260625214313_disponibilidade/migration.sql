-- CreateEnum
CREATE TYPE "StatusSlot" AS ENUM ('LIVRE', 'RESERVADO');

-- CreateTable
CREATE TABLE "Disponibilidade" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "setor" "Setor" NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "status" "StatusSlot" NOT NULL DEFAULT 'LIVRE',
    "agendamentoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Disponibilidade_agendamentoId_key" ON "Disponibilidade"("agendamentoId");

-- CreateIndex
CREATE INDEX "Disponibilidade_setor_inicio_idx" ON "Disponibilidade"("setor", "inicio");

-- CreateIndex
CREATE INDEX "Disponibilidade_profissionalId_inicio_idx" ON "Disponibilidade"("profissionalId", "inicio");

-- AddForeignKey
ALTER TABLE "Disponibilidade" ADD CONSTRAINT "Disponibilidade_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disponibilidade" ADD CONSTRAINT "Disponibilidade_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
