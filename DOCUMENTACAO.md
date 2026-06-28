# FaixaPreta - Documentacao do Sistema

Sistema SaaS de gestao para academias (CTs) de Jiu-Jitsu Brasileiro. Plataforma multi-tenant com paineis separados para super admin, administradores/professores e alunos.

---

## Sumario

1. [Arquitetura Geral](#1-arquitetura-geral)
2. [Multi-Tenancy](#2-multi-tenancy)
3. [Autenticacao e Autorizacao](#3-autenticacao-e-autorizacao)
4. [Papeis de Usuario](#4-papeis-de-usuario)
5. [Cadastro e Aprovacao de Alunos](#5-cadastro-e-aprovacao-de-alunos)
6. [Planos de Aluno](#6-planos-de-aluno)
7. [Solicitacao de Upgrade de Plano](#7-solicitacao-de-upgrade-de-plano)
8. [Aulas em Grupo (Coletivas)](#8-aulas-em-grupo-coletivas)
9. [Aulas Particulares (Slots Privados)](#9-aulas-particulares-slots-privados)
10. [Sistema de Agendamento (Bookings)](#10-sistema-de-agendamento-bookings)
11. [Cancelamento de Agendamentos](#11-cancelamento-de-agendamentos)
12. [Reagendamento de Aulas Particulares](#12-reagendamento-de-aulas-particulares)
13. [Chamada e Check-in](#13-chamada-e-check-in)
14. [Creditos Mensais](#14-creditos-mensais)
15. [Sistema de Graduacao](#15-sistema-de-graduacao)
16. [Ranking de Presencas](#16-ranking-de-presencas)
17. [Relatorios de Frequencia](#17-relatorios-de-frequencia)
18. [Gestao de Professores](#18-gestao-de-professores)
19. [Eventos](#19-eventos)
20. [Notificacoes](#20-notificacoes)
21. [Timer de Tatame](#21-timer-de-tatame)
22. [Site Institucional](#22-site-institucional)
23. [Painel Super Admin](#23-painel-super-admin)
24. [Modelos de Dados](#24-modelos-de-dados)

---

## 1. Arquitetura Geral

- **Stack**: Next.js 14 + Prisma 7 + Turso (libsql) + NextAuth
- **Frontend**: React com Tailwind CSS, tema claro com variaveis CSS semanticas
- **Banco de dados**: SQLite via Turso (producao) ou arquivo local (desenvolvimento)
- **Autenticacao**: NextAuth (credenciais) para tenants, JWT via `jose` para super admin

---

## 2. Multi-Tenancy

O sistema opera com um **banco master** e **um banco por tenant (CT)**.

### Banco Master (`prisma/master.prisma`)
Armazena informacoes dos tenants e super admins:
- **Tenant**: nome, slug, logo, cores (primaria/secundaria), dados do admin, URL do banco Turso, status ativo/inativo
- **SuperAdmin**: email e senha hash para acesso ao painel super admin

### Banco do Tenant (`prisma/schema.prisma`)
Cada CT possui seu proprio banco com todos os dados operacionais: usuarios, aulas, agendamentos, graduacoes, etc.

### Roteamento de Tenant
- **Producao**: subdominio `{slug}.faixappreta.com.br`
- **Desenvolvimento**: query param `?tenant={slug}`
- O middleware extrai o slug e injeta o contexto do tenant nas requisicoes

---

## 3. Autenticacao e Autorizacao

### Autenticacao de Tenant (Alunos e Admins)
- Provider de credenciais do NextAuth (email + senha + tenantSlug)
- Estrategia JWT com dados do usuario na sessao (role, studentType, belt, etc.)
- Senha minima: 6 caracteres
- Hash com bcryptjs (10 rounds)

### Autenticacao Super Admin
- JWT gerado via `jose`, armazenado em cookie httpOnly `super-admin-token`
- Expiracao: 24 horas
- Verificacao em `src/lib/super-admin-auth.ts`

### Protecao de Rotas (Middleware)
| Rota | Requisito |
|------|-----------|
| `/super-admin/*` | Cookie `super-admin-token` com JWT valido |
| `/admin/*` | Sessao NextAuth com role=ADMIN |
| `/student/*` | Sessao NextAuth com role=STUDENT |
| `/site/*` | Publico |
| `/login`, `/register` | Publico |

---

## 4. Papeis de Usuario

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

---

## 5. Cadastro e Aprovacao de Alunos

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

---

## 6. Planos de Aluno

Tres niveis de plano controlam o acesso as funcionalidades:

| Funcionalidade | ESSENCIAL | PRO | PREMIUM |
|---------------|-----------|-----|---------|
| Aulas em grupo (coletivas) | Sim | Sim | Sim |
| Aulas semi-privadas | Nao | Sim | Sim |
| Aulas particulares | Nao | Sim | Sim |
| Ver slots particulares abertos | Nao | Sim | Sim |
| Reagendar aula particular | Nao | Sim | Sim |
| Creditos mensais | Nao | Sim | Sim |

### Modalidades
- **GRAPPLING** (padrao)
- **MMA**
- **GRAPPLING,MMA** (ambas)

### Modo Kids
- Flag `isKids` indica aluno infantil
- Faixas diferentes para kids (cinza, amarela, laranja, verde com subdivisoes)
- Filtros separados em aulas kids

---

## 7. Solicitacao de Upgrade de Plano

1. Aluno cria solicitacao com: plano desejado, frequencia, detalhes, preco
2. Apenas **uma** solicitacao PENDING por aluno por vez (409 se ja existir)
3. Admin visualiza solicitacoes em `/admin/plan-upgrades`
4. Admin pode **aprovar** (atualiza studentType do aluno) ou **rejeitar**
5. Contador de pendencias exibido no dashboard admin

---

## 8. Aulas em Grupo (Coletivas)

### Tipos
- **GROUP** (Coletiva): disponivel para todos os alunos
- **SEMI_PRIVATE** (Semi-Privada): apenas alunos PRO e PREMIUM

### Dados da Aula
- Nome, dia da semana (0-6), horario inicio/fim, capacidade, flag kids
- Professor responsavel (opcional, referencia a User com role=ADMIN)

### Gestao (Admin)
- CRUD completo em `/admin/group-classes`
- Definir capacidade maxima por aula
- Associar professor responsavel

---

## 9. Aulas Particulares (Slots Privados)

### Conceitos
- **Slot vinculado** (bound): `userId` preenchido - aula fixa do aluno na grade
- **Slot aberto** (open): `userId` nulo - disponivel para qualquer aluno PRO/PREMIUM agendar

### Dados do Slot
- Dia da semana, horario inicio/fim, disponibilidade (ativo/inativo)
- Aluno vinculado (opcional), professor responsavel (opcional)

### Regras de Criacao (Admin)
- Pode criar para multiplos alunos simultaneamente (array de userIds)
- Calculo automatico de horario fim se nao informado (inicio + 1 hora)
- Nao permite slots duplicados (mesmo dia + horario + aluno)
- Maximo um slot aberto por combinacao dia/horario

### Visibilidade por Plano
| Plano | Ve slots vinculados proprios | Ve slots abertos | Ve slots reagendados |
|-------|----------------------------|-------------------|---------------------|
| ESSENCIAL | Sim | Nao | Nao |
| PRO | Sim | Sim | Sim |
| PREMIUM | Sim | Sim | Sim |

### Capacidade por Slot
- Admin pode adicionar ate **4 alunos** por slot particular por data
- Aluno agendando sozinho: **1 por slot aberto** por data (exclusivo)

---

## 10. Sistema de Agendamento (Bookings)

### Agendamento de Aula Particular

| Regra | Detalhe |
|-------|---------|
| Antecedencia minima (aluno) | 6 horas antes do inicio da aula |
| Antecedencia minima (admin) | Sem restricao |
| Plano minimo | PRO ou PREMIUM (ESSENCIAL recebe 403) |
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
| SEMI_PRIVATE | Apenas PRO/PREMIUM |
| Capacidade | Limitada pelo campo capacity da aula |
| Dia da semana | Data deve corresponder ao dayOfWeek da aula |
| Duplicidade | Um booking por aluno por aula por data |

---

## 11. Cancelamento de Agendamentos

### Aula Particular
- **Aluno**: minimo 12 horas de antecedencia
- **Admin**: sem restricao de horario
- Alunos **nao podem** cancelar diretamente slots vinculados (devem usar reagendamento)

### Aula em Grupo
- **Aluno**: minimo 1 hora de antecedencia
- **Admin**: sem restricao de horario

---

## 12. Reagendamento de Aulas Particulares

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

---

## 13. Chamada e Check-in

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

---

## 14. Creditos Mensais

- Campo `monthlyCredits` no perfil do aluno (definido pelo admin)
- Contagem por mes calendario: bookings tipo PRIVATE no mes corrente
- Se creditos > 0 e usados >= creditos → bloqueio (403)
- Retorna: total, usados, restantes
- Se monthlyCredits = 0 → sem limite (creditos desabilitados)
- Admins agendando em nome do aluno **nao** consomem creditos

---

## 15. Sistema de Graduacao

### Faixas Adulto
BRANCA → AZUL → ROXA → MARROM → PRETA

### Faixas Kids
CINZA_BRANCA → CINZA → CINZA_PRETA → AMARELA_BRANCA → AMARELA → AMARELA_PRETA → LARANJA_BRANCA → LARANJA → LARANJA_PRETA → VERDE_BRANCA → VERDE → VERDE_PRETA

### Graus
- 0 a 4 graus por faixa
- Requisitos configuraveis por faixa/grau (numero de aulas necessarias)

### Requisitos de Graduacao
- **BeltRequirement**: numero de aulas necessarias para trocar de faixa (ex: Branca → Azul)
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

---

## 16. Ranking de Presencas

- Top 10 alunos APPROVED com mais presencas (checkinStatus=PRESENTE) no mes corrente
- Timezone UTC-3 para calculo do mes
- Exibido no dashboard do aluno (com posicao individual) e no timer do admin
- Medalhas para top 3, badges numerados para demais

---

## 17. Relatorios de Frequencia

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

---

## 18. Gestao de Professores

- Rota: `/admin/professors`
- **Apenas o dono (isOwner)** pode gerenciar professores

### Operacoes
- **Criar**: nome, email, senha (min 6 chars) → role=ADMIN, status=APPROVED
- **Editar**: nome, email, senha (opcional)
- **Excluir**: com confirmacao (nao pode excluir a si mesmo)
- **Listar**: exibe nome, email, tipo (Dono/Professor), numero de aulas/slots

---

## 19. Eventos

- Rota: `/admin/events`
- Admin cria eventos com titulo, descricao e data
- Eventos exibidos no dashboard/agenda do aluno (proximos 30 dias)
- Exibidos na data correspondente ao navegar pela agenda

---

## 20. Notificacoes

- Rota: `/admin/notifications`
- Admin cria notificacoes broadcast (titulo + mensagem)
- Sistema rastreia leitura individual por aluno (NotificationRead)
- Alunos veem notificacoes com status de leitura

---

## 21. Timer de Tatame

- Rota: `/admin/timer`
- Cronometro fullscreen com formato MM:SS
- Controles: +1min, +3min, +5min, play/pause, reset
- Efeitos sonoros: 3 beeps + tom ao iniciar, beep longo ao finalizar
- Efeitos visuais: glow verde (parado) / vermelho (rodando)
- Exibe ranking horizontal dos top 10 alunos abaixo do timer
- Esconde sidebar e topbar para visualizacao em tela cheia

---

## 22. Site Institucional

- Rota: `/site`
- Landing page profissional com tema escuro
- Secoes: hero, dores dos donos de CT, antes/depois, personalizacao, funcionalidades (8 screenshots), precos, FAQ, CTA final
- Link direto para WhatsApp para contato comercial

---

## 23. Painel Super Admin

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

---

## 24. Modelos de Dados

### Banco Master

```
Tenant
  id, name, slug (unique), logoUrl?, primaryColor, secondaryColor,
  adminName, adminEmail, tursoDbUrl, tursoAuthToken, isActive, createdAt

SuperAdmin
  id, email (unique), passwordHash, createdAt
```

### Banco do Tenant

```
User
  id, name, email (unique), passwordHash, role (STUDENT|ADMIN),
  status (PENDING|APPROVED), isOwner, studentType (ESSENCIAL|PRO|PREMIUM),
  belt, degrees (0-4), initialCheckins, monthlyCredits,
  modalities (GRAPPLING|MMA|ambos), isKids, photoUrl?,
  monthlyDueDay?, lastPaymentDate?, lastGraduationDate?, lastBeltChangeDate?,
  createdAt

GroupClass
  id, name, dayOfWeek, startTime, endTime, capacity,
  isKids, classType (GROUP|SEMI_PRIVATE), instructorId?

PrivateSlot
  id, dayOfWeek, startTime, endTime, isAvailable,
  userId? (aluno vinculado), instructorId?

Booking
  id, userId, type (PRIVATE|GROUP), privateSlotId?, groupClassId?,
  date, status, checkedIn, checkinStatus (PRESENTE|CANCELADO|AUSENTE)?

Event
  id, title, description, date, createdById

Notification
  id, title, message, createdById
  NotificationRead: id, notificationId, userId (unique combo)

BeltRequirement
  id, belt (unique), requiredClasses

DegreeRequirement
  id, belt, degree, requiredClasses (unique: belt+degree)

GraduationLog
  id, userId, belt, degrees, type (BELT|DEGREE), createdAt

RescheduleLog
  id, type (RESCHEDULE|BOOKING), userId, privateSlotId, date,
  newPrivateSlotId?, newDate?, readByAdmin (unique: slot+date+type)

PlanUpgradeRequest
  id, userId, plan, frequency, details?, price,
  status (PENDING|APPROVED|REJECTED), readByAdmin, createdAt
```

---

## Resumo de Regras de Negocio

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
