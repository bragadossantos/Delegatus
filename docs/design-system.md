# Design System & Guia Visual — Delegatus

> **Versão:** 1.0.0  
> **Stack Alvo:** Next.js (Pages Router) + TypeScript + Tailwind CSS (PWA Mobile-First)  
> **Público:** Estudantes universitários (foco principal), ensino médio e fundamental — Delegados, Subdelegados e Colegas de turma.

---

## 1. Identidade Visual da Marca

### 1.1 Posicionamento e Personalidade
A **Delegatus** é uma plataforma gratuita que transforma a gestão de turma numa experiência de **app nativa no bolso**. A linguagem visual equilibra **credibilidade académica** com **agilidade digital**:
- **Clara e Direta:** Zero ruído visual; a informação crítica (anúncios, faltas, horários, vagas) destaca-se imediatamente.
- **Mobile-First Nativa:** Navegação inferior (Bottom Bar), gestos confortáveis, *touch targets* amplos (`>= 44px`) e suporte a *Safe Areas* de telemóveis.
- **Universitária Moderna:** Paleta baseada em Indigo Académico e Teal Energético sobre superfícies neutras limpas, com suporte nativo a **Light Mode** e **Dark Mode**.

### 1.2 Logótipo e Ícone PWA
- **Símbolo:** Escudo minimalista com cantos arredondados contendo um ícone estilizado de ligação/megafone ou marca de verificação dupla (representando representação da turma + comunicação direta).
- **Wordmark:** `Delegatus` em `Plus Jakarta Sans` Bold (`700`), tracking `-0.02em`.
- **Assets PWA (`public/`):**
  - `favicon.ico` / `icon.svg` (fundo `#4F46E5`, símbolo `#FFFFFF`)
  - `icons/icon-192x192.png` (uso geral Android/PWA)
  - `icons/icon-512x512.png` (splash screen)
  - `icons/icon-maskable-512x512.png` (área segura central de 80% para ícones adaptativos)
  - `theme_color`: `#4F46E5` (light) / `#0F172A` (dark)
  - `background_color`: `#F8FAFC`

---

## 2. Paleta de Cores

Todas as combinações de texto e fundo respeitam o contraste mínimo **WCAG AA (>= 4.5:1 para texto normal, >= 3:1 para texto grande e ícones)**.

### 2.1 Cores de Marca e Ação
| Token | Light Mode | Dark Mode | Uso Principal |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#4F46E5` (Indigo 600) | `#6366F1` (Indigo 500) | Botões primários, tabs ativas, links, foco |
| `--color-primary-hover` | `#4338CA` (Indigo 700) | `#818CF8` (Indigo 400) | Estado hover/pressed de ações primárias |
| `--color-primary-soft` | `#EEF2FF` (Indigo 50) | `#1E1B4B` (Indigo 950) | Fundo de badges, itens selecionados, highlights |
| `--color-secondary` | `#0D9488` (Teal 600) | `#14B8A6` (Teal 500) | Ações secundárias, indicadores de progresso |
| `--color-secondary-soft` | `#F0FDFA` (Teal 50) | `#042F2E` (Teal 950) | Fundo de destaques informativos secundários |
| `--color-whatsapp` | `#25D366` | `#25D366` | Botão dedicado de partilha/disparo WhatsApp |
| `--color-whatsapp-hover` | `#1EBE5D` | `#22C35E` | Hover do botão WhatsApp (texto `#FFFFFF` ou `#052E16` conforme variante) |

### 2.2 Neutros e Superfícies
| Token | Light Mode | Dark Mode | Uso Principal |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#F8FAFC` (Slate 50) | `#0F172A` (Slate 900) | Fundo global da aplicação |
| `--bg-surface` | `#FFFFFF` (White) | `#1E293B` (Slate 800) | Cards, modais, bottom nav, inputs |
| `--bg-surface-muted` | `#F1F5F9` (Slate 100) | `#334155` (Slate 700) | Áreas secundárias, skeletons, hover subtil |
| `--border-subtle` | `#E2E8F0` (Slate 200) | `#334155` (Slate 700) | Divisores, bordas de cards e inputs |
| `--border-strong` | `#CBD5E1` (Slate 300) | `#475569` (Slate 600) | Bordas em foco ou hover |
| `--text-primary` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Títulos e texto principal |
| `--text-secondary` | `#475569` (Slate 600) | `#CBD5E1` (Slate 300) | Subtítulos, descrições, metadados |
| `--text-muted` | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) | Placeholders, timestamps, legendas |

