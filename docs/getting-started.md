# Início Rápido — Heimdall KV

Base de Conhecimento open-source com Vault e IA Contextual.

## Pré-requisitos

| Ferramenta   | Versão mínima | Notas                          |
| ------------ | ------------- | ------------------------------ |
| Node.js      | 22.x          | Recomendado via `nvm` ou `fnm` |
| pnpm         | 10.x          | `npm install -g pnpm@10`       |
| PostgreSQL   | 16+           | Para execução completa futura  |
| Redis        | 7+            | Para filas/cache futuros       |

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
├── packages/        ← bibliotecas compartilhadas (a criar)
├── docs/            ← documentação do repo
├── nx.json          ← configuração Nx
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Comandos de desenvolvimento

### Servir apps individualmente

```bash
pnpm exec nx serve web      # Next.js web — http://localhost:4200
pnpm exec nx serve api      # NestJS API  — http://localhost:3000
pnpm exec nx serve worker   # NestJS Worker
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
```

## Variáveis de ambiente

> ⚠️ **Nunca versionar arquivos `.env` com dados reais.** O CI bloqueia PRs que contenham `.env` real.

Crie um arquivo `.env` na raiz e nas apps que precisarem. Use sempre placeholders nos exemplos:

```dotenv
# .env.example — copie para .env e substitua os valores
DATABASE_URL=postgresql://<usuario>:<senha>@<host>:5432/<banco>
REDIS_URL=redis://<host>:6379
JWT_SECRET=<segredo-minimo-32-chars>
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=http://<host>:9000
STORAGE_ACCESS_KEY=<access-key>
STORAGE_SECRET_KEY=<secret-key>
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
