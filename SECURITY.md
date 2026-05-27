# Segurança — Heimdall KV

## Reportar vulnerabilidades

Não abra issues públicas para vulnerabilidades. Envie um e-mail diretamente ao mantenedor.

## Política de dados sensíveis (LGPD)

Este projeto pode processar dados pessoais (nomes, e-mails, documentos). Por isso:

- Nenhum dado real deve ser versionado neste repositório.
- Nenhum dado pessoal deve aparecer em logs, buscas ou respostas de IA.
- O vault armazena segredos com permissão separada da documentação.
- IA nunca expõe valores reais de segredos.
- Dumps, backups e arquivos `.env` reais nunca devem ser commitados.

## O que nunca versionar

- Arquivos `.env` com valores reais
- Chaves privadas (`.pem`, `.key`, `.p12`, `.pfx`)
- Certificados
- Dumps de banco
- Dados pessoais (CPF, RG, endereços, e-mails reais)
- Tokens e senhas

## Responsável

daniel — 27-05-2026
