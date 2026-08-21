# ADR-0006: Modelo relacional normalizado

- **Status:** Aceito
- **Data:** 2026-08-20
- **Decisores:** time do projeto

## Contexto

A especificação inicial (SDD v1.0) previa um modelo denormalizado em `articles`, com `author`, `category` e `tags TEXT[]` embutidos na mesma tabela. Isso simplifica a persistência, mas dificulta:

- Integridade referencial (autores/categorias/tags duplicados com grafias diferentes)
- Filtros por categoria/tag via JOIN com índices adequados (RF04, RF05)
- Evolução futura (rascunhos via `published_at` nullable, novas editorias)

O projeto está em bootstrap (sem dados em produção), permitindo pivotar o schema sem custo de migração de dados.

## Decisão

Adotar modelo relacional normalizado com 5 tabelas:

- `authors`, `categories`, `tags` — entidades de referência
- `articles` — aggregate root com FKs para author e category
- `article_tags` — tabela intermediária N:N com PK composta `(article_id, tag_id)`

**Regras complementares:**

1. `published_at` é nullable (rascunho/agendado); listagem filtra apenas publicados.
2. O contrato da API **não muda** — ingestão continua recebendo strings; o `ArticlesService` faz find-or-create das referências.
3. O índice OpenSearch permanece **denormalizado** — `ArticleMapper.toSearchDocument()` achata relações na indexação (read model de busca, CQRS leve).

## Consequências

### Positivas

- Integridade referencial com FKs e `ON DELETE` explícitos
- Filtros RF04/RF05 eficientes via JOIN + índices (`category_id`, `article_tags.tag_id`)
- Domínio expressivo: `Article` como aggregate root; Author/Category/Tag como referências
- `published_at` nullable prepara draft/scheduled sem nova migration

### Negativas / trade-offs

- JOINs na listagem (mitigado por índices e paginação obrigatória)
- Sincronização PG → OpenSearch exige mapper de achatamento
- Ingestão precisa de find-or-create para referências (repositórios adicionais)

### Neutras

- OpenSearch continua com documento flat — padrão de mercado para motores de busca
- Bounded context permanece único (`articles`); sem módulos separados por entidade

## Referências

- [SDD §2](../SDD.md#2-modelo-de-dados)
- [ADR-0003: CQRS leve](./0003-cqrs-leve.md)
- [ADR-0005: DDD pragmático](./0005-ddd-pragmatico-repository.md)
