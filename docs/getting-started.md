# Início Rápido — Heimdall KV

> ⚠️ Stack ainda não inicializada. Este documento será atualizado quando o monorepo for criado.

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Redis 7+
- Docker (opcional, recomendado)

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-org/heimdall-kv.git
cd heimdall-kv

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Rode as migrations
pnpm db:migrate

# Inicie em modo desenvolvimento
pnpm dev
```

## Variáveis de ambiente

Veja `.env.example` (a ser criado) para todas as variáveis necessárias.

> ⚠️ Nunca commitar `.env` com valores reais.

## Estrutura do monorepo (planejada)

```
heimdall-kv/
├── apps/
│   ├── web/        ← Next.js frontend
│   └── api/        ← NestJS backend
├── packages/
│   ├── ui/         ← componentes compartilhados
│   └── shared/     ← tipos e utilitários
└── docs/
```
