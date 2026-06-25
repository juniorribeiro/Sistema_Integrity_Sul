# Sistema de Gestão — Integrity Sul Consultoria

Sistema de gestão de RH e bem-estar corporativo: clientes, funcionários, equipe interna,
4 setores de atendimento (psicologia, nutrição, jurídico, financeiro), banco de currículos,
gestão financeira e métricas.

## Stack

- **Frontend:** Next.js 14+ (App Router) · TypeScript · Tailwind + shadcn/ui · React Hook Form + Zod · Axios
- **Backend:** Fastify · TypeScript · Prisma + PostgreSQL 16 · Redis · Garage (S3) · JWT
- **Infra:** Docker Compose · Nginx + Let's Encrypt · Garage v2.3.0

## Estrutura

```
integrity-sul/
├── frontend/          # Next.js
├── backend/           # Fastify API
├── docker-compose.yml
├── garage/            # garage.toml + init-garage.sh
├── nginx/             # reverse proxy + SSL
└── scripts/           # backups + init-db
```

## Setup local (dev)

1. Copie `.env.example` para `.env` e preencha (já existe um `.env` de dev com secrets gerados).
2. Suba a infraestrutura base:
   ```bash
   docker compose up -d postgres redis garage
   ```
3. Inicialize o Garage (uma única vez) e copie as credenciais para o `.env`:
   ```bash
   ./garage/init-garage.sh
   ```
4. Backend:
   ```bash
   cd backend && npm install && npm run prisma:migrate && npm run dev
   ```
5. Frontend:
   ```bash
   cd frontend && npm install && npm run dev
   ```

## Níveis de acesso

| Nível | Roles |
|-------|-------|
| Integrity Sul (interno) | `DIRETORIA`, `CONSULTOR_RH`, `PSICOLOGO`, `NUTRICIONISTA`, `JURIDICO`, `FINANCEIRO_ATENDIMENTO`, `FINANCEIRO_INTEGRITY` |
| Cliente (empresa) | `RH_CLIENTE` |
| Funcionário do cliente | `FUNCIONARIO` |

## Segurança / LGPD

- Sigilo por setor (RLS no PostgreSQL + validação de role no Fastify).
- Consentimento explícito no autocadastro.
- Dados sensíveis de triagem criptografados em repouso (pgcrypto).
- Arquivos servidos apenas via Presigned URL (validade 1h).
- Rate limiting via Redis.
