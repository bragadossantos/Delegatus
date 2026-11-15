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

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface UserRecord {
  id: string;
  nome: string;
  email: string;
  passwordHash: string;
  escolaUniversidade: string;
  nivelEnsino: NivelEnsino;
  curso: string;
  turmaId: string | null;
  papel: PapelUsuario;
  createdAt: string;
}

export type UserPublic = Omit<UserRecord, 'passwordHash'>;

export interface Turma {
  id: string;
  nome: string;
  escolaUniversidade: string;
  curso: string;
  anoLetivo: string;
  codigoConvite: string;
  delegadoId: string;
  linkGrupoWhatsapp?: string;
  webhookWhatsapp?: string;
  createdAt: string;
}

export interface TurmaConvitePublic {
  id: string;
  nome: string;
  escolaUniversidade: string;
  curso: string;
  codigoConvite: string;
  delegadoNome: string;
  totalMembros: number;
}

export interface PedidoEntrada {
  id: string;
  turmaId: string;
  userId: string;
  userName: string;
  userEmail: string;
  mensagem?: string;
  status: StatusPedidoEntrada;
  respondidoPor?: string;
  respondidoEm?: string;
  createdAt: string;
}

export interface Anuncio {
  id: string;
  turmaId: string;
  autorId: string;
  autorNome: string;
  titulo: string;
  conteudo: string;
  fixado: boolean;
  disparadoWhatsapp: boolean;
  whatsappEnviadoEm?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappDisparoResult {
  textoFormatado: string;
  waMeUrl: string;
  webhookDisparado: boolean;
  webhookStatus?: number;
}

export interface Falta {
  id: string;
  turmaId: string;
  alunoId: string;
  alunoNome: string;
  data: string; // YYYY-MM-DD
  disciplina: string;
  motivo: MotivoFalta;
  descricao: string;
  status: StatusFalta;
  vistoPor?: string;
  vistoPorNome?: string;
  vistoEm?: string;
  notaDelegado?: string;
  createdAt: string;
}

export interface HorarioItem {
  id: string;
  turmaId: string;
  diaSemana: DiaSemana;
  horaInicio: string; // HH:mm
  horaFim: string; // HH:mm
  disciplina: string;
  sala?: string;
  professor?: string;
  createdAt: string;
}

export interface Materia {
  id: string;
  turmaId: string;
  nome: string;
  professor?: string;
  ementaResumo?: string;
  links?: string[];
  createdAt: string;
}

export interface FaltaProfessor {
  id: string;
  turmaId: string;
  professor: string;
  disciplina: string;
  data: string; // YYYY-MM-DD
  horario?: string;
  observacao?: string;
  autorId: string;
  createdAt: string;
}

export interface AtividadeExtra {
  id: string;
  turmaId: string;
  titulo: string;
  disciplina?: string;
  tipo: TipoAtividade;
  dataEntrega: string; // YYYY-MM-DD
  descricao: string;
  concluida: boolean;
  autorId: string;
  createdAt: string;
}

export interface AnexoImagem {
  id: string;
  turmaId: string;
  titulo: string;
  categoria: CategoriaAnexo;
  imagemUrl: string; // data:image/... base64 ou https://...
  autorId: string;
  autorNome: string;
  createdAt: string;
}

export interface GrupoMembro {
  userId: string;
  nome: string;
}

export interface GrupoTrabalho {
  id: string;
  turmaId: string;
  loteId: string;
  nome: string; // ex: "Grupo 1"
  tema?: string;
  disciplina?: string;
  modo: ModoGrupo;
  limiteVagas: number;
  membros: GrupoMembro[];
  createdAt: string;
}

export interface SondagemOpcao {
  id: string;
  texto: string;
}

export interface SondagemVoto {
  userId: string;
  opcaoId: string;
  createdAt: string;
}

export interface Sondagem {
  id: string;
  turmaId: string;
  autorId: string;
  autorNome: string;
  titulo: string;
  descricao?: string;
  opcoes: SondagemOpcao[];
  votos: SondagemVoto[];
  encerrada: boolean;
  encerraEm?: string;
  createdAt: string;
}

export interface SondagemOpcaoResultado extends SondagemOpcao {
  votosCount: number;
  percentagem: number;
}

export interface SondagemComResultados {
  id: string;
  turmaId: string;
  autorId: string;
  autorNome: string;
  titulo: string;
  descricao?: string;
  opcoes: SondagemOpcaoResultado[];
  totalVotos: number;
  meuVotoOpcaoId: string | null;
  encerrada: boolean;
  encerraEm?: string;
  createdAt: string;
}

export interface Notificacao {
  id: string;
  turmaId: string;
  userId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lida: boolean;
  referenciaId?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  turmas: Turma[];
  pedidosEntrada: PedidoEntrada[];
  anuncios: Anuncio[];
  faltas: Falta[];
  horarios: HorarioItem[];
  materias: Materia[];
  faltasProfessores: FaltaProfessor[];
  atividades: AtividadeExtra[];
  anexos: AnexoImagem[];
  grupos: GrupoTrabalho[];
  sondagens: Sondagem[];
  notificacoes: Notificacao[];
}

// DTOs de Request
export interface RegisterInput {
  nome: string;
  email: string;
  password: string;
  escolaUniversidade: string;
  nivelEnsino: NivelEnsino;
  curso: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateTurmaInput {
  nome: string;
  escolaUniversidade?: string;
  curso?: string;
  anoLetivo?: string;
  linkGrupoWhatsapp?: string;
  webhookWhatsapp?: string;
}

export interface CreateAnuncioInput {
  titulo: string;
  conteudo: string;
  fixado?: boolean;
}

export interface CreateFaltaInput {
  data: string;
  disciplina: string;
  motivo: MotivoFalta;
  descricao: string;
}

export type CreateGruposInput =
  | {
      modo: 'alfabetico' | 'aleatorio';
      disciplina?: string;
      temaBase?: string;
      tamanhoGrupo: number;
    }
  | {
      modo: 'livre';
      disciplina?: string;
      quantidadeGrupos: number;
      limiteVagas: number;
      temas?: string[];
    };

export interface CreateSondagemInput {
  titulo: string;
  descricao?: string;
  opcoes: string[];
  encerraEm?: string;
}
