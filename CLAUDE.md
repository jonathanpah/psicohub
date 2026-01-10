# CLAUDE.md - Instrucoes para IAs

## LEITURA OBRIGATORIA

Antes de qualquer modificacao, entenda o contexto:
- **Projeto:** PsicoHub - SaaS para psicologos e clinicas de psicologia
- **Publico:** Psicologos brasileiros (LGPD obrigatoria)
- **Stack:** Next.js 16 + React 19 + TypeScript + Prisma + PostgreSQL
- **Idioma:** Portugues brasileiro (commits, UI, variaveis em ingles)

---

## Estrutura do Projeto

```
psicohub/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login e registro
│   │   ├── (dashboard)/      # Area logada
│   │   │   ├── agenda/       # Calendario de sessoes
│   │   │   ├── dashboard/    # Visao geral
│   │   │   ├── financeiro/   # Pagamentos e recibos
│   │   │   ├── pacientes/    # Gestao de pacientes
│   │   │   ├── novo-atendimento/  # Agendar sessao
│   │   │   └── perfil/       # Configuracoes do usuario
│   │   └── api/              # 25 endpoints REST
│   ├── components/
│   │   ├── layout/           # Header, Sidebar
│   │   └── ui/               # Componentes Radix + Tailwind
│   ├── lib/                  # Utilitarios criticos (ver abaixo)
│   └── __tests__/            # Testes Vitest
├── prisma/
│   └── schema.prisma         # 14 modelos + enums
└── Docs/
    └── GLOSSARY.md           # Termos do dominio
```

---

## AREAS CRITICAS - Cuidado Redobrado

Estas areas afetam seguranca e conformidade LGPD. Modificar com cautela:

| Arquivo | Funcao | Risco |
|---------|--------|-------|
| `src/lib/auth.ts` | Autenticacao NextAuth | Seguranca |
| `src/lib/rate-limit.ts` | Protecao contra brute force | Seguranca |
| `src/lib/audit.ts` | Logs LGPD obrigatorios | Conformidade |
| `src/lib/data-masking.ts` | Mascaramento CPF/dados | Privacidade |
| `src/lib/sanitize.ts` | Prevencao XSS/injection | Seguranca |
| `src/middleware.ts` | Protecao de rotas | Seguranca |
| `prisma/schema.prisma` | Modelo de dados | Integridade |

**Regra:** Nao modifique estes arquivos sem autorizacao explicita.

---

## Padroes do Projeto

### Commits (Conventional Commits em portugues)
```
feat: adiciona filtro por data no calendario
fix: corrige calculo de sessoes do pacote
fix(critical): corrige exclusao em cascata
```

### Nomenclatura
- **Variaveis/funcoes:** camelCase em ingles (`patientId`, `fetchSessions`)
- **Componentes:** PascalCase (`PatientCard`, `SessionModal`)
- **Arquivos:** kebab-case (`patient-card.tsx`, `session-modal.tsx`)
- **Rotas API:** kebab-case (`/api/patients`, `/api/sessions`)

### Banco de Dados
- Usar Prisma Client (`import { prisma } from '@/lib/prisma'`)
- Sempre incluir `userId` em queries (multi-tenant)
- Transacoes para operacoes relacionadas

### UI
- Componentes em `src/components/ui/` (Radix + Tailwind)
- Toast via Sonner (`toast.success()`, `toast.error()`)
- Formularios com React Hook Form + Zod

---

## Glossario Rapido

Consulte `Docs/GLOSSARY.md` para detalhes. Termos essenciais:

| Termo no Codigo | Significado |
|-----------------|-------------|
| `Session` | Atendimento/consulta agendada |
| `Patient` | Paciente (pessoa em tratamento) |
| `SessionPackage` | Pacote de sessoes pre-pago |
| `PricingPlan` | Modelo de cobranca do paciente |
| `clinicalNotes` | Evolucao clinica (prontuario) |
| `NO_SHOW` | Falta do paciente |
| `guardian` | Responsavel legal (menores) |

---

## Fluxos Importantes

### Agendamento de Sessao
1. Criar `Session` com status `SCHEDULED`
2. Criar `Payment` vinculado com status `PENDING`
3. Se pacote: vincular `packageId` e incrementar `packageOrder`

### Sessao Recorrente
1. Gerar sessoes via `src/lib/recurrence.ts`
2. Todas recebem mesmo `recurrenceGroupId`
3. Cada uma tem `recurrenceIndex` sequencial

### Exclusao de Paciente
- Cascata automatica: Sessions -> Payments, Documents, Packages
- Auditoria obrigatoria via `logPatientDelete()`

---

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev

# Banco de dados
npx prisma studio          # UI do banco
npx prisma db push         # Sync schema
npx prisma generate        # Gerar client

# Testes
npm run test               # Vitest

# Build
npm run build
```

---

## Checklist Antes de Commitar

- [ ] Codigo compila sem erros (`npm run build`)
- [ ] Nao quebrou autenticacao/rate-limit
- [ ] Queries incluem filtro por `userId`
- [ ] Dados sensiveis estao mascarados na UI
- [ ] Commit segue Conventional Commits
