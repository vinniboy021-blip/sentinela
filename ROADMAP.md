# Roadmap

Este documento descreve evoluções planejadas para o OSINT Tracker. Nenhum item representa um compromisso de entrega; priorização depende de feedback da comunidade e recursos disponíveis.

## Curto prazo

### Conectores adicionais
- **Shodan** — consulta de hosts e banners via API oficial com chave do operador
- **Have I Been Pwned** — verificação de e-mails em vazamentos públicos conhecidos
- **VirusTotal** — análise de URLs, domínios e hashes via API pública (readonly)
- **Censys** — pesquisa de certificados e hosts com autenticação OAuth2

### Interface
- Paginação interativa nas listagens (atualmente exibe os primeiros 50 registros)
- Filtro por investigação ativo persistido no URL para compartilhamento
- Visualização do grafo com posicionamento por força (force-directed layout)
- Exibição de diff de observações alteradas entre coletas consecutivas

### Operacional
- Webhook de saída para Slack/Teams ao disparar alerta crítico
- Suporte a S3/MinIO como backend de evidências (além do volume local)
- Rotação assistida de `CONNECTOR_SECRET_KEY` via CLI

## Médio prazo

### Colaboração
- Comentários e anotações em observações individuais
- Notificações in-app (além de e-mail e webhook)
- Auditoria de acesso por colaborador exportável em CSV

### Inteligência
- Enriquecimento automático de indicadores com MISP (opcional, self-hosted)
- Correlação temporal: agrupamento de observações por janela de tempo
- Sugestão de entidade por NER (Named Entity Recognition) via Ollama

### Infraestrutura
- Suporte a PostgreSQL com réplica de leitura para queries de relatório
- Health check HTTP no worker Celery (endpoint `/worker/health`)
- Métricas por conector: latência, taxa de erro e quota restante

## Longo prazo

- **Alta disponibilidade**: múltiplas instâncias da API com sessões compartilhadas via Redis
- **Exportação STIX 2.1**: relatórios em formato interoperável com outras plataformas de CTI
- **Plugins de conector**: interface para adicionar conectores externos sem modificar o core
- **Auditoria externa**: pentest independente e publicação de relatório de segurança

## Fora do escopo

Os itens abaixo **não serão implementados** por razões éticas, legais ou de segurança:

- Scraping de redes sociais sem API oficial
- Autenticação em serviços de terceiros em nome do usuário
- Coleta de dados de pessoas físicas sem autorização documentada
- Funcionalidades de ataque, bypass de autenticação ou evasão
- Integração com serviços de vigilância em massa
