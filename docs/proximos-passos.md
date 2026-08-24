# Próximos Passos

> Roadmap de melhorias priorizadas para o Portal de Notícias — do Render para produção AWS, e além.
>
> Contexto: [arquitetura de produção](./arquitetura-producao.md) · [SDD](./SDD.md) · [ADRs](./adr/)

---

## Prioridade Alta

### 1. Redis (ElastiCache) para cache compartilhado

**Motivação:** o cache atual (`Cache-Control` HTTP na API + ISR no Next.js) funciona para um único processo. Com múltiplas réplicas da API no ECS, cada task tem seu próprio estado de cache HTTP — sem compartilhamento. Redis resolve isso.

**O que muda:**

| Camada | Hoje | Com Redis |
|--------|------|-----------|
| Cache de listagem | `Cache-Control` (cliente/CDN) | Redis in-process + `Cache-Control` para CDN |
| Invalidação | Webhook S2S para ISR | Redis `DEL` + pub/sub para invalidação cross-replica |
| TTL | `CACHE_ARTICLES_MAX_AGE=60s` | Configurável por rota no Redis |
| Frontend ISR | `revalidateTag` | Mantido — complementar |

**Implementação:**
1. Adicionar `@nestjs/cache-manager` + driver `cache-manager-ioredis`
2. Envolver respostas de `GET /articles` e `GET /articles/:slug` com `CacheInterceptor`
3. `FrontendCacheInvalidationService` também invalida chaves Redis após ingestão
4. `REDIS_URL` como variável de ambiente; sem Redis → fallback para `Cache-Control` puro

**Infra AWS:** `ElastiCache for Redis` (t4g.micro para baixo tráfego; cluster mode para HA).

---

### 2. SQS real para ingestão assíncrona

**Motivação:** o Outbox PG (`index_jobs`) funciona e é correto para o Render. Em produção AWS, SQS + Lambda é mais adequado: escala zero, sem polling ativo, dead-letter queue nativa, visibilidade de mensagens configurável.

**O que muda:**

| | Hoje (Outbox PG) | Com SQS + Lambda |
|-|------------------|-----------------|
| Fila | Tabela `index_jobs` no PG | SQS Standard Queue |
| Worker | Background Worker Render (`yarn start:worker`) | Lambda acionada por evento SQS |
| Retry | `attempts` + `MAX_ATTEMPTS` manual | DLQ automático após N falhas |
| Visibilidade | `FOR UPDATE SKIP LOCKED` | Visibility timeout SQS |
| Custo | Incluído no Render | Pay-per-invocation Lambda |
| Monitoramento | Query `index_jobs` | CloudWatch metrics SQS + Lambda |

**Implementação:**
1. Adicionar driver `IIndexJobQueue` (port) com implementações `OutboxQueue` (atual) e `SqsQueue`
2. `SqsQueue.enqueue()` publica no SQS via `@aws-sdk/client-sqs`
3. `LambdaIndexerHandler` consome eventos SQS, reutiliza `IndexWorkerService.processJob()`
4. Variável `QUEUE_DRIVER=outbox|sqs` seleciona implementação
5. LocalStack SQS já provisionado no Docker Compose — testes de integração prontos

---

### 3. Observabilidade (correlation ID + logs estruturados)

**Motivação:** logs atuais são texto plano do NestJS. Em produção multi-serviço, rastrear uma requisição end-to-end (API → Worker → Lambda) exige correlationId e logs JSON.

**O que implementar:**
1. **Correlation ID:** middleware que lê `X-Correlation-ID` do header de entrada ou gera UUID; propaga via `AsyncLocalStorage` para todos os logs da requisição.
2. **Logger JSON:** substituir `Logger` padrão NestJS por `pino` (alta performance) ou `winston` com formato JSON; campos: `timestamp`, `level`, `correlationId`, `service`, `traceId`, `message`, `meta`.
3. **AWS X-Ray SDK:** instrumentação automática de HTTP calls, PG e chamadas SQS.
4. **CloudWatch:** streams por serviço (`portal-api`, `portal-worker`, `portal-indexer`); alarmes SNS para taxa de erro > 1% e latência P95 > 1s.

---

## Prioridade Média

### 4. Job de reindexação dedicado

**Motivação:** `SEARCH_REINDEX_ON_STARTUP=true` (dev) reindexará todos os artigos a cada restart da API — inadequado em produção com volume alto.

**O que implementar:**
1. Script `yarn reindex` que lê todos os artigos publicados do PG em batches e faz bulk index no OpenSearch.
2. Alias de índice OpenSearch (`articles_v2`) + troca atômica do alias — zero downtime.
3. Agendamento via EventBridge (semanal ou sob demanda) acionando Lambda.
4. `SEARCH_REINDEX_ON_STARTUP=false` em produção.

