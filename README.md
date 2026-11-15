# Plano de Arquitetura e Produto — Delegatus

> **Plataforma PWA mobile-first gratuita** para delegados de turma (ensino fundamental, médio e principalmente universitário) gerirem a turma de forma simples, rápida e integrada ao WhatsApp.

---

## 1. Visão Geral do Produto

A **Delegatus** resolve a desorganização dos grupos de WhatsApp de turma, centralizando num único aplicativo web instalável (PWA) tudo o que um delegado, subdelegado e colegas precisam no dia a dia académico:

- **Controlo de acesso à turma**: apenas colegas aprovados pelo delegado entram (evitando estranhos no ambiente da turma).
- **Ponte direta com o WhatsApp**: convites de turma e anúncios oficiais são formatados e disparados/partilhados diretamente para o grupo do WhatsApp com um toque.
- **Gestão académica diária**: avisos de falta dos colegas, faltas de professores, horário, matérias, atividades/tarefas extras, galeria de fotos/apontamentos, sondagens e grupos de trabalho.
- **Experiência de App Nativa (Mobile-First PWA)**: navegação inferior fixa, interface limpa, rápida, gratuita e instalável no telemóvel (Android/iOS).

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológica
- **Framework**: Next.js (Pages Router) + TypeScript (`strict: true`).
- **UI & Estilo**: Mobile-first CSS / Tailwind CSS seguindo os tokens definidos em `docs/design-system.md`.
- **Backend / API**: Next.js API Routes (`src/pages/api/...`) delegando para serviços, modelos e persistência tipada em `src/api/`.
- **Persistência**: Armazenamento local em ficheiro JSON / camada tipada em memória com persistência em disco (`src/api/db/`) — zero dependências externas pagas ou pesadas, permitindo execução imediata e gratuita.
- **PWA**: `public/manifest.json`, Service Worker (`public/sw.js`) para cache de shell e fallback offline, meta tags Apple/Android em `src/pages/_document.tsx`.
- **Integração WhatsApp**:
  - Partilha direta via `https://wa.me/?text=...` (e `navigator.share` quando suportado no mobile) com formatação automática de anúncio/convite.
  - Suporte opcional a webhook configurável na turma para automação futura.

### 2.2 Separação de Camadas
```text
[Browser / PWA Mobile-First]
   ├── src/pages/         -> Ecrãs Next.js (Pages Router)
   ├── src/components/    -> Componentes de UI reutilizáveis e AppShell (BottomNav)
   └── public/            -> manifest.json, sw.js, ícones PWA
          │
          ▼ (fetch / REST JSON - docs/api-contratos.md)
[Next.js API Layer]
   └── src/pages/api/     -> Endpoints HTTP finos (validação + resposta HTTP)
          │
          ▼
[Domínio & Persistência]
   └── src/api/           -> Modelos TS, serviços de negócio, RBAC, helper WhatsApp, DB local
```

---

## 3. Estrutura de Pastas (Next.js Pages Router)

