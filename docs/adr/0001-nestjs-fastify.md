# ADR-0001: NestJS com Fastify

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

A API precisa de um framework Node.js maduro, com suporte a injeção de dependência, validação e estrutura modular. O edital e o SDD definem NestJS como stack principal. É necessário escolher o adapter HTTP.

## Decisão

Adotar **NestJS 11** com adapter **Fastify** (`@nestjs/platform-fastify`), em vez de Express.

## Consequências

### Positivas

- Melhor desempenho e menor overhead por requisição em relação ao Express.
- Logger integrado do Fastify disponível na inicialização.
- Mantém o ecossistema NestJS (módulos, pipes, guards, filters).

### Negativas / trade-offs

- Alguns exemplos da comunidade assumem Express; adaptações pontuais podem ser necessárias.
- Plugins/middlewares específicos de Express não são compatíveis sem adaptação.

### Neutras

- Prefixo global da API: `api/v1`.

## Referências

- [SDD — Stack](../SDD.md)
- [arquitetura.md — Visão geral](../arquitetura.md#1-visão-geral)
