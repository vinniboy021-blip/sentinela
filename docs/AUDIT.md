# Registro de auditoria de segurança e operação

## Rodada 3 — qualidade e acessibilidade (2026-11-22)

**Escopo**: frontend Next.js, Dockerfile web, `routes/core.py`, testes E2E, documentação.

### Achados corrigidos

| ID | Severidade | Achado | Correção |
|---|---|---|---|
| AUD-18 | Média | `globals.css` minificado sem classe `.error`; mensagens de erro sem estilo diferenciado. | Desminificado; adicionada `.error` (vermelho), `:focus`, hover com transição, tipografia. |
| AUD-19 | Média | `next.config.ts` sem `headers()`; headers de segurança dependiam exclusivamente do Caddy. | Adicionado `headers()` com `X-Frame-Options`, `CSP`, `Referrer-Policy`, `Permissions-Policy`. |
| AUD-20 | Baixa | `Dockerfile` web sem `--chown=node:node`; arquivos standalone com ownership root. | Adicionado `--chown=node:node` nos COPYs; copia `public/`; `NEXT_TELEMETRY_DISABLED=1`. |
| AUD-21 | Baixa | `smoke.spec.ts` minificado sem teste de erro de login nem de botão desabilitado. | Reformatado; adicionados testes de `role="alert"` e botão desabilitado durante envio. |
| AUD-22 | Baixa | `[section]/page.tsx` sem `?skip=0&limit=50`; paginação implícita dependia do default do backend. | Adicionado `?skip=0&limit=50`; 401/403 tratados com mensagens distintas. |
| AUD-23 | Baixa | Nós SVG do grafo sem `<title>` nem `aria-label`; inacessíveis a leitores de tela. | Adicionados `<title>` e `role="img" aria-label` em cada nó. |
| AUD-24 | Baixa | `dump()` e `page()` em `routes/core.py` sem anotações de tipo. | Anotações `Any`, `Session`, `dict[str, Any]` adicionadas. |
| AUD-25 | Baixa | `ROADMAP.md` referenciado no README mas inexistente. | Criado com itens curto/médio/longo prazo e seção "fora do escopo". |

---

## Rodada 2 — hardening de proxy e migração (2026-11-18)

**Escopo**: Dockerfile API, Caddyfile, `migrations/0001_initial.py`, scripts.

### Achados corrigidos

| ID | Severidade | Achado | Correção |
|---|---|---|---|
| AUD-10 | Alta | `--forwarded-allow-ips *` no uvicorn fazia o serviço confiar em `X-Forwarded-For` de qualquer IP, contornando `_RealIPMiddleware` e permitindo bypass do rate limiter. | Restringido para `127.0.0.1`; apenas o proxy Caddy (loopback na rede Docker) é confiável. |
| AUD-11 | Média | Caddyfile sem `X-Frame-Options`, `Content-Security-Policy` e `Permissions-Policy`. | Adicionados os três; HSTS reforçado com `preload`. |
| AUD-12 | Média | `migrations/0001_initial.py` usava `Base.metadata.create_all/drop_all` — anti-padrão Alembic que ignora histórico de migrações e não é reproduzível com `downgrade`. | Substituído por DDL explícito com ~200 linhas: todas as tabelas, índices e `downgrade` correto. |
| AUD-13 | Baixa | `scripts/purge_expired_evidence.py` usava SQLAlchemy 1.x `db.query()`. | Modernizado para `select()`; shebang; `sys.exit(1)` em caso de falhas. |
| AUD-14 | Baixa | `scripts/demo_public.py` era código minificado sem tratamento de erros HTTP. | Reformatado; `try/except HTTPError/URLError`; mensagens em `stderr`. |

---

## Rodada 1 — segurança de notificações e middleware (2026-11-12)

**Escopo**: `notifications.py`, `main.py`, `observability.py`, `routes/core.py`.

### Achados corrigidos

| ID | Severidade | Achado | Correção |
|---|---|---|---|
| AUD-01 | Alta | `hmac.new` inexistente em Python 3; webhook estava sempre inoperante. | Corrigido para `hmac.HMAC(key, body, sha256)`. |
| AUD-02 | Alta | Webhook não usava `PublicNetworkBackend`; suscetível a DNS rebinding. | `_webhook_client()` com `PublicNetworkBackend` e DNS pin no TCP connect. |
| AUD-03 | Alta | `X-Forwarded-For` aceito de qualquer peer; qualquer cliente podia falsificar IP e escapar do throttle. | `_RealIPMiddleware` só propaga IP quando peer é loopback/RFC-1918. |
| AUD-04 | Média | `X-Request-ID` refletido sem sanitização; suscetível a log injection e header injection. | Sanitizado para `[A-Za-z0-9\-_]`, máx 64 chars, antes de qualquer uso. |
| AUD-05 | Média | Parâmetro `recipient` aceito como `str` livre em `POST /alerts/{id}/deliver`. | Trocado para `EmailStr` Pydantic + `_validate_recipient()` com regex e proteção contra `\n`/`\r`. |

---

## Auditoria anterior (2026-10-29)

Auditoria profunda de escopo completo. Resultados e evidências em [AUDIT.md versão anterior].

Achados já corrigidos (referência):
- AUD-P01 Alta: Isolamento entre investigações em agregados e busca.
- AUD-P02 Alta: Rota de conectores administrativos sem RBAC.
- AUD-P03 Média: Cascata de evidências inconsistente.
- AUD-P04 Alta: Dependências vulneráveis (starlette, next, eslint-config-next).
- AUD-P05 Média: Build do frontend omitia dependências de desenvolvimento.
- AUD-P06 Baixa: `make audit` gravava cache em diretório não gravável.
- AUD-P07 Média: Webhook sem validação de destino interno.
- AUD-P08 Média: Caddy não bloqueava `/metrics/prometheus` completo.
- AUD-P09 Média: Sem API de colaboradores/membros de investigação.

## Riscos residuais

1. Sem pentest independente, DAST autenticado ou revisão externa de configuração pública.
2. Ensaio de desastre com volumes externos pendente; apenas smoke test CI foi executado.
3. Integração Meta não validada remotamente sem credenciais e permissões oficiais.
4. Métricas Prometheus devem continuar bloqueadas no Caddy e acessíveis apenas por rede interna.
5. `TestClient` de Starlette emite aviso de depreciação para httpx; suíte passa mas migração deve ser planejada.
6. `PublicNetworkBackend` usa detalhe interno de `httpcore` para pinning DNS; updates de `httpx/httpcore` devem ser acompanhados por testes de SSRF.
7. Interface web de colaboração parcialmente implementada; backend aplica autorização mas nem todas as operações têm tela dedicada.
