# Changelog

Todas as alteracoes notaveis serao documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

### Added
- Documentacao CLAUDE.md para instrucoes de IAs (2026-01-10)
- Glossario de termos do dominio em Docs/GLOSSARY.md (2026-01-10)

---

## [0.1.0-beta.3] - 2026-01-10

### Added
- Exibicao de primeiro e ultimo nome no calendario (e686fd6)
- Codigo automatico AGAAMMDDHHMMSS para todos os agendamentos (8fc3d32)
- Agendamento recorrente na pagina Novo Atendimento (124b8eb)

### Fixed
- Correcao de badges duplicadas em sessoes recorrentes de pacotes (3a352a5)
- **CRITICO:** Correcao de exclusao em cascata de sessoes e pagamentos (17f7b77)
- Correcao de fuso horario e quantidade duplicada na recorrencia (dff0a98)
- Schema de validacao de pacientes aceita null em campos opcionais (0123138)
- Exibir valor das faltas no Historico de Sessoes (10cc048)
- NO_SHOW (falta) nao cancela mais o pagamento (28e272e)

---

## [0.1.0-beta.2] - 2025-12-28

### Added
- Correcoes de seguranca e melhorias gerais (331d208)

### Fixed
- Adicionado prisma generate ao script de build para deploy Vercel (6733f3b)

---

## [0.1.0-beta.1] - 2025-12-27

### Added
- **PsicoHub Beta 1** - Versao completa para testes (e80e221)
  - Autenticacao com NextAuth (login/registro)
  - Gestao completa de pacientes (CRUD)
  - Agendamento de sessoes com deteccao de conflitos
  - Controle de pagamentos e recibos
  - Pacotes de sessoes com rastreamento
  - Upload de documentos (Cloudinary)
  - Dashboard e calendario
  - Area financeira
  - Conformidade LGPD (audit logs, mascaramento)
  - Rate limiting contra abusos
  - Dark mode

- Melhorias no cadastro e perfil do psicologo (2ff5257)

---

## [0.0.1] - 2025-12-XX

### Added
- Commit inicial: Fundacao do SaaS Psicohub (ca2e61d)
- Estrutura Next.js 16 + React 19 + TypeScript
- Configuracao Prisma + PostgreSQL
- Setup inicial de componentes UI

---

## Legenda

- **Added:** Novas funcionalidades
- **Changed:** Alteracoes em funcionalidades existentes
- **Fixed:** Correcoes de bugs
- **Removed:** Funcionalidades removidas
- **Security:** Correcoes de seguranca
- **CRITICO:** Correcoes urgentes que afetam integridade de dados