### 2.3 Cores Semânticas (Status)
| Estado | Texto / Ícone | Fundo (Light) | Fundo (Dark) | Uso na Delegatus |
| :--- | :--- | :--- | :--- | :--- |
| **Sucesso** | `#15803D` / `#4ADE80` | `#DCFCE7` | `#14532D` | Colega aprovado, falta vista, grupo disponível |
| **Aviso / Pendente** | `#B45309` / `#FBBF24` | `#FEF3C7` | `#451A03` | Pedido de entrada pendente, vagas quase cheias (80%+) |
| **Erro / Urgente** | `#B91C1C` / `#F87171` | `#FEE2E2` | `#450A0A` | Rejeitado, falta de professor, anúncio urgente, grupo lotado |
| **Info / Papel** | `#1D4ED8` / `#60A5FA` | `#DBEAFE` | `#172554` | Subdelegado, nova atividade, sondagem ativa |

---

## 3. Tipografia

- **Família Principal (`--font-sans`):** `'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif`
- **Família Monoespaçada (`--font-mono`):** `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace` (para códigos de convite, horários e contadores com `tabular-nums`).

| Estilo | Tamanho (`rem` / `px`) | Line Height | Peso | Tracking | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `2rem` (`32px`) -> `2.75rem` (`44px` md) | `1.15` | `800` | `-0.025em` | Título principal da Landing Page |
| **H1 (Ecrã)** | `1.5rem` (`24px`) | `1.25` | `700` | `-0.02em` | Título de página no painel |
| **H2 (Secção)** | `1.125rem` (`18px`) | `1.35` | `700` | `-0.01em` | Cabeçalhos de secção e modais |
| **H3 (Card Title)** | `1rem` (`16px`) | `1.4` | `600` | `0` | Títulos de anúncios, grupos e sondagens |
| **Body** | `0.9375rem` (`15px`) | `1.5` | `400` | `0` | Texto corrido e descrições |
| **Body Small** | `0.875rem` (`14px`) | `1.45` | `400` / `500` | `0` | Inputs, botões, metadados secundários |
| **Caption / Badge** | `0.75rem` (`12px`) | `1.3` | `600` | `0.01em` | Badges, labels da bottom nav, timestamps |

---

## 4. Espaçamento, Grid Mobile-First e Layout PWA

### 4.1 Escala de Espaçamento (Base `4px`)
- `4px` (`1`): Micro-espaço entre ícone e texto curto.
- `8px` (`2`): Espaço interno entre badge e título.
- `12px` (`3`): Gap entre itens compactos ou inputs relacionados.
- `16px` (`4`): Padding lateral padrão em mobile (`px-4`) e padding interno de cards (`p-4`).
- `20px` (`5`) / `24px` (`6`): Espaçamento entre secções (`space-y-5` / `space-y-6`).

### 4.2 Regras de Touch & Safe Area (PWA)
- **Touch Target Mínimo:** Todo elemento interativo (botão, link de menu, checkbox, opção de sondagem, botão fechar) deve ter no mínimo **`44px x 44px`** (`min-h-[44px] min-w-[44px]`).
- **Top App Bar (Mobile):** Altura `56px` (`h-14`) + `env(safe-area-inset-top)`, fixa no topo com `backdrop-blur-md` e borda inferior `1px`.
- **Bottom Navigation Bar (Mobile `< 768px`):** Altura `64px` (`h-16`) + `env(safe-area-inset-bottom)`, fixa em baixo. O conteúdo principal da página deve incluir `pb-24` para nunca ficar oculto atrás da barra.
- **Desktop (`>= 768px`):** Bottom Bar é substituída por uma **Sidebar fixa à esquerda (`w-64` / `256px`)**, mantendo área de conteúdo centrada com `max-w-4xl` (ou `max-w-5xl` em grelhas).