```text
Delegatus/
├── docs/
│   ├── plano.md                  # Este documento (arquitetura, requisitos, fluxos, CA)
│   ├── design-system.md          # Guia visual, tokens, componentes mobile-first
│   └── api-contratos.md          # Tipos TS, endpoints REST e códigos de erro
├── public/
│   ├── manifest.json             # Metadados PWA (nome, ícones, display: standalone)
│   ├── sw.js                     # Service Worker (cache de assets e shell)
│   ├── offline.html              # Página de fallback offline
│   └── icons/                    # Ícones PWA (192x192, 512x512, maskable)
├── src/
│   ├── api/                      # Lógica de backend, modelos e persistência
│   │   ├── db/                   # Store JSON/memória tipado e seed opcional
│   │   ├── models/               # Entidades e tipos TypeScript
│   │   ├── services/             # Regras de negócio (turma, faltas, grupos, etc.)
│   │   ├── utils/                # Auth/sessão, RBAC, formatador WhatsApp
│   │   └── index.ts              # Exportações centrais
│   ├── components/               # Componentes React (mobile-first)
│   │   ├── layout/               # AppShell, BottomNav, TopBar, RoleBadge
│   │   ├── ui/                   # Button, Card, Badge, Modal, Toast, EmptyState
│   │   ├── turma/                # Convite WhatsApp, pedidos pendentes, lista membros
│   │   ├── anuncios/             # Lista, criador e botão disparo WhatsApp
│   │   ├── faltas/               # Formulário colega + lista de revisão delegado
│   │   ├── informacoes/          # Horário, matérias, falta professor, tarefas, fotos
│   │   ├── sondagens/            # Cartões de votação e barras de progresso
│   │   └── grupos/               # Gerador alfabético/aleatório + grupos com vagas
│   ├── pages/                    # Rotas Next.js (Pages Router)
│   │   ├── _app.tsx              # Providers globais, registo do Service Worker
│   │   ├── _document.tsx         # Meta tags PWA, viewport, manifest link
│   │   ├── index.tsx             # Landing Page pública explicando a Delegatus
│   │   ├── auth/
│   │   │   ├── registo.tsx       # Criação de conta (escola/universidade, curso, etc.)
│   │   │   └── login.tsx         # Autenticação
│   │   ├── entrar/
│   │   │   └── [codigo].tsx      # Landing de convite para pedir entrada numa turma
│   │   ├── turma/
│   │   │   └── index.tsx         # Menu Turma (membros, convite, aprovações, subdelegado)
│   │   ├── avisos/
│   │   │   └── index.tsx         # Menu Avisos (notificações e alertas)
│   │   ├── informacoes/
│   │   │   └── index.tsx         # Menu Informações (horário, matérias, profs, tarefas, fotos)
│   │   ├── faltas/
│   │   │   └── index.tsx         # Menu Faltas (enviar falta / rever faltas)
│   │   ├── anuncios/
│   │   │   └── index.tsx         # Menu Anúncios (ler / criar e disparar WhatsApp)
│   │   ├── sondagens/
│   │   │   └── index.tsx         # Menu Sondagem (votar / criar sondagem)
│   │   ├── grupos/
│   │   │   └── index.tsx         # Menu Grupos de Trabalho (automáticos e por vagas)
│   │   └── api/                  # API Routes do Next.js (delegam para src/api/)
│   └── styles/                   # Estilos globais e tokens CSS/Tailwind
├── package.json
└── tsconfig.json
```

---

## 4. Papéis e Permissões (Painel do Delegado vs Painel dos Colegas)

| Funcionalidade | Delegado | Subdelegado | Colega |
|---|:---:|:---:|:---:|
| Criar turma & gerar link de convite | ✅ | ❌ | ❌ |
| Partilhar link de convite no WhatsApp | ✅ | ✅ | ❌ |
| Aprovar / Rejeitar pedidos de entrada | ✅ | ✅ | ❌ |
| Nomear / Remover Subdelegado | ✅ | ❌ | ❌ |
| Criar anúncios e disparar para WhatsApp | ✅ | ✅ | ❌ |
| Ver anúncios | ✅ | ✅ | ✅ |
| Enviar aviso de falta (doença, trabalho, outro) | ✅ | ✅ | ✅ |
| Rever faltas dos colegas e marcar como vista/lida | ✅ | ✅ | ❌ |
| Publicar horário, matérias, falta de professores, tarefas extras | ✅ | ✅ | ❌ |
| Ver horário, matérias, falta de professores, tarefas extras | ✅ | ✅ | ✅ |
| Partilhar fotos / imagens (apontamentos, quadro, avisos) | ✅ | ✅ | ✅ |
| Criar sondagens | ✅ | ✅ | ❌ |
| Votar em sondagens (1 voto por membro) | ✅ | ✅ | ✅ |
| Criar grupos (alfabético, aleatório ou numerado com vagas) | ✅ | ✅ | ❌ |
| Entrar / Sair de grupos numerados com vagas | ✅ | ✅ | ✅ |

