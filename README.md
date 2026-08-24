# Portal de Notícias — Backend

API REST para o portal de notícias/artigos, desenvolvida como parte do desafio técnico da **Gazeta do Povo**.

Construída com **NestJS + Fastify**, **Prisma + PostgreSQL** e **OpenSearch**, seguindo **DDD pragmático**, **Clean Code**, **TDD**, **Repository / Services** e **CQRS leve** (PG para listagem, OpenSearch para busca textual).

---

## Stack

| Camada    | Tecnologia                      |
| --------- | ------------------------------- |
| Runtime   | Node.js 22 (recomendado) ou 20+ |
| Framework | NestJS 11 + Fastify             |
| ORM       | Prisma                          |
| Banco     | PostgreSQL 16                   |
| Busca     | OpenSearch 2.x                  |
| AWS local | LocalStack (SQS)                |
| Linguagem | TypeScript                      |

---

## Pré-requisitos

- Node.js 22 (recomendado) ou 20+
- Yarn 1.22+
- Docker e Docker Compose

---

## Como rodar

### 1. Clonar e instalar dependências

```bash
git clone <repo-url>
cd portal-noticias-backend
yarn install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

### 3. Subir infraestrutura local

```bash
docker compose up -d
```

Serviços disponíveis:

| Serviço    | URL                     | Uso                                            |
| ---------- | ----------------------- | ---------------------------------------------- |
| PostgreSQL | `localhost:5432`        | Persistência                                   |
| OpenSearch | `http://localhost:9200` | Busca textual                                  |
| LocalStack | `http://localhost:4566` | SQS (simulação AWS em dev; prod usa Outbox PG) |

Verificar OpenSearch:

```bash
curl http://localhost:9200/_cluster/health
```

### 4. Executar migrations

```bash
yarn prisma:migrate
```

### 5. (Opcional) Popular o banco com artigos de exemplo

Popula o banco com 22 artigos fictícios (RF10):

```bash
yarn prisma db seed
```

### 6. Iniciar a API

```bash
# desenvolvimento
yarn start:dev

# produção
yarn build
yarn start:prod

# background worker (indexação assíncrona — Render)
yarn start:worker
```

A API estará disponível em `http://localhost:3000/api/v1`.

Em desenvolvimento, a indexação é **síncrona** (`INDEXING_MODE=sync`, default). Com `INDEXING_MODE=async`, o worker embutido sobe junto com a API (`INDEX_WORKER_AUTOSTART=true`) e drena jobs pendentes na subida — não é preciso rodar `yarn start:worker` em outro terminal. Para um processo dedicado (produção), use `yarn build && yarn start:worker` e defina `INDEX_WORKER_AUTOSTART=false` na API.

### Health check

```bash
curl http://localhost:3000/api/v1/health
```

---

## Scripts disponíveis

| Script                  | Descrição                                          |
| ----------------------- | -------------------------------------------------- |
| `yarn start:dev`        | Inicia em modo watch                               |
| `yarn build`            | Compila para `dist/`                               |
| `yarn start:prod`       | Executa build de produção                          |
| `yarn start:worker`     | Background worker — consome `index_jobs` (async)   |
| `yarn lint`             | ESLint (flat config)                               |
| `yarn lint:fix`         | ESLint com correção automática                     |
| `yarn format`           | Formata código com Prettier                        |
| `yarn format:check`     | Verifica formatação sem alterar arquivos           |
| `yarn test`             | Executa testes unitários                           |
| `yarn test:cov`         | Testes unitários com cobertura (mínimo global 75%) |
| `yarn test:watch`       | Testes unitários em modo watch                     |
| `yarn test:integration` | Repositórios Prisma com PostgreSQL real            |
| `yarn test:all`         | Unitários + integração                             |
| `yarn prisma:migrate`   | Cria/aplica migrations                             |
| `yarn prisma:studio`    | Abre Prisma Studio                                 |
| `yarn prisma:generate`  | Gera Prisma Client e docs HTML do schema           |
| `yarn prisma:docs`      | Serve a referência HTML em `localhost:5858`        |

---

## Endpoints

