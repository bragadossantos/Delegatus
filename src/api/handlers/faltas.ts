import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRoles, requireTurmaMember } from '../auth';
import {
  ApiHttpError,
  assertMethod,
  getBody,
  requireNonEmptyString,
  sendOk,
} from '../http';
import { notifyTurmaByRoles, pushNotification } from '../services/notificacoes';
import { mutateDb, newId, readDb } from '../store';
import type { CreateFaltaInput, MotivoFalta, StatusFalta } from '../types';

const VALID_MOTIVOS: MotivoFalta[] = ['doenca', 'trabalho', 'outro'];

const MOTIVO_LABELS: Record<MotivoFalta, string> = {
  doenca: 'Doença',
  trabalho: 'Trabalho',
  outro: 'Outro',
};

export async function handleFaltasCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);

  if (req.method === 'GET') {
    const { user, turmaId } = requireTurmaMember(req);
    const db = readDb();

    let faltas = db.faltas.filter((f) => f.turmaId === turmaId);

    // Colega vê apenas as suas próprias faltas; delegado/subdelegado vê todas
    if (user.papel === 'colega') {
      faltas = faltas.filter((f) => f.alunoId === user.id);
    } else if (typeof req.query.alunoId === 'string' && req.query.alunoId) {
      faltas = faltas.filter((f) => f.alunoId === req.query.alunoId);
    }

    const status = req.query.status as StatusFalta | undefined;
    if (status && ['pendente', 'visto'].includes(status)) {
      faltas = faltas.filter((f) => f.status === status);
    }

    const motivo = req.query.motivo as MotivoFalta | undefined;
    if (motivo && VALID_MOTIVOS.includes(motivo)) {
      faltas = faltas.filter((f) => f.motivo === motivo);
    }

    if (typeof req.query.data === 'string' && req.query.data) {
      faltas = faltas.filter((f) => f.data === req.query.data);
    }

    faltas = [...faltas].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    sendOk(res, { faltas });
    return;
  }

  const { user, turmaId } = requireTurmaMember(req);
  const body = getBody<Partial<CreateFaltaInput>>(req);

  const data = requireNonEmptyString(body.data, 'data');
  const disciplina = requireNonEmptyString(body.disciplina, 'disciplina');
  const descricao = requireNonEmptyString(body.descricao, 'descricao');
  const motivo: MotivoFalta =
    body.motivo && VALID_MOTIVOS.includes(body.motivo) ? body.motivo : 'outro';

  const falta = mutateDb((db) => {
    const nova = {
      id: newId('falta'),
      turmaId,
      alunoId: user.id,
      alunoNome: user.nome,
      data,
      disciplina,
      motivo,
      descricao,
      status: 'pendente' as const,
      createdAt: new Date().toISOString(),
    };
    db.faltas.unshift(nova);

    notifyTurmaByRoles(
      db,
      turmaId,
      ['delegado', 'subdelegado'],
      {
        tipo: 'nova_falta',
        titulo: 'Novo aviso de falta',
        mensagem: `${user.nome} registou falta em ${disciplina} (${MOTIVO_LABELS[motivo]}).`,
        referenciaId: nova.id,
      },
      user.id
    );

    return nova;
  });

  sendOk(res, { falta }, 201);
}

export async function handleFaltaVisto(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['PATCH']);
  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<{ notaDelegado?: string }>(req);

  const falta = mutateDb((db) => {
    const target = db.faltas.find((f) => f.id === id && f.turmaId === turmaId);
    if (!target) throw new ApiHttpError(404, 'NOT_FOUND', 'Aviso de falta não encontrado.');

    target.status = 'visto';
    target.vistoPor = user.id;
    target.vistoPorNome = user.nome;
    target.vistoEm = new Date().toISOString();
    if (typeof body.notaDelegado === 'string' && body.notaDelegado.trim()) {
      target.notaDelegado = body.notaDelegado.trim();
    }

    if (target.alunoId !== user.id) {
      pushNotification(db, {
        turmaId,
        userId: target.alunoId,
        tipo: 'falta_vista',
        titulo: 'Aviso de falta revisto',
        mensagem: `${user.nome} marcou a tua falta em ${target.disciplina} (${target.data}) como vista.`,
        referenciaId: target.id,
      });
    }

    return target;
  });

  sendOk(res, { falta });
}
