# Contratos da API — Delegatus

Este documento define os tipos TypeScript, endpoints REST (Next.js Pages Router API Routes), payloads de request/response, autenticação e códigos de erro da plataforma **Delegatus**.

Todos os tipos aqui descritos estão implementados e exportados em [`src/api/types.ts`](../src/api/types.ts).

---

## 1. Convenções Gerais

- **Base URL:** `/api`
- **Content-Type:** `application/json`
- **Autenticação:** Cookie `HttpOnly` (`delegatus_token`) **ou** header `Authorization: Bearer <token>`.
- **Formato de Resposta Padrão:**
  - **Sucesso:** `{ ok: true, data: T }`
  - **Erro:** `{ ok: false, error: { code: ApiErrorCode, message: string, details?: unknown } }`

### Códigos de Erro (`ApiErrorCode`)

| HTTP | Código | Descrição |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Campos em falta ou inválidos |
| 401 | `UNAUTHORIZED` | Sessão ausente, expirada ou credenciais inválidas |
| 403 | `FORBIDDEN` | Sem permissão para esta ação (ex: requer papel `delegado`) |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `CONFLICT` | Conflito de estado (email duplicado, voto duplicado, grupo cheio, etc.) |
| 405 | `METHOD_NOT_ALLOWED` | Método HTTP não suportado neste endpoint |
| 500 | `INTERNAL_ERROR` | Erro interno inesperado |

---

## 2. Modelos e Tipos TypeScript

```ts
export type PapelUsuario = 'delegado' | 'subdelegado' | 'colega';
export type NivelEnsino = 'fundamental' | 'medio' | 'universitario';
export type MotivoFalta = 'doenca' | 'trabalho' | 'outro';
export type StatusFalta = 'pendente' | 'visto';
export type StatusPedidoEntrada = 'pendente' | 'aprovado' | 'rejeitado';
export type ModoGrupo = 'alfabetico' | 'aleatorio' | 'livre';
export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
export type TipoAtividade = 'trabalho' | 'prova' | 'evento' | 'tarefa_extra';
export type CategoriaAnexo = 'quadro' | 'horario' | 'evento' | 'material' | 'outro';
export type TipoNotificacao =
  | 'pedido_entrada'
  | 'entrada_aprovada'
  | 'entrada_rejeitada'
  | 'nova_falta'
  | 'falta_vista'
  | 'novo_anuncio'
  | 'nova_sondagem'
  | 'novo_grupo'
  | 'nomeacao_subdelegado';
```

---

## 3. Endpoints

### 3.1 Autenticação (`/api/auth/*`)

- **`POST /api/auth/register`**
  - Body: `{ nome, email, password, escolaUniversidade, nivelEnsino, curso }`
  - Response `201`: `{ user: UserPublic, token: string }` (define cookie `delegatus_token`)
- **`POST /api/auth/login`**
  - Body: `{ email, password }`
  - Response `200`: `{ user: UserPublic, token: string }` (define cookie `delegatus_token`)
- **`POST /api/auth/logout`**
  - Response `200`: `{ loggedOut: true }` (limpa cookie)
- **`GET /api/auth/me`**
  - Auth: Obrigatória
  - Response `200`: `{ user: UserPublic, turma: Turma | null }`
- **`PATCH /api/auth/me`**
  - Auth: Obrigatória
  - Body: `{ nome?, escolaUniversidade?, nivelEnsino?, curso? }`
  - Response `200`: `{ user: UserPublic }`

### 3.2 Turmas (`/api/turmas/*`)

- **`POST /api/turmas`** (Cria turma e promove o utilizador a `delegado`)
  - Auth: Obrigatória
  - Body: `{ nome, escolaUniversidade?, curso?, anoLetivo?, linkGrupoWhatsapp?, webhookWhatsapp? }`
  - Response `201`: `{ turma: Turma, user: UserPublic }`
- **`GET /api/turmas/atual`**
  - Auth: Obrigatória
  - Response `200`: `{ turma: Turma, membros: UserPublic[], pedidosPendentesCount: number }`
- **`PATCH /api/turmas/atual`** (Delegado atualiza dados/integração WhatsApp da turma)
  - Auth: `delegado`
  - Body: `{ nome?, curso?, anoLetivo?, linkGrupoWhatsapp?, webhookWhatsapp? }`
  - Response `200`: `{ turma: Turma }`