---

## 5. Requisitos Funcionais (RF)

### RF01 — Landing Page e Conta de Utilizador
- **RF01.1**: Landing page pública (`/`) explicando os benefícios da Delegatus (gratuita, mobile-first, integração WhatsApp, gestão de faltas, grupos e sondagens) com CTAs para "Criar Conta" e "Entrar".
- **RF01.2**: Registo (`/auth/registo`) recolhendo: nome completo, email, password, instituição (escola ou universidade), nível de ensino (`fundamental`, `medio`, `universitario`), curso/turma e papel inicial pretendido (criar turma como delegado ou entrar com convite como colega).
- **RF01.3**: Login (`/auth/login`) e logout com sessão persistente.

### RF02 — Turma, Convites, Aprovação e Subdelegado
- **RF02.1**: O delegado pode criar uma turma (nome, instituição, curso, ano/semestre), recebendo automaticamente um `codigoConvite` único e URL partilhável (`/entrar/[codigo]`).
- **RF02.2**: Botão de partilha direta do convite para o WhatsApp com mensagem pré-formatada.
- **RF02.3**: Ao aceder ao link ou inserir o código, o colega envia um pedido de entrada (`status: pendente`).
- **RF02.4**: O delegado recebe uma notificação/aviso de novo pedido de entrada e pode **Aprovar** ou **Rejeitar** (bloqueando estranhos).
- **RF02.5**: O delegado pode nomear um membro aprovado como **Subdelegado** (e revogar quando necessário).

### RF03 — Menus Principais (Navegação Mobile-First)
A aplicação autenticada organiza-se nos 7 menus solicitados (acessíveis via Bottom Navigation Bar para os principais + menu/drawer ou barra secundária para acesso rápido a todos):
1. **Turma**: dados da turma, link de convite + WhatsApp, lista de membros, pedidos pendentes (delegado) e gestão de subdelegado.
2. **Avisos**: feed de notificações (novos pedidos de entrada, novas faltas enviadas, aprovação na turma, novos anúncios, falta de professores).
3. **Informações**: separadores para Horário semanal, Matérias/Disciplinas, Falta de Professores, Atividades/Tarefas Extras e Galeria de Fotos/Imagens.
4. **Faltas**: formulário para colega enviar aviso de falta (data, disciplina, motivo: `doenca` | `trabalho` | `outro`, descrição); painel de revisão para o delegado/subdelegado filtrar (por data/estado) e marcar como vista/lida no decorrer ou fim do dia.
5. **Anúncios**: lista de anúncios oficiais da turma; formulário de criação para delegado/subdelegado com botão **"Disparar / Partilhar no WhatsApp"** (gera link `wa.me` com título, corpo, autor e nome da turma formatados + opção de copiar texto).
6. **Sondagem**: lista de sondagens ativas/encerradas; votação única por colega com atualização visual das percentagens; criação de sondagens pelo delegado/subdelegado.
7. **Grupos de Trabalho**:
   - **Modo Automático (Alfabético)**: distribui automaticamente os membros aprovados da turma por ordem alfabética conforme o número de grupos ou tamanho definido.
   - **Modo Automático (Aleatório)**: sorteia e distribui aleatoriamente os membros aprovados pelos grupos.
   - **Modo Numerado com Vagas (Livre)**: o delegado cria grupos numerados (`Grupo 1`, `Grupo 2`, `Grupo 3`...) definindo um **tema** e um **limite máximo de vagas** (ex: 5 pessoas). Os colegas entram por ordem de chegada ("os primeiros 5 entram") até a lotação esgotar, podendo também sair caso haja alteração.

---

## 6. Requisitos Não-Funcionais (RNF)

