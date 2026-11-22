# Implantação e manutenção

## HTTPS em servidor próprio

Use um domínio sob seu controle com DNS apontando ao host. Disponibilize as portas 80 e 443
para o Caddy obter certificados via ACME. Não publique PostgreSQL, Redis ou a porta interna
da API diretamente ao host. Gere segredos com `setup_env.py`, configure `HOSTNAME` e
`ACME_EMAIL` no `.env`, e revise `CORS_ORIGINS` e `TRUSTED_HOSTS`.

```bash
python3 scripts/setup_env.py
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose exec api python -m app.cli create-admin --email administrador@example.org
```

O override de produção ativa `COOKIE_SECURE=true`, `ENVIRONMENT=production` e expõe apenas
o Caddy nas portas públicas. O Compose >= 2.24.4 é necessário para a diretiva `!reset`.

Configure firewall no host e mantenha atualizações do SO. Para releases reproduzíveis, fixe
digests das imagens-base e mantenha artefatos assinados conforme seu processo. Não há claim
de supply chain completa nesta versão.

### Headers de segurança (Caddy)

O `Caddyfile` configura automaticamente:

| Header | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | geolocation, camera, mic, payment, usb desabilitados |
| `Content-Security-Policy` | `default-src 'self'`; restringe scripts, estilos, frames |
| `Server` | removido |

O Next.js também aplica esses headers via `next.config.ts` como camada adicional.

### Uvicorn e proxy

O backend é iniciado com `--forwarded-allow-ips 127.0.0.1`. Uvicorn só confia em
`X-Forwarded-For` recebido do proxy Caddy (que conecta via loopback na rede Docker).
O `_RealIPMiddleware` em `main.py` faz a segunda verificação: só propaga o IP real
quando o peer TCP direto é loopback ou RFC-1918. Nunca configure `--forwarded-allow-ips *`
em produção.

## Backup e recuperação

```bash
make backup
# Antes de restaurar, revise o diretório e o manifest.json.
make restore BACKUP=/caminho/do/backup
```

O backup pausa web, API, workers e Beat; executa `pg_dump -Fc`; arquiva o volume de
evidências e grava hashes SHA-256 de todos os arquivos. Os serviços retornam após a
conclusão do backup ou após falha — monitore os logs.

Preserve segredos (`.env`, `CONNECTOR_SECRET_KEY`) em armazenamento separado protegido.
Backups contêm configurações de conectores criptografadas com `CONNECTOR_SECRET_KEY`;
sem a chave original, as credenciais são irrecuperáveis.

Restauração: verifica hashes SHA-256, pausa os serviços escritores, substitui banco e
evidências, reaplica migrações Alembic e reinicia. Falha mantém escritores parados para
evitar uso de dados parcialmente restaurados. `pg_restore --clean` é destrutivo —
teste periodicamente em ambiente isolado.

Para usar `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` com os scripts de
backup/restauração, exporte a variável no ambiente antes de executar; em Windows o
separador de paths é ponto-e-vírgula.

## Observabilidade

```bash
docker compose --profile observability up -d prometheus
```

Prometheus fica apenas no loopback na porta 9090 e consulta a API internamente.
O Caddy bloqueia `/metrics*` e `/api/metrics*` na borda pública.

Monitore: `GET /ready` (PostgreSQL e Redis), backlog de jobs, dead letters,
tempo de resposta das fontes, 429, espaço do volume de evidências e persistência do Redis.
Um worker saudável no nível do processo pode estar incapaz de coletar uma fonte específica;
verifique as execuções reais nos logs.

## Migrações

As migrações Alembic são aplicadas pelo serviço `migrate` antes de liberar API e workers.
A migração inicial (`0001_initial`) usa DDL explícito com todas as tabelas e índices —
não mais `Base.metadata.create_all`. Novas alterações de esquema devem ser sempre
migrações Alembic explícitas para garantir `downgrade` reproduzível.

```bash
make migrate           # aplica migrações pendentes
docker compose exec api alembic current
docker compose exec api alembic history
```

## Atualização

1. Faça backup completo.
2. Leia o CHANGELOG para verificar migrações ou mudanças de configuração.
3. Teste o upgrade em um clone do backup.
4. Execute `docker compose up -d --build`.

Migrações passam automaticamente pelo serviço isolado. Não execute mais de um Beat por
stack. Para ampliar workers, meça rate limits reais, conexões PostgreSQL e tamanho das filas
antes — não há configuração de cluster/HA incluída.
