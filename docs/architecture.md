# Arquitetura — Heimdall KV

## Visão geral

Heimdall KV é um **modular monolith** single-tenant por instalação. Uma instância serve uma organização.

## Stack

| Camada       | Tecnologia                        |
| ------------ | --------------------------------- |
| Frontend     | Next.js + TypeScript              |
| Backend      | NestJS + TypeScript               |
| Worker       | NestJS Worker (jobs assíncronos)  |
| Banco        | PostgreSQL                        |
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