| Método | Rota                     | Status          | Descrição                                                                                                |
| ------ | ------------------------ | --------------- | -------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/health`         | ✅ Implementado | Status da API e conexão com banco                                                                        |
| `GET`  | `/api/v1/articles`       | ✅ Implementado | Listagem paginada (RF01/RF02); busca com `q` via OpenSearch (RF03); filtros `category`/`tag` (RF04/RF05) |
| `GET`  | `/api/v1/articles/:slug` | ✅ Implementado | Detalhe de artigo publicado (RF06)                                                                       |
| `POST` | `/api/v1/articles`       | ✅ Implementado | Criar artigo (requer `X-API-Key`); `201` (sync) ou `202` (async)                                         |
| `PUT`  | `/api/v1/articles/:id`   | ✅ Implementado | Atualizar artigo (requer `X-API-Key`); `200` (sync) ou `202` (async)                                     |

Contratos completos na [especificação SDD](docs/SDD.md#4-contratos-da-api).

---

## Arquitetura

O projeto segue **DDD pragmático** com camadas bem definidas:

```
Presentation → Application → Domain ← Infrastructure
```

- **Controllers** — entrada HTTP, DTOs, validação, `ApiKeyGuard` na ingestão ✅
- **ArticlesService** — orquestração direta (PostgreSQL + OpenSearch ou Outbox) ✅
- **IndexWorkerService** — processa `index_jobs` e revalida o frontend (modo async) ✅
- **Domain** — entidades, value objects, interfaces de repositório ✅
- **Infrastructure** — Prisma ✅, OpenSearch ✅ (busca com `q` e indexação na ingestão)

**CQRS leve:** listagem/filtros no PostgreSQL; busca textual no OpenSearch. Domain Events não adotados — ver [docs/arquitetura.md](docs/arquitetura.md).

Documentação completa: [docs/arquitetura.md](docs/arquitetura.md)

---

## Documentação

| Documento                                                                                    | Conteúdo                                                           |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [docs/requisitos-funcionais-nao-funcionais.md](docs/requisitos-funcionais-nao-funcionais.md) | Baseline do edital — requisitos funcionais e não funcionais        |
| [docs/SDD.md](docs/SDD.md)                                                                   | Especificação técnica (contratos, modelos, stack, rastreabilidade) |
| [docs/arquitetura.md](docs/arquitetura.md)                                                   | Padrões, camadas, TDD, estrutura de pastas                         |
| [docs/prisma-schema/index.html](docs/prisma-schema/index.html)                               | Referência HTML do schema Prisma (models, campos, relações)        |
| [docs/diagramas/diagrama-eer.png](docs/diagramas/diagrama-eer.png)                           | Diagrama EER do banco relacional                                   |
| [docs/adr/](docs/adr/)                                                                       | Architecture Decision Records (ADRs)                               |
| [docs/deploy-render.md](docs/deploy-render.md)                                               | Deploy no Render (API + Background Worker + frontend)              |
| [docs/uso-de-ia.md](docs/uso-de-ia.md)                                                       | Uso de IA no desenvolvimento (RNF16)                               |

### Schema Prisma e diagrama EER

O modelo relacional está documentado em três formatos complementares:

| Recurso                                                              | Descrição                                                        |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`prisma/schema.prisma`](prisma/schema.prisma)                       | Fonte da verdade — models, relações e comentários `///`          |
| [`docs/prisma-schema/index.html`](docs/prisma-schema/index.html)     | Referência HTML interativa (models, campos, operações do client) |
| [`docs/diagramas/diagrama-eer.png`](docs/diagramas/diagrama-eer.png) | Diagrama EER visual do banco relacional                          |

