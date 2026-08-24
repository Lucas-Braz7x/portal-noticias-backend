# Deploy no Render — API + Frontend

Guia para publicar o portal com **ingestão assíncrona** (Outbox PostgreSQL + worker embutido na API), sem SQS em produção.

| Projeto | Repositório | Produção |
|---------|-------------|----------|
| Backend (API) | [github.com/Lucas-Braz7x/portal-noticias-backend](https://github.com/Lucas-Braz7x/portal-noticias-backend) | [portal-noticias-backend.onrender.com](https://portal-noticias-backend.onrender.com/) |
| Frontend | [github.com/Lucas-Braz7x/portal-noticias-frontend](https://github.com/Lucas-Braz7x/portal-noticias-frontend) | [portal-noticias-frontend.onrender.com](https://portal-noticias-frontend.onrender.com) |

## Visão geral

| Serviço Render | Tipo | Start command | Repositório GitHub |
|----------------|------|---------------|-------------------|
| `portal-noticias-api` | Web Service | `yarn start:prod` | [portal-noticias-backend](https://github.com/Lucas-Braz7x/portal-noticias-backend) |
| `portal-noticias-frontend` | Web Service | `yarn start` | [portal-noticias-frontend](https://github.com/Lucas-Braz7x/portal-noticias-frontend) |

Com `INDEXING_MODE=async` e `INDEX_WORKER_AUTOSTART=true` (default), o **worker de indexação roda embutido no mesmo processo da API** — não é necessário um Background Worker separado no Render.

Fluxo de ingestão:

```
POST/PUT → API salva no PG + insere index_jobs → 202 Accepted
Worker embutido → poll index_jobs → index/remove OpenSearch → revalidate frontend
```

## Pré-requisitos

- Conta no [Render](https://render.com)
- PostgreSQL gerenciado (Render Postgres ou externo)
- OpenSearch externo (Bonsai, AWS OpenSearch) **ou** `OPENSEARCH_ENABLED=false` (busca `q` via PostgreSQL)
- Frontend já deployado com `/api/revalidate` configurado
- Repositórios conectados ao GitHub

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
| `INDEX_WORKER_AUTOSTART` | `true` (worker embutido na API) |
| `INGEST_API_KEY` | Segredo forte |
| `OPENSEARCH_ENABLED` | `true` ou `false` |
| `OPENSEARCH_NODE` | URL do cluster externo |
| `SEARCH_REINDEX_ON_STARTUP` | `false` |
| `FRONTEND_REVALIDATE_URL` | `https://portal-noticias-frontend.onrender.com/api/revalidate` |
| `REVALIDATE_SECRET` | Mesmo valor do frontend |
| `CACHE_ARTICLES_MAX_AGE` | `60` |
| `CACHE_SEARCH_MAX_AGE` | `30` |
| `CACHE_CATALOG_MAX_AGE` | `300` |

Com `INDEXING_MODE=async`, `POST`/`PUT` retornam **202 Accepted** e `indexingStatus: "pending"`. A API enfileira em `index_jobs`; o worker embutido indexa no OpenSearch e chama o webhook de revalidação.

## 3. Frontend (Web Service)

| Campo | Valor |
|-------|-------|
| Build Command | `yarn install && yarn build` |
| Start Command | `yarn start` |

Configure:

- `API_URL` apontando para a API Render (ex.: `https://portal-noticias-backend.onrender.com/api/v1`)
- `NEXT_PUBLIC_SITE_URL` com a URL pública do frontend (ex.: `https://portal-noticias-frontend.onrender.com`)
- `REVALIDATE_SECRET` igual ao backend

## 4. CI/CD (GitHub Actions + Render)

### Fluxo

| Evento | GitHub Actions | Render |
|--------|----------------|--------|
| Pull request | CI (`quality`, `unit`, `build`, integração no backend) | PR Preview automático (dashboard) |
| Push em `main` com CI verde | Job `deploy` dispara deploy hook | Build e deploy de produção |

O deploy de **produção** só ocorre após todos os jobs de CI passarem. PR previews são criados pelo Render (não via deploy hook).

### Dashboard Render (configuração manual)

Para cada serviço web (API e frontend):

1. **Settings → Build & Deploy → Auto-Deploy**: **No** — evita deploy paralelo ao CI; produção só via hook após CI verde.
2. **Settings → Deploy Hook**: copiar a URL do hook para o secret do GitHub (ver abaixo).
3. **Previews → Pull Request Previews**: **Automatic** (opcional: Auto-delete ao fechar/mergear PR).

### Secrets no GitHub

Em cada repositório: **Settings → Secrets and variables → Actions**:

| Repositório | Secret | Valor |
|-------------|--------|-------|
| [portal-noticias-backend](https://github.com/Lucas-Braz7x/portal-noticias-backend) | `RENDER_DEPLOY_HOOK_URL` | Deploy hook da API |
| [portal-noticias-frontend](https://github.com/Lucas-Braz7x/portal-noticias-frontend) | `RENDER_DEPLOY_HOOK_URL` | Deploy hook do frontend |

Nunca commitar URLs de deploy hook no repositório. Se uma hook foi exposta, use **Regenerate Hook** no Render ([documentação](https://render.com/docs/deploy-hooks)).

### Preview do frontend (limitação cross-repo)

Frontend e backend são repos separados; números de PR não coincidem. Para previews do frontend, defina `API_URL` nas **Preview Environment Variables** apontando à API de produção ou staging fixa.

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

Checklist após configurar CI/CD:

1. PR aberto → CI roda; Render cria preview (URL no PR do GitHub).
2. Push em `main` com CI verde → job `deploy` dispara; Render inicia build.
3. Push em `main` com CI falhando → job `deploy` não roda.
4. Auto-deploy desligado no Render (produção só via hook).

## Background Worker separado (alternativa opcional)

Se preferir isolar o worker em outro processo (ex.: escalar ingestão separada da API), crie um **Background Worker** no mesmo repo:

| Campo | Valor |
|-------|-------|
| Build Command | `yarn install && yarn build` |
| Start Command | `yarn start:worker` |

Nesse caso, defina `INDEX_WORKER_AUTOSTART=false` na API e configure `FRONTEND_REVALIDATE_URL`/`REVALIDATE_SECRET` também no worker. O padrão recomendado é worker embutido (um único Web Service).

## LocalStack vs Outbox

| Ambiente | Fila de indexação |
|----------|-------------------|
| Dev (`docker compose`) | LocalStack SQS provisionado (simulação AWS, RNF06) — **sem driver no código** |
| Render (prod) | Tabela `index_jobs` no PostgreSQL (Outbox) + worker embutido na API |

## Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| `202` mas artigo não aparece na busca | `INDEX_WORKER_AUTOSTART=false` ou `OPENSEARCH_*` incorreto |
| Jobs `FAILED` em `index_jobs` | OpenSearch inacessível; ver `last_error` na tabela |
| Frontend desatualizado após ingestão | `FRONTEND_REVALIDATE_URL`/`REVALIDATE_SECRET` ausentes na API |
| API lenta na ingestão | `INDEXING_MODE=sync` por engano — usar `async` |
| Deploy em produção sem CI verde | Auto-deploy ainda ativo no Render — desligar e usar hook |