---

### 5. Idempotência na ingestão

**Motivação:** atualmente, `POST /articles` cria um novo artigo sempre que chamado — sem chave natural de idempotência. Em integrações automatizadas (pipelines de CMS), reenvios podem duplicar artigos.

**O que implementar:**
1. Campo `externalId` opcional no DTO (string livre — identificador do sistema de origem).
2. `findOrCreate` por `externalId` no `ArticlesService`: se já existe, faz `update`; senão, `create`.
3. Migration adicionando `external_id` com unique index em `articles`.
4. Resposta com `201` (criado) ou `200` (atualizado) — sem 409.

---

### 6. Autenticação completa

**Motivação:** a autenticação atual (API Key simples) é adequada para ingestão interna. Para um painel editorial com usuários, fluxo de login, roles e revogação, é necessário um sistema de identidade.

**Opções:**

| Opção | Prós | Contras |
|-------|------|---------|
| **AWS Cognito** | Gerenciado, integrado com ALB/CloudFront, MFA nativo | Curva de aprendizado, UI customização limitada |
| **Auth0** | Developer-friendly, SDKs ricos, regras/hooks | Custo cresce com usuários |
| **NestJS + Passport + JWT** | Controle total, sem vendor lock-in | Operação e segurança por conta própria |

**Implementação sugerida (NestJS + JWT):**
1. Módulo `AuthModule` com `POST /auth/login` → JWT access token + refresh token
2. `JwtAuthGuard` substituindo/complementando `ApiKeyGuard` nas rotas de ingestão
3. Roles (`ADMIN`, `EDITOR`) com `RolesGuard`

---

## Prioridade Baixa / Diferenciais

### 7. E2E no CI

**Motivação:** os testes Playwright existem mas não rodam no CI (necessitam backend real + seed).

**O que implementar:**
1. Job `e2e` no GitHub Actions com `docker compose up -d` (PG + OpenSearch + API + seed)
2. Playwright no [frontend](https://github.com/Lucas-Braz7x/portal-noticias-frontend) rodando contra `http://localhost:3001` + API em `http://localhost:3000`
3. Cache do Docker Compose para acelerar CI

---

### 8. OpenAPI / Swagger aprimorado

**Status atual:** Swagger já está implementado e acessível em `GET /docs`.

**Melhorias:**
- `@ApiProperty()` com exemplos em todos os DTOs de ingestão
- Schema de resposta `ArticleIngestResponseDto` completo (incluindo `indexingStatus`)
- Documentar header `X-API-Key` nos exemplos do Swagger UI
- Exportar `openapi.json` como artefato no CI para contratos de integração

---

### 9. Painel de monitoramento de jobs

**Motivação:** atualmente, o status dos `index_jobs` só é visível via query SQL. Um dashboard simples (ou endpoint admin) permitiria visibilidade operacional.

**O que implementar:**
1. `GET /admin/index-jobs` com filtro por `status` (PENDING/PROCESSING/COMPLETED/FAILED)
2. Protegido por `ApiKeyGuard` (ou futura autenticação admin)
3. Reprocessar jobs `FAILED` via `POST /admin/index-jobs/:id/retry`

---

### 10. Driver SQS real em desenvolvimento

**Status atual:** LocalStack SQS está provisionado no Docker Compose mas sem driver no código.

**O que implementar:**
1. Ativar `SqsQueue` (ver item 2) quando `QUEUE_DRIVER=sqs`
2. No Docker Compose (`QUEUE_DRIVER=sqs`, `AWS_ENDPOINT_URL=http://localhost:4566`), a API publica no LocalStack SQS
3. Worker Lambda rodando localmente via `aws-lambda-local` ou SAM CLI consumindo o LocalStack

---

## Sumário de prioridades

| # | Item | Impacto | Esforço | Quando |
|---|------|---------|---------|--------|
| 1 | Redis (cache compartilhado) | Alto | Médio | Antes de múltiplas réplicas API |
| 2 | SQS + Lambda | Alto | Alto | Migração para AWS |
| 3 | Observabilidade (logs + X-Ray) | Alto | Médio | Antes de ir a produção real |
| 4 | Job de reindexação | Médio | Baixo | Deploy AWS |
| 5 | Idempotência na ingestão | Médio | Baixo | Integração com CMS externo |
| 6 | Autenticação completa | Alto | Alto | Painel editorial multi-usuário |
| 7 | E2E no CI | Médio | Médio | Antes de times maiores |
| 8 | Swagger aprimorado | Baixo | Baixo | Qualquer momento |
| 9 | Painel de jobs | Baixo | Baixo | Operação em escala |
| 10 | Driver SQS local | Baixo | Baixo | Teste local de Lambda |

---

*Versão: 1.0 — Agosto/2026*
