# Deploy no Render — API + Index Worker + Frontend

Guia para publicar o portal com **ingestão assíncrona** (Outbox PostgreSQL + Background Worker), sem SQS em produção.

## Visão geral

| Serviço Render | Tipo | Start command | Repositório |
|----------------|------|---------------|-------------|
| `portal-noticias-api` | Web Service | `yarn start:prod` | `portal-noticias-backend` |
| `portal-noticias-indexer` | **Background Worker** | `yarn start:worker` | `portal-noticias-backend` (mesmo repo) |
| `portal-noticias-frontend` | Web Service | `yarn start` | `portal-noticias-frontend` |

Fluxo de ingestão:

```
POST/PUT → API salva no PG + insere index_jobs → 202 Accepted
Worker → poll index_jobs → index/remove OpenSearch → revalidate frontend
```

## Pré-requisitos

- Conta no [Render](https://render.com)
- PostgreSQL gerenciado (Render Postgres ou externo)
- OpenSearch externo (Bonsai, AWS OpenSearch) **ou** `OPENSEARCH_ENABLED=false` (busca `q` via PostgreSQL)
- Frontend já deployado com `/api/revalidate` configurado

## 1. PostgreSQL

Crie um banco PostgreSQL no Render e copie a `DATABASE_URL`.

Após o primeiro deploy da API, as migrations rodam no build (`prisma migrate deploy` se configurado) ou execute manualmente:

```bash
DATABASE_URL="<url>" yarn prisma migrate deploy
```

## 2. API (Web Service)

| Campo | Valor |
|-------|-------|
| Build Command | `yarn install && yarn build && yarn prisma migrate deploy` |
| Start Command | `yarn start:prod` |

**Variáveis de ambiente (API):**

| Variável | Valor sugerido |
|----------|----------------|
| `DATABASE_URL` | Connection string do Postgres |
| `INDEXING_MODE` | `async` |
| `INGEST_API_KEY` | Segredo forte |
| `OPENSEARCH_ENABLED` | `true` ou `false` |
| `OPENSEARCH_NODE` | URL do cluster externo |
| `SEARCH_REINDEX_ON_STARTUP` | `false` |
| `FRONTEND_REVALIDATE_URL` | `https://seu-frontend.onrender.com/api/revalidate` |
| `REVALIDATE_SECRET` | Mesmo valor do frontend |
| `CACHE_ARTICLES_MAX_AGE` | `60` |
| `CACHE_SEARCH_MAX_AGE` | `30` |
| `CACHE_CATALOG_MAX_AGE` | `300` |

Com `INDEXING_MODE=async`, `POST`/`PUT` retornam **202 Accepted** e `indexingStatus: "pending"`. A API **não** indexa no OpenSearch nem chama o webhook de revalidação — isso fica com o worker.

## 3. Index Worker (Background Worker)

Crie um **Background Worker** apontando para o **mesmo repositório** do backend.

| Campo | Valor |
|-------|-------|
| Build Command | `yarn install && yarn build` |
| Start Command | `yarn start:worker` |

**Variáveis de ambiente (Worker):**

| Variável | Obrigatória | Notas |
|----------|-------------|-------|
| `DATABASE_URL` | Sim | Mesma da API |
| `OPENSEARCH_ENABLED` | Sim | Igual à API |
| `OPENSEARCH_NODE` | Se OS habilitado | Igual à API |
| `FRONTEND_REVALIDATE_URL` | Recomendado | Webhook após indexação |
| `REVALIDATE_SECRET` | Recomendado | Igual ao frontend |
| `INDEX_WORKER_POLL_MS` | Não | Default `2000` |
| `INDEX_WORKER_BATCH_SIZE` | Não | Default `5` |
| `INDEX_WORKER_MAX_ATTEMPTS` | Não | Default `5` |

**Não** configure `INDEXING_MODE` no worker — ele sempre consome a tabela `index_jobs`.

O worker não expõe HTTP; é um processo long-running ideal para [Render Background Workers](https://render.com/docs/background-workers).

## 4. Frontend (Web Service)

Sem mudanças específicas para ingestão assíncrona. Configure:

- `API_BASE_URL` apontando para a API Render
- `REVALIDATE_SECRET` igual ao backend/worker

## 5. Verificação

```bash
# Ingestão (deve retornar 202)
curl -X POST https://sua-api.onrender.com/api/v1/articles \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $INGEST_API_KEY" \
  -d '{"title":"Teste async","summary":"Resumo","content":"Corpo","author":"Autor","category":"Tech","tags":["news"],"publishedAt":"2026-01-15T10:00:00Z"}'

# Após alguns segundos, busca textual
curl "https://sua-api.onrender.com/api/v1/articles?q=teste+async"
```

## LocalStack vs Outbox

| Ambiente | Fila de indexação |
|----------|-------------------|
| Dev (`docker compose`) | LocalStack SQS provisionado (simulação AWS, RNF06) — **sem driver no código** |
| Render (prod) | Tabela `index_jobs` no PostgreSQL (Outbox) + Background Worker |

## Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| `202` mas artigo não aparece na busca | Worker parado ou `OPENSEARCH_*` incorreto no worker |
| Jobs `FAILED` em `index_jobs` | OpenSearch inacessível; ver `last_error` na tabela |
| Frontend desatualizado após ingestão | `FRONTEND_REVALIDATE_URL`/`REVALIDATE_SECRET` ausentes no **worker** (modo async) |
| API lenta na ingestão | `INDEXING_MODE=sync` por engano — usar `async` na API |
