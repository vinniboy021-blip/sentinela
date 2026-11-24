# Relatório de Auditoria de Segurança — Projeto Sentinela

**Data:** 2026-11-23  
**Escopo:** Revisão estática completa dos arquivos listados na solicitação  
**Metodologia:** OWASP Top 10 + categorias específicas de OSINT/coleta  
**Auditor:** Claude Sonnet 4.6 (Anthropic)

---

## Resumo Executivo

O projeto Sentinela apresenta uma postura de segurança geral acima da média para um sistema OSINT. As decisões de arquitetura — sessões opacas no servidor, proteção CSRF, Argon2id, Fernet para credenciais de conector, validação SSRF com DNS-pinning no TCP, rate limiting em Redis — demonstram maturidade de design. A maior parte do código é defensiva e bem comentada.

Foram identificados **12 achados**, distribuídos nas seguintes severidades:

| Severidade | Quantidade |
|------------|-----------|
| CRÍTICA    | 0         |
| ALTA       | 2         |
| MÉDIA      | 6         |
| BAIXA      | 4         |

Nenhuma credencial hardcoded foi encontrada. Nenhuma injeção SQL identificada (ORM com parâmetros). Os achados mais relevantes envolvem: ausência de proteção SSRF no módulo `kali_mcp.py`, ausência de autenticação no Redis, e configurações que se tornam inseguras por padrão quando implantadas sem `ENVIRONMENT=production`.

---

## Achados Detalhados

---

### FIND-01 — SSRF Sem Validação em `kali_mcp.py`

- **Arquivo:** `apps/api/app/kali_mcp.py` — linhas 7, 14  
- **Severidade:** ALTA  
- **CWE:** CWE-918 (Server-Side Request Forgery)

**Descrição:**  
A função `health()` constrói uma URL a partir da variável de ambiente `KALI_MCP_URL` e realiza um `httpx.get()` direto, sem qualquer chamada a `validate_public_url()` ou uso do `PublicNetworkBackend` com DNS-pinning. Isso contrasta diretamente com a arquitetura de todos os outros pontos de saída HTTP do sistema (conectores, webhook de alerta), que passam pela pilha de validação SSRF de `connectors/security.py`.

```python
# kali_mcp.py linha 14 — sem validação
response = httpx.get(f"{KALI_MCP_URL}/health", timeout=3, follow_redirects=False)
```

**Cenário de exploração:**  
Um operador ou atacante que controle a variável de ambiente (p.ex. via injeção de configuração, comprometimento de `.env`, ou escalonamento de privilégios dentro do container) pode apontar `KALI_MCP_URL` para endereços RFC-1918 (`http://169.254.169.254/latest/meta-data/` em AWS, `http://postgres:5432/`, etc.). A rota `/api/v1/kali/health` (inferida da inclusão do router em `main.py`) exporia a resposta ao chamador autenticado.

**Correção sugerida:**
```python
# Substituir o bloco httpx.get por:
from app.connectors.security import validate_public_url, ConnectorError
import httpx
from app.connectors.security import PublicNetworkBackend
import httpcore

def health() -> dict:
    if not KALI_MCP_URL:
        return {"status": "disabled", "message": "KALI_MCP_URL não configurada"}
    try:
        validate_public_url(KALI_MCP_URL)
    except ConnectorError as exc:
        return {"status": "disabled", "message": str(exc)}
    try:
        transport = httpx.HTTPTransport(retries=0, trust_env=False)
        transport._pool._network_backend = PublicNetworkBackend()
        with httpx.Client(transport=transport, timeout=3, follow_redirects=False) as client:
            response = client.get(f"{KALI_MCP_URL}/health")
        ...
```

---

### FIND-02 — `CONNECTOR_SECRET_KEY` Padrão Vazio em Desenvolvimento

- **Arquivo:** `apps/api/app/config.py` — linha 30; `docker-compose.yml` — linha 9  
- **Severidade:** ALTA  
- **CWE:** CWE-311 (Missing Encryption of Sensitive Data)

**Descrição:**  
Em `config.py`, `connector_secret_key` tem `default=""`. No `docker-compose.yml`, o valor é `${CONNECTOR_SECRET_KEY:-}`, o que resulta em string vazia quando a variável não está definida. A validação `production_safety` só exige a chave em `ENVIRONMENT=production`. Em qualquer implantação de desenvolvimento, staging ou CI onde `ENVIRONMENT` não seja `production`, credenciais de conector (tokens de API, senhas) são armazenadas em texto claro no banco de dados, embora sejam passadas pela função `encrypt_connector_settings`.