### 4.3 Grid e Breakpoints
- **Mobile (`< 640px`, padrão):** 1 coluna (`grid-cols-1`), padding lateral `16px`.
- **Tablet (`sm: 640px` / `md: 768px`):** 2 colunas para cards de grupos, métricas e horários (`grid-cols-2`).
- **Desktop (`lg: 1024px`):** Sidebar `256px` + área de conteúdo fluida até `1024px`.

### 4.4 Raios de Borda e Elevação
- **Botões e Inputs:** `rounded-xl` (`12px`).
- **Cards:** `rounded-2xl` (`16px`), borda `1px solid var(--border-subtle)`, sombra leve (`0 1px 2px rgba(15, 23, 42, 0.04)`).
- **Modais (Desktop) / Bottom Sheets (Mobile):** `rounded-t-2xl` em mobile, `rounded-2xl` em desktop.
- **Badges, Pills e Avatares:** `rounded-full`.

---

## 5. Tokens CSS & Tailwind

### 5.1 Variáveis CSS (`src/styles/globals.css`)
```css
:root {
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-muted: #f1f5f9;
  --border-subtle: #e2e8f0;
  --border-strong: #cbd5e1;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-soft: #eef2ff;

  --color-secondary: #0d9488;
  --color-secondary-soft: #f0fdfa;

  --color-whatsapp: #25d366;
  --color-whatsapp-hover: #1ebe5d;

  --status-success-text: #15803d;
  --status-success-bg: #dcfce7;
  --status-warning-text: #b45309;
  --status-warning-bg: #fef3c7;
  --status-danger-text: #b91c1c;
  --status-danger-bg: #fee2e2;
  --status-info-text: #1d4ed8;
  --status-info-bg: #dbeafe;
}

.dark {
  --bg-app: #0f172a;
  --bg-surface: #1e293b;
  --bg-surface-muted: #334155;
  --border-subtle: #334155;
  --border-strong: #475569;

  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;

  --color-primary: #6366f1;
  --color-primary-hover: #818cf8;
  --color-primary-soft: #1e1b4b;

  --color-secondary: #14b8a6;
  --color-secondary-soft: #042f2e;

  --status-success-text: #4ade80;
  --status-success-bg: #14532d;
  --status-warning-text: #fbbf24;
  --status-warning-bg: #451a03;
  --status-danger-text: #f87171;
  --status-danger-bg: #450a0a;
  --status-info-text: #60a5fa;
  --status-info-bg: #172554;
}
```

### 5.2 Extensão Tailwind (`tailwind.config.ts`)
Mapear os tokens acima para classes utilitárias consistentes:
- `colors`: `app: 'var(--bg-app)'`, `surface: 'var(--bg-surface)'`, `surface-muted: 'var(--bg-surface-muted)'`, `primary: 'var(--color-primary)'`, `secondary: 'var(--color-secondary)'`, `whatsapp: 'var(--color-whatsapp)'`.
- `minHeight` / `minWidth`: `touch: '44px'`.
- `fontFamily`: `sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif']`, `mono: ['JetBrains Mono', 'monospace']`.

---

## 6. Especificação de Componentes

### 6.1 Botões (`Button`)
Todos os botões usam `min-h-[44px] px-4 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none`.

| Variante | Estilo Visual | Uso |
| :--- | :--- | :--- |
| **Primary** | Fundo `--color-primary`, texto `#FFFFFF`, hover `--color-primary-hover` | Criar turma, publicar anúncio, enviar falta, confirmar |
| **Secondary** | Fundo `--color-primary-soft`, texto `--color-primary` | Ações secundárias no painel, ver detalhes |
| **Outline** | Fundo transparente, borda `1px solid --border-strong`, texto `--text-primary` | Cancelar, filtrar, editar |
| **Ghost** | Fundo transparente, hover `--bg-surface-muted`, texto `--text-secondary` | Ícones de ação na top bar, fechar modal |
| **Danger** | Fundo `--status-danger-bg`, texto `--status-danger-text` (ou sólido `#DC2626` para ações destrutivas) | Rejeitar pedido, remover membro, apagar anúncio |
| **WhatsApp** | Fundo `#25D366`, texto `#FFFFFF`, ícone oficial WhatsApp `18px` | Partilhar convite da turma, disparar anúncio para grupo WhatsApp |

