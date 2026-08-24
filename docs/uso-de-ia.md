# Uso de IA no desenvolvimento — Backend

> Atende [RNF16 — Uso responsável de IA](./requisitos-funcionais-nao-funcionais.md#rnf16--uso-responsável-de-ia).

---

## 1. Contexto

Desenvolvimento do backend do desafio técnico da **Gazeta do Povo**, com **Cursor** como ambiente principal. A IA generativa entrou como **ferramenta de aceleração** — rascunhos de documentação, exploração de alternativas, boilerplate e primeiros casos de teste.

**O que a IA não fez:** definir requisitos, registrar ADRs finais, validar contratos REST, executar suites de integração como critério de merge ou decidir deploy. Toda entrega passou por leitura do edital, consulta ao [SDD](./SDD.md) e revisão manual antes de commit.

Fluxo adotado: **especificação → ADR (quando aplicável) → teste → implementação → revisão humana**.

### Ferramentas e modelos

| Ferramenta | Modelo | Quando usar |
|------------|--------|-------------|
| [Cursor](https://cursor.com) | **Claude Sonnet 4.6** | Planejamento: arquitetura, ADRs, SDD, estratégia de testes, trade-offs |
| [Cursor](https://cursor.com) | **Composer 2.5** | Execução: boilerplate, testes, mappers, repositórios Prisma, configs Jest/Husky, seed |

Sonnet 4.6 para decisões estruturais; Composer 2.5 para iteração rápida e TDD.

---

## 2. O que ficou humano

| Responsabilidade | Por quê |
|------------------|---------|
| Baseline de requisitos (RF/RNF) | Espelho fiel do edital; critério de aceite |
| ADRs e pivots (ex.: schema normalizado) | Decisões arquiteturais formais; ADR-0006 após revisão do modelo |
| Contratos da API (`/api/v1`) | Endpoints, códigos HTTP, payloads — fonte para o frontend consumir |
| Regras de domínio | `Article`, `Slug`, exceções `ArticleNotFound` / `DuplicateSlug` |
| Estratégia de testes | Unitário com mocks vs integração com PG/OpenSearch reais; exclusões de cobertura |
| CQRS leve e indexação | Quando usar PG vs OpenSearch; `search.remove()` na despublicação |
| Deploy Render | Outbox PG + worker embutido; variáveis `FRONTEND_REVALIDATE_URL`, TTLs de cache |
| Integração com frontend | Webhook ISR server-to-server; repos separados no GitHub |

A IA acelerou a escrita; **o critério de qualidade e o “merge ou não merge” foram meus**.

---

## 3. Onde a IA auxiliou

| Área | Contribuição da IA | Revisão / decisão final |
|------|--------------------|-------------------------|
| **Documentação** (`docs/`, ADRs, SDD, README) | Estrutura, primeira redação, tabelas, diagramas Mermaid | Alinhamento ao edital, ADRs, status ✅/🔜/📄 |
| **Schema e seed** | Models, migrations, script inicial | Normalização (ADR-0006), FKs, índices, dados do seed |
| **Código** (domínio, infra) | Entidades, repos Prisma/OpenSearch, `ArticlesService`, guards/filters, mappers | Regras de negócio, exceções, contratos das interfaces |
| **Testes** | Casos iniciais, setup de integração, specs HTTP com OpenSearch real | Estratégia mock vs. banco vs. OpenSearch, cobertura, pre-commit |
| **Infra local** | `docker-compose.yml`, `.env.example`, flag `SEARCH_REINDEX_ON_STARTUP` | Portas, health checks, validação local |
| **Cache e webhook** | `HttpCacheInterceptor`, `FrontendCacheInvalidationService` | TTLs por rota; fire-and-forget; falha não bloqueia ingestão |
| **Regras Cursor** (`.cursor/rules/`) | Rascunho de padrões | Consistência com ADRs e código existente |

Documentos revisados manualmente:

| Documento | Foco da revisão |
|-----------|-----------------|
| [requisitos-funcionais-nao-funcionais.md](./requisitos-funcionais-nao-funcionais.md) | Espelho fiel do edital |
| [SDD.md](./SDD.md) | Contratos, rastreabilidade RF/RNF, modelo de dados |
| [arquitetura.md](./arquitetura.md) | Camadas DDD, TDD, CQRS leve |
| [adr/](./adr/) | Decisões formais registradas |
| [diagramas/diagrama-eer.png](./diagramas/diagrama-eer.png) | Conferência com schema Prisma |
| [prisma-schema/index.html](./prisma-schema/index.html) | Gerado por `prisma-docs-generator`; schema validado no `schema.prisma` |

---

## 4. Decisões técnicas revisadas

Registro de escolhas tomadas durante o projeto — em vários casos, a IA sugeriu um caminho diferente do adotado. Detalhes nos ADRs.

| Tema | Alternativa considerada | Decisão adotada | Registro |
|------|-------------------------|-----------------|----------|
| Orquestração | Use case por endpoint | `ArticlesService` direto | [ADR-0004](./adr/0004-articles-service-orquestracao.md) |
| Efeitos colaterais | Domain Events + event bus | Orquestração explícita, sem events | [ADR-0002](./adr/0002-sem-domain-events.md) |
| Leitura | Fonte única (PG ou OS) | CQRS leve: PG + OpenSearch (`q`) | [ADR-0003](./adr/0003-cqrs-leve.md) |
| Modelo de dados | `articles` denormalizada | 5 tabelas + N:N | [ADR-0006](./adr/0006-modelo-relacional-normalizado.md) |
| DDD | Módulo por entidade | Bounded context `articles` | [ADR-0005](./adr/0005-ddd-pragmatico-repository.md) |
| HTTP | Express (padrão NestJS) | Fastify | [ADR-0001](./adr/0001-nestjs-fastify.md) |
| Testes Prisma | Mock nos unitários | Integração com PG real | [arquitetura.md §5](./arquitetura.md#5-tdd--estratégia-de-testes) |
| Validação HTTP | 422 Unprocessable Entity | **400 Bad Request** (default NestJS, alinhado ao SDD) | [arquitetura.md §4.5](./arquitetura.md#45-tratamento-de-erros) |
| Despublicar (`publishedAt: null`) | Reindexar sem `publishedAt` no OpenSearch | `search.remove()` — documento removido do índice | [arquitetura.md §4.4](./arquitetura.md#44-indexação--local-vs-produção) |
| Reindex na subida | Full reindex em todo `onModuleInit` | `SEARCH_REINDEX_ON_STARTUP` (default `true` em dev) | [README](../README.md#variáveis-de-ambiente) |
| Teste HTTP `?q=` | Mock de `SEARCH_REPOSITORY` no controller | Spec dedicado com OpenSearch real | `articles.controller.search.integration.spec.ts` |
| Indexação prod | SQS real | Outbox PG + worker embutido no Render | [deploy-render.md](./deploy-render.md) |
| Cache | Redis / ElastiCache | `Cache-Control` na API + ISR no frontend via webhook | [SDD §3.5](./SDD.md#35-cache-e-invalidação-sem-redis) |

**Ajustes relevantes após rascunhos da IA:**

- Schema normalizado com PK composta em `article_tags` e `ON DELETE RESTRICT`.
- Regras de domínio em `Article` e `Slug`; exceções `ArticleNotFound`, `DuplicateSlug`.
- Suites separadas: unitário (`yarn test`) e integração (`yarn test:integration`); repos Prisma fora da cobertura unitária.
- Spec de integração HTTP de busca separado do spec com mock (listagem PG + ingestão).
- Helper compartilhado `test/integration/helpers/opensearch.helper.ts` para health check e limpeza do índice.
- Descartados: event bus, use case por endpoint, Testcontainers (Docker Compose já cobre integração local).

---

## 5. Prompts utilizados

Resumo das principais sessões — objetivo, prompt essencial e resultado. Sem dump de chat.

### Planejamento — Claude Sonnet 4.6

| Sessão | Prompt (resumo) | Resultado |
|--------|-----------------|-----------|
| SDD inicial | *"Com base no edital, produza SDD com contratos REST, paginação, ingestão com API Key e mapa RF/RNF."* | Contratos mantidos; rastreabilidade atualizada conforme implementação |
| Arquitetura DDD | *"Proponha arquitetura NestJS DDD pragmático: PG + OpenSearch, sem over-engineering."* | CQRS leve; sem Domain Events; Outbox/SQS só produção |
| ADRs | *"Gere ADRs para Fastify, sem events, CQRS, ArticlesService, repository."* | 6 ADRs aceitos; ADR-0006 após pivot do schema |
| Testes | *"Estratégia Jest: unitários no domínio, integração nos repos Prisma, Husky pre-commit."* | Mock vs. banco definido; exclusões de cobertura |
| Normalização | *"Modelo normalizado mantendo API flat e denormalização no OpenSearch."* | 5 tabelas; `published_at` nullable — ADR-0006 |
| Lacunas técnicas | *"Plano: teste HTTP ?q= real, unpublish remove, reindex flag, docs 400."* | TDD Red→Green; specs dedicados |
| Cache sem Redis | *"Cache-Control na API + webhook para revalidar ISR do frontend após ingestão."* | Interceptor + `FrontendCacheInvalidationService` |

### Execução — Composer 2.5

| Sessão | Prompt (resumo) | Resultado |
|--------|-----------------|-----------|
| Schema + seed | *"Schema Prisma Author/Category/Tag/Article/ArticleTag; seed 20+ artigos."* | Migrations incrementais; comentários `///` |
| Domínio + repos | *"Módulo articles: entidades, ArticleRepository, PrismaArticleRepository paginado."* | Filtros RF04/RF05; mappers; exceções de domínio |
| OpenSearch | *"Cliente OpenSearch, ISearchRepository, busca textual com multi_match e filtros."* | CQRS leve; `findByIds` preserva ordem de relevância |
| Ingestão RF08 | *"POST/PUT com ApiKeyGuard, DTOs, create/update no ArticlesService, indexação sync ou async."* | `INDEXING_MODE`; Outbox `index_jobs`; worker no Render |
| Guards/filters | *"ApiKeyGuard + DomainExceptionFilter global para erros padronizados."* | 400 via ValidationPipe default; 404/409 via filter |
| Testes unitários | *"Testes para ArticleMapper e Slug VO."* | Casos de borda cobertos |
| Testes integração | *"Integração PrismaArticleRepository com schema isolado."* | Setup global; cenários find/create/filtro |
| Testes busca HTTP | *"Spec dedicado GET ?q= com OpenSearch real; helper compartilhado."* | Lacuna de controller mockada fechada |
| Bootstrap OS | *"Flag SEARCH_REINDEX_ON_STARTUP; ensureIndex sempre, reindex condicional."* | Dev `true`; prod `false` + job futuro |
| Infra + DX | *"Docker Compose PG+OpenSearch+LocalStack; Husky test:cov."* | `.env.example` e README alinhados |
| Cursor rules | *"Rules para DDD pragmático, consulta à docs, TDD."* | `.cursor/rules/` consistente com ADRs |

---

## 6. Resumo da solução *(mini documento — revisado manualmente)*

API REST **NestJS 11 + Fastify**, **PostgreSQL** (persistência) e **OpenSearch** (busca textual, CQRS leve). Bounded context `articles` com entidades, value objects e repositórios abstraídos; orquestração no `ArticlesService`. Infra local via Docker Compose; produção no [Render](https://portal-noticias-backend.onrender.com/).

### Como a especificação guiou a implementação

| Fase | O que o SDD/edital pediu | O que foi entregue |
|------|--------------------------|-------------------|
| 1 | RNF15 SDD + baseline RF/RNF | `docs/requisitos-*`, SDD v1, ADRs iniciais |
| 2 | Setup NestJS + Prisma + Docker | Fastify, Compose (PG, OS, LocalStack) |
| 3 | RF09 persistência + RF10 seed | Schema normalizado; seed 20+ artigos |
| 4 | RF07 API + RF08 ingestão | Controllers, DTOs, `ApiKeyGuard`, `ArticlesService` |
| 5 | RF01–RF06 leitura | Listagem PG, busca `q` no OS, detalhe por slug, filtros |
| 6 | RNF07 testabilidade | Jest unit + integração; CI com PG/OS reais |
| 7 | Indexação e CQRS | Sync local; Outbox + worker async no Render |
| 8 | Cache sem Redis | `Cache-Control` + webhook ISR no [frontend](https://github.com/Lucas-Braz7x/portal-noticias-frontend) |

Cada RF implementado neste repo tem rastreio no [SDD §1](./SDD.md#1-rastreabilidade). RF de interface (RF11) ficam no repositório do frontend, referenciado por link — sem acoplar paths locais na documentação.

### Estado atual (RF01–RF10 ✅)

| Área | Implementado |
|------|--------------|
| Leitura | `GET /articles` (PG), `GET /articles?q=` (OpenSearch + hidratação PG), `GET /articles/:slug` |
| Ingestão | `POST` / `PUT` com `X-API-Key`; sync (dev) ou async Outbox + worker embutido (Render) |
| Segurança | `ApiKeyGuard`, validação DTO (`400`), `DomainExceptionFilter` (`404`, `409`) |
| OpenSearch | Cliente, índice, bootstrap (`ensureIndex` + reindex opcional), testes repo + HTTP |
| Testes | ~105 unitários + ~59 integração (PG, OpenSearch, HTTP) |
| Deploy | [portal-noticias-backend.onrender.com](https://portal-noticias-backend.onrender.com/) |

**Pendente / só documentado:** observabilidade CloudWatch/X-Ray, OpenAPI/Swagger exposto, driver SQS real (LocalStack permanece simulação dev).

→ [SDD.md](./SDD.md) · [arquitetura.md](./arquitetura.md)

---

## 7. Trade-offs

| Decisão | Ganho | Custo |
|---------|-------|-------|
| Sem Domain Events | Fluxo explícito, testes simples | Orquestração acoplada à indexação |
| CQRS leve | PG para listagem; OS para relevância | Sincronização PG → OS |
| Modelo normalizado | Integridade; filtros RF04/RF05 | JOINs; find-or-create na ingestão |
| DDD pragmático | Domínio testável, baixa ceremony | Menos pureza que DDD enterprise |
| Integração separada | Confiança nos repos Prisma e OpenSearch | Requer Docker; suite mais lenta |
| Reindex na subida (dev) | Índice consistente após restart local | Em prod exige flag `false` + job dedicado |
| `search.remove()` na despublicação | Índice sem documentos órfãos | Operação extra no fluxo de update |
| Outbox PG + worker embutido | Deploy simples no Render; transação atômica save+enqueue | Não é SQS “de verdade” em prod; consistência eventual na busca |
| Cache sem Redis | Compatível com Render; HTTP `Cache-Control` + ISR + webhook | Sem invalidação instantânea se webhook falhar (TTL cobre) |
| Repos separados (API + UI) | Deploy e evolução independentes | Dois SDDs e secrets (`REVALIDATE_SECRET`) para alinhar |

---

## 8. Premissas, dúvidas e próximos passos

**Premissas:**

- [Frontend](https://github.com/Lucas-Braz7x/portal-noticias-frontend) em repo separado; consome esta API server-side (sem CORS).
- Ingestão via `X-API-Key`; `published_at` nullable para rascunhos.
- Produção Render usa Outbox PG + worker embutido (`INDEXING_MODE=async`).
- `FRONTEND_REVALIDATE_URL` aponta para `https://portal-noticias-frontend.onrender.com/api/revalidate` quando ISR on-demand está ativo.
- Arquitetura AWS documentada como evolução — ver [arquitetura-producao.md](./arquitetura-producao.md).

**Dúvidas registradas (não bloqueantes):**

- OpenSearch externo no Render vs `OPENSEARCH_ENABLED=false` — trade-off custo vs relevância na busca `q`.
- E2E no CI exige orquestrar dois repos — adiado; validação local documentada no frontend.

**Próximos passos (backend):**

1. Job de reindexação em produção (`SEARCH_REINDEX_ON_STARTUP=false`)
2. OpenAPI/Swagger exposto na API
3. Observabilidade (correlation ID, logs estruturados, CloudWatch)
4. Driver SQS real (além do Outbox Render)
5. E2E no CI — job com docker-compose + frontend (cross-repo)

**Implementado (diferencial):** cache HTTP + invalidação ISR via webhook; ingestão assíncrona (Outbox + worker embutido).

---

*Versão: 2.0 — Agosto/2026*
