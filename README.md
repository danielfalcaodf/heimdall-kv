# Heimdall KV

> Base de Conhecimento com Vault e IA Contextual — versão open-source.

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

## Início rápido

> ⚠️ Em construção. Stack ainda não inicializada.

```bash
# Em breve
```

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
