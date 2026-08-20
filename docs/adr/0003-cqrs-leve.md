# ADR-0003: CQRS leve (PG + OpenSearch)

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

O sistema precisa listar e detalhar artigos com filtros estruturados e, ao mesmo tempo, oferecer busca textual relevante. PostgreSQL e OpenSearch têm forças distintas: consistência relacional vs. busca full-text.

Implementar CQRS completo (commands, queries, handlers separados, projeções) seria excessivo para o escopo atual.

## Decisão

Adotar **CQRS leve**:

- **PostgreSQL (via Prisma):** listagem, paginação, filtros e detalhe por slug/id.
- **OpenSearch:** busca textual quando o parâmetro `q` estiver presente.

Escritas continuam no PostgreSQL; a indexação no OpenSearch é efeito colateral da orquestração (síncrona localmente, assíncrona em produção).

## Consequências

### Positivas

- Cada store usa a ferramenta mais adequada à consulta.
- Sem a complexidade de um CQRS full (sem handlers/commands separados por operação).
- Atende RNF10 (busca e persistência).

### Negativas / trade-offs

- Eventual consistência entre PG e OpenSearch; estratégia de reindexação deve ser documentada.
- Dois pontos de leitura exigem testes de integração para o fluxo `q`.

### Neutras

- Contratos da API permanecem unificados em `GET /articles`.

## Referências

- [SDD — Sincronização banco ↔ busca](../SDD.md#32-padrão-de-sincronização-banco--busca)
- [arquitetura.md — CQRS leve](../arquitetura.md#1-visão-geral)
