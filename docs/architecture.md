# Arquitetura — Heimdall KV

## Visão geral

Heimdall KV é um **modular monolith** single-tenant por instalação. Uma instância serve uma organização.

## Stack

| Camada       | Tecnologia                        |
| ------------ | --------------------------------- |
| Frontend     | Next.js + TypeScript              |
| Backend      | NestJS + TypeScript               |
| Worker       | NestJS Worker (jobs assíncronos)  |
| Banco        | PostgreSQL + Prisma               |
| Cache / Fila | Redis + BullMQ                    |
| Storage      | MinIO / S3-compatible             |
| IA           | RAG sobre base interna autorizada |

## Schemas PostgreSQL por domínio

| Schema    | Responsabilidade                          |
| --------- | ----------------------------------------- |
| `auth`    | Usuários, sessões, tokens                 |
| `org`     | Organização, clientes, setores, projetos  |
| `kb`      | Documentos, versões, tags                 |
| `storage` | Arquivos, blobs, metadados                |
| `vault`   | Segredos por projeto (permissão separada) |
| `search`  | Índices e configurações de busca          |
| `ai`      | Embeddings, histórico de consultas        |
| `audit`   | Logs de auditoria transversal             |
| `admin`   | Configurações do sistema                  |

O diretório `prisma/` contém a migration inicial que cria esses schemas.
A V1 não usa `tenant_id` funcional nas tabelas; o isolamento enterprise futuro
fica fora deste repositório open-source.

## Bootstrap e health

| Contrato      | Rota              | Finalidade                                                       |
| ------------- | ----------------- | ---------------------------------------------------------------- |
| Bootstrap     | `/api/bootstrap`  | Estado inicial do shell autenticado com dados sintéticos         |
| Health        | `/api/health`     | Status seguro de API, PostgreSQL, Redis, worker, storage e filas |
| Worker sanity | `/api/health/job` | Processamento mínimo de job sintético                            |

As respostas de health não retornam hosts, credenciais, connection strings ou payloads brutos.

## Bibliotecas locais

- `libs/contracts`: contratos compartilhados entre web, API e worker.
- `libs/runtime-config`: validação de variáveis obrigatórias sem imprimir valores.
- `libs/queue`: contrato BullMQ e job sintético de sanidade.
- `libs/storage`: adapter privado local para arquivos, sem URL pública fixa.

## Princípios

1. Markdown canônico como fonte oficial de documentos.
2. Vault com permissão separada da documentação.
3. IA somente sobre base interna autorizada — nunca expõe segredos reais.
4. Jobs assíncronos para conversão, indexação e exportação.
5. Storage sempre por adapter (local → cloud sem reescrita).
6. Auditoria transversal em todas as operações.

## O que esta versão NÃO tem

- MSAL / Azure AD → disponível no Heimdall KV Enterprise.
- Personalização de logo/títulos → Enterprise.
- Multi-tenant → Enterprise (futuro).