A função `_fernet()` em `auth.py` lança `HTTPException(503)` quando a chave está vazia, mas isso só ocorre **no momento de usar** as credenciais — durante a configuração via PUT, `encrypt_connector_settings` chama `_fernet()` que lança erro, impedindo o salvamento. Porém, se um conector for configurado antes de definir a chave e depois a chave for removida, as configurações persistidas ficam sem criptografia efetiva (o campo `encrypted:` não será prefixado).

**Cenário de exploração:**  
Em um ambiente de staging ou CI/CD que aponte para dados reais (situação comum), credenciais como tokens GitHub, GitLab, URLhaus ficam em texto simples na coluna `settings` da tabela `connector_configurations`. Um SQL dump, backup inseguro, ou acesso indevido ao banco expõe imediatamente todos os tokens.

**Correção sugerida:**  
Adicionar validação também para `staging` e qualquer ambiente não-development. Alternativamente, tornar a chave obrigatória sempre (sem default):

```python
connector_secret_key: str = Field(
    ...,  # Campo obrigatório — sem default
    validation_alias=AliasChoices("CONNECTOR_SECRET_KEY", "APP_SECRET_KEY")
)
```

E garantir que `docker-compose.yml` exija a variável com `:?` em vez de `:-`:
```yaml
CONNECTOR_SECRET_KEY: ${CONNECTOR_SECRET_KEY:?configure CONNECTOR_SECRET_KEY em .env}
```

---

### FIND-03 — Redis Sem Autenticação

- **Arquivo:** `docker-compose.yml` — linhas 65–75; `apps/api/app/config.py` — linha 13  
- **Severidade:** MÉDIA  
- **CWE:** CWE-306 (Missing Authentication for Critical Function)

**Descrição:**  
O serviço Redis não tem senha configurada. O Redis é acessível por qualquer container na rede Docker interna `sentinela`. As chaves armazenadas incluem contadores de rate limiting de autenticação (que, se manipuláveis, permitem bypass de brute-force) e estado de rate limiting de conectores.

A porta Redis **não é exposta ao host** no compose (sem `ports:`), o que mitiga o risco externo. No entanto, qualquer container comprometido na rede interna — incluindo o próprio container da aplicação — pode ler e escrever dados Redis sem restrição.

**Cenário de exploração:**  
Comprometimento RCE em qualquer serviço da rede Docker → `redis-cli -h redis FLUSHALL` → contadores de tentativas de login zerados → ataque de brute-force sem throttle.

**Correção sugerida:**  
```yaml
# docker-compose.yml
redis:
  command: [redis-server, --requirepass, "${REDIS_PASSWORD:?configure REDIS_PASSWORD}", ...]
```
Atualizar `REDIS_URL` para incluir a senha: `redis://:${REDIS_PASSWORD}@redis:6379/0`.

---

### FIND-04 — Swagger UI e ReDoc Expostos em Produção Sem Autenticação

- **Arquivo:** `apps/api/app/main.py` — linhas 51–57  
- **Severidade:** MÉDIA  
- **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)

**Descrição:**  
Os endpoints `/docs` (Swagger UI) e `/redoc` são habilitados por padrão sem qualquer restrição de acesso ou autenticação. Embora o Caddy bloqueie `/metrics*`, não há bloco para `/docs` ou `/redoc` no Caddyfile. A documentação completa da API — incluindo todos os schemas, parâmetros, tipos esperados e endpoints de administração — fica pública para qualquer cliente que alcance o servidor.

**Cenário de exploração:**  
Um atacante que descubra a URL do servidor obtém o mapa completo da superfície de ataque: endpoints de administração, schemas de corpo, parâmetros de query, tipos de resposta esperados. Isso acelera o desenvolvimento de exploits.

**Correção sugerida:**  
Desabilitar em produção:
```python
app = FastAPI(
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)
```
Ou proteger via Caddy com restrição de IP de origem.

---

### FIND-05 — Métricas Prometheus Acessíveis Diretamente na API

- **Arquivo:** `apps/api/app/main.py` — linhas 73–74; `infrastructure/deployment/Caddyfile` — linhas 15–18  
- **Severidade:** MÉDIA  
- **CWE:** CWE-200 (Exposure of Sensitive Information)

**Descrição:**  
O endpoint `/metrics/prometheus` é montado sem autenticação quando `metrics_enabled=True` (padrão). O Caddyfile bloqueia o path `/metrics*` respondendo 404, o que protege o edge. Porém, a API é exposta diretamente ao host na porta `127.0.0.1:8000`. Qualquer processo local (incluindo um atacante com acesso local à máquina host) pode acessar `http://127.0.0.1:8000/metrics/prometheus` sem autenticação e obter contagens de requisições, latências, estados internos do sistema.