- **RNF01 (PWA & Mobile-First)**: Layout pensado primeiro para ecrãs de 360px–430px, `manifest.json` válido para instalação no ecrã inicial, Service Worker ativo e alvos de toque `>= 44px`.
- **RNF02 (Gratuidade & Zero Fricção)**: Funciona sem serviços pagos obrigatórios; partilha WhatsApp funciona nativamente via URL scheme `wa.me` / Web Share API.
- **RNF03 (Segurança & Isolamento)**: Validação de sessão e papel (RBAC) no servidor em todas as rotas `/api/*`; utilizadores não aprovados numa turma não acedem aos dados internos da turma.
- **RNF04 (Integridade de Dados)**: Voto único garantido no servidor por `(sondagemId, userId)`; limite de vagas em grupos validado atomicamente no servidor para impedir exceder o máximo.
- **RNF05 (Upload de Imagens)**: Suporte a imagens (PNG/JPG/WEBP) com validação de formato e limite de tamanho seguro.

---

## 7. Fluxos de Utilizador Críticos

1. **Onboarding do Delegado**:
   `Landing (/)` → `Registo (/auth/registo)` → `Criar Turma (/turma)` → `Copiar / Partilhar Link WhatsApp` → `Receber Pedido em Avisos` → `Aprovar Colega`.
2. **Entrada do Colega**:
   `Link WhatsApp (/entrar/[codigo])` → `Registo/Login` → `Pedido Pendente` → `Aprovado pelo Delegado` → `Acesso completo aos 7 menus`.
3. **Comunicação Oficial (Anúncio -> WhatsApp)**:
   `Delegado abre Anúncios` → `Cria Anúncio` → `Clica em "Partilhar no WhatsApp"` → `Abre WhatsApp com texto formatado para colar/enviar no grupo da turma`.
4. **Gestão de Faltas Diárias**:
   `Colega abre Faltas` → `Seleciona data, disciplina e motivo (doença/trabalho/outro)` → `Submete` → `Delegado vê badge em Avisos/Faltas` → `Revê no fim do dia e marca como "Vista"`.
5. **Formação de Grupos de Trabalho**:
   `Delegado abre Grupos` → `Escolhe modo (Alfabético / Aleatório / Numerado com Tema e Vagas)` → `Se Numerado: Colegas abrem Grupos e clicam em "Entrar" até atingir o limite de vagas`.

---

## 8. Critérios de Aceitação (CA)

- [ ] **CA01 — Landing & Auth**: Utilizador consegue ler a proposta da Delegatus na `/`, criar conta informando escola/universidade e curso, e fazer login/logout.
- [ ] **CA02 — Turma & Segurança de Entrada**: Delegado cria turma, gera link de convite partilhável no WhatsApp; colega pede entrada e fica bloqueado até aprovação explícita do delegado; delegado recebe aviso do pedido; delegado consegue nomear um subdelegado.
- [ ] **CA03 — Anúncios & WhatsApp**: Delegado/subdelegado cria anúncio e consegue disparar/abrir partilha formatada para o WhatsApp com 1 clique.
- [ ] **CA04 — Faltas**: Colega regista aviso de falta com motivo (`doenca`, `trabalho`, `outro`); delegado visualiza, filtra e marca como vista/lida.
- [ ] **CA05 — Informações & Fotos**: Delegado publica horário, matérias, falta de professores e atividades extras; delegado e colegas conseguem publicar e visualizar fotos/imagens.
- [ ] **CA06 — Sondagens**: Delegado cria sondagem; colega vota exatamente 1 vez; barras de resultado refletem os votos corretamente.
- [ ] **CA07 — Grupos de Trabalho**: Delegado gera grupos por ordem alfabética, aleatória, ou numerados (`Grupo 1, 2, 3...`) com tema e limite máximo de vagas; colega não consegue entrar num grupo já lotado.
- [ ] **CA08 — PWA Mobile-First**: `manifest.json` e `sw.js` carregam sem erros; navegação mobile com BottomNav e touch targets adequados; build TypeScript/Next.js compila sem erros.
