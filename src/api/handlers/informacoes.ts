import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRoles, requireTurmaMember } from '../auth';
import {
  ApiHttpError,
  assertMethod,
  getBody,
  requireNonEmptyString,
  sendOk,
} from '../http';
import { mutateDb, newId, readDb } from '../store';
import type { CategoriaAnexo, DiaSemana, TipoAtividade } from '../types';

const VALID_DIAS: DiaSemana[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const VALID_TIPOS_ATIV: TipoAtividade[] = ['trabalho', 'prova', 'evento', 'tarefa_extra'];
const VALID_CATEGORIAS_ANEXO: CategoriaAnexo[] = [
  'quadro',
  'horario',
  'evento',
  'material',
  'outro',
];

export async function handleInformacoesResumo(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET']);
  const { turmaId } = requireTurmaMember(req);
  const db = readDb();

  sendOk(res, {
    horario: db.horarios.filter((h) => h.turmaId === turmaId),
    materias: db.materias.filter((m) => m.turmaId === turmaId),
    faltasProfessores: db.faltasProfessores
      .filter((fp) => fp.turmaId === turmaId)
      .sort((a, b) => b.data.localeCompare(a.data)),
    atividades: db.atividades
      .filter((a) => a.turmaId === turmaId)
      .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega)),
    anexos: db.anexos
      .filter((an) => an.turmaId === turmaId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

// --- HORÁRIO ---
export async function handleHorarioCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);
  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    sendOk(res, { horario: db.horarios.filter((h) => h.turmaId === turmaId) });
    return;
  }

  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<{
    diaSemana?: DiaSemana;
    horaInicio?: string;
    horaFim?: string;
    disciplina?: string;
    sala?: string;
    professor?: string;
  }>(req);

  const diaSemana = body.diaSemana;
  if (!diaSemana || !VALID_DIAS.includes(diaSemana)) {
    throw new ApiHttpError(400, 'VALIDATION_ERROR', 'diaSemana inválido.');
  }
  const horaInicio = requireNonEmptyString(body.horaInicio, 'horaInicio');
  const horaFim = requireNonEmptyString(body.horaFim, 'horaFim');
  const disciplina = requireNonEmptyString(body.disciplina, 'disciplina');

  const item = mutateDb((db) => {
    const novo = {
      id: newId('hor'),
      turmaId,
      diaSemana,
      horaInicio,
      horaFim,
      disciplina,
      sala: body.sala?.trim() || undefined,
      professor: body.professor?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    db.horarios.push(novo);
    return novo;
  });

  sendOk(res, { item }, 201);
}

export async function handleHorarioDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['DELETE']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  mutateDb((db) => {
    const idx = db.horarios.findIndex((h) => h.id === id && h.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Horário não encontrado.');
    db.horarios.splice(idx, 1);
  });
  sendOk(res, { deletedId: id });
}

// --- MATÉRIAS ---
export async function handleMateriasCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);
  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    sendOk(res, { materias: db.materias.filter((m) => m.turmaId === turmaId) });
    return;
  }

  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<{
    nome?: string;
    professor?: string;
    ementaResumo?: string;
    links?: string[];
  }>(req);

  const nome = requireNonEmptyString(body.nome, 'nome');
  const materia = mutateDb((db) => {
    const nova = {
      id: newId('mat'),
      turmaId,
      nome,
      professor: body.professor?.trim() || undefined,
      ementaResumo: body.ementaResumo?.trim() || undefined,
      links: Array.isArray(body.links)
        ? body.links.filter((l) => typeof l === 'string' && l.trim().length > 0)
        : undefined,
      createdAt: new Date().toISOString(),
    };
    db.materias.push(nova);
    return nova;
  });

  sendOk(res, { materia }, 201);
}

export async function handleMateriaDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['DELETE']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  mutateDb((db) => {
    const idx = db.materias.findIndex((m) => m.id === id && m.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Matéria não encontrada.');
    db.materias.splice(idx, 1);
  });
  sendOk(res, { deletedId: id });
}

// --- FALTA DE PROFESSORES ---
export async function handleFaltasProfessoresCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);
  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    const faltasProfessores = db.faltasProfessores
      .filter((fp) => fp.turmaId === turmaId)
      .sort((a, b) => b.data.localeCompare(a.data));
    sendOk(res, { faltasProfessores });
    return;
  }

  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<{
    professor?: string;
    disciplina?: string;
    data?: string;
    horario?: string;
    observacao?: string;
  }>(req);

  const professor = requireNonEmptyString(body.professor, 'professor');
  const disciplina = requireNonEmptyString(body.disciplina, 'disciplina');
  const data = requireNonEmptyString(body.data, 'data');

  const registo = mutateDb((db) => {
    const novo = {
      id: newId('fp'),
      turmaId,
      professor,
      disciplina,
      data,
      horario: body.horario?.trim() || undefined,
      observacao: body.observacao?.trim() || undefined,
      autorId: user.id,
      createdAt: new Date().toISOString(),
    };
    db.faltasProfessores.unshift(novo);
    return novo;
  });

  sendOk(res, { registo }, 201);
}

