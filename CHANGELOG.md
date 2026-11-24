# Changelog

## Unreleased

## 0.3.3 — hardening de validação de entrada (2026-11-23)

### Segurança / Validação

- **`routes/core.py`** — `WorkspaceIn.kind` e `.status` usam `Literal` (validação antes do banco);
  `WorkspaceIn.label`/`content` têm `max_length`; `EntityIn` com `Field(max_length=...)`
  em todos os campos string; `UserIn.role` usa `Literal`; `MemberIn.role` usa `Literal`;
  `MemberIn.email` trocado de `str` para `EmailStr`; verificações de role duplicadas removidas
  das rotas (já cobertas pelo schema Pydantic).
- **`config.py`** — `smtp_from` validado como `EmailStr`; impede header injection no campo `From:`
  de e-mails de alerta.
- **`migrations/0002`** — corrigida para adicionar colunas `label` e `status` faltantes em
  `workspace_items` (ausentes de `0001`) e dois CHECK constraints (`valid_kind`,
  `valid_workspace_status`).

## 0.3.2 — auditoria de segurança: achados restantes (2026-11-23)

### Segurança

- **`main.py`** (FIND-05 / CWE-200) — `/metrics/prometheus` agora retorna 404 para qualquer
  peer que não seja loopback ou RFC-1918; guarda na camada ASGI, independente do Caddy.
- **`collection.py`** (FIND-10 / CWE-209) — `str(error)` substituído por `error.args[0]`
  com verificação de tipo; garante que somente o texto literal da `ConnectorError` é serializado,
  nunca `repr()` de objetos arbitrários com tokens ou payloads.
- **`Dockerfile` (api)** (FIND-09) — `--proxy-headers --forwarded-allow-ips 127.0.0.1`
  removidos do uvicorn; flag era ineficaz na rede bridge Docker (Caddy chega com IP 172.x.x.x)
  e conflitava com `_RealIPMiddleware`, que já faz o trabalho correto.
- **`package.json`** (FIND-11) — `next` e `eslint-config-next` corrigidos de `^16.4.3`
  (versão inexistente) para `^15.1.0`.

## 0.3.1 — auditoria de segurança (2026-11-23)

### Segurança — ALTA

- **`kali_mcp.py`** (FIND-01 / CWE-918) — `httpx.get()` direto substituído por `PublicNetworkBackend`
  com `validate_public_url()`; endpoint nunca chamava a pilha SSRF dos conectores.
- **`config.py`** (FIND-02 / CWE-311) — `CONNECTOR_SECRET_KEY` vazia agora falha em qualquer ambiente
  fora de `development`; credenciais de conector não ficam mais desprotegidas em staging/produção.

### Segurança — MÉDIA

- **`docker-compose.yml`** (FIND-03 / CWE-306) — Redis agora exige `REDIS_PASSWORD`; `--requirepass`
  passado ao servidor; `REDIS_URL` atualizada para incluir senha.
- **`main.py`** (FIND-04 / CWE-200) — `/docs`, `/redoc` e `/openapi.json` desabilitados quando
  `ENVIRONMENT=production`; OpenAPI nunca exposto em produção.
- **`notifications.py`** (FIND-06 / CWE-321) — Webhook bloqueado quando `ALERT_WEBHOOK_SECRET` está
  vazio; `config.py` em produção valida a presença da chave quando `ALERT_WEBHOOK_URL` está definida.
- **`notifications.py`** (FIND-12) — `smtp.starttls()` agora usa `ssl.create_default_context()`;
  certificado do servidor SMTP verificado corretamente.
- **`models.py`** (FIND-07 / CWE-20) — `WorkspaceItem.status` protegido com `CHECK` constraint
  `('open','in_progress','resolved','dismissed')`.
- **`routes/core.py`** (FIND-08 / CWE-20) — `UserIn.email` trocado de `str` para `EmailStr`.

### Infraestrutura

- **`.env.example`** — adicionado `REDIS_PASSWORD`; corrigido `SMTP_FROM` legado.
- **`scripts/setup_env.py`** — gera `REDIS_PASSWORD` automaticamente junto com os outros secrets.
- **`migrations/versions/0002_workspace_status_constraint.py`** — migração DDL para o novo
  CHECK constraint em `workspace_items.status`.

## 0.3.0 — melhorias de qualidade e acessibilidade (2026-11-22)

### Frontend

- **`globals.css`** — desminificado; adicionada classe `.error` (vermelho `#f87171`), `:focus` outline,
  hover com transição, tipografia com `line-height`, media query legível.
- **`next.config.ts`** — desminificado; adicionado `headers()` com `X-Frame-Options: DENY`,
  `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy` e `X-Content-Type-Options`
  no nível Next.js (camada adicional ao Caddy).