Os comentários `///` alimentam o IntelliSense do Prisma Client e a referência HTML gerada pelo [`prisma-docs-generator`](https://github.com/pantharshit00/prisma-docs-generator).

```bash
# Regenera client + docs/prisma-schema/index.html
yarn prisma:generate

# Abre servidor local para navegar a referência HTML
yarn prisma:docs
# → http://localhost:5858
```

Também é possível abrir diretamente [`docs/prisma-schema/index.html`](docs/prisma-schema/index.html) ou o [`diagrama EER`](docs/diagramas/diagrama-eer.png) no navegador/visualizador de imagens.

---

## Testes

Duas suites **Jest**, com responsabilidades distintas (sem duplicar mock + banco no mesmo cenário):

| Suite      | Comando                       | Escopo                                                   |
| ---------- | ----------------------------- | -------------------------------------------------------- |
| Unitário   | `yarn test` / `yarn test:cov` | Domínio, mappers, ArticlesService (mocks), health        |
| Integração | `yarn test:integration`       | Repositórios Prisma com PostgreSQL real (schema isolado) |

```bash
yarn test              # unitários (pre-commit)
yarn test:cov          # unitários + cobertura (mínimo global 75%)
yarn test:watch        # unitários em modo interativo
yarn test:integration  # repositórios — requer docker compose up -d
```

Estratégia completa (mock vs banco, o que testar em cada camada): [docs/arquitetura.md §5](docs/arquitetura.md#5-tdd--estratégia-de-testes).

O **[Husky](https://typicode.github.io/husky/)** executa `yarn lint`, `yarn format:check` e `yarn test:cov` no **pre-commit**.

Arquivos excluídos da cobertura unitária: bootstrap (`main.ts`, módulos Nest), interfaces de repositório no domínio e **implementações Prisma em `infrastructure/repositories/`** (cobertas por `yarn test:integration`).

---

## CI

O pipeline em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em **push** e **pull request** para `main`/`master`, com **Node.js 22**:

| Job           | Comando(s)                       | Infra                                      |
| ------------- | -------------------------------- | ------------------------------------------ |
| `quality`     | `yarn lint`, `yarn format:check` | —                                          |
| `unit`        | `yarn test:cov`                  | —                                          |
| `build`       | `yarn build`                     | —                                          |
| `integration` | `yarn test:integration`          | PostgreSQL + OpenSearch (`docker compose`) |
| `deploy`      | deploy hook Render               | só em **push** em `main`, após jobs acima  |

O job `deploy` dispara o deploy de produção no Render via secret `RENDER_DEPLOY_HOOK_URL`. PR previews são criados automaticamente pelo Render (não via hook). Ver [docs/deploy-render.md § CI/CD](docs/deploy-render.md#4-cicd-github-actions--render).

Para reproduzir localmente os mesmos passos do CI:

```bash
yarn lint && yarn format:check && yarn test:cov && yarn build
docker compose up -d postgres opensearch
# aguardar health dos serviços
yarn test:integration
```

---

## Variáveis de ambiente

| Variável                    | Descrição                                                                                                                     | Default                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `PORT`                      | Porta da API                                                                                                                  | `3000`                        |
| `NODE_ENV`                  | Ambiente                                                                                                                      | `development`                 |
| `DATABASE_URL`              | Connection string PostgreSQL                                                                                                  | ver `.env.example`            |
| `INGEST_API_KEY`            | Chave para endpoints de ingestão                                                                                              | —                             |
| `OPENSEARCH_ENABLED`        | Habilita OpenSearch (busca `q` com ranking e indexação). Se `false`, busca `q` usa fallback PostgreSQL (`ILIKE`, sem ranking) | `true`                        |
| `OPENSEARCH_NODE`           | URL do OpenSearch                                                                                                             | `http://localhost:9200`       |
| `SEARCH_REINDEX_ON_STARTUP` | Reindexar artigos publicados na subida da API                                                                                 | `true` (dev); `false` em prod |
| `CACHE_ARTICLES_MAX_AGE`    | TTL do `Cache-Control` em listagem/detalhe de artigos (segundos)                                                              | `60`                          |
| `CACHE_SEARCH_MAX_AGE`      | TTL do `Cache-Control` em buscas com `?q=` (segundos)                                                                         | `30`                          |
| `CACHE_CATALOG_MAX_AGE`     | TTL do `Cache-Control` em `/categories` e `/tags` (segundos)                                                                  | `300`                         |
| `FRONTEND_REVALIDATE_URL`   | URL do webhook ISR do frontend (ex.: `https://seu-app.onrender.com/api/revalidate`)                                           | — (opcional)                  |
| `REVALIDATE_SECRET`         | Segredo compartilhado com o frontend para invalidação on-demand                                                               | — (opcional)                  |
| `INDEXING_MODE`             | `sync` (dev) ou `async` — enfileira em `index_jobs` sem indexar na hora                                                       | `sync`                        |
| `INDEX_WORKER_AUTOSTART`    | Sobe o worker embutido junto com a API quando `INDEXING_MODE=async`                                                           | `true`                        |
| `INDEX_WORKER_STALE_MS`     | Jobs `PROCESSING` órfãos voltam para `PENDING` após esse tempo (ms)                                                           | `60000`                       |
| `INDEX_WORKER_POLL_MS`      | Intervalo de poll do worker (ms)                                                                                              | `2000`                        |
| `INDEX_WORKER_BATCH_SIZE`   | Jobs por lote no worker                                                                                                       | `5`                           |
| `INDEX_WORKER_MAX_ATTEMPTS` | Tentativas antes de marcar job como `FAILED`                                                                                  | `5`                           |
| `AWS_ENDPOINT_URL`          | Endpoint LocalStack (simulação SQS em dev)                                                                                    | `http://localhost:4566`       |
| `AWS_REGION`                | Região AWS local                                                                                                              | `us-east-1`                   |
| `SQS_INDEX_QUEUE_URL`       | Fila SQS no LocalStack (simulação; sem driver em prod)                                                                        | ver `.env.example`            |

> `SEARCH_REINDEX_ON_STARTUP=true` reindexa todos os artigos publicados a cada subida (útil em dev). Em produção, use `false` e execute reindexação via job dedicado.

### Cache e invalidação (Render, sem Redis)

- **API:** respostas `GET` públicas recebem `Cache-Control` com TTL configurável (`CACHE_*_MAX_AGE`).
- **Frontend:** ISR via Next.js (`revalidate` + `tags` no repo frontend).
- **Invalidação (sync):** após `POST/PUT`, a API chama `FRONTEND_REVALIDATE_URL` (fire-and-forget).
- **Invalidação (async):** o worker embutido (`INDEX_WORKER_AUTOSTART=true`) chama o webhook após indexação bem-sucedida. Configure `FRONTEND_REVALIDATE_URL` e `REVALIDATE_SECRET` na API.

Deploy completo: [docs/deploy-render.md](docs/deploy-render.md).

---

## Estrutura do projeto

**Estado atual:**

```
portal-noticias-backend/
├── docker/localstack/init/   # bootstrap da fila SQS
├── src/
│   ├── main.ts
│   ├── worker.ts             # entrypoint do Background Worker
│   ├── worker.module.ts
│   ├── app.module.ts
│   ├── app.controller.ts     # GET /health
│   ├── app.service.ts
│   ├── shared/
│   │   ├── config/cache.config.ts
│   │   ├── infrastructure/cache/frontend-cache-invalidation.service.ts
│   │   └── presentation/
│   │       ├── decorators/http-cache.decorator.ts
│   │       └── interceptors/http-cache.interceptor.ts
│   ├── modules/articles/     # bounded context articles (+ index_jobs outbox)
│   └── prisma/               # PrismaModule (global)
├── src/                      # código da aplicação
├── test/                     # testes unitários (*.spec.ts)
├── prisma/
│   ├── schema.prisma         # models + comentários ///
│   ├── migrations/           # uma migration por entidade (authors → article_tags)
├── docs/
│   ├── prisma-schema/        # referência HTML (gerada por yarn prisma:generate)
│   └── diagramas/
│       └── diagrama-eer.png  # diagrama EER do banco relacional
├── .husky/                   # git hooks (pre-commit → lint, format, test:cov)
├── docker-compose.yml
└── .env.example
```

**Estrutura alvo** (módulo `articles` com DDD): ver [docs/arquitetura.md](docs/arquitetura.md#3-estrutura-de-pastas).

---

## Commits

Este projeto segue **[Conventional Commits](https://www.conventionalcommits.org/)** (padrão usado pelo [Commitizen](https://github.com/commitizen/cz-cli)):

```
<type>(<scope>): <descrição curta>

[corpo opcional]
```

| Tipo       | Uso                                      |
| ---------- | ---------------------------------------- |
| `feat`     | Nova funcionalidade                      |
| `fix`      | Correção de bug                          |
| `docs`     | Documentação                             |
| `test`     | Testes                                   |
| `chore`    | Manutenção (deps, configs, tooling)      |
| `refactor` | Refatoração sem mudança de comportamento |

Exemplos do histórico: `feat(articles): add prisma repositories`, `fix(build): prevent empty dist output`.

---

## Licença

Projeto privado — uso exclusivo para avaliação técnica.