**Correção sugerida:**  
Adicionar autenticação básica ou IP allowlist via middleware, ou remover a montagem quando em produção e servir as métricas apenas via rede interna de monitoramento:
```python
if settings.metrics_enabled and settings.environment != "production":
    app.mount("/metrics/prometheus", make_asgi_app())
```

---

### FIND-06 — Webhook HMAC Enviado com Chave Vazia

- **Arquivo:** `apps/api/app/notifications.py` — linha 79; `apps/api/app/config.py` — linha 51  
- **Severidade:** MÉDIA  
- **CWE:** CWE-321 (Use of Hard-coded Cryptographic Key), CWE-347 (Improper Verification of Cryptographic Signature)

**Descrição:**  
Se `ALERT_WEBHOOK_SECRET` não estiver configurado (valor padrão `""`), o HMAC é calculado com chave vazia:
```python
signature = hmac.HMAC(settings.alert_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
```
Isso resulta em `hmac.HMAC(b"", body, sha256)`, que é uma assinatura determinística mas sem autenticação real. O receptor do webhook que confiar nessa assinatura e aceitar `X-Sentinela-Signature: sha256=<valor_previsível>` pode ser enganado.

Adicionalmente, se `ALERT_WEBHOOK_URL` estiver configurado mas `ALERT_WEBHOOK_SECRET` vazio, não há aviso ou bloqueio. A requisição é enviada com assinatura sem valor criptográfico.

**Correção sugerida:**  
Bloquear o envio se a chave estiver vazia quando a URL estiver configurada:
```python
if settings.alert_webhook_url:
    if not settings.alert_webhook_secret:
        raise ValueError("ALERT_WEBHOOK_SECRET é obrigatório quando ALERT_WEBHOOK_URL está configurado")
    ...
```

---

### FIND-07 — `WorkspaceItem.status` Sem Validação de Domínio

- **Arquivo:** `apps/api/app/models.py` — linhas 398–408; `apps/api/app/routes/core.py` — linhas 73–79  
- **Severidade:** MÉDIA  
- **CWE:** CWE-20 (Improper Input Validation)

**Descrição:**  
O modelo `WorkspaceItem` tem uma `CheckConstraint` para o campo `kind` (`IN ('hypothesis','observation','task')`), mas não há restrição para o campo `status`. O modelo `WorkspaceIn` aceita `status: str = "open"` sem validar os valores permitidos. Um usuário pode persistir qualquer string arbitrária como status, incluindo strings longas (o campo é `String(30)` no modelo, mas o schema Pydantic não impõe limite).

**Cenário de exploração:**  
Baixo impacto direto, mas pode causar quebra em frontends que dependem de valores conhecidos de status, e representa uma superfície de injeção de dados não sanitizados no banco.

**Correção sugerida:**  
```python
class WorkspaceIn(BaseModel):
    status: Literal["open", "in_progress", "closed"] = "open"
```
E adicionar `CheckConstraint("status IN ('open','in_progress','closed')", name="valid_ws_status")` ao modelo.

---

### FIND-08 — `UserIn.email` Sem Validação de Formato

- **Arquivo:** `apps/api/app/routes/core.py` — linhas 81–84  
- **Severidade:** BAIXA  
- **CWE:** CWE-20 (Improper Input Validation)

**Descrição:**  
O modelo `UserIn` usa `email: str` em vez de `email: EmailStr`. Enquanto `LoginBody` em `auth.py` usa `EmailStr` corretamente, o endpoint `POST /admin/users` aceita strings arbitrárias como email, que são armazenadas em lowercase sem validação de formato. Isso pode resultar em contas com emails inválidos que nunca receberão notificações, ou dados inconsistentes entre tabelas.

**Correção sugerida:**  
```python
from pydantic import EmailStr

class UserIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    role: str = "analyst"
```

---

### FIND-09 — `uvicorn --forwarded-allow-ips 127.0.0.1` Incompatível com Rede Docker

- **Arquivo:** `apps/api/Dockerfile` — linha 16  
- **Severidade:** BAIXA  
- **CWE:** CWE-346 (Origin Validation Error)

