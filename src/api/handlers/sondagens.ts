import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRoles, requireTurmaMember } from '../auth';
import {
  ApiHttpError,
  assertMethod,
  getBody,
  requireNonEmptyString,
  sendOk,
} from '../http';
import { notifyAllTurmaMembers } from '../services/notificacoes';
import { mutateDb, newId, readDb } from '../store';
import type { CreateSondagemInput, Sondagem, SondagemComResultados } from '../types';

function formatSondagem(s: Sondagem, currentUserId: string): SondagemComResultados {
  const totalVotos = s.votos.length;
  const meuVoto = s.votos.find((v) => v.userId === currentUserId);

  return {
    id: s.id,
    turmaId: s.turmaId,
    autorId: s.autorId,
    autorNome: s.autorNome,
    titulo: s.titulo,
    descricao: s.descricao,
    opcoes: s.opcoes.map((opt) => {
      const votosCount = s.votos.filter((v) => v.opcaoId === opt.id).length;
      const percentagem = totalVotos > 0 ? Math.round((votosCount / totalVotos) * 100) : 0;
      return {
        ...opt,
        votosCount,
        percentagem,
      };
    }),
    totalVotos,
    meuVotoOpcaoId: meuVoto ? meuVoto.opcaoId : null,
    encerrada: s.encerrada,
    encerraEm: s.encerraEm,
    createdAt: s.createdAt,
  };
}

export async function handleSondagensCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);

  if (req.method === 'GET') {
    const { user, turmaId } = requireTurmaMember(req);
    const db = readDb();
    const sondagens = db.sondagens
      .filter((s) => s.turmaId === turmaId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((s) => formatSondagem(s, user.id));
    sendOk(res, { sondagens });
    return;
  }

  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<Partial<CreateSondagemInput>>(req);

  const titulo = requireNonEmptyString(body.titulo, 'titulo');
  const rawOpcoes = Array.isArray(body.opcoes)
    ? body.opcoes.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
    : [];

  if (rawOpcoes.length < 2) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'Uma sondagem precisa de pelo menos 2 opções válidas.'
    );
  }

  const nova = mutateDb((db) => {
    const sondagem: Sondagem = {
      id: newId('sond'),
      turmaId,
      autorId: user.id,
      autorNome: user.nome,
      titulo,
      descricao: body.descricao?.trim() || undefined,
      opcoes: rawOpcoes.map((texto) => ({ id: newId('opt'), texto })),
      votos: [],
      encerrada: false,
      encerraEm: body.encerraEm?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    db.sondagens.unshift(sondagem);

    notifyAllTurmaMembers(
      db,
      turmaId,
      {
        tipo: 'nova_sondagem',
        titulo: 'Nova sondagem da turma',
        mensagem: `${user.nome} criou uma sondagem: "${titulo}".`,
        referenciaId: sondagem.id,
      },
      user.id
    );

    return sondagem;
  });

  sendOk(res, { sondagem: formatSondagem(nova, user.id) }, 201);
}

export async function handleSondagemVotar(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['POST']);
  const { user, turmaId } = requireTurmaMember(req);
  const body = getBody<{ opcaoId?: string }>(req);
  const opcaoId = requireNonEmptyString(body.opcaoId, 'opcaoId');

  const updated = mutateDb((db) => {
    const sondagem = db.sondagens.find((s) => s.id === id && s.turmaId === turmaId);
    if (!sondagem) throw new ApiHttpError(404, 'NOT_FOUND', 'Sondagem não encontrada.');
    if (sondagem.encerrada) {
      throw new ApiHttpError(409, 'CONFLICT', 'Esta sondagem já foi encerrada.');
    }
    if (!sondagem.opcoes.some((o) => o.id === opcaoId)) {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'Opção de voto inválida.');
    }
    if (sondagem.votos.some((v) => v.userId === user.id)) {
      throw new ApiHttpError(409, 'CONFLICT', 'Já votaste nesta sondagem.');
    }

    sondagem.votos.push({
      userId: user.id,
      opcaoId,
      createdAt: new Date().toISOString(),
    });
    return sondagem;
  });

  sendOk(res, { sondagem: formatSondagem(updated, user.id) });
}

export async function handleSondagemEncerrar(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['PATCH']);
  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);

  const updated = mutateDb((db) => {
    const sondagem = db.sondagens.find((s) => s.id === id && s.turmaId === turmaId);
    if (!sondagem) throw new ApiHttpError(404, 'NOT_FOUND', 'Sondagem não encontrada.');
    sondagem.encerrada = true;
    return sondagem;
  });

  sendOk(res, { sondagem: formatSondagem(updated, user.id) });
}

export async function handleSondagemDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['DELETE']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);

  mutateDb((db) => {
    const idx = db.sondagens.findIndex((s) => s.id === id && s.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Sondagem não encontrada.');
    db.sondagens.splice(idx, 1);
  });

  sendOk(res, { deletedId: id });
}