### 6.2 Badges de Status e Papéis (`Badge`)
Formato pill (`rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1`).
- **Papéis:**
  - `Delegado`: Fundo `--color-primary-soft`, texto `--color-primary`, ícone de escudo/coroa.
  - `Subdelegado`: Fundo `--status-info-bg`, texto `--status-info-text`, ícone de estrela.
  - `Colega`: Fundo `--bg-surface-muted`, texto `--text-secondary`.
- **Estados:**
  - `Pendente` / `Por rever`: `--status-warning-bg` + `--status-warning-text`.
  - `Aprovado` / `Visto`: `--status-success-bg` + `--status-success-text`.
  - `Rejeitado` / `Urgente` / `Falta de Professor`: `--status-danger-bg` + `--status-danger-text`.

### 6.3 Cards (`Card`)
- **Card Base:** `bg-surface border border-[var(--border-subtle)] rounded-2xl p-4 shadow-xs`.
- **Card de Anúncio:** Cabeçalho (Badge de prioridade + data relativa + autor) -> Título (`H3`) -> Corpo (`Body`, máx. 3 linhas com "Ver mais" se longo) -> Anexo de imagem opcional -> Rodapé com ações (Partilhar no WhatsApp para Delegado/Subdelegado).
- **Card de Falta:** Avatar/Nome do colega + Data + Disciplina + Badge do motivo (`Doença`, `Trabalho`, `Outro`) + Descrição + Badge de estado (`Pendente` / `Visto`). No Painel do Delegado inclui botão rápido `Marcar como visto` (`44px`).

### 6.4 Navegação Principal (7 Menus -> Mobile Bottom Nav + Desktop Sidebar)
Os 7 menus principais são: **Turma**, **Avisos**, **Informações**, **Faltas**, **Anúncios**, **Sondagem**, **Grupos de Trabalho**.

Para garantir *touch targets* `>= 44px` e labels legíveis em ecrãs de `360px` sem aperto:
- **Mobile Bottom Navigation Bar (5 slots fixos):**
  1. **Turma** (ícone `Users` / `Home`) — resumo da turma, aprovações (delegado), link de convite.
  2. **Anúncios** (ícone `Megaphone`) — feed de anúncios + disparo WhatsApp.
  3. **Faltas** (ícone `CalendarOff` / `ClipboardList`) — enviar falta (colega) / rever faltas (delegado).
  4. **Grupos** (ícone `Layers` / `Boxes`) — grupos de trabalho e vagas.
  5. **Mais** (ícone `Menu` / `Grid`) — abre um **Bottom Sheet** com acesso direto aos restantes módulos (**Avisos**, **Informações**, **Sondagem**) + alternar Dark Mode + Terminar Sessão.
- **Desktop Sidebar (`>= 768px`):** Lista vertical completa com todos os **7 menus** visíveis simultaneamente, sem necessidade do menu "Mais", mais badge de contagem em `Turma` (pedidos pendentes) e `Faltas` (faltas por rever).

### 6.5 Modais e Bottom Sheets (`Modal`)
- **Mobile (`< 768px`):** Apresentado como **Bottom Sheet** ancorado ao fundo (`fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] overflow-y-auto p-5 pb-8`), com barra de arrasto visual (`w-10 h-1 rounded-full bg-[var(--border-strong)] mx-auto mb-4`).
- **Desktop (`>= 768px`):** Modal centrado (`max-w-lg w-full rounded-2xl p-6`), backdrop `bg-slate-950/50 backdrop-blur-xs`.

### 6.6 Formulários & Upload de Imagem
- **Inputs / Selects / Textareas:**
  - Altura mínima `44px` (`h-11` ou `h-12`), `rounded-xl`, fundo `--bg-surface`, borda `1px solid --border-subtle`.
  - Foco: `outline-none ring-2 ring-[var(--color-primary)]/30 border-[var(--color-primary)]`.
  - Erro: borda `#DC2626` + mensagem `text-xs text-[var(--status-danger-text)] mt-1`.
  - Label sempre visível acima do campo (`text-sm font-medium text-[var(--text-primary)] mb-1.5`).