- **`GET /api/turmas/convite/:codigo`** (Pré-visualização pública do convite)
  - Auth: Opcional
  - Response `200`: `{ id, nome, escolaUniversidade, curso, codigoConvite, delegadoNome, totalMembros }`
- **`POST /api/turmas/entrar`** (Colega pede entrada na turma via código)
  - Auth: Obrigatória
  - Body: `{ codigoConvite, mensagem? }`
  - Response `201`: `{ pedido: PedidoEntrada }`
- **`GET /api/turmas/pedidos`** (Lista pedidos de entrada da turma)
  - Auth: `delegado` | `subdelegado`
  - Query: `?status=pendente|aprovado|rejeitado`
  - Response `200`: `{ pedidos: PedidoEntrada[] }`
- **`POST /api/turmas/pedidos/:pedidoId/responder`**
  - Auth: `delegado` | `subdelegado`
  - Body: `{ acao: 'aprovar' | 'rejeitar' }`
  - Response `200`: `{ pedido: PedidoEntrada }`
- **`PATCH /api/turmas/subdelegado`**
  - Auth: `delegado`
  - Body: `{ userId: string, acao: 'nomear' | 'remover' }`
  - Response `200`: `{ membro: UserPublic }`

### 3.3 Anúncios & WhatsApp (`/api/anuncios/*`)

- **`GET /api/anuncios`**
  - Auth: Membro aprovado da turma
  - Response `200`: `{ anuncios: Anuncio[] }`
- **`POST /api/anuncios`**
  - Auth: `delegado` | `subdelegado`
  - Body: `{ titulo, conteudo, fixado?: boolean }`
  - Response `201`: `{ anuncio: Anuncio }`
- **`PATCH /api/anuncios/:id`**
  - Auth: `delegado` | `subdelegado`
  - Body: `{ titulo?, conteudo?, fixado? }`
  - Response `200`: `{ anuncio: Anuncio }`
- **`DELETE /api/anuncios/:id`**
  - Auth: `delegado` | `subdelegado`
  - Response `200`: `{ deletedId: string }`
- **`POST /api/anuncios/:id/whatsapp`**
  - Auth: `delegado` | `subdelegado`
  - Body?: `{ telefoneDestino?: string, dispararWebhook?: boolean }`
  - Response `200`: `{ anuncio: Anuncio, whatsapp: { textoFormatado: string, waMeUrl: string, webhookDisparado: boolean, webhookStatus?: number } }`

### 3.4 Faltas / Avisos de Falta (`/api/faltas/*`)

- **`GET /api/faltas`**
  - Auth: Membro aprovado da turma (Delegado/Subdelegado vê todas da turma; Colega vê apenas as suas)
  - Query: `?status=pendente|visto&motivo=doenca|trabalho|outro&data=YYYY-MM-DD&alunoId=...`
  - Response `200`: `{ faltas: Falta[] }`
- **`POST /api/faltas`**
  - Auth: Membro aprovado da turma
  - Body: `{ data: string, disciplina: string, motivo: MotivoFalta, descricao: string }`
  - Response `201`: `{ falta: Falta }`
- **`PATCH /api/faltas/:id/visto`**
  - Auth: `delegado` | `subdelegado`
  - Body?: `{ notaDelegado?: string }`
  - Response `200`: `{ falta: Falta }`

### 3.5 Informações, Horário, Atividades & Fotos (`/api/informacoes/*`)

- **`GET /api/informacoes/resumo`**
  - Auth: Membro aprovado da turma
  - Response `200`: `{ horario: HorarioItem[], materias: Materia[], faltasProfessores: FaltaProfessor[], atividades: AtividadeExtra[], anexos: AnexoImagem[] }`
- **`GET /api/informacoes/horario`** / **`POST /api/informacoes/horario`** (`delegado` | `subdelegado`) / **`DELETE /api/informacoes/horario/:id`** (`delegado` | `subdelegado`)
- **`GET /api/informacoes/materias`** / **`POST /api/informacoes/materias`** (`delegado` | `subdelegado`) / **`DELETE /api/informacoes/materias/:id`** (`delegado` | `subdelegado`)
- **`GET /api/informacoes/faltas-professores`** / **`POST /api/informacoes/faltas-professores`** (`delegado` | `subdelegado`) / **`DELETE /api/informacoes/faltas-professores/:id`** (`delegado` | `subdelegado`)
- **`GET /api/informacoes/atividades`** / **`POST /api/informacoes/atividades`** (`delegado` | `subdelegado`) / **`PATCH /api/informacoes/atividades/:id`** (`delegado` | `subdelegado`) / **`DELETE /api/informacoes/atividades/:id`** (`delegado` | `subdelegado`)
- **`GET /api/informacoes/anexos`** / **`POST /api/informacoes/anexos`** (qualquer membro aprovado) / **`DELETE /api/informacoes/anexos/:id`** (autor ou `delegado` | `subdelegado`)

