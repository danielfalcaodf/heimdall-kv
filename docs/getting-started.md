# Início Rápido — Heimdall KV

Base de Conhecimento open-source com Vault e IA Contextual.

## Pré-requisitos

| Ferramenta | Versão mínima | Notas                                        |
| ---------- | ------------- | -------------------------------------------- |
| Node.js    | 22.x          | Recomendado via `nvm` ou `fnm`               |
| pnpm       | 10.x          | `npm install -g pnpm@10`                     |
| PostgreSQL | 16+           | Necessario para migrations e health completo |
| Redis      | 7+            | Necessario para BullMQ e health completo     |

> Os serviços externos (PostgreSQL, Redis) ainda não são necessários para rodar lint/typecheck/testes unitários.

## Instalação

```bash
# Clone o repositório
git clone https://github.com/danielfalcaodf/heimdall-kv.git
cd heimdall-kv

# Instale as dependências
pnpm install
```

## Estrutura do monorepo

```
heimdall-kv/
├── apps/
│   ├── web/         ← Next.js 16 (frontend)
│   ├── web-e2e/     ← testes e2e do web
│   ├── api/         ← NestJS 11 (backend REST)
│   ├── api-e2e/     ← testes e2e da API
│   ├── worker/      ← NestJS 11 (jobs assíncronos)
│   └── worker-e2e/  ← testes e2e do worker
├── libs/            ← contratos, config, fila e storage compartilhados
├── prisma/          ← schema Prisma e migrations de schemas de dominio
├── docs/            ← documentação do repo
├── nx.json          ← configuração Nx
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Comandos de desenvolvimento

### Servir apps individualmente

```bash
pnpm exec nx serve web      # Next.js web — http://localhost:4200
pnpm exec nx serve api      # NestJS API  — http://localhost:3001/api
pnpm exec nx serve worker   # NestJS Worker — http://localhost:3002/api
```

### Servir todos os apps

```bash
pnpm exec nx run-many -t serve --all
```

### Build

```bash
# Build de um app
pnpm exec nx build web
pnpm exec nx build api
pnpm exec nx build worker

# Build de todos
pnpm build
```

## Validação de qualidade

```bash
# Verificar tipos TypeScript
pnpm typecheck
# equivalente a: pnpm exec nx run-many -t typecheck --all

# Lint
pnpm lint
# equivalente a: pnpm exec nx run-many -t lint --all

# Verificar formatação
pnpm format:check

# Formatar (aplica mudanças)
pnpm format

# Testes unitários (sem serviços externos)
pnpm test
# equivalente a: pnpm exec nx run-many -t test --all --passWithNoTests

# Prisma
pnpm prisma:validate
pnpm prisma:generate
pnpm db:migrate
```

## Variáveis de ambiente

> ⚠️ **Nunca versionar arquivos `.env` com dados reais.** O CI bloqueia PRs que contenham `.env` real.

Crie `.env` nas apps que precisarem. Use sempre placeholders nos exemplos e mantenha valores reais fora do Git:

```dotenv
# apps/api/.env.example ou apps/worker/.env.example
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://<usuario>:<senha>@<host>:5432/<banco>?schema=public
REDIS_HOST=<host>
REDIS_PORT=6379
HEALTH_QUEUE_NAME=system.health.sanity
STORAGE_PRIVATE_ROOT=.local/storage/private
JWT_SECRET=<segredo-minimo-32-chars>
```

> Substitua cada `<placeholder>` pelo valor real no seu `.env` local. Nunca commitar o `.env` preenchido.

## Listar projetos no workspace

```bash
pnpm exec nx show projects
```

## CI local equivalente

Os mesmos checks executados no CI podem ser rodados localmente:

```bash
# 1. Verificar segredos (simula o job security do CI)
git ls-files | grep -E '^\.env$' && echo "ERRO: .env real versionado!" || echo "OK"

# 2. Lint + typecheck + testes
pnpm lint && pnpm typecheck && pnpm test
```

Veja `.github/workflows/ci.yml` para o workflow completo.

## Rotas de sanidade

| Camada | Rota              |
| ------ | ----------------- |
| Web    | `/app`            |
| Web    | `/app/sem-acesso` |
| Web    | `/admin/status`   |
| API    | `/api/bootstrap`  |
| API    | `/api/health`     |
| Worker | `/api/health/job` |