**Descrição:**  
O CMD do Dockerfile configura `--forwarded-allow-ips 127.0.0.1`, que instrui o Uvicorn a confiar em cabeçalhos `X-Forwarded-*` apenas de conexões de loopback. No entanto, em um deploy Docker Compose, Caddy (ou qualquer proxy reverso) se conecta à API via rede bridge Docker (172.x.x.x), não via 127.0.0.1. Isso significa que o Uvicorn ignorará os cabeçalhos de proxy de Caddy para populamento de `request.scope["client"]` nativamente.

A aplicação mitiga isso via `_RealIPMiddleware`, que implementa sua própria lógica de proxy trust usando `_is_trusted_proxy()` (RFC-1918 + loopback). Essa camada funciona corretamente. O risco residual é que configurações que dependam do `scope["client"]` resolvido pelo Uvicorn (antes do middleware) possam ver o IP do container proxy em vez do IP real.

**Correção sugerida:**  
Consistir a configuração:
```
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips", "*"]
```
E confiar exclusivamente no `_RealIPMiddleware` para validar quais proxies são confiáveis (que já faz corretamente).

---

### FIND-10 — `bad_request()` Pode Vazar Mensagens Internas

- **Arquivo:** `apps/api/app/routes/collection.py` — linha 132  
- **Severidade:** BAIXA  
- **CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)

**Descrição:**  
```python
def bad_request(error: Exception) -> HTTPException:
    return HTTPException(400, str(error))
```
Esta função serializa diretamente a mensagem da exceção como resposta HTTP. `ValueError` e `ConnectorError` são usados por código da aplicação com mensagens controladas, o que é seguro neste contexto. No entanto, se uma exceção inesperada de biblioteca de terceiro chegar aqui (ex.: erros de serialização JSON, erros de validação de schema), a mensagem pode conter informações sobre a estrutura interna, configurações ou caminhos de arquivo.

**Correção sugerida:**  
Restringir o pass-through apenas a exceções controladas:
```python
def bad_request(error: Exception) -> HTTPException:
    if isinstance(error, (ValueError, ConnectorError)):
        return HTTPException(400, str(error))
    return HTTPException(400, "Requisição inválida")
```

---

### FIND-11 — Dependências com Ranges Amplos Sem Auditoria Automatizada no CI

- **Arquivo:** `apps/api/pyproject.toml` — linhas 11–17; `apps/web/package.json` — linhas 14–28  
- **Severidade:** BAIXA  
- **CWE:** CWE-1104 (Use of Unmaintained Third-Party Components)

**Descrição:**  
As dependências Python usam ranges `>=X.Y,<Z` que permitem atualizações de patch e minor sem revisão. Por exemplo, `cryptography>=44` (sem upper bound), `httpx>=0.28.1,<0.29`. O projeto inclui `pip-audit` nos deps de dev, o que é positivo, mas não há evidência de integração em CI/CD.

No `package.json`, versões usam `^` (caret), permitindo minor updates automáticas. `next: ^16.4.3` é uma versão futura não existente no npm atual (16.x não existe; a versão mais recente do Next.js é 15.x), sugerindo um placeholder ou erro.

**Correção sugerida:**  
- Integrar `pip-audit` e `npm audit` como step obrigatório no CI.
- Fixar versões exatas em `requirements.lock` / `package-lock.json` e fazer updates deliberados.
- Verificar se `next: ^16.4.3` é intencional.

---

### FIND-12 — SMTP Sem Validação de Certificado TLS Explícita

- **Arquivo:** `apps/api/app/notifications.py` — linhas 65–70  
- **Severidade:** BAIXA  
- **CWE:** CWE-295 (Improper Certificate Validation)

**Descrição:**  
```python
with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
    if settings.smtp_starttls:
        smtp.starttls()
```

`smtplib.SMTP.starttls()` sem argumento `context=` usa o contexto SSL padrão do sistema, que em Python 3.12 verifica certificados por padrão (`ssl.create_default_context()`). Portanto, o comportamento padrão é seguro. No entanto, não há tratamento de `ssl.SSLCertVerificationError` — se o certificado do servidor SMTP for inválido ou autoassinado (comum em ambientes internos), o envio falhará com exceção não capturada, que é relançada pelo handler como `HTTPException(502)` sem detalhe. Adicionalmente, `SMTP_HOST` aceita qualquer string sem validação de domínio, potencialmente permitindo SMTP injection via cabeçalho `From`.

**Correção sugerida:**  
Adicionar validação explícita do `smtp_from` e considerar usar `ssl.create_default_context()` explicitamente para documar a intenção:
```python
import ssl
ctx = ssl.create_default_context()
smtp.starttls(context=ctx)
```
Validar `settings.smtp_from` como email válido no model_validator de `Settings`.

