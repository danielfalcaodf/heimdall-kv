# Features — Heimdall KV (open-source)

## Incluído nesta versão

### Base documental

- Criação, edição e versionamento de documentos em Markdown.
- Organização por cliente, setor e projeto.
- Importação/exportação DOCX e PDF (futuro).

### Autenticação

- Login local com e-mail e senha.
- Convites administrativos com expiração e invalidação.
- Sessão local com expiração e encerramento.
- Tokens persistidos apenas em hash.
- Controle de acesso por projeto.

### Vault

- Armazenamento de segredos por projeto.
- Permissão separada da documentação.
- IA não acessa valores reais do vault.

### Busca

- Full-text via PostgreSQL.
- Busca vetorial / semântica via pgvector (futuro).
- Escopo por cliente, setor ou projeto.

### IA contextual

- RAG (Retrieval-Augmented Generation) sobre documentos autorizados.
- Sem acesso aberto à internet.
- Sem exposição de segredos reais.

### Auditoria

- Log transversal de todas as operações.
- Rastreabilidade por usuário e projeto.

## Não incluído nesta versão (disponível no Enterprise)

| Feature                                | Disponível em          |
| -------------------------------------- | ---------------------- |
| MSAL / Azure AD                        | Heimdall KV Enterprise |
| Personalização de logo, nome e títulos | Enterprise             |
| Multi-tenant / isolamento por cliente  | Enterprise (futuro)    |
| Deploy e configuração enterprise       | Enterprise             |
