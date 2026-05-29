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

| Check       | Comando                                          |
| ----------- | ------------------------------------------------ |
| Lint        | `pnpm nx run-many -t lint --all`                 |
| Typecheck   | `pnpm nx run-many -t typecheck --all`            |
| Testes      | `pnpm nx run-many -t test --all --passWithNoTests` |
| Segurança   | Verifica arquivos `.env` reais e padrões de segredos |

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
```

> Os testes e2e (`api-e2e`, `worker-e2e`, `web-e2e`) dependem de servicos e sao executados separadamente.

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
```

> ⚠️ Copie os arquivos `.env.example` para `.env` (ou `.env.local` no web) antes de executar.  
> **Nunca versionar arquivos `.env` com dados reais.**

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
