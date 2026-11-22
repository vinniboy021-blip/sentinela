# Contribuindo

Contribuições são distribuídas sob MIT. Discuta alterações que mudem contratos ou esquema
antes de implementar; preserve fontes autorizadas e mantenha compatibilidade de dados.
Não inclua credenciais reais, dados pessoais desnecessários ou fixtures aparentando ser
coletas reais.

## Configuração do ambiente

```bash
make install   # instala dependências Python (.venv) e Node.js (node_modules)
make lint      # Ruff + ESLint
make typecheck # mypy + tsc
make test      # pytest com PostgreSQL/Redis reais
```

## Padrões de código

### Backend (Python)

- **Migrações**: qualquer alteração de banco requer migração Alembic explícita com
  `upgrade` e `downgrade` funcionais. Não use `Base.metadata.create_all` em migrações.
- **Consultas**: SQLAlchemy 2.x `select()` — não use `db.query()`.
- **Tipos**: anotações em todas as funções públicas. `mypy` strict deve passar.
- **Testes**: cobrir PostgreSQL com constraints, concorrência e casos de erro.
  Acesso a investigações de outro usuário deve retornar 403 ou 404.

### Conectores

Novos conectores precisam de:
1. Contrato `Connector` em `app/connectors/base.py`
2. Validação de consulta e configuração
3. Proveniência (`source_url`) em toda observação
4. Respeito a rate limit, timeout e backoff
5. Proteção SSRF via `validate_public_url()` e `PublicNetworkBackend`
6. Fixtures explicitamente identificadas como teste (`entity_type=test`)
7. Testes de erro, timeout, autorização e normalização

Não altere o núcleo de agendamento para cada nova fonte.

### Frontend (TypeScript)

- TypeScript strict; sem `any` explícito.
- Handlers de formulário com `useCallback` e dependências corretas.
- Estados `loading` e `error` em todo componente que faz `fetch`.
- Mensagens de erro com `role="alert"` para acessibilidade.
- Paginação explícita em listagens: `?skip=0&limit=50`.
- Interface em português; strings preparadas para internacionalização.

### Autorização

Toda nova rota deve:
- Verificar o papel do usuário (admin/analyst/viewer)
- Verificar o escopo da investigação quando aplicável
- Testar resposta 403/404 para usuário sem acesso e para membro de outra investigação

## Migrações

```bash
docker compose exec api alembic revision --autogenerate -m "descrição"
docker compose exec api alembic upgrade head
docker compose exec api alembic downgrade -1
docker compose exec api alembic upgrade head
```

Revise o arquivo gerado; `--autogenerate` não captura todas as mudanças.

## Documentação

Atualize ao submeter:
- `CHANGELOG.md`: seção `Unreleased` com descrição da mudança
- Documento relevante (`API.md`, `CONNECTORS.md`, etc.) se houver mudança de contrato
- `docs/IMPLEMENTATION_MATRIX.md` se um requisito for atendido ou alterado
- `docs/VALIDATION.md` com evidência do check executado

Não declare prontidão de produção com checks não executados.

## Problemas de segurança

Veja [SECURITY.md](SECURITY.md) para o processo de reporte responsável.
