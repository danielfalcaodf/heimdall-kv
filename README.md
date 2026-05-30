# Heimdall KV

> Base de Conhecimento com Vault e IA Contextual — versão open-source.

[![CI](https://github.com/danielfalcaodf/heimdall-kv/actions/workflows/ci.yml/badge.svg)](https://github.com/danielfalcaodf/heimdall-kv/actions/workflows/ci.yml)

Heimdall KV é uma plataforma web para documentação operacional organizada por projeto, com vault integrado, busca por escopo e IA contextual sobre base autorizada.

## O que é

- Documentação operacional em Markdown canônico.
- Vault por projeto com permissão separada da documentação.
- Busca por escopo (cliente, setor, projeto).
- IA contextual sobre documentos internos autorizados.
- Auditoria transversal.

## O que esta versão inclui

- ✅ Base documental Markdown
- ✅ Login local (e-mail/senha)
- ✅ Vault por projeto
- ✅ IA contextual sobre base autorizada
- ✅ Busca full-text e vetorial
- ✅ Auditoria
- ❌ MSAL / Azure AD (disponível no [Heimdall KV Enterprise](../heimdall-kv-enterprise/README.md))
- ❌ Personalização de logo, nome e títulos (Enterprise)
- ❌ Multi-tenant / isolamento por cliente (Enterprise)

## Stack

- **Frontend:** Next.js + TypeScript
- **Backend:** NestJS + TypeScript
- **Banco:** PostgreSQL (schemas por domínio)
- **Cache/fila:** Redis + BullMQ
- **Storage:** MinIO (local) / S3-compatible
- **IA:** RAG sobre base interna autorizada

## CI / Integração Contínua

O repositório usa GitHub Actions para garantir qualidade em cada PR e push para `main`.

| Check     | Comando                                              |
| --------- | ---------------------------------------------------- |
| Lint      | `pnpm nx run-many -t lint --all`                     |
| Typecheck | `pnpm nx run-many -t typecheck --all`                |
| Testes    | `pnpm nx run-many -t test --all --passWithNoTests`   |
| Segurança | Verifica arquivos `.env` reais e padrões de segredos |

> Pull requests só são mergeados com CI verde. Veja `.github/pull_request_template.md`.

## Validacao

```bash
# Verificar tipos TypeScript
pnpm typecheck

# Lint
pnpm lint

# Verificar formatacao
pnpm format:check

# Testes unitarios (sem servicos externos)
pnpm test

# Prisma
pnpm prisma:validate
pnpm prisma:generate
```

> Os testes e2e (`api-e2e`, `worker-e2e`, `web-e2e`) dependem de servicos e sao executados separadamente.

## Rodando com Docker

O projeto inclui um `docker-compose.yml` com PostgreSQL, Redis e MinIO prontos para desenvolvimento local.

### Pré-requisitos

- Docker 24+ com Docker Compose v2
- `docker compose version` deve retornar v2.x

### Subindo os serviços

```bash
# Subir serviços essenciais
docker compose up -d

# Verificar saúde dos containers
docker compose ps

# Parar e remover volumes (reset completo)
docker compose down -v
```

### Configurar variáveis de ambiente

```bash
cp .env.docker.example apps/api/.env
cp .env.docker.example apps/worker/.env
# Edite os arquivos e substitua TROQUE_AQUI por senhas seguras
```

### Serviços opcionais (dev-tools)

```bash
# Sobe pgAdmin (http://localhost:5050) e Redis Commander (http://localhost:8081)
docker compose --profile dev-tools up -d
```

### Portas locais

| Serviço         | Porta |
| --------------- | ----- |
| PostgreSQL      | 5432  |
| Redis           | 6379  |
| MinIO API       | 9000  |
| MinIO Console   | 9001  |
| pgAdmin         | 5050  |
| Redis Commander | 8081  |

## Início rápido

**Pré-requisitos:** Node.js >= 22, pnpm >= 10

```bash
# Instalar dependências
pnpm install

# Ver todos os projetos no workspace
pnpm exec nx show projects

# Desenvolvimento individual por app
pnpm exec nx serve web      # Next.js web (porta 4200)
pnpm exec nx serve api      # NestJS API (porta 3001)
pnpm exec nx serve worker   # NestJS Worker (porta 3002)

# Build por app
pnpm exec nx build web
pnpm exec nx build api
pnpm exec nx build worker

# Build de todos os apps
pnpm build

# Testes
pnpm test

# Lint
pnpm lint

# Prisma / migrations
pnpm prisma:validate
pnpm prisma:generate
pnpm db:migrate
```

> ⚠️ Copie os arquivos `.env.example` para `.env` (ou `.env.local` no web) antes de executar.  
> **Nunca versionar arquivos `.env` com dados reais.**

## Bootstrap operacional

- Web: `/app`, `/app/sem-acesso`, `/admin/status`
- API: `/api/bootstrap`, `/api/health`
- Worker: `/api/health/job`
- Storage privado local: `.local/storage/private` via adapter, ignorado pelo Git

## Documentação

- [Arquitetura](docs/architecture.md)
- [Features](docs/features.md)
- [Início rápido](docs/getting-started.md)
- [Roadmap](docs/roadmap.md)

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Segurança

Veja [SECURITY.md](SECURITY.md). Este projeto segue LGPD.

## Licença

[MIT](LICENSE)
