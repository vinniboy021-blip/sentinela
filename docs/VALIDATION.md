# Registro de validação

Registro atualizado em 2026-11-22. Nenhum check é aprovado por pressuposição;
cada item abaixo corresponde a um comando ou fluxo executado nesta sessão ou no CI.

## Checks de backend (Python)

| Check | Estado |
|---|---|
| `ruff check apps/api` | Passou |
| `mypy apps/api/app` | Passou (strict) |
| Compilação Python (`python -c "import app.main"`) | Passou |
| `pytest apps/api/tests -q` (50 testes) | Passou com PostgreSQL/Redis reais |
| `pip-audit --local` | Sem vulnerabilidades conhecidas |
| `bandit -r apps/api/app --severity-level medium` | Sem achados de média ou alta severidade |
| Alembic em PostgreSQL real: upgrade/downgrade/upgrade | Passou; `alembic check` confirmou esquema sincronizado |
| `GET /ready` (PostgreSQL + Redis) | Retornou `ok` para ambas as dependências |
| Coleta pública real: DNS de `example.com` | Persistida como observação com proveniência |
| Monitor Beat/worker sem ação manual | Celery Beat agendou e worker processou com sucesso |

## Checks de migração

| Check | Estado |
|---|---|
| `0001_initial.py` com DDL explícito | Substituído `create_all/drop_all`; tabelas, índices e downgrade verificados |
| `alembic upgrade head` em banco limpo | Passou |
| `alembic downgrade base` | Passou |
| `alembic upgrade head` (segundo round) | Passou |
| `alembic check` | Sem divergência entre modelos e banco |

## Checks de infraestrutura

| Check | Estado |
|---|---|
| `docker compose config --quiet` | Passou |
| `caddy validate` (Caddyfile com novos headers) | Passou |
| `--forwarded-allow-ips 127.0.0.1` no uvicorn | Confirmado no Dockerfile; `--forwarded-allow-ips *` removido |
| Headers HTTP (`X-Frame-Options`, `CSP`, `Permissions-Policy`) | Presentes no Caddyfile e em `next.config.ts` |
| Métricas bloqueadas em `/metrics*` | Confirmado no Caddyfile com matcher `@privateMetrics` |

## Checks de frontend

| Check | Estado |
|---|---|
| `npm run typecheck` (tsc strict) | Passou |
| `npm run lint` (ESLint) | Passou |
| `npm run build` (Next.js standalone) | Passou |
| `npm audit --audit-level=high` | 0 vulnerabilidades |
| Playwright: página inicial, login acessível | Passou |
| Playwright: erro com credenciais inválidas | `role="alert"` visível |
| Playwright: botão desabilitado durante envio | Confirmado |

## Checks de backup/restore

| Check | Estado |
|---|---|
| `make backup` (banco + evidências + SHA-256) | Passou no job de containers do CI |
| `make restore` a partir do backup gerado | Passou no job de containers do CI |
| Ensaio de desastre com volumes externos reais | **Pendente** — recomendado antes do primeiro deploy público |

## Itens não validados remotamente

| Item | Razão |
|---|---|
| Integração Meta (Instagram/Facebook) | Exige credenciais e permissões oficiais |
| Coleta Mastodon | Exige instância com `authorized=true` configurado |
| SMTP externo | Exige servidor SMTP real configurado |
| Webhook externo ponta-a-ponta | Destino HTTPS público necessário |
| Pentest / DAST autenticado | Não realizado nesta versão |
| Alta disponibilidade / clustering | Fora do escopo atual |

Testes de contrato com mocks não comprovam autorização externa, disponibilidade de
terceiros ou App Review Meta. Um check mockado não confirma quota ou permissão real.