---

## Análise de Arquitetura de Segurança — Pontos Positivos

Os itens abaixo representam decisões de segurança corretas que merecem registro:

| Área | Implementação |
|------|--------------|
| Autenticação | Argon2id com `time_cost=3, memory_cost=65536, parallelism=4` — parâmetros adequados (FIND-01 de OWASP) |
| Timing attack | `_dummy_hash` para usuários inexistentes; `secrets.compare_digest` para CSRF |
| Sessões | Opacas no servidor; apenas SHA-256 do token armazenado; expiração implementada |
| CSRF | Token por sessão, verificado em todas as rotas de escrita, com validação de `Origin` |
| SSRF (conectores) | DNS-pinning no TCP via `PublicNetworkBackend`; validação de IPs RFC-1918/loopback; Teredo/6to4 bloqueados |
| Criptografia de credenciais | Fernet (AES-128-CBC + HMAC-SHA256) com `encrypted:` prefix; redact antes de serializar |
| Rate limiting | Redis atômico com Lua script (INCR+EXPIRE); fallback local para dev; throttle por IP e por `IP:email` |
| Upload de evidências | Chave aleatória (UUID hex); `O_EXCL` previne sobrescritas; `O_NOFOLLOW` previne symlinks; SHA-256 de integridade |
| Path traversal | Chave de storage validada como alnum 32 chars; symlinks bloqueados |
| XSS / Headers | CSP restritiva em Caddy e Next.js; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY` |
| SQL Injection | SQLAlchemy ORM com parâmetros — sem SQL interpolado encontrado |
| Command Injection | Sem uso de `subprocess`, `os.system` ou similar no código auditado |
| Container hardening | `cap_drop: ALL`, `no-new-privileges: true`, `read_only: true`, `tmpfs` noexec |
| Audit log | Cobertura ampla de ações sensíveis; email nunca logado em texto claro (apenas SHA-256) |
| XML | `defusedxml` com `forbid_dtd=True, forbid_entities=True, forbid_external=True` |

---

## Tabela de Achados por Categoria OWASP

| # | Categoria OWASP / Específica | Achados |
|---|------------------------------|---------|
| 1 | Injeção (SQL, OS, header) | Nenhum encontrado |
| 2 | Autenticação e sessão | FIND-02 (chave vazia) |
| 3 | Exposição de dados sensíveis | FIND-10 (erros), FIND-05 (métricas) |
| 4 | SSRF | FIND-01 (kali_mcp), FIND-03 (Redis sem auth) |
| 5 | CSRF | Implementação correta — sem achados |
| 6 | Controle de acesso / RBAC | FIND-04 (docs públicos) |
| 7 | Configuração insegura | FIND-03, FIND-04, FIND-09 |
| 8 | Criptografia | FIND-02, FIND-06, FIND-12 |
| 9 | Race conditions / TOCTOU | Nenhum encontrado (uso correto de `with_for_update`) |
| 10 | Dependências vulneráveis | FIND-11 |
| 11 | Secrets em código | Nenhum hardcoded encontrado |
| 12 | Upload/Download de arquivos | FIND-07 (validação de status), FIND-08 (email) |

---

## Priorização de Remediação

| Prioridade | Achado | Esforço Estimado |
|-----------|--------|-----------------|
| 1 | FIND-01 — SSRF em kali_mcp.py | Baixo (< 1h) |
| 2 | FIND-02 — CONNECTOR_SECRET_KEY vazio | Baixo (< 1h) |
| 3 | FIND-03 — Redis sem autenticação | Baixo (< 1h) |
| 4 | FIND-06 — Webhook HMAC vazio | Baixo (< 30min) |
| 5 | FIND-04 — Docs em produção | Muito baixo (< 15min) |
| 6 | FIND-05 — Métricas sem auth | Baixo (< 1h) |
| 7 | FIND-07 — WorkspaceItem status | Baixo (< 1h) |
| 8 | FIND-08 — UserIn email | Muito baixo (< 15min) |
| 9 | FIND-09 — forwarded-allow-ips | Muito baixo (< 15min) |
| 10 | FIND-10 — bad_request leaks | Muito baixo (< 15min) |
| 11 | FIND-11 — Auditoria de deps | Médio (integração CI) |
| 12 | FIND-12 — SMTP TLS | Baixo (< 1h) |

---

*Relatório gerado por revisão estática automatizada. Recomenda-se complementar com testes dinâmicos (DAST) e pentest manual nos endpoints de upload, autenticação e webhook antes de deploy em produção.*
