import type {
  AnexoImagem,
  Anuncio,
  ApiResponse,
  AtividadeExtra,
  CategoriaAnexo,
  CreateAnuncioInput,
  CreateFaltaInput,
  CreateGruposInput,
  CreateSondagemInput,
  CreateTurmaInput,
  DiaSemana,
  Falta,
  FaltaProfessor,
  GrupoTrabalho,
  HorarioItem,
  LoginInput,
  Materia,
  MotivoFalta,
  NivelEnsino,
  Notificacao,
  PedidoEntrada,
  RegisterInput,
  SondagemComResultados,
  StatusFalta,
  StatusPedidoEntrada,
  TipoAtividade,
  Turma,
  TurmaConvitePublic,
  UserPublic,
  WhatsappDisparoResult,
} from './types';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) {
    throw new ApiClientError(json.error.code, json.error.message, res.status);
  }
  return json.data;
}

export const apiClient = {
  auth: {
    register: (body: RegisterInput) =>
      request<{ user: UserPublic; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: LoginInput) =>
      request<{ user: UserPublic; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () => request<{ loggedOut: true }>('/api/auth/logout', { method: 'POST' }),
    me: () => request<{ user: UserPublic; turma: Turma | null }>('/api/auth/me'),
    updateMe: (body: {
      nome?: string;
      escolaUniversidade?: string;
      nivelEnsino?: NivelEnsino;
      curso?: string;
    }) =>
      request<{ user: UserPublic }>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  turmas: {
    criar: (body: CreateTurmaInput) =>
      request<{ turma: Turma; user: UserPublic }>('/api/turmas', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    atual: () =>
      request<{ turma: Turma; membros: UserPublic[]; pedidosPendentesCount: number }>(
        '/api/turmas/atual'
      ),
    atualizarAtual: (body: {
      nome?: string;
      curso?: string;
      anoLetivo?: string;
      linkGrupoWhatsapp?: string;
      webhookWhatsapp?: string;
    }) =>
      request<{ turma: Turma }>('/api/turmas/atual', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    convitePublico: (codigo: string) =>
      request<TurmaConvitePublic>(`/api/turmas/convite/${encodeURIComponent(codigo)}`),
    pedirEntrada: (body: { codigoConvite: string; mensagem?: string }) =>
      request<{ pedido: PedidoEntrada }>('/api/turmas/entrar', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listarPedidos: (status?: StatusPedidoEntrada) =>
      request<{ pedidos: PedidoEntrada[] }>(
        `/api/turmas/pedidos${status ? `?status=${status}` : ''}`
      ),
    responderPedido: (pedidoId: string, acao: 'aprovar' | 'rejeitar') =>
      request<{ pedido: PedidoEntrada }>(`/api/turmas/pedidos/${pedidoId}/responder`, {
        method: 'POST',
        body: JSON.stringify({ acao }),
      }),
    gerirSubdelegado: (userId: string, acao: 'nomear' | 'remover') =>
      request<{ membro: UserPublic }>('/api/turmas/subdelegado', {
        method: 'PATCH',
        body: JSON.stringify({ userId, acao }),
      }),
  },

  anuncios: {
    listar: () => request<{ anuncios: Anuncio[] }>('/api/anuncios'),
    criar: (body: CreateAnuncioInput) =>
      request<{ anuncio: Anuncio }>('/api/anuncios', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    atualizar: (id: string, body: Partial<CreateAnuncioInput>) =>
      request<{ anuncio: Anuncio }>(`/api/anuncios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    apagar: (id: string) =>
      request<{ deletedId: string }>(`/api/anuncios/${id}`, { method: 'DELETE' }),
    dispararWhatsapp: (
      id: string,
      body?: { telefoneDestino?: string; dispararWebhook?: boolean }
    ) =>
      request<{ anuncio: Anuncio; whatsapp: WhatsappDisparoResult }>(
        `/api/anuncios/${id}/whatsapp`,
        {
          method: 'POST',
          body: JSON.stringify(body || {}),
        }
      ),
  },

  faltas: {
    listar: (filtros?: {
      status?: StatusFalta;
      motivo?: MotivoFalta;
      data?: string;
      alunoId?: string;
    }) => {
      const params = new URLSearchParams();
      if (filtros?.status) params.set('status', filtros.status);
      if (filtros?.motivo) params.set('motivo', filtros.motivo);
      if (filtros?.data) params.set('data', filtros.data);
      if (filtros?.alunoId) params.set('alunoId', filtros.alunoId);
      const qs = params.toString();
      return request<{ faltas: Falta[] }>(`/api/faltas${qs ? `?${qs}` : ''}`);
    },
    registar: (body: CreateFaltaInput) =>
      request<{ falta: Falta }>('/api/faltas', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    marcarVista: (id: string, notaDelegado?: string) =>
      request<{ falta: Falta }>(`/api/faltas/${id}/visto`, {
        method: 'PATCH',
        body: JSON.stringify({ notaDelegado }),
      }),
  },

  informacoes: {
    resumo: () =>
      request<{
        horario: HorarioItem[];
        materias: Materia[];
        faltasProfessores: FaltaProfessor[];
        atividades: AtividadeExtra[];
        anexos: AnexoImagem[];
      }>('/api/informacoes/resumo'),
    criarHorario: (body: {
      diaSemana: DiaSemana;
      horaInicio: string;
      horaFim: string;
      disciplina: string;
      sala?: string;
      professor?: string;
    }) =>
      request<{ item: HorarioItem }>('/api/informacoes/horario', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    apagarHorario: (id: string) =>
      request<{ deletedId: string }>(`/api/informacoes/horario/${id}`, { method: 'DELETE' }),
    criarMateria: (body: {
      nome: string;
      professor?: string;
      ementaResumo?: string;
      links?: string[];
    }) =>
      request<{ materia: Materia }>('/api/informacoes/materias', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    apagarMateria: (id: string) =>
      request<{ deletedId: string }>(`/api/informacoes/materias/${id}`, { method: 'DELETE' }),
    criarFaltaProfessor: (body: {
      professor: string;
      disciplina: string;
      data: string;
      horario?: string;
      observacao?: string;
    }) =>
      request<{ registo: FaltaProfessor }>('/api/informacoes/faltas-professores', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    apagarFaltaProfessor: (id: string) =>
      request<{ deletedId: string }>(`/api/informacoes/faltas-professores/${id}`, {
        method: 'DELETE',
      }),
    criarAtividade: (body: {
      titulo: string;
      disciplina?: string;
      tipo: TipoAtividade;
      dataEntrega: string;
      descricao: string;
    }) =>
      request<{ atividade: AtividadeExtra }>('/api/informacoes/atividades', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    atualizarAtividade: (
      id: string,
      body: Partial<{
        titulo: string;
        disciplina: string;
        tipo: TipoAtividade;
        dataEntrega: string;
        descricao: string;
        concluida: boolean;
      }>
    ) =>
      request<{ atividade: AtividadeExtra }>(`/api/informacoes/atividades/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    apagarAtividade: (id: string) =>
      request<{ deletedId: string }>(`/api/informacoes/atividades/${id}`, { method: 'DELETE' }),
    criarAnexo: (body: { titulo: string; categoria: CategoriaAnexo; imagemUrl: string }) =>
      request<{ anexo: AnexoImagem }>('/api/informacoes/anexos', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    apagarAnexo: (id: string) =>
      request<{ deletedId: string }>(`/api/informacoes/anexos/${id}`, { method: 'DELETE' }),
  },

  grupos: {
    listar: () => request<{ grupos: GrupoTrabalho[] }>('/api/grupos'),
    criar: (body: CreateGruposInput) =>
      request<{ grupos: GrupoTrabalho[] }>('/api/grupos', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    entrar: (id: string) =>
      request<{ grupo: GrupoTrabalho }>(`/api/grupos/${id}/entrar`, { method: 'POST' }),
    sair: (id: string) =>
      request<{ grupo: GrupoTrabalho }>(`/api/grupos/${id}/sair`, { method: 'POST' }),
    apagar: (id: string) =>
      request<{ deletedId: string }>(`/api/grupos/${id}`, { method: 'DELETE' }),
  },

  sondagens: {
    listar: () => request<{ sondagens: SondagemComResultados[] }>('/api/sondagens'),
    criar: (body: CreateSondagemInput) =>
      request<{ sondagem: SondagemComResultados }>('/api/sondagens', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    votar: (id: string, opcaoId: string) =>
      request<{ sondagem: SondagemComResultados }>(`/api/sondagens/${id}/votar`, {
        method: 'POST',
        body: JSON.stringify({ opcaoId }),
      }),
    encerrar: (id: string) =>
      request<{ sondagem: SondagemComResultados }>(`/api/sondagens/${id}/encerrar`, {
        method: 'PATCH',
      }),
    apagar: (id: string) =>
      request<{ deletedId: string }>(`/api/sondagens/${id}`, { method: 'DELETE' }),
  },

  notificacoes: {
    listar: () =>
      request<{ notificacoes: Notificacao[]; naoLidasCount: number }>('/api/notificacoes'),
    marcarLida: (id: string) =>
      request<{ notificacao: Notificacao }>(`/api/notificacoes/${id}/lida`, {
        method: 'PATCH',
      }),
    lerTodas: () =>
      request<{ atualizadas: number }>('/api/notificacoes/ler-todas', { method: 'POST' }),
  },
};
