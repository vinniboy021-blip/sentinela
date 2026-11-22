# Resolução de problemas

## Diagnóstico rápido

```bash
docker compose ps
docker compose logs --tail=100 migrate api worker beat
docker compose exec api alembic current
curl --fail http://localhost:8000/ready
```

## Tabela de problemas comuns

| Sintoma | Verificação e ação |
|---|---|
| API não sobe | `docker compose logs migrate api`; PostgreSQL pronto e migração completa? |
| Erro de cookie / CSRF | Acesse pela origem configurada; sessão válida e token de escrita correto; HTTPS obrigatório se `COOKIE_SECURE=true` |
| Fontes sem credenciais | Registry mostra configuração pendente; use fonte pública ou configure autorização oficial via `PUT /api/v1/connectors/{id}/configuration` |
| Coleta fica em `pending` | Logs de worker/Beat; `celery inspect ping`; conexão Redis; job persistido no banco? |
| Monitor não dispara | Monitor ativo? Próxima execução em UTC? Beat único? Agenda válida? Relógio do host sincronizado? |
| Resultados repetidos sem alertas | Conteúdo idêntico não gera alerta duplicado por design; compare fingerprint e horário das observações |
| 429 da fonte | Reduza frequência/concorrência; respeite `Retry-After`; nunca evada limites distribuindo requisições |
| Falha TLS em cloud com proxy CA | Use `scripts/cloud_compose.py` ou o build secret BuildKit; não desative verificação SSL |
| SSRF bloqueado | URL deve ser HTTPS, porta 443, destino público sem RFC-1918/loopback/metadata; verifique DNS |
| Evidência inválida na verificação | Compare SHA-256 da versão atual; não sobrescreva o original para encobrir falha |
| Redis sem memória | `noeviction` falha explicitamente; reduza carga, amplie capacidade ou ajuste `maxmemory` |
| Senha PostgreSQL mudou | Volume antigo guarda credenciais anteriores; alterar `.env` não altera o usuário existente no volume |
| `!reset` desconhecido no Compose | Atualize Docker Compose para >= 2.24.4 |
| Restore falhou parcialmente | Escritores ficam parados para evitar dados parciais; examine logs, restaure novamente do backup íntegro, reinicie |
| Métricas não acessíveis externamente | Por design — Caddy bloqueia `/metrics*` na borda pública; acesse pelo loopback ou túnel interno |
| IP de cliente incorreto no log | Confirme que o Caddy está como proxy direto na rede Docker e que uvicorn usa `--forwarded-allow-ips 127.0.0.1` |
| Erro 422 ao entregar alerta | Endereço `recipient` inválido; forneça e-mail no formato `user@domain.tld` |
| `globals.css` sem efeito | O CSS está em `apps/web/app/globals.css` e é importado pelo `layout.tsx`; verifique o `import './globals.css'` |
| `--forwarded-allow-ips *` no log | Versão antiga do Dockerfile; atualize para `127.0.0.1` e reconstrua a imagem |

## Verificações de saúde

```bash
# Liveness
curl http://localhost:8000/live

# Readiness (PostgreSQL + Redis)
curl http://localhost:8000/ready

# Worker Celery
docker compose exec worker celery -A app.celery_app:celery_app inspect ping

# Migrações
docker compose exec api alembic current
docker compose exec api alembic check
```

## Segurança nos logs

Não publique `.env`, dump do ambiente, configuração Docker ou logs com tokens. Use
o `request_id` (campo `X-Request-ID` sanitizado) para correlacionar requisições sem
divulgar credenciais. Se o socket Docker não está acessível, recupere o ambiente —
a aplicação não pode corrigir permissões do host durante runtime.