- **Upload de Imagem (`ImageUpload`):**
  - Área clicável (`min-h-[120px] border-2 border-dashed border-[var(--border-strong)] rounded-2xl flex flex-col items-center justify-center gap-2 p-4`).
  - Suporta câmara e galeria em mobile (`accept="image/*"`).
  - Quando há imagem selecionada: exibe preview em `rounded-xl` (`max-h-48 object-cover`), nome/tamanho do ficheiro e botão `Remover` (`44x44px`) no canto superior direito.

### 6.7 Botão de Partilha / Disparo WhatsApp (`WhatsAppShareButton`)
- Estilo dedicado com cor `#25D366`, ícone SVG do WhatsApp e label clara (ex: `"Disparar no WhatsApp"` ou `"Partilhar Convite"`).
- Ao clicar no disparo de anúncio: abre modal/sheet de **Pré-visualização da Mensagem** (mostrando o texto formatado com título, turma e link) com botão principal `"Abrir no WhatsApp"` (`https://wa.me/?text=...`) e botão secundário `"Copiar Texto"`.

### 6.8 Cards de Grupos de Trabalho com Barra de Vagas (`GroupCard`)
- **Cabeçalho:** Nome do grupo (`Grupo 1`, `Grupo 2`...), tema opcional (ex: *"Arquitetura de Software"*), badge do modo (`Alfabético`, `Aleatório`, `Entrada Livre`).
- **Barra de Vagas:**
  - Texto alinhado à esquerda/direita: `3 de 5 vagas preenchidas` (`tabular-nums`).
  - Barra horizontal (`h-2 rounded-full bg-[var(--bg-surface-muted)] overflow-hidden`):
    - `< 80%`: `--color-secondary` (`#0D9488`) ou `--status-success-text`.
    - `80% – 99%`: `--status-warning-text` (`#D97706`).
    - `100% (Lotado)`: `--status-danger-text` (`#DC2626`).
- **Membros:** Lista compacta de chips ou avatares com iniciais.
- **Ação (Entrada Livre):** Botão `Entrar no Grupo` (Primary/Secondary, `44px`), `Sair do Grupo` (Outline/Danger se já estiver dentro), ou estado desativado `Grupo Lotado`.

### 6.9 Sondagens com Barras de Progresso (`PollCard`)
- **Cabeçalho:** Pergunta (`H3`), badge de estado (`Aberta` / `Encerrada`), total de votos (`tabular-nums`) e data limite.
- **Opções (Antes de votar):** Botões em lista vertical (`min-h-[48px] w-full text-left px-4 py-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--color-primary)]`).
- **Opções (Após votar ou Encerrada):**
  - Cada opção mostra uma barra de progresso de fundo (`bg-[var(--color-primary-soft)]` para a opção votada pelo utilizador, `bg-[var(--bg-surface-muted)]` para as restantes), texto da opção + ícone de check na escolhida + percentagem à direita (`64%`).

### 6.10 Feedback Visual & Estados PWA
- **Toasts:** Posicionados acima da Bottom Nav em mobile (`bottom-20 inset-x-4`) e canto superior direito em desktop. Duração `3.5s`.
- **Empty States:** Ícone em círculo suave (`48px`), título curto, descrição de 1 linha e botão CTA (quando aplicável ao papel).
- **Offline / PWA Banner:** Barra discreta no topo quando `navigator.onLine === false` ("Modo offline — a mostrar dados guardados") e prompt opcional de instalação ("Instalar Delegatus no telemóvel").

---

## 7. Arquitetura de Ecrãs e Fluxos

