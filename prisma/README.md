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

Comandos:

- `pnpm prisma:validate`
- `pnpm prisma:generate`
- `pnpm db:migrate`

Use apenas `.env` local nao versionado ou variaveis de ambiente do shell. Nunca grave credenciais reais neste diretorio.
