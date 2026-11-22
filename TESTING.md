# Testes e critérios de aceite

Os testes separam contratos com mocks de coleta remota real. Fixtures são identificadas
como testes e nunca servem de evidência de disponibilidade de API externa.

```bash
make install       # instala dependências Python e Node.js
make lint          # Ruff + ESLint
make typecheck     # mypy + tsc
make test          # pytest com PostgreSQL/Redis reais
make integration   # testes de integração completos (exige RUN_INTEGRATION=1)
```

```bash
# Testes E2E Playwright
cd apps/web
npx playwright install --with-deps chromium
npm run test:e2e
```

## Backend

**Pytest** com fixtures PostgreSQL e Redis reais (`DATABASE_URL`, `REDIS_URL`, `EVIDENCE_PATH`).
**Ruff** para linting. **mypy** strict para tipos.

Critérios críticos cobertos:
- Login, CSRF e brute-force bloqueado por IP+email
- Isolamento por investigação em todos os agregados e listas
- Coleta, normalização e proveniência de observações
- Deduplicação por fingerprint
- Cron/intervalos/recuperação de jobs perdidos
- Retries, backoff e dead letter após limite
- Revisão e revogação de vínculos de correlação
- Evidências: upload, integridade SHA-256, versões e download seguro
- Exportações JSON/CSV/Markdown sem dados inventados
- SSRF: loopback, IPv6, RFC-1918, metadata, DNS rebinding e redirecionamentos

## Frontend

**ESLint** e **TypeScript strict** para qualidade estática. **Next.js build** para validação
de compilação. **Playwright** para E2E.

Suíte de testes E2E (`tests/e2e/smoke.spec.ts`):
- Página inicial exibe link de autenticação
- Página de login apresenta campos com `label` acessível (`E-mail`, `Senha`)
- Credenciais inválidas exibem mensagem de erro com `role="alert"`
- Botão desabilitado durante envio (estado `loading`)

## CI

O workflow GitHub (`validate.yml`) provisiona PostgreSQL e Redis reais, executa API,
worker e Beat, verifica Alembic, constrói as imagens Docker e exercita backup/restauração.
Aguarda o servidor web com health check antes dos testes Playwright.

Exigências para o runner de integração:
- `DATABASE_URL` apontando para banco PostgreSQL descartável
- `REDIS_URL` apontando para Redis disponível
- `EVIDENCE_PATH` com diretório gravável
- `RUN_INTEGRATION=1`

## Demonstração com fonte real

Instale a stack, crie o administrador e execute:

```bash
python3 scripts/demo_public.py
```

O script consulta o repositório público GitHub `psf/requests` via API oficial e exibe
contagem de estrelas e nome completo. Erros de rede ou HTTP são reportados em `stderr`
com código de saída 1. Nenhuma informação é apresentada como coleta real antes da
persistência — trate esta demonstração como smoke test de conectividade, não como evidência.

Disponibilidade de terceiros não faz parte de testes determinísticos. Falha de rede é
reportada explicitamente. Integrações Meta não são declaradas funcionalmente validadas
sem tokens e concessões oficiais.

Veja [docs/VALIDATION.md](docs/VALIDATION.md) para os comandos executados nesta entrega
e suas limitações. Antes de um release, aguarde o workflow CI do commit final e complete
o ensaio de desastre com volumes externos.