### 7.1 Landing Page (`/`)
1. **Header compacto:** Logótipo `Delegatus` + botão `Entrar` (`Outline`).
2. **Hero Mobile-First:** Headline clara (*"A tua turma organizada num só lugar"*), subtítulo explicando o uso gratuito para delegados universitários e escolares, CTA principal `Criar Turma Grátis` e secundário `Entrar com Convite`.
3. **Grelha de Funcionalidades (4 cards):** Anúncios com disparo WhatsApp, Controlo de Faltas, Grupos de Trabalho com limite de vagas, Sondagens rápidas.
4. **Rodapé simples:** Marca + nota de acesso gratuito PWA.

### 7.2 Autenticação & Onboarding (`/login`, `/register`, `/convite/[codigo]`)
1. **Registo (`/register`):** Nome completo, Email, Password, **Nível de Ensino** (`Universidade`, `Ensino Médio`, `Ensino Fundamental`), **Nome da Escola / Universidade**, **Curso / Turma**.
2. **Escolha Inicial (após registo sem turma):**
   - *Sou Delegado:* Criar nova turma -> gera imediatamente código e botão **Partilhar Link no WhatsApp**.
   - *Sou Colega:* Colar código/link de convite -> envia pedido de entrada -> ecrã de estado **"A aguardar aprovação do Delegado"**.

### 7.3 Estrutura do Painel Autenticado (`/app/...`)
O header indica sempre: **Nome da Turma**, **Instituição** e **Badge do Papel** (`Delegado`, `Subdelegado`, `Colega`), além do sino de notificações.

| Menu | Ecrã / Conteúdo Principal | Ações do Delegado / Subdelegado | Ações do Colega |
| :--- | :--- | :--- | :--- |
| **1. Turma** | Lista de membros, código/link de convite, badge do Subdelegado | Aprovar/Rejeitar pedidos pendentes (com alerta visual), nomear/remover Subdelegado, partilhar convite no WhatsApp | Ver colegas e delegados, copiar/partilhar link se permitido |
| **2. Anúncios** | Feed cronológico de anúncios oficiais (com opção de fixar/urgente e fotos) | Criar/editar/apagar anúncio + **Disparar para WhatsApp** | Ler anúncios, expandir anexos/fotos |
| **3. Avisos** | Avisos rápidos (ex: *Falta de professor*, mudança de sala, lembretes de última hora) | Publicar/remover aviso rápido | Consultar avisos do dia |
| **4. Informações** | Horário semanal da turma, lista de matérias/disciplinas, atividades e tarefas extras, galeria de fotos/imagens | Publicar/editar horário, matérias, tarefas extras e upload de imagens | Consultar horário, matérias, tarefas e partilhar/ver fotos |
| **5. Faltas** | Registos de ausência às aulas | Filtrar por data/estado, rever justificações (Doença, Trabalho, Outro) e marcar como **Visto** | Enviar novo aviso de falta (data, disciplina, motivo, descrição) e acompanhar estado |
| **6. Sondagem** | Lista de votações ativas e encerradas | Criar sondagem (pergunta + 2 a 6 opções), encerrar votação | Votar (1 voto por colega) e visualizar resultados em barras |
| **7. Grupos de Trabalho** | Cards de grupos com tema, modo e barra de vagas | Criar grupos automaticamente (Alfabético / Aleatório) ou criar grupos numerados com tema e limite máximo de vagas | Entrar num grupo com vagas disponíveis (entrada imediata até ao limite) ou sair |

---

## 8. Checklist de Implementação para `@frontender`
- [ ] Aplicar variáveis CSS em `src/styles/globals.css` e configurar `tailwind.config.ts` com fonte `Plus Jakarta Sans` + `JetBrains Mono`.
- [ ] Garantir `min-h-[44px]` e `min-w-[44px]` em todos os elementos clicáveis.
- [ ] Implementar `AppShell` responsivo: Top Bar + Bottom Navigation Bar (`< md` com 4 tabs + "Mais") e Sidebar (`>= md` com os 7 menus).
- [ ] Garantir suporte PWA (`public/manifest.json`, meta tags `apple-mobile-web-app-capable`, `theme-color`, ícones e `sw.js`).
- [ ] Usar Bottom Sheet em mobile (`< md`) e Modal centrado em desktop (`>= md`) para formulários de criação (anúncios, faltas, grupos, sondagens).
