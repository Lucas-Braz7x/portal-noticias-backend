# ADR-0002: Sem Domain Events

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

Após publicar ou atualizar um artigo, a API precisa persistir no PostgreSQL e indexar no OpenSearch. Padrões DDD frequentemente usam Domain Events e event bus para desacoplar efeitos colaterais.

Para o escopo do desafio técnico, é preciso equilibrar clareza arquitetural com simplicidade de implementação e manutenção.

## Decisão

**Não adotar Domain Events** nem event bus no código da aplicação.

A orquestração entre persistência e indexação fica no `ArticlesService` (ambiente local) ou no worker de indexação (produção com SQS), de forma explícita e direta.

## Consequências

### Positivas

- Fluxo de negócio mais fácil de seguir e testar.
- Menos abstrações e infraestrutura (sem publicador/assinante de eventos).
- Alinhado ao DDD pragmático definido no projeto.

### Negativas / trade-offs

- Acoplamento maior entre orquestração e efeitos colaterais (indexação).
- Evolução para múltiplos consumidores de eventos exigiria revisão desta decisão.

### Neutras

- O padrão Outbox + SQS permanece documentado para produção, sem Domain Events no domínio.

## Referências

- [arquitetura.md — O que implementar vs documentar](../arquitetura.md#1-visão-geral)
- [arquitetura.md — Indexação local vs produção](../arquitetura.md#44-indexação--local-vs-produção)
