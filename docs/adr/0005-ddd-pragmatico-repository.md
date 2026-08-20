# ADR-0005: DDD pragmático com Repository

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

O projeto deve demonstrar separação de responsabilidades, baixo acoplamento e preparação para evolução (RNF08), sem over-engineering típico de DDD tático completo.

A persistência usa Prisma/PostgreSQL; a busca usa OpenSearch. O domínio não pode depender desses detalhes.

## Decisão

Adotar **DDD pragmático** no bounded context `articles`:

- **Entidades** e **value objects** (`Slug`) no domínio.
- **Interfaces de repositório** no domínio (`IArticleRepository`, `ISearchRepository`).
- **Implementações** na infraestrutura (Prisma, OpenSearch), registradas via tokens `Symbol` no módulo NestJS.
- **Mappers** convertem entre modelos de persistência e entidades.

O domínio **não importa** `@nestjs/*`, Prisma nem clientes OpenSearch.

## Consequências

### Positivas

- Domínio testável sem banco ou busca.
- Troca de adapters de infraestrutura sem alterar regras de negócio.
- Estrutura de pastas clara: `presentation` → `application` → `domain` ← `infrastructure`.

### Negativas / trade-offs

- Boilerplate de interfaces, mappers e tokens de injeção.
- Nem todo conceito vira aggregate ou evento — pragmatismo em vez de DDD dogmático.

### Neutras

- Hexagonal (ports/adapters) aplicada de forma incremental no módulo `articles`.

## Referências

- [arquitetura.md — Camadas](../arquitetura.md#2-camadas-e-responsabilidades)
- [arquitetura.md — Estrutura de pastas](../arquitetura.md#3-estrutura-de-pastas)
