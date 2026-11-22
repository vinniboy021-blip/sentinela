# Changelog

## Unreleased

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
