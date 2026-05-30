# Prisma e schemas de dominio

O Prisma e usado como ferramenta de acesso e migrations PostgreSQL.

A V1 usa schemas de dominio, nao `tenant_id` funcional espalhado nas tabelas:

- `auth`
- `org`
- `kb`
- `storage`
- `vault`
- `search`
- `ai`
- `audit`
- `admin`

## Tabelas implementadas

### `auth`

ST-031 cria a base de autenticacao local:

- `auth.users`: usuarios internos, papel inicial e status operacional.
- `auth.invitations`: convites administrativos com hash do token, expiracao, aceite e invalidacao.
- `auth.sessions`: sessoes locais com hash do token, expiracao e revogacao.

Tokens e senhas nao devem ser persistidos em texto claro. As migrations usam apenas estrutura e constraints, sem dados reais.

Comandos:

- `pnpm prisma:validate`
- `pnpm prisma:generate`
- `pnpm db:migrate`

Use apenas `.env` local nao versionado ou variaveis de ambiente do shell. Nunca grave credenciais reais neste diretorio.
