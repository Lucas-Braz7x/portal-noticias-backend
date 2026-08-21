# Portal de Notícias — Backend

API REST para o portal de notícias/artigos, desenvolvida como parte do desafio técnico da **Gazeta do Povo**.

Construída com **NestJS + Fastify**, **Prisma + PostgreSQL** e **OpenSearch**, seguindo **DDD pragmático**, **Clean Code**, **TDD**, **Repository / Services** e **CQRS leve** (PG para listagem, OpenSearch para busca textual).

---

## Stack

| Camada    | Tecnologia          |
| --------- | ------------------- |
| Runtime   | Node.js 20+         |
| Framework | NestJS 11 + Fastify |
| ORM       | Prisma              |
| Banco     | PostgreSQL 16       |
| Busca     | OpenSearch 2.x      |
| AWS local | LocalStack (SQS)    |
| Linguagem | TypeScript          |

---

## Pré-requisitos

- Node.js 20+
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

| Serviço    | URL                     | Uso                                 |
| ---------- | ----------------------- | ----------------------------------- |
| PostgreSQL | `localhost:5432`        | Persistência                        |
| OpenSearch | `http://localhost:9200` | Busca textual                       |
| LocalStack | `http://localhost:4566` | SQS (indexação assíncrona simulada) |

Verificar OpenSearch:

```bash
curl http://localhost:9200/_cluster/health
```

### 4. Executar migrations

```bash
yarn prisma:migrate
```

### 5. (Opcional) Popular o banco com artigos de exemplo

> **Em breve** — o script `prisma/seed.ts` ainda será adicionado (RF10).

```bash
# yarn prisma db seed   # disponível após implementação do seed
```

### 6. Iniciar a API

```bash
# desenvolvimento
yarn start:dev

# produção
yarn build
yarn start:prod
```

A API estará disponível em `http://localhost:3000/api/v1`.

### Health check

```bash
curl http://localhost:3000/api/v1/health
```

---

## Scripts disponíveis

| Script                 | Descrição                                |
| ---------------------- | ---------------------------------------- |
| `yarn start:dev`       | Inicia em modo watch                     |
| `yarn build`           | Compila para `dist/`                     |
| `yarn start:prod`      | Executa build de produção                |
| `yarn lint`            | ESLint (flat config)                     |
| `yarn lint:fix`        | ESLint com correção automática           |
| `yarn format`          | Formata código com Prettier              |
| `yarn format:check`    | Verifica formatação sem alterar arquivos |
| `yarn test`            | Executa testes unitários                 |
| `yarn test:cov`        | Testes unitários com cobertura (mínimo global 75%) |
| `yarn test:watch`      | Testes unitários em modo watch           |
| `yarn test:integration`| Repositórios Prisma com PostgreSQL real |
| `yarn test:all`        | Unitários + integração                   |
| `yarn prisma:migrate`  | Cria/aplica migrations                   |
| `yarn prisma:studio`   | Abre Prisma Studio                       |
| `yarn prisma:generate` | Gera Prisma Client e docs HTML do schema |
| `yarn prisma:docs`     | Serve a referência HTML em `localhost:5858` |

---

## Endpoints

| Método | Rota                     | Status          | Descrição                               |
| ------ | ------------------------ | --------------- | --------------------------------------- |
| `GET`  | `/api/v1/health`         | ✅ Implementado | Status da API e conexão com banco       |
| `GET`  | `/api/v1/articles`       | 🔜 Planejado    | Listagem com paginação, busca e filtros |
| `GET`  | `/api/v1/articles/:slug` | 🔜 Planejado    | Detalhe de um artigo                    |
| `POST` | `/api/v1/articles`       | 🔜 Planejado    | Criar artigo (requer `X-API-Key`)       |
| `PUT`  | `/api/v1/articles/:id`   | 🔜 Planejado    | Atualizar artigo (requer `X-API-Key`)   |

Contratos completos na [especificação SDD](docs/SDD.md#4-contratos-da-api).

---

## Arquitetura

O projeto segue **DDD pragmático** com camadas bem definidas:

```
Presentation → Application → Domain ← Infrastructure
```

- **Controllers** — entrada HTTP, DTOs, validação _(módulo `articles` pendente)_
- **ArticlesService** — orquestração direta (persistência + indexação) _(pendente)_
- **Domain** — entidades, value objects, interfaces de repositório _(pendente)_
- **Infrastructure** — Prisma ✅, OpenSearch 🔜, mappers 🔜

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
| [docs/uso-de-ia.md](docs/uso-de-ia.md)                                                       | Uso de IA no desenvolvimento (RNF16)                                 |

### Schema Prisma e diagrama EER

O modelo relacional está documentado em três formatos complementares:

| Recurso | Descrição |
| ------- | --------- |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Fonte da verdade — models, relações e comentários `///` |
| [`docs/prisma-schema/index.html`](docs/prisma-schema/index.html) | Referência HTML interativa (models, campos, operações do client) |
| [`docs/diagramas/diagrama-eer.png`](docs/diagramas/diagrama-eer.png) | Diagrama EER visual do banco relacional |

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

| Suite | Comando | Escopo |
|-------|---------|--------|
| Unitário | `yarn test` / `yarn test:cov` | Domínio, mappers, ArticlesService (mocks), health |
| Integração | `yarn test:integration` | Repositórios Prisma com PostgreSQL real (schema isolado) |

```bash
yarn test              # unitários (pre-commit)
yarn test:cov          # unitários + cobertura (mínimo global 75%)
yarn test:watch        # unitários em modo interativo
yarn test:integration  # repositórios — requer docker compose up -d
```

Estratégia completa (mock vs banco, o que testar em cada camada): [docs/arquitetura.md §5](docs/arquitetura.md#5-tdd--estratégia-de-testes).

O **[Husky](https://typicode.github.io/husky/)** executa `yarn test:cov` no **pre-commit** — apenas unitários.

Arquivos excluídos da cobertura unitária: bootstrap (`main.ts`, módulos Nest), interfaces de repositório no domínio e **implementações Prisma em `infrastructure/repositories/`** (cobertas por `yarn test:integration`).

---

## Variáveis de ambiente

| Variável              | Descrição                        | Default                 |
| --------------------- | -------------------------------- | ----------------------- |
| `PORT`                | Porta da API                     | `3000`                  |
| `NODE_ENV`            | Ambiente                         | `development`           |
| `DATABASE_URL`        | Connection string PostgreSQL     | ver `.env.example`      |
| `INGEST_API_KEY`      | Chave para endpoints de ingestão | —                       |
| `OPENSEARCH_NODE`     | URL do OpenSearch                | `http://localhost:9200` |
| `AWS_ENDPOINT_URL`    | Endpoint LocalStack              | `http://localhost:4566` |
| `AWS_REGION`          | Região AWS local                 | `us-east-1`             |
| `SQS_INDEX_QUEUE_URL` | Fila SQS para indexação          | ver `.env.example`      |

> `OPENSEARCH_NODE` já está no `.env.example`, mas o cliente OpenSearch na API será implementado no módulo `articles`.

---

## Estrutura do projeto

**Estado atual:**

```
portal-noticias-backend/
├── docker/localstack/init/   # bootstrap da fila SQS
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts     # GET /health
│   ├── app.service.ts
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
├── .husky/                   # git hooks (pre-commit → yarn test:cov)
├── docker-compose.yml
└── .env.example
```

**Estrutura alvo** (módulo `articles` com DDD): ver [docs/arquitetura.md](docs/arquitetura.md#3-estrutura-de-pastas).

---

## Licença

Projeto privado — uso exclusivo para avaliação técnica.