export async function handleFaltaProfessorDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['DELETE']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  mutateDb((db) => {
    const idx = db.faltasProfessores.findIndex((fp) => fp.id === id && fp.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Registo não encontrado.');
    db.faltasProfessores.splice(idx, 1);
  });
  sendOk(res, { deletedId: id });
}

// --- ATIVIDADES / TAREFAS EXTRAS ---
export async function handleAtividadesCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);
  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    const atividades = db.atividades
      .filter((a) => a.turmaId === turmaId)
      .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega));
    sendOk(res, { atividades });
    return;
  }

  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<{
    titulo?: string;
    disciplina?: string;
    tipo?: TipoAtividade;
    dataEntrega?: string;
    descricao?: string;
  }>(req);

  const titulo = requireNonEmptyString(body.titulo, 'titulo');
  const dataEntrega = requireNonEmptyString(body.dataEntrega, 'dataEntrega');
  const descricao = requireNonEmptyString(body.descricao, 'descricao');
  const tipo: TipoAtividade =
    body.tipo && VALID_TIPOS_ATIV.includes(body.tipo) ? body.tipo : 'tarefa_extra';

  const atividade = mutateDb((db) => {
    const nova = {
      id: newId('ativ'),
      turmaId,
      titulo,
      disciplina: body.disciplina?.trim() || undefined,
      tipo,
      dataEntrega,
      descricao,
      concluida: false,
      autorId: user.id,
      createdAt: new Date().toISOString(),
    };
    db.atividades.push(nova);
    return nova;
  });

  sendOk(res, { atividade }, 201);
}

export async function handleAtividadeItem(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['PATCH', 'DELETE']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);

  if (req.method === 'PATCH') {
    const body = getBody<{
      titulo?: string;
      disciplina?: string;
      tipo?: TipoAtividade;
      dataEntrega?: string;
      descricao?: string;
      concluida?: boolean;
    }>(req);

    const atividade = mutateDb((db) => {
      const target = db.atividades.find((a) => a.id === id && a.turmaId === turmaId);
      if (!target) throw new ApiHttpError(404, 'NOT_FOUND', 'Atividade não encontrada.');
      if (typeof body.titulo === 'string' && body.titulo.trim()) target.titulo = body.titulo.trim();
      if (typeof body.disciplina === 'string') target.disciplina = body.disciplina.trim() || undefined;
      if (body.tipo && VALID_TIPOS_ATIV.includes(body.tipo)) target.tipo = body.tipo;
      if (typeof body.dataEntrega === 'string' && body.dataEntrega.trim()) {
        target.dataEntrega = body.dataEntrega.trim();
      }
      if (typeof body.descricao === 'string' && body.descricao.trim()) {
        target.descricao = body.descricao.trim();
      }
      if (typeof body.concluida === 'boolean') target.concluida = body.concluida;
      return target;
    });

    sendOk(res, { atividade });
    return;
  }

  mutateDb((db) => {
    const idx = db.atividades.findIndex((a) => a.id === id && a.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Atividade não encontrada.');
    db.atividades.splice(idx, 1);
  });
  sendOk(res, { deletedId: id });
}

// --- FOTOS / IMAGENS / ANEXOS ---
export async function handleAnexosCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);
  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    const anexos = db.anexos
      .filter((a) => a.turmaId === turmaId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    sendOk(res, { anexos });
    return;
  }

  const { user, turmaId } = requireTurmaMember(req);
  const body = getBody<{
    titulo?: string;
    categoria?: CategoriaAnexo;
    imagemUrl?: string;
  }>(req);

  const titulo = requireNonEmptyString(body.titulo, 'titulo');
  const imagemUrl = requireNonEmptyString(body.imagemUrl, 'imagemUrl');
  const categoria: CategoriaAnexo =
    body.categoria && VALID_CATEGORIAS_ANEXO.includes(body.categoria)
      ? body.categoria
      : 'outro';

  if (
    !imagemUrl.startsWith('data:image/') &&
    !imagemUrl.startsWith('https://') &&
    !imagemUrl.startsWith('http://') &&
    !imagemUrl.startsWith('/')
  ) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'imagemUrl deve ser uma imagem base64 (data:image/...) ou URL válida.'
    );
  }

  const anexo = mutateDb((db) => {
    const novo = {
      id: newId('anx'),
      turmaId,
      titulo,
      categoria,
      imagemUrl,
      autorId: user.id,
      autorNome: user.nome,
      createdAt: new Date().toISOString(),
    };
    db.anexos.unshift(novo);
    return novo;
  });

  sendOk(res, { anexo }, 201);
}

export async function handleAnexoDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['DELETE']);
  const { user, turmaId } = requireTurmaMember(req);

  mutateDb((db) => {
    const idx = db.anexos.findIndex((a) => a.id === id && a.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Imagem/anexo não encontrado.');
    const target = db.anexos[idx];
    const isGestor = user.papel === 'delegado' || user.papel === 'subdelegado';
    if (!isGestor && target.autorId !== user.id) {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Apenas o autor ou delegado pode apagar este anexo.');
    }
    db.anexos.splice(idx, 1);
  });

  sendOk(res, { deletedId: id });
}