- **`Dockerfile` (web)** — `--chown=node:node` nos `COPY` do standalone; copia `public/`;
  `NEXT_TELEMETRY_DISABLED=1`; `--ignore-scripts` no `npm ci`.
- **`layout.tsx`** — declara `icons` em `metadata` para favicon e `apple-touch-icon`.
- **`login/page.tsx`**, **`investigations/new/page.tsx`**, **`search/page.tsx`** —
  handlers convertidos para `useCallback` com dependências explícitas.
- **`[section]/page.tsx`** — adicionado `?skip=0&limit=50` para paginação explícita;
  trata 401/403 com mensagens diferenciadas.
- **`graph/page.tsx`** — `useCallback` em `exportJson`; `<title>` e `aria-label` em cada
  nó SVG para acessibilidade de leitores de tela.
- **`smoke.spec.ts`** — desminificado; `describe` blocks; teste de mensagem de erro com
  credenciais inválidas; teste de botão desabilitado durante envio.

### Backend

- **`routes/core.py`** — anotações de tipo explícitas em `dump()` e `page()`.

### Documentação

- **`ROADMAP.md`** — criado com itens curto/médio/longo prazo e seção "fora do escopo".
- Toda documentação atualizada para refletir o estado atual do código.

---

## 0.2.0 — hardening e qualidade de código (2026-11-18)

### Segurança

- **`Dockerfile` (api)** — `--forwarded-allow-ips *` substituído por `127.0.0.1`;
  uvicorn agora só confia em `X-Forwarded-For` do proxy Caddy (loopback), consistente
  com `_RealIPMiddleware`; a configuração anterior permitia que qualquer cliente
  falsificasse o IP e escapasse do throttle de login.
- **`Caddyfile`** — adicionados `X-Frame-Options: DENY`, `Content-Security-Policy`,
  `Permissions-Policy`; HSTS reforçado com `preload`.

### Migrações

- **`migrations/versions/0001_initial.py`** — substituído `Base.metadata.create_all/drop_all`
  (anti-padrão Alembic) por DDL explícito com todas as tabelas, índices e `downgrade` correto
  em ordem reversa.

### Scripts

- **`scripts/purge_expired_evidence.py`** — modernizado para SQLAlchemy 2.x `select()`;
  shebang; saída estruturada com contagem de erros; `sys.exit(1)` quando há falhas de storage.
- **`scripts/demo_public.py`** — reformatado de código minificado para legível;
  tratamento de `HTTPError`/`URLError` com mensagem em `stderr`.

### Frontend

- Todos os 8 arquivos de página Next.js desminificados e reestruturados com estados
  `loading`/`error`, `role="alert"` em mensagens de erro, `autoComplete` em campos de senha.

---

## 0.1.1 — correções de segurança (2026-11-12)

- **`notifications.py`** — corrigido `hmac.new` (inexistente) para `hmac.HMAC`;
  webhook estava inoperante.
- **`notifications.py`** — webhook HTTPS passa por `PublicNetworkBackend` com DNS pin,
  prevenindo DNS rebinding.
- **`notifications.py`** — `_validate_recipient()` com regex e proteção contra
  header injection via e-mail malformado.
- **`routes/core.py`** — parâmetro `recipient` trocado de `str` livre para `EmailStr`;
  `ValueError` retorna 422 em vez de 502.
- **`main.py`** — `_RealIPMiddleware` só lê `X-Forwarded-For` quando o peer TCP direto
  é loopback ou RFC-1918/ULA.
- **`observability.py`** — `X-Request-ID` sanitizado (`[A-Za-z0-9\-_]`, máx 64 chars)
  antes de ser refletido no response header e gravado no log.

---

## 0.1.0 — desenvolvimento inicial (2026-10-12)

- Plataforma MIT com monólito modular FastAPI/Next.js e PostgreSQL/Redis/Celery.
- Docker Compose com serviço isolado de migração, volumes persistentes, worker e Beat.
- HTTPS Caddy para produção; Prometheus opcional.
- Geração local de segredos; backup/restauração consistente de banco e evidências.
- Logging JSON com `request_id`, usuário e contexto operacional de jobs.
- Busca global persistida; revogação global de sessões; configuração administrativa de conectores.
- CI: inicia API, worker, Beat; smoke tests Playwright.
- Grafo web com filtros de escopo e exportação JSON.
- Notificações SMTP e webhooks HMAC SHA-256 para alertas.
- Revogação global de sessões e expurgo de evidências expiradas via `make purge`.
- Documentação de arquitetura, conectores autorizados, segurança, privacidade e operação.
