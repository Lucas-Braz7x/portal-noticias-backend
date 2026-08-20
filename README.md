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
| `yarn prisma:migrate`  | Cria/aplica migrations                   |
| `yarn prisma:studio`   | Abre Prisma Studio                       |
| `yarn prisma:generate` | Gera Prisma Client                       |

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
| [docs/adr/](docs/adr/)                                                                       | Architecture Decision Records (ADRs)                               |

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
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
├── docker-compose.yml
└── .env.example
```

**Estrutura alvo** (módulo `articles` com DDD): ver [docs/arquitetura.md](docs/arquitetura.md#3-estrutura-de-pastas).

---

## Licença

Projeto privado — uso exclusivo para avaliação técnica.
