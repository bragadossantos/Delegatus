import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../auth';
import { ApiHttpError, assertMethod, sendOk } from '../http';
import { mutateDb, readDb } from '../store';

export async function handleNotificacoesCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET']);
  const user = requireAuth(req);
  const db = readDb();

  const notificacoes = db.notificacoes
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const naoLidasCount = notificacoes.filter((n) => !n.lida).length;
  sendOk(res, { notificacoes, naoLidasCount });
}

export async function handleNotificacaoLida(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['PATCH']);
  const user = requireAuth(req);

  const notificacao = mutateDb((db) => {
    const target = db.notificacoes.find((n) => n.id === id && n.userId === user.id);
    if (!target) throw new ApiHttpError(404, 'NOT_FOUND', 'Notificação não encontrada.');
    target.lida = true;
    return target;
  });

  sendOk(res, { notificacao });
}

export async function handleNotificacoesLerTodas(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['POST']);
  const user = requireAuth(req);

  const atualizadas = mutateDb((db) => {
    let count = 0;
    for (const n of db.notificacoes) {
      if (n.userId === user.id && !n.lida) {
        n.lida = true;
        count++;
      }
    }
    return count;
  });

  sendOk(res, { atualizadas });
}
