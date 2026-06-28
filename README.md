# faixappreta

Sistema SaaS de gestao para academias (CTs) de Jiu-Jitsu Brasileiro. Plataforma multi-tenant com paineis separados para super admin, administradores/professores e alunos.

**Stack**: Next.js 14 + Prisma 7 + Turso (libsql) + NextAuth + Tailwind CSS

---

## Sumario

**Parte Tecnica**
1. [Requisitos](#requisitos)
2. [Setup Local](#setup-local)
3. [Scripts Disponiveis](#scripts-disponiveis)
4. [Variaveis de Ambiente](#variaveis-de-ambiente)
5. [Banco de Dados e Prisma](#banco-de-dados-e-prisma)
6. [Turso (Producao)](#turso-producao)
7. [Deploy (GCP Cloud Run)](#deploy-gcp-cloud-run)
8. [CI/CD (GitHub Actions)](#cicd-github-actions)
9. [Estrutura do Projeto](#estrutura-do-projeto)

**Parte Funcional**
10. [Arquitetura Multi-Tenant](#arquitetura-multi-tenant)
11. [Autenticacao e Autorizacao](#autenticacao-e-autorizacao)
12. [Papeis de Usuario](#papeis-de-usuario)
13. [Cadastro e Aprovacao de Alunos](#cadastro-e-aprovacao-de-alunos)
14. [Planos de Aluno](#planos-de-aluno)
15. [Solicitacao de Upgrade de Plano](#solicitacao-de-upgrade-de-plano)
16. [Aulas em Grupo (Coletivas)](#aulas-em-grupo-coletivas)
17. [Aulas Particulares (Slots Privados)](#aulas-particulares-slots-privados)
18. [Sistema de Agendamento](#sistema-de-agendamento)
19. [Cancelamento de Agendamentos](#cancelamento-de-agendamentos)
20. [Reagendamento de Aulas Particulares](#reagendamento-de-aulas-particulares)
21. [Chamada e Check-in](#chamada-e-check-in)
22. [Creditos Mensais](#creditos-mensais)
23. [Sistema de Graduacao](#sistema-de-graduacao)
24. [Ranking de Presencas](#ranking-de-presencas)
25. [Relatorios de Frequencia](#relatorios-de-frequencia)
26. [Gestao de Professores](#gestao-de-professores)
27. [Eventos](#eventos)
28. [Notificacoes](#notificacoes)
29. [Timer de Tatame](#timer-de-tatame)
30. [Site Institucional](#site-institucional)
31. [Painel Super Admin](#painel-super-admin)
32. [Regras de Negocio (Resumo)](#regras-de-negocio-resumo)

---

# PARTE TECNICA

## Requisitos

- Node.js 20+
- npm

## Setup Local

```bash
# 1. Instalar dependencias
npm install

# 2. Gerar clientes Prisma (master + tenant)
npx prisma generate
npx prisma generate --schema=prisma/master.prisma

# 3. Configurar .env.local (ver secao Variaveis de Ambiente)
cp .env.local.example .env.local  # ou criar manualmente

# 4. Rodar em modo dev
npm run dev
```

### Acessando um tenant local

Tenants locais sao acessados via query param (nao por subdominio):

```
http://localhost:3000/login?tenant=teste-gracie
```

O banco SQLite local do tenant deve existir em `prisma/tenants/{slug}.db`.

### Acessando o site institucional local

```
http://localhost:3000/?site=1
```

## Scripts Disponiveis

| Script | Comando | Descricao |
|--------|---------|-----------|
| Dev | `npm run dev` | Servidor de desenvolvimento |
| Build | `npm run build` | Build de producao |
| Start | `npm start` | Inicia build de producao |
| Lint | `npm run lint` | ESLint |

### Scripts de Migracao (one-time)

```bash
# Migrar tenants existentes (adicionar isOwner, instructorId)
npx tsx scripts/migrate-existing-tenants.ts

# Migrar sistema de planos (ESSENCIAL/PRO/PREMIUM → COLETIVA/PARTICULAR)
npx tsx scripts/migrate-plans.ts
```

## Variaveis de Ambiente

### Desenvolvimento Local (`.env.local`)

```env
DATABASE_URL="file:./prisma/tenants/teste-gracie.db"
MASTER_DATABASE_URL="file:./prisma/master.db"
NEXTAUTH_SECRET="dev-secret-faixappreta-local"
NEXTAUTH_URL="http://localhost:3000"
```

### Producao

| Variavel | Descricao |
|----------|-----------|
| `MASTER_TURSO_DATABASE_URL` | URL do banco master no Turso (`libsql://...`) |
| `MASTER_TURSO_AUTH_TOKEN` | Token de autenticacao do master DB |
| `TURSO_API_TOKEN` | Token da Platform API do Turso (provisionar novos BDs) |
| `TURSO_ORG_SLUG` | Slug da organizacao no Turso |
| `SUPER_ADMIN_JWT_SECRET` | Secret para JWT do super admin |
| `NEXTAUTH_SECRET` | Secret do NextAuth |
| `NEXTAUTH_URL` | URL base da aplicacao |
| `GCP_SA_KEY` | JSON key da service account GCP (usado no CI/CD) |

## Banco de Dados e Prisma

### Arquitetura de Bancos

O sistema usa **dois schemas Prisma** e um banco separado por tenant:

| Schema | Arquivo | Output | Conteudo |
|--------|---------|--------|----------|
| Master | `prisma/master.prisma` | `src/generated/prisma-master/` | Tenant, SuperAdmin |
| Tenant | `prisma/schema.prisma` | `src/generated/prisma/` | User, Booking, GroupClass, etc. |

### Gerando os Clientes

```bash
# Ambos precisam ser gerados sempre que o schema mudar
npx prisma generate                          # tenant
npx prisma generate --schema=prisma/master.prisma  # master
```

### Cuidados com Prisma + Turso

- Os adapters (`@prisma/adapter-libsql`, `@prisma/adapter-better-sqlite3`) **devem ser importados com `require()`**, nao `import`. Isso evita erros de tipo do TypeScript com os adapters.
- O arquivo `prisma/tenant-schema.sql` contem o DDL raw usado para provisionar novos bancos de tenant via Turso. Ele deve ser mantido **sincronizado manualmente** com `prisma/schema.prisma` — qualquer alteracao no schema Prisma deve ser refletida nesse SQL.
- Nao usamos `prisma migrate` em producao. Migracoes de tenant sao feitas via SQL raw executado pelo `src/lib/migrate-tenant.ts`.

### Adicionando Colunas/Tabelas a um Tenant

1. Altere `prisma/schema.prisma`
2. Atualize `prisma/tenant-schema.sql` com o mesmo DDL
3. Rode `npx prisma generate`
4. Crie um script de migracao em `scripts/` para alterar tenants existentes (usando `ALTER TABLE`)
5. Execute o script: `npx tsx scripts/nome-do-script.ts`

### Banco Local (Desenvolvimento)

- Master: `prisma/master.db` (SQLite)
- Tenant: `prisma/tenants/{slug}.db` (SQLite por tenant)
- Adaptador: `better-sqlite3`

### Banco Producao (Turso)

- Master: Turso database acessada via `MASTER_TURSO_DATABASE_URL`
- Tenant: Um Turso database por CT, criado automaticamente via Platform API
- Adaptador: `@prisma/adapter-libsql`

## Turso (Producao)

### Como Funciona

Cada CT possui seu proprio banco no Turso. O provisionamento acontece automaticamente ao criar um CT pelo painel super admin:

1. `turso-api.ts` chama `POST /v1/organizations/{org}/databases` para criar o banco
2. Gera um auth token full-access para o banco
3. Executa o DDL de `prisma/tenant-schema.sql` via `@libsql/client`
4. Cria o usuario admin e seeds de graduacao
5. Salva a URL e token no registro do Tenant no master DB

### Cuidados com Turso

- **Nao deletar bancos manualmente** no dashboard do Turso sem remover o tenant correspondente no master DB
- **Tokens de auth** sao full-access e ficam armazenados no master DB — proteger o acesso ao master
- **Nomes dos bancos** seguem o padrao `faixappreta-{slug}`
- **Grupo**: todos os bancos sao criados no grupo `default`
- Em caso de problemas com um tenant, verificar primeiro se o banco existe e se o token e valido no dashboard do Turso

## Deploy (GCP Cloud Run)

### Infraestrutura

- **Projeto GCP**: `faixappreta`
- **Regiao**: `us-central1`
- **Servico**: `faixappreta`
- **Artifact Registry**: `us-central1-docker.pkg.dev/faixappreta/faixappreta/app`
- **Uploads de arquivo**: GCS bucket `faixappreta-uploads`

### Build Docker Manual

```bash
# Build
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/faixappreta/faixappreta/app:latest .

# Push
docker push us-central1-docker.pkg.dev/faixappreta/faixappreta/app:latest

# Deploy
gcloud run deploy faixappreta \
  --image us-central1-docker.pkg.dev/faixappreta/faixappreta/app:latest \
  --region us-central1
```

### Dockerfile (3 estagios)

1. **deps**: Instala dependencias com `npm ci` (inclui build tools para modulos nativos)
2. **builder**: Gera clientes Prisma e roda `next build`
3. **runner**: Imagem minima com `standalone` output, porta 3000

## CI/CD (GitHub Actions)

Pipeline em `.github/workflows/deploy.yml`, disparado em push na `main`:

**Job 1 — check** (Lint & Type Check)
- `npm ci` → `prisma generate` (ambos schemas) → `tsc --noEmit` → `npm run lint`

**Job 2 — deploy** (Build & Deploy, depende de check)
- Autentica no GCP → Build Docker → Push Artifact Registry → `gcloud run deploy`

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/              # Login e registro de tenant
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Areas autenticadas
│   │   ├── admin/           # Painel do professor/admin
│   │   │   ├── agenda/
│   │   │   ├── approvals/
│   │   │   ├── attendance/
│   │   │   ├── belt-requirements/
│   │   │   ├── events/
│   │   │   ├── group-classes/
│   │   │   ├── notifications/
│   │   │   ├── plans/
│   │   │   ├── professors/
│   │   │   ├── ranking/
│   │   │   ├── roll-call/
│   │   │   ├── slots/
│   │   │   ├── students/
│   │   │   └── timer/
│   │   └── student/         # Painel do aluno
│   │       ├── account/
│   │       ├── agenda/
│   │       ├── booking/
│   │       ├── graduations/
│   │       └── plans/
│   ├── (super-admin)/       # Painel super admin
│   │   └── super-admin/
│   │       ├── login/
│   │       ├── create/
│   │       └── [id]/edit/
│   ├── api/                 # Rotas de API
│   └── site/                # Site institucional
├── components/              # Componentes React
│   └── ui/                  # Primitivos de UI
├── generated/               # Clientes Prisma gerados
│   ├── prisma/              # Tenant
│   └── prisma-master/       # Master
└── lib/                     # Utilitarios e configuracao
    ├── auth.ts              # NextAuth config
    ├── super-admin-auth.ts  # JWT super admin
    ├── turso-api.ts         # Turso Platform API
    ├── tenant-prisma.ts     # Cache de Prisma client por tenant
    ├── prisma-master.ts     # Singleton master DB
    ├── request-prisma.ts    # Helper para API routes
    ├── migrate-tenant.ts    # Provisionamento de tenant
    ├── validations.ts       # Schemas Zod
    └── utils.ts             # Constantes e helpers
prisma/
├── schema.prisma            # Schema do tenant
├── master.prisma            # Schema do master
├── tenant-schema.sql        # DDL raw para provisionar tenants
└── tenants/                 # Bancos SQLite locais (dev)
scripts/                     # Scripts de migracao one-time
```

---

# PARTE FUNCIONAL

## Arquitetura Multi-Tenant

O sistema opera com um **banco master** e **um banco por tenant (CT)**.

### Banco Master
Armazena informacoes dos tenants e super admins:
- **Tenant**: nome, slug, logo, cores (primaria/secundaria), dados do admin, URL do banco Turso, feature flags, status ativo/inativo
- **SuperAdmin**: email e senha hash para acesso ao painel super admin

### Banco do Tenant
Cada CT possui seu proprio banco com todos os dados operacionais: usuarios, aulas, agendamentos, graduacoes, planos, etc.

### Roteamento de Tenant
- **Producao**: subdominio `{slug}.faixappreta.com.br`
- **Desenvolvimento**: query param `?tenant={slug}`
- O middleware extrai o slug e injeta o contexto do tenant nas requisicoes

## Autenticacao e Autorizacao

### Autenticacao de Tenant (Alunos e Admins)
- Provider de credenciais do NextAuth (email + senha + tenantSlug)
- Estrategia JWT com dados do usuario na sessao (role, studentType, belt, etc.)
- Senha minima: 6 caracteres
- Hash com bcryptjs (10 rounds)

### Autenticacao Super Admin
- JWT gerado via `jose`, armazenado em cookie httpOnly `super-admin-token`
- Expiracao: 24 horas

### Protecao de Rotas (Middleware)

| Rota | Requisito |
|------|-----------|
| `/super-admin/*` | Cookie `super-admin-token` com JWT valido |
| `/admin/*` | Sessao NextAuth com role=ADMIN |
| `/student/*` | Sessao NextAuth com role=STUDENT |
| `/site/*` | Publico |
| `/login`, `/register` | Publico |

## Papeis de Usuario

### STUDENT (Aluno)
- Papel padrao para novos cadastros
- Acessa agenda, agendamentos, perfil, graduacoes, ranking
- Pode agendar aulas conforme seu plano

### ADMIN (Professor/Administrador)
- Gerencia alunos, aulas, agenda, chamada, graduacoes
- Pode agendar aulas em nome de alunos (sem restricoes de horario)
- Flag `isOwner` distingue o dono do CT dos demais professores

### Permissoes Exclusivas do Dono (isOwner)
- Adicionar, editar e remover professores
- Ver dados de todos os alunos (professores nao-donos veem apenas suas aulas/slots)

### SUPER_ADMIN
- Gerencia tenants (CTs) no painel super admin
- Provisiona novos bancos de dados
- Ativa/desativa tenants

## Cadastro e Aprovacao de Alunos

### Fluxo de Auto-Cadastro
1. Aluno acessa `/register?tenant={slug}`
2. Preenche: nome, email, senha, foto (opcional), modo kids (opcional)
3. Cadastro criado com status **PENDING**
4. Aluno recebe tela de confirmacao informando que aguarda aprovacao
5. Aluno com status PENDING nao consegue fazer login

### Aprovacao pelo Admin
- Admin visualiza alunos pendentes em `/admin/approvals`
- Pode **aprovar** (status → APPROVED) ou **rejeitar** (exclui o cadastro)
- Alunos criados diretamente pelo admin ja nascem com status APPROVED

## Planos de Aluno

Dois tipos de plano controlam o acesso as funcionalidades:

| Funcionalidade | COLETIVA | PARTICULAR |
|---------------|----------|------------|
| Aulas em grupo (coletivas) | Sim | Sim |
| Aulas semi-privadas | Nao | Sim |
| Aulas particulares | Nao | Sim |
| Ver slots particulares abertos | Nao | Sim |
| Reagendar aula particular | Nao | Sim |
| Creditos mensais | Nao | Sim |

### Feature Flag
- O recurso de planos pode ser ativado/desativado por tenant via flag `enablePlans` no master DB

### Modalidades
- **GRAPPLING** (padrao)
- **MMA**
- **GRAPPLING,MMA** (ambas)

### Modo Kids
- Flag `isKids` indica aluno infantil
- Faixas diferentes para kids (cinza, amarela, laranja, verde com subdivisoes)
- Filtros separados em aulas kids

## Solicitacao de Upgrade de Plano

1. Aluno cria solicitacao com: plano desejado, frequencia, detalhes, preco
2. Apenas **uma** solicitacao PENDING por aluno por vez (409 se ja existir)
3. Admin visualiza solicitacoes no dashboard
4. Admin pode **aprovar** (atualiza studentType do aluno) ou **rejeitar**
5. Contador de pendencias exibido no dashboard admin

## Aulas em Grupo (Coletivas)

### Tipos
- **GROUP** (Coletiva): disponivel para todos os alunos
- **SEMI_PRIVATE** (Semi-Privada): apenas alunos PARTICULAR

### Dados da Aula
- Nome, dia da semana (0-6), horario inicio/fim, capacidade, flag kids
- Professor responsavel (opcional)
- Turma fixa (`fixedRoster`): quando ativado, apenas alunos matriculados podem agendar

### Gestao (Admin)
- CRUD completo em `/admin/group-classes`
- Definir capacidade maxima por aula
- Associar professor responsavel
- Gerenciar matriculas em turmas fixas

## Aulas Particulares (Slots Privados)

### Conceitos
- **Slot vinculado** (bound): `userId` preenchido — aula fixa do aluno na grade
- **Slot aberto** (open): `userId` nulo — disponivel para qualquer aluno PARTICULAR agendar

### Dados do Slot
- Dia da semana, horario inicio/fim, disponibilidade (ativo/inativo)
- Aluno vinculado (opcional), professor responsavel (opcional)

### Regras de Criacao (Admin)
- Pode criar para multiplos alunos simultaneamente (array de userIds)
- Calculo automatico de horario fim se nao informado (inicio + 1 hora)
- Nao permite slots duplicados (mesmo dia + horario + aluno)
- Maximo um slot aberto por combinacao dia/horario

### Capacidade por Slot
- Admin pode adicionar ate **4 alunos** por slot particular por data
- Aluno agendando sozinho: **1 por slot aberto** por data (exclusivo)

## Sistema de Agendamento

### Agendamento de Aula Particular

| Regra | Detalhe |
|-------|---------|
| Antecedencia minima (aluno) | 6 horas antes do inicio da aula |
| Antecedencia minima (admin) | Sem restricao |
| Plano minimo | PARTICULAR (COLETIVA recebe 403) |
| Capacidade | 4 alunos/slot (admin), 1 aluno/slot (auto-agendamento) |
| Dia da semana | Data do booking deve corresponder ao dayOfWeek do slot |
| Creditos | Verificados se monthlyCredits > 0 |
| Duplicidade | Nao permite booking duplicado (mesmo aluno + slot + data) |

Quando um aluno agenda um slot aberto, um `RescheduleLog` tipo "BOOKING" e criado para notificar o admin.

### Agendamento de Aula em Grupo

| Regra | Detalhe |
|-------|---------|
| Antecedencia minima (aluno) | 1 hora antes do inicio |
| Antecedencia minima (admin) | Sem restricao |
| SEMI_PRIVATE | Apenas PARTICULAR |
| Capacidade | Limitada pelo campo capacity da aula |
| Dia da semana | Data deve corresponder ao dayOfWeek da aula |
| Duplicidade | Um booking por aluno por aula por data |

## Cancelamento de Agendamentos

### Aula Particular
- **Aluno**: minimo 12 horas de antecedencia
- **Admin**: sem restricao de horario
- Alunos **nao podem** cancelar diretamente slots vinculados (devem usar reagendamento)

### Aula em Grupo
- **Aluno**: minimo 1 hora de antecedencia
- **Admin**: sem restricao de horario

## Reagendamento de Aulas Particulares

### Regras
- Apenas para alunos reagendando seus **proprios slots vinculados** (slot.userId = aluno.id)
- Antecedencia minima: **12 horas** antes do horario original
- Novo slot deve estar disponivel (isAvailable=true) e nao ter booking na data alvo
- Dia da semana da nova data deve corresponder ao dayOfWeek do novo slot

### Fluxo (Transacao Atomica)
1. Exclui booking antigo
2. Cria registro `RescheduleLog` tipo "RESCHEDULE"
3. Cria novo booking no slot/data de destino

### Notificacao ao Admin
- Logs de reagendamento aparecem no dashboard admin
- Admin pode marcar como lido individualmente ou em lote
- Exibe informacoes de "de → para" (slot original e novo)

## Chamada e Check-in

### Operacao (Admin)
- Rota: `/admin/roll-call`
- Selecao de data para visualizar bookings do dia
- **Auto-geracao**: o sistema cria bookings automaticamente para slots vinculados ativos no dia selecionado (exceto se houver reagendamento)

### Status de Check-in

| Status | Significado |
|--------|-------------|
| PRESENTE | Aluno presente (marca checkedIn=true) |
| CANCELADO | Aluno cancelou |
| AUSENTE | Aluno faltou |
| (pendente) | Ainda nao registrado |

### Presencas Manuais
- Admin pode adicionar presencas retroativas via `/api/bookings/manual`
- Incrementa o campo `initialCheckins` do aluno
- Usado para aulas avulsas ou presencas fora do sistema

## Creditos Mensais

- Campo `monthlyCredits` no perfil do aluno (definido pelo admin)
- Contagem por mes calendario: bookings tipo PRIVATE no mes corrente
- Se creditos > 0 e usados >= creditos → bloqueio (403)
- Se monthlyCredits = 0 → sem limite (creditos desabilitados)
- Admins agendando em nome do aluno **nao** consomem creditos

## Sistema de Graduacao

### Faixas Adulto
BRANCA → AZUL → ROXA → MARROM → PRETA

### Faixas Kids
CINZA_BRANCA → CINZA → CINZA_PRETA → AMARELA_BRANCA → AMARELA → AMARELA_PRETA → LARANJA_BRANCA → LARANJA → LARANJA_PRETA → VERDE_BRANCA → VERDE → VERDE_PRETA

### Graus
- 0 a 4 graus por faixa
- Requisitos configuraveis por faixa/grau (numero de aulas necessarias)

### Requisitos de Graduacao
- **BeltRequirement**: numero de aulas necessarias para trocar de faixa
- **DegreeRequirement**: numero de aulas para cada grau dentro de uma faixa
- Admin configura em `/admin/belt-requirements` (separado por adulto/kids)

### Promocao (Admin)
- Admin pode promover grau ou faixa na pagina de detalhes do aluno (`/admin/students/:id`)
- Sistema exibe se aluno esta "apto" com base nos requisitos configurados
- Warning exibido se aluno nao atingiu requisitos (admin pode prosseguir mesmo assim)
- Criacao automatica de `GraduationLog` (tipo BELT ou DEGREE)
- Atualiza `lastGraduationDate` e/ou `lastBeltChangeDate`

### Historico de Graduacoes
- Aluno visualiza timeline de promocoes em `/student/graduations`
- Exibe tipo (faixa ou grau), data e representacao visual

## Ranking de Presencas

- Top 10 alunos APPROVED com mais presencas (checkinStatus=PRESENTE) no mes corrente
- Timezone UTC-3 para calculo do mes
- Exibido no dashboard do aluno (com posicao individual) e no timer do admin
- Medalhas para top 3, badges numerados para demais

## Relatorios de Frequencia

- Rota: `/admin/attendance`
- Filtros de periodo: semana, mes, 3 meses, customizado
- Professor nao-dono ve apenas frequencia de suas proprias aulas/slots

### Metricas

| Metrica | Descricao |
|---------|-----------|
| Total de check-ins | Soma de presencas + initialCheckins |
| Alunos ativos | Alunos com pelo menos 1 presenca no periodo |
| Media por aluno | Check-ins / alunos ativos |
| Aluno destaque | Aluno com mais presencas no periodo |

### Tabela de Frequencia
- Lista de alunos ordenados por presencas (decrescente)
- Exibe posicao, nome, avatar, faixa, graus, total de presencas

## Gestao de Professores

- Rota: `/admin/professors`
- **Apenas o dono (isOwner)** pode gerenciar professores

### Operacoes
- **Criar**: nome, email, senha (min 6 chars) → role=ADMIN, status=APPROVED
- **Editar**: nome, email, senha (opcional)
- **Excluir**: com confirmacao (nao pode excluir a si mesmo)
- **Listar**: exibe nome, email, tipo (Dono/Professor), numero de aulas/slots

## Eventos

- Rota: `/admin/events`
- Admin cria eventos com titulo, descricao e data
- Eventos exibidos no dashboard/agenda do aluno (proximos 30 dias)
- Exibidos na data correspondente ao navegar pela agenda

## Notificacoes

- Rota: `/admin/notifications`
- Admin cria notificacoes broadcast (titulo + mensagem)
- Sistema rastreia leitura individual por aluno (NotificationRead)
- Alunos veem notificacoes com status de leitura

## Timer de Tatame

- Rota: `/admin/timer`
- Feature flag: `enableTimer` (pode ser desativado por tenant)
- Cronometro fullscreen com formato MM:SS
- Controles: +1min, +3min, +5min, play/pause, reset
- Efeitos sonoros: 3 beeps + tom ao iniciar, beep longo ao finalizar
- Efeitos visuais: glow verde (parado) / vermelho (rodando)
- Exibe ranking horizontal dos top 10 alunos abaixo do timer
- Esconde sidebar e topbar para visualizacao em tela cheia

## Site Institucional

- Rota: `/site` (reescrita a partir do dominio raiz em producao)
- Landing page profissional com tema escuro
- Secoes: hero, dores dos donos de CT, antes/depois, personalizacao, funcionalidades, precos, FAQ, CTA final
- Link direto para WhatsApp para contato comercial

## Painel Super Admin

### Login (`/super-admin/login`)
- Autenticacao via JWT com cookie httpOnly

### Dashboard (`/super-admin`)
- Lista de CTs cadastrados (nome, email admin, status, link de login)
- Botao para criar novo CT

### Criar CT (`/super-admin/create`)
- Campos: nome do CT, slug (auto-gerado), nome/email/senha do admin, logo, cores
- Validacao de slug: apenas letras minusculas, numeros e hifens
- Slug unico (409 se ja existir)
- Provisiona banco automaticamente (Turso em producao, SQLite local em dev)
- Executa migracoes e cria usuario admin no banco do tenant

### Editar CT (`/super-admin/:id/edit`)
- Editar nome, admin, logo, cores, status ativo/inativo
- Ativar/desativar feature flags (planos, timer)

## Regras de Negocio (Resumo)

| Regra | Valor |
|-------|-------|
| Senha minima | 6 caracteres |
| Antecedencia agendamento particular (aluno) | 6 horas |
| Antecedencia agendamento coletiva (aluno) | 1 hora |
| Antecedencia cancelamento particular (aluno) | 12 horas |
| Antecedencia cancelamento coletiva (aluno) | 1 hora |
| Antecedencia reagendamento (aluno) | 12 horas |
| Max alunos por slot particular (admin) | 4 |
| Max alunos por slot particular (auto) | 1 |
| Graus por faixa | 0 a 4 |
| Ranking mensal | Top 10 |
| JWT super admin | 24h expiracao |
| Solicitacoes upgrade pendentes por aluno | 1 |
