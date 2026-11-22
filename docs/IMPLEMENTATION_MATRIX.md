# Matriz de requisitos e implementação

Revisão de estado em 2026-11-22. A coluna de implementação descreve o código presente;
a coluna de validação distingue testes locais, CI e dependências externas.

| Fase / requisito | Implementação | Validação |
|---|---|---|
| Fundação, MIT, Compose, PostgreSQL, Redis, API e web | Implementado | `docker compose config`, PostgreSQL/Redis iniciados, `make test` |
| Auth, Argon2id, sessões, RBAC, CSRF | Implementado | Testes unitários e de integração; brute-force bloqueado |
| Migrações Alembic com DDL explícito | Implementado; `0001_initial` com tabelas e índices explícitos | PostgreSQL real, `alembic check`, upgrade/downgrade reproduzíveis |
| Registry, conectores públicos, normalização, proveniência | Implementado | Mocks de contrato; disponibilidade remota exige execução real |
| Monitores, Beat, workers, retries, recuperação/DLQ | Implementado | Redis/PostgreSQL reais; cenários de concorrência não benchmarkados |
| Social tracker (GitHub, GitLab, Bluesky, Mastodon, Meta) | Implementado | Meta exige credenciais oficiais; demais validados com contrato |
| Entidades, correlação explicável e revisão humana | Implementado | Testes específicos; score é sugestão, não confirmação |
| Grafo real com filtros, path e exportação JSON | Implementado; nós SVG acessíveis com `<title>` e `aria-label` | Relações persistidas; E2E visual adicional recomendado |
| Colaboração por investigação (membros e RBAC do proprietário) | Backend implementado; UI parcial | 50 testes; telas de colaboração podem ser ampliadas |
| Evidências privadas, versões, SHA-256, O_EXCL, O_NOFOLLOW | Implementado | Testes de integridade, isolamento e download seguro |
| Relatórios JSON/CSV/Markdown com escape de fórmulas | Implementado | Testes de autorização; PDF é evolução futura |
| IA opcional local com citações (Ollama) | Implementado; desabilitado por padrão | Validar apenas com modelo local configurado |
| Threat intelligence defensiva | Feed público e histórico de indicadores | Disponibilidade/licença dependem da fonte |
| Alertas internos, SMTP e webhook HMAC-SHA256 | Implementado; `hmac.HMAC` correto; DNS pin no webhook | Webhook validado contra SSRF; SMTP externo requer teste em ambiente real |
| Headers de segurança HTTP | Caddy: `X-Frame-Options`, `CSP`, `Permissions-Policy`, HSTS com preload; Next.js: mesmos via `headers()` | Caddy validado com `caddy validate`; Next.js: `npm run build` |
| IP real e rate limiting | `_RealIPMiddleware` só confia em loopback/RFC-1918; uvicorn com `--forwarded-allow-ips 127.0.0.1` | Teste de bypass de IP; throttle de login |
| Log injection / header injection | `X-Request-ID` sanitizado; `recipient` validado como EmailStr | Testes de injeção |
| Migrações com DDL explícito (sem create_all) | `0001_initial` refatorado para DDL explícito | Downgrade e upgrade verificados |
| Observabilidade: health, readiness, Prometheus | `/live`, `/ready` (PostgreSQL+Redis), `/metrics/prometheus` bloqueado no Caddy | Verificado com `curl /ready`; Caddy bloqueia endpoint |
| Backup e restore com SHA-256 | Scripts `backup.sh`/`restore.sh`, manifest, smoke test CI | Ensaio de desastre com volumes externos pendente |
| Frontend acessível e com tratamento de erros | Componentes com `loading`, `error`, `role="alert"`, `useCallback`, paginação explícita, nós SVG com `<title>` | Playwright; inspeção manual |
| Testes unitários, integração, E2E e CI | 50 testes, PostgreSQL/Redis/Celery/Beat reais, Playwright, CI | Workflow CI verde; E2E visual em produção recomendado |
| Documentação completa e demonstração pública | Todos os documentos atualizados; `demo_public.py` com tratamento de erros | Smoke test de conectividade |

**Legenda de validação**:
- **Implementado / testado**: código presente e coberto por testes automatizados.
- **Implementado / sem teste externo**: código presente, mas validação de ponta-a-ponta exige credenciais ou infra externa.
- **Pendente**: funcionalidade planejada, não implementada.

Primeiro release exige verificar os itens acima. Limitações de permissão, ambiente ou
escopo devem continuar explícitas; este checklist não substitui pentest, DAST autenticado
ou ensaio de desastre em infraestrutura real.
