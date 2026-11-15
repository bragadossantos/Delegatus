import crypto from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRoles, requireTurmaMember } from '../auth';
import { ApiHttpError, assertMethod, getBody, sendOk } from '../http';
import { notifyAllTurmaMembers } from '../services/notificacoes';
import { mutateDb, newId, readDb } from '../store';
import type { CreateGruposInput, GrupoTrabalho } from '../types';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function handleGruposCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);

  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    const grupos = db.grupos.filter((g) => g.turmaId === turmaId);
    sendOk(res, { grupos });
    return;
  }

  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<CreateGruposInput>(req);

  if (!body.modo || !['alfabetico', 'aleatorio', 'livre'].includes(body.modo)) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'O campo "modo" deve ser "alfabetico", "aleatorio" ou "livre".'
    );
  }

  const modo = body.modo;

  const criados = mutateDb((db) => {
    const loteId = newId('lote');
    const now = new Date().toISOString();
    const novosGrupos: GrupoTrabalho[] = [];

    if (body.modo === 'livre') {
      const quantidadeGrupos = Number(body.quantidadeGrupos);
      const limiteVagas = Number(body.limiteVagas);

      if (!Number.isInteger(quantidadeGrupos) || quantidadeGrupos < 1 || quantidadeGrupos > 50) {
        throw new ApiHttpError(
          400,
          'VALIDATION_ERROR',
          'quantidadeGrupos deve ser um inteiro entre 1 e 50.'
        );
      }
      if (!Number.isInteger(limiteVagas) || limiteVagas < 1 || limiteVagas > 100) {
        throw new ApiHttpError(
          400,
          'VALIDATION_ERROR',
          'limiteVagas deve ser um inteiro entre 1 e 100.'
        );
      }

      const temas = Array.isArray(body.temas) ? body.temas : [];
      for (let i = 0; i < quantidadeGrupos; i++) {
        novosGrupos.push({
          id: newId('grp'),
          turmaId,
          loteId,
          nome: `Grupo ${i + 1}`,
          tema: typeof temas[i] === 'string' && temas[i].trim() ? temas[i].trim() : undefined,
          disciplina: body.disciplina?.trim() || undefined,
          modo: 'livre',
          limiteVagas,
          membros: [],
          createdAt: now,
        });
      }
    } else {
      const tamanhoGrupo = Number(body.tamanhoGrupo);
      if (!Number.isInteger(tamanhoGrupo) || tamanhoGrupo < 1 || tamanhoGrupo > 50) {
        throw new ApiHttpError(
          400,
          'VALIDATION_ERROR',
          'tamanhoGrupo deve ser um inteiro entre 1 e 50.'
        );
      }

      const membrosTurma = db.users
        .filter((u) => u.turmaId === turmaId)
        .map((u) => ({ userId: u.id, nome: u.nome }));

      if (membrosTurma.length === 0) {
        throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Não há membros na turma para agrupar.');
      }

      const ordenados =
        modo === 'alfabetico'
          ? [...membrosTurma].sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
          : shuffleArray(membrosTurma);

      let grupoIdx = 1;
      for (let i = 0; i < ordenados.length; i += tamanhoGrupo) {
        const slice = ordenados.slice(i, i + tamanhoGrupo);
        novosGrupos.push({
          id: newId('grp'),
          turmaId,
          loteId,
          nome: `Grupo ${grupoIdx}`,
          tema: body.temaBase?.trim() ? `${body.temaBase.trim()} #${grupoIdx}` : undefined,
          disciplina: body.disciplina?.trim() || undefined,
          modo,
          limiteVagas: tamanhoGrupo,
          membros: slice,
          createdAt: now,
        });
        grupoIdx++;
      }
    }

    db.grupos.push(...novosGrupos);

    notifyAllTurmaMembers(
      db,
      turmaId,
      {
        tipo: 'novo_grupo',
        titulo: 'Novos Grupos de Trabalho',
        mensagem:
          body.modo === 'livre'
            ? `${user.nome} criou ${novosGrupos.length} grupos de entrada livre. Escolhe o teu!`
            : `${user.nome} gerou ${novosGrupos.length} grupos (${body.modo}).`,
        referenciaId: loteId,
      },
      user.id
    );

    return novosGrupos;
  });

  sendOk(res, { grupos: criados }, 201);
}

export async function handleGrupoEntrar(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['POST']);
  const { user, turmaId } = requireTurmaMember(req);

  const grupo = mutateDb((db) => {
    const target = db.grupos.find((g) => g.id === id && g.turmaId === turmaId);
    if (!target) throw new ApiHttpError(404, 'NOT_FOUND', 'Grupo não encontrado.');

    if (target.membros.some((m) => m.userId === user.id)) {
      throw new ApiHttpError(409, 'CONFLICT', 'Já fazes parte deste grupo.');
    }

    if (target.membros.length >= target.limiteVagas) {
      throw new ApiHttpError(409, 'CONFLICT', 'Este grupo já atingiu o limite de vagas.');
    }

    target.membros.push({ userId: user.id, nome: user.nome });
    return target;
  });

  sendOk(res, { grupo });
}

export async function handleGrupoSair(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['POST']);
  const { user, turmaId } = requireTurmaMember(req);

  const grupo = mutateDb((db) => {
    const target = db.grupos.find((g) => g.id === id && g.turmaId === turmaId);
    if (!target) throw new ApiHttpError(404, 'NOT_FOUND', 'Grupo não encontrado.');

    const idx = target.membros.findIndex((m) => m.userId === user.id);
    if (idx === -1) {
      throw new ApiHttpError(409, 'CONFLICT', 'Não fazes parte deste grupo.');
    }
    target.membros.splice(idx, 1);
    return target;
  });

  sendOk(res, { grupo });
}

export async function handleGrupoDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['DELETE']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);

  mutateDb((db) => {
    const idx = db.grupos.findIndex((g) => g.id === id && g.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Grupo não encontrado.');
    db.grupos.splice(idx, 1);
  });

  sendOk(res, { deletedId: id });
}
