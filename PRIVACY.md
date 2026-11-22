# Privacidade e princípios da LGPD

## Antes de coletar

Defina **finalidade**, **escopo**, **necessidade** e **base jurídica** para cada investigação
antes de coletar. Registre essas informações nos campos `objective`, `scope` e
`authorization_basis` ao criar a investigação — eles fazem parte do log de auditoria.

## Minimização de dados

Colete somente os campos necessários à finalidade declarada:

- Evite capturar dados de contato pessoal de registros RDAP (nome, e-mail, telefone de
  pessoas físicas) quando o objetivo é apenas verificar titularidade de domínio.
- Não colete mensagens privadas, geolocalização pessoal ou dados de saúde.
- Não faça enriquecimento pessoal indiscriminado (correlacionar todas as fontes disponíveis
  sobre uma pessoa sem necessidade demonstrada).
- Perfis com nomes semelhantes não devem ser automaticamente tratados como a mesma pessoa;
  correlação automática é **sugestão** — requer revisão humana com justificativa explícita.

## Controle de acesso

- Use associação de membros e papéis (`editor`/`viewer`) para limitar quem acessa cada
  investigação.
- Evidências e seus metadados exigem autenticação e autorização pela investigação.
- Restrinja o papel `admin` ao mínimo necessário.
- Toda ação de escrita é registrada em `audit_logs` com usuário, objeto e investigação.

## Exportações e compartilhamento

Downloads e exportações (JSON/CSV/Markdown) podem conter dados pessoais. Trate o arquivo
exportado sob a mesma política de acesso da investigação original. Não publique evidências
ou relatórios em canais não autorizados.

## Retenção e expurgo

Defina `retention_until` por finalidade. Apague dados cuja necessidade terminou — incluindo
objetos de evidência armazenados e cópias de backup conforme sua política de retenção.

A política de retenção não fornece base legal automática; ela deve ser definida e documentada
pelo operador. A execução do expurgo (`make purge`) remove registros com `retention_until`
vencido do banco e do storage. Uma remoção lógica na API **não** apaga automaticamente
backups físicos ou discos — considere isso ao definir procedimentos de eliminação.

## IA local

A análise de IA (Ollama) é desabilitada por padrão (`AI_ENABLED=false`), evitando
dependência de serviço externo. Ao habilitar, o operador deve revisar quais dados serão
enviados ao endpoint e suas condições de processamento. O software não envia dados a
serviços de IA automaticamente.

Ao apontar `OLLAMA_URL` para um endpoint externo (não o serviço interno Docker), trate
os dados enviados como dados pessoais que saem do seu controle — avalie a base legal e
documente o tratamento.

## Direitos dos titulares

Documente procedimentos para:
- **Acesso**: como um titular pode solicitar consulta aos dados coletados sobre ele.
- **Correção**: como corrigir dados imprecisos.
- **Oposição/eliminação**: como atender solicitações de remoção.
- **Incidentes**: como notificar a ANPD e os titulares em caso de violação.

O software fornece as ferramentas técnicas (exclusão de evidências, exclusão de
observações, controle de acesso); as políticas e os procedimentos organizacionais
são responsabilidade do operador.

## Limites de uso

Não use esta plataforma para:
- Vigilância indiscriminada de pessoas sem base jurídica
- Decisões automatizadas sobre pessoas sem revisão humana
- Correlação de dados além do escopo declarado na investigação
- Contorno de autenticação, CAPTCHA ou restrições de privacidade de plataformas