### 3.6 Grupos de Trabalho (`/api/grupos/*`)

- **`GET /api/grupos`**
  - Auth: Membro aprovado da turma
  - Response `200`: `{ grupos: GrupoTrabalho[] }`
- **`POST /api/grupos`**
  - Auth: `delegado` | `subdelegado`
  - Body:
    - Modo `alfabetico` ou `aleatorio`: `{ modo: 'alfabetico' | 'aleatorio', disciplina?: string, temaBase?: string, tamanhoGrupo: number }`
    - Modo `livre`: `{ modo: 'livre', disciplina?: string, quantidadeGrupos: number, limiteVagas: number, temas?: string[] }`
  - Response `201`: `{ grupos: GrupoTrabalho[] }`
- **`POST /api/grupos/:id/entrar`**
  - Auth: Membro aprovado da turma
  - Response `200`: `{ grupo: GrupoTrabalho }` (Erro `409` se grupo cheio ou já inscrito)
- **`POST /api/grupos/:id/sair`**
  - Auth: Membro aprovado da turma
  - Response `200`: `{ grupo: GrupoTrabalho }`
- **`DELETE /api/grupos/:id`**
  - Auth: `delegado` | `subdelegado`
  - Response `200`: `{ deletedId: string }`

### 3.7 Sondagens (`/api/sondagens/*`)

- **`GET /api/sondagens`**
  - Auth: Membro aprovado da turma
  - Response `200`: `{ sondagens: SondagemComResultados[] }`
- **`POST /api/sondagens`**
  - Auth: `delegado` | `subdelegado`
  - Body: `{ titulo, descricao?, opcoes: string[], encerraEm?: string }`
  - Response `201`: `{ sondagem: SondagemComResultados }`
- **`POST /api/sondagens/:id/votar`**
  - Auth: Membro aprovado da turma
  - Body: `{ opcaoId: string }`
  - Response `200`: `{ sondagem: SondagemComResultados }` (Erro `409` se já votou ou sondagem encerrada)
- **`PATCH /api/sondagens/:id/encerrar`**
  - Auth: `delegado` | `subdelegado`
  - Response `200`: `{ sondagem: SondagemComResultados }`
- **`DELETE /api/sondagens/:id`**
  - Auth: `delegado` | `subdelegado`
  - Response `200`: `{ deletedId: string }`

### 3.8 Notificações (`/api/notificacoes/*`)

- **`GET /api/notificacoes`**
  - Auth: Obrigatória
  - Response `200`: `{ notificacoes: Notificacao[], naoLidasCount: number }`
- **`PATCH /api/notificacoes/:id/lida`**
  - Auth: Obrigatória
  - Response `200`: `{ notificacao: Notificacao }`
- **`POST /api/notificacoes/ler-todas`**
  - Auth: Obrigatória
  - Response `200`: `{ atualizadas: number }`

---

## 4. Ligação Next.js Pages Router & Cliente Tipado

- **Catch-all Next.js API Route (`src/pages/api/[[...path]].ts`):**
  ```ts
  import type { NextApiRequest, NextApiResponse } from 'next';
  import { handleApiRequest } from '@/api/router';

  export const config = {
    api: {
      bodyParser: {
        sizeLimit: '8mb', // suporta upload de imagens base64
      },
    },
  };

  export default function handler(req: NextApiRequest, res: NextApiResponse) {
    return handleApiRequest(req, res);
  }
  ```
- **Cliente Frontend Tipado:** Importar `apiClient` de `@/api/client` (`src/api/client.ts`) para chamadas tipadas em todos os ecrãs.
- **Contas de Demonstração (Seed automático em `.data/delegatus-db.json`):**
  - Delegado: `delegado@delegatus.app` / `123456`
  - Subdelegado: `subdelegado@delegatus.app` / `123456`
  - Colegas: `carla@delegatus.app` / `123456`, `diogo@delegatus.app` / `123456`
  - Código de convite da turma demo: `LEIC2A`

