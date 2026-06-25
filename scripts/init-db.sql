-- Executado automaticamente na PRIMEIRA inicialização do container postgres.
-- Habilita extensões necessárias para o sistema.

-- pgcrypto: criptografia em repouso de dados sensíveis (triagem, etc.)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- citext: comparação de e-mails case-insensitive (opcional, usado em índices)
CREATE EXTENSION IF NOT EXISTS citext;
