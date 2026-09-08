# Plano de Execução — Refund API (16 Issues)

> Gerado em 2026-09-08. Fonte: `gh issue list --repo IamThiago-IT/refund-api --state all` (16 OPEN). Upstream `rocketseat-education/refund-api` 0 issues.

## Resumo Executivo

| Grau           | Qnt | Perfil                                                             | Ação                            |
| -------------- | --- | ------------------------------------------------------------------ | ------------------------------- |
| **P0 Crítico** | 6   | Vazamento credencial, corrupção financeira, race, bypass validação | Fazer agora — bloqueia produção |
| **P1 Alto**    | 6   | 422/500 em fluxo normal, perda filename, lixo disco, sem auth      | Próxima sprint                  |
| **P2 Médio**   | 4   | Dívida técnica/docs                                                | Backlog pós-estabilização       |

**Ordem recomendada:** Lote 1 (P0 #3,#4,#1,#6) → Lote 2 (#5,#2,#10,#7) → Lote 3 (#9,#8 + P2s). #11 (auth) promover a P0 se deploy público.

## Priorização Detalhada

### Fase 1 — P0 | Bloqueia Produção (estimativa 4-5h)

| #                                                      | Título                                                                                                                                                                                 | Locais                                                                                   | Impacto           | Esforço                                                         | Por que primeiro |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------- | ---------------- |
| **#3** `security: .env commitado com APP_KEY`          | `.env:5`, `.gitignore:8`, `start/env.ts:8`, `config/app.ts:8`                                                                                                                          | **10/10** — signed URLs (`app/controllers/receipt_downloads_controller.ts:16`) forjáveis | 1h                | Credencial em histórico git, qualquer clone compromete `appKey` |
| **#4** `security: CORS origin:true + credentials:true` | `config/cors.ts:11`                                                                                                                                                                    | **10/10** — browsers rejeitam `*` com credenciais, preflight falha                       | 15min             | Bloqueia consumo front, viola spec                              |
| **#1** `bug: value sem prepare`                        | `app/models/refund.ts:20`                                                                                                                                                              | **10/10** — `150.50` salvo `150.5` → lido `1.505`                                        | 30min + migration | Corrupção financeira silenciosa                                 |
| **#6** `bug: validação params.id sem request.params()` | `app/controllers/refunds_controller.ts:37`, `app/controllers/receipts_controller.ts:25`, `app/controllers/receipt_downloads_controller.ts:11`, `app/validators/refund_validator.ts:20` | **9/10** — bypass 422, `payload.params.id` undefined                                     | 30min             | Base para todos `show/destroy`, `good first issue`              |
| **#5** `bug: RefundService.create sem transação`       | `app/services/refunds_service.ts:27`, `app/services/receipts_service.ts:10`                                                                                                            | **9/10** — race duplica `receipt`, orphan file                                           | 2h                | Requer `db.transaction()` + `forUpdate`, depende de #6          |
| **#2** `bug: ?q= where exato`                          | `app/services/refunds_service.ts:20`, `README.md:60`                                                                                                                                   | **8/10** — `q=Elias` não acha `Eliasdadas`                                               | 20min             | Core search quebrado, índice em Fase 3 (#14) complementa        |

**Dependências Fase 1:** #3 independe → #4 → #1 → #6 → #5,#2 podem paralelizar após #6.

**Critérios de aceite Fase 1:**

- [ ] `.env` removido do histórico (`git filter-repo` ou rotação + `.gitignore: .env` + novo `APP_KEY`)
- [ ] `config/cors.ts` usa `env.get('CORS_ORIGIN')` whitelist, sem `origin:true`
- [ ] `app/models/refund.ts` com `prepare: v=>Math.round(v*100)` + migration corretiva + teste `value=0.99,150.50`
- [ ] Todos `validateUsing` com `data:{params:request.params()}` + teste 422 `not-a-uuid`
- [ ] `RefundsService.create` em `db.transaction()` + teste concorrência
- [ ] `whereLike(%term%)` case-insensitive + `trim()` + teste `q=Elias` → `Eliasdadas`

---

### Fase 2 — P1 | Fluxo Normal Quebrado (estimativa 6-8h)

| #                                        | Título                                                                              | Locais                         | Impacto | Esforço                                                                                       | Nota |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------ | ------- | --------------------------------------------------------------------------------------------- | ---- |
| **#10** `soft-delete quebra sem receipt` | `app/models/refund.ts:44`, `app/utils/file.ts:8`                                    | **8/10** 500                   | 45min   | Guard `related('receipt').query().first()` + `catch ENOENT` + log                             |
| **#7** `paginação ?page=1 422`           | `app/validators/refund_validator.ts:32`, `app/controllers/refunds_controller.ts:18` | **8/10** toda listagem quebra  | 20min   | `vine.string().transform(Number)` ou `allowString`, limite 1000                               |
| **#9** `ForceJsonResponse clone`         | `app/middleware/force_json_response_middleware.ts:11`                               | **7/10** retorna HTML          | 15min   | `request.request.headers.accept='application/json'`                                           |
| **#8** `originalFilename truncado`       | `app/services/receipts_service.ts:13`                                               | **6/10** perda `a.b.c.pdf`→`a` | 15min   | `parse(clientName).name`, `good first issue`                                                  |
| **#12** `receipts órfãos`                | `app/services/receipts_service.ts:10`, `config/bodyparser.ts:7`                     | **6/10** disco infinito        | 1h      | `ace receipts:prune --dry-run`, `whereNull refundId + 24h`                                    |
| **#11** `sem autenticação`               | `start/routes.ts:16`, `package.json:54`, `adonisrc.ts:39`                           | **9/10** se público (hoje P1)  | 1-2d    | Guard `accessTokens` + `auth` middleware + `Bouncer`. **Promover a P0 se expor externamente** |

**Ordem Fase 2:** #10,#7,#9 (paralelo junior) → #8 → #12 → #11 (epic separado, depende de #6).

---

### Fase 3 — P2 | Dívida Técnica (estimativa 1.5d)

| #                                     | Título                                                                           | Locais                      | Impacto | Esforço                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| **#13** `tests 0%`                    | `tests/bootstrap.ts:25`, `adonisrc.ts:73`                                        | Base para regressão         | 1d      | Factories `Refund/Receipt`, `refunds.spec.ts`, `receipts.spec.ts`, `runnerHooks migrate/truncate` |
| **#14** `índices ausentes`            | `database/migrations/175935...`, `175942...`                                     | Perf `whereNull deleted_at` | 30min   | `index(['deleted_at','title','refund_id'])` + `explain`                                           |
| **#15** `status codes inconsistentes` | `app/controllers/refunds_controller.ts:22`, `app/services/refunds_service.ts:68` | Contrato                    | 30min   | `201` POST, `204` DELETE, typo `successfully`                                                     |
| **#16** `README value:0 inválido`     | `README.md:69`, `Insomnia.json`, `app/validators/refund_validator.ts:7`          | Onboarding falha            | 20min   | `value:150.50`, `APP_NAME`/`CORS_ORIGIN` em `start/env.ts`                                        |

**Dependências:** #14 após #2; #13 consome todos P0/P1 como casos de teste.

---

## Matriz RICE Simplificada

| Issue           | Reach | Impact | Confidence | Effort | Score | Grau Final |
| --------------- | ----- | ------ | ---------- | ------ | ----- | ---------- |
| #3 .env         | 100%  | 10     | 100%       | 1h     | 1000  | P0 10/10   |
| #4 CORS         | 100%  | 10     | 100%       | 0.25h  | 4000  | P0 10/10   |
| #1 value        | 100%  | 10     | 90%        | 0.5h   | 1800  | P0 10/10   |
| #5 transaction  | 60%   | 9      | 80%        | 2h     | 216   | P0 9/10    |
| #6 params       | 90%   | 9      | 95%        | 0.5h   | 1539  | P0 9/10    |
| #2 search       | 80%   | 8      | 90%        | 0.33h  | 1745  | P0 8/10    |
| #10 soft-delete | 50%   | 8      | 85%        | 0.75h  | 453   | P1 8/10    |
| #7 pagination   | 90%   | 8      | 90%        | 0.33h  | 1963  | P1 8/10    |
| #11 auth        | 100%  | 9      | 70%        | 12h    | 52    | P1→P0\*    |

\*Score alto esforço penaliza, mas risco segurança sobe grau se público.

## Riscos e Mitigações

- **#3 histórico git:** `git filter-repo` reescreve SHA — coordenar force-push, rotacionar `APP_KEY` em todos envs imediatamente.
- **#5 concorrência:** SQLite `better-sqlite3` não tem `forUpdate` verdadeiro — usar `transaction` serializada + validator `unique` + retry.
- **#11 auth:** sem design de ownership, `Bouncer` pode travar Fase 2 — fazer spike 2h antes.

## Próximos Passos Propostos

1. **Lote 1 (0.5 dia):** branch `fix/p0-critical` com #3,#4,#1,#6 → PR + testes manuais + merge.
2. **Lote 2 (1 dia):** `fix/p0-race-search` #5,#2 + `fix/p1-bugs` #10,#7,#9,#8 → PRs paralelos.
3. **Lote 3 (1 dia):** `chore/p2-debt` #12,#14,#15,#16 + `chore/tests` #13 → base para CI.
4. **Epic auth:** `feat/auth` separado, após P0 estável.

## Questões Abertas para Decisão

- [ ] Promover #11 para P0? (depende se API será exposta)
- [ ] `value:0` deve ser válido? (issue #16) → decidir `positive()` vs `min(0)` antes de #1.
- [ ] `CORS_ORIGIN` deve ser lista ou string única? (env)

---

_Detalhes completos de reprodução/critérios em cada issue `gh issue view <n> --repo IamThiago-IT/refund-api`._
