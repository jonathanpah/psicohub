# Glossario - Termos do Dominio

Este documento define os termos especificos da psicologia clinica usados no PsicoHub.

> **IMPORTANTE:** Todos os desenvolvedores devem conhecer estes termos para manter consistencia no codigo e na UI.

---

## Termos de Atendimento

### Sessao (Session)
Encontro entre psicologo e paciente com duracao definida (padrao 50 min).
- **Inclui:** Consultas presenciais, online, avaliacoes
- **NAO inclui:** Contatos por telefone/WhatsApp, trocas de mensagens
- **No codigo:** `Session`, `dateTime`, `duration`

### Atendimento
Sinonimo de sessao, usado na UI em portugues.
- **Na UI:** "Novo Atendimento", "Historico de Atendimentos"
- **No codigo:** Sempre usar `Session`

### Consulta
Sinonimo de sessao, termo mais formal.
- **Uso:** Documentos, recibos, termos legais
- **No codigo:** Sempre usar `Session`

---

## Status de Sessao

### Agendada (SCHEDULED)
Sessao marcada, aguardando confirmacao ou realizacao.

### Confirmada (CONFIRMED)
Paciente confirmou presenca (opcional no fluxo).

### Realizada (COMPLETED)
Sessao aconteceu. Permite registro de evolucao clinica.

### Cancelada (CANCELLED)
Sessao nao acontecera. Motivo deve ser registrado.
- **Regra:** Pagamento vinculado tambem e cancelado.

### Falta (NO_SHOW)
Paciente nao compareceu sem aviso previo.
- **Regra:** Pagamento permanece PENDING (pode ser cobrado).
- **UI:** Exibir como "Falta" ou "Nao compareceu"

---

## Termos de Paciente

### Paciente (Patient)
Pessoa que recebe atendimento psicologico.
- **Inclui:** Adultos, criancas, adolescentes
- **No codigo:** `Patient`, `patientId`

### Responsavel (Guardian)
Adulto legalmente responsavel por paciente menor ou incapaz.
- **Campos:** `guardian`, `guardianPhone`, `guardianCpf`, `guardianRelation`
- **Segundo responsavel:** `guardian2`, `guardian2Phone`, etc.

### Relacao (guardianRelation)
Vinculo do responsavel com o paciente.
- **Valores comuns:** Mae, Pai, Avo/Avo, Tio/Tia, Tutor Legal

---

## Termos Financeiros

### Plano de Preco (PricingPlan)
Modelo de cobranca definido para um paciente.
- **Tipos:** `SESSION` (por sessao) ou `PACKAGE` (pacote)

### Pacote de Sessoes (SessionPackage)
Conjunto pre-pago de sessoes com desconto.
- **Campos:** `totalSessions`, `pricePerSession`
- **Status:** `ACTIVE`, `COMPLETED`, `CANCELLED`

### Pagamento (Payment)
Registro financeiro vinculado a uma sessao.
- **Status:** `PENDING`, `PAID`, `CANCELLED`
- **1:1 com Session:** Cada sessao tem exatamente um pagamento.

### Sessao Cortesia (isCourtesy)
Sessao sem cobranca (ex: primeira consulta, reposicao).
- **No codigo:** `isCourtesy: true`
- **Pagamento:** Criado com `amount: 0`

---

## Termos Clinicos

### Evolucao Clinica (clinicalNotes)
Registro tecnico do psicologo sobre a sessao.
- **Conteudo:** Observacoes, temas abordados, progressos
- **Privacidade:** Dado sensivel, acesso restrito
- **LGPD:** Log obrigatorio ao visualizar

### Anamnese (ANAMNESIS)
Entrevista inicial para coleta de historico do paciente.
- **Documento:** Tipo `ANAMNESIS` em `DocumentCategory`

### Laudo Psicologico (PSYCHOLOGICAL_REPORT)
Documento formal com avaliacao e conclusoes.
- **Regulamentacao:** CFP (Conselho Federal de Psicologia)

### Avaliacao Psicologica (PSYCHOLOGICAL_EVALUATION)
Processo de aplicacao de testes e analises.
- **Documento:** Tipo `PSYCHOLOGICAL_EVALUATION`

---

## Termos Documentais

### Termo de Consentimento (CONSENT_TERM)
Autorizacao do paciente/responsavel para tratamento.

### Termo de Sigilo (CONFIDENTIALITY_TERM)
Acordo de confidencialidade sobre informacoes da terapia.

### Autorizacao do Responsavel (GUARDIAN_AUTHORIZATION)
Documento para atendimento de menores.

### Contrato (CONTRACT)
Acordo formal de prestacao de servicos.

---

## Termos Regulatorios

### CRP (Conselho Regional de Psicologia)
Registro profissional obrigatorio para psicologos.
- **Formato:** CRP XX/XXXXX (estado/numero)
- **No codigo:** `User.crp`

### LGPD (Lei Geral de Protecao de Dados)
Lei brasileira de privacidade de dados.
- **Impacto:** Logs de auditoria, mascaramento, consentimento

### CFP (Conselho Federal de Psicologia)
Orgao regulador da profissao no Brasil.

---

## Termos de Recorrencia

### Sessao Recorrente
Sessoes que se repetem automaticamente (semanal, quinzenal, mensal).
- **No codigo:** `recurrencePattern`, `recurrenceGroupId`

### Grupo de Recorrencia (recurrenceGroupId)
Identificador que agrupa sessoes da mesma serie recorrente.
- **Formato:** `AGAAMMDDHHMMSS` (ex: `AG2501101430`)

### Indice de Recorrencia (recurrenceIndex)
Posicao da sessao dentro da serie (1, 2, 3...).

---

## Abreviacoes Comuns

| Sigla | Significado |
|-------|-------------|
| CRP | Conselho Regional de Psicologia |
| CFP | Conselho Federal de Psicologia |
| LGPD | Lei Geral de Protecao de Dados |
| CPF | Cadastro de Pessoa Fisica |
| CNPJ | Cadastro Nacional de Pessoa Juridica |
