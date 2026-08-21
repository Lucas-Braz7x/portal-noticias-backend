# Architecture Decision Records (ADR)

Registro das decisões arquiteturais relevantes do **Portal de Notícias Backend**.

Cada ADR captura o contexto, a decisão tomada e suas consequências. Decisões gerais de padrões e camadas continuam resumidas em [arquitetura.md](../arquitetura.md); aqui ficam os registros formais e rastreáveis.

## Índice

| ADR | Título | Status |
|-----|--------|--------|
| [0000](./0000-template.md) | Template | — |
| [0001](./0001-nestjs-fastify.md) | NestJS com Fastify | Aceito |
| [0002](./0002-sem-domain-events.md) | Sem Domain Events | Aceito |
| [0003](./0003-cqrs-leve.md) | CQRS leve (PG + OpenSearch) | Aceito |
| [0004](./0004-articles-service-orquestracao.md) | Orquestração via ArticlesService | Aceito |
| [0005](./0005-ddd-pragmatico-repository.md) | DDD pragmático com Repository | Aceito |
| [0006](./0006-modelo-relacional-normalizado.md) | Modelo relacional normalizado | Aceito |

## Como criar um novo ADR

1. Copie [0000-template.md](./0000-template.md) para o próximo número sequencial (`0006-titulo-curto.md`).
2. Preencha contexto, decisão e consequências.
3. Atualize esta tabela de índice.
4. Se a decisão alterar padrões globais, atualize também [arquitetura.md](../arquitetura.md).

## Status possíveis

| Status | Significado |
|--------|-------------|
| **Proposto** | Em discussão; ainda não adotado |
| **Aceito** | Decisão vigente no projeto |
| **Substituído** | Substituído por outro ADR (indicar qual) |
| **Obsoleto** | Não se aplica mais |
