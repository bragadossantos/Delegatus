import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, requireRoles, requireTurmaMember, toUserPublic } from '../auth';
import {
  ApiHttpError,
  assertMethod,
  getBody,
  requireNonEmptyString,
  sendOk,
} from '../http';
import { notifyTurmaByRoles, pushNotification } from '../services/notificacoes';
import { generateInviteCode, mutateDb, newId, readDb } from '../store';
import type { CreateTurmaInput, StatusPedidoEntrada, TurmaConvitePublic } from '../types';

export async function handleCreateTurma(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['POST']);
  const authUser = requireAuth(req);
  const body = getBody<Partial<CreateTurmaInput>>(req);

  const nome = requireNonEmptyString(body.nome, 'nome');

  const result = mutateDb((db) => {
    const user = db.users.find((u) => u.id === authUser.id);
    if (!user) throw new ApiHttpError(404, 'NOT_FOUND', 'Utilizador não encontrado.');
    if (user.turmaId) {
      throw new ApiHttpError(409, 'CONFLICT', 'Já pertences a uma turma.');
    }

    let codigoConvite = generateInviteCode();
    while (db.turmas.some((t) => t.codigoConvite === codigoConvite)) {
      codigoConvite = generateInviteCode();
    }

    const turma = {
      id: newId('turma'),
      nome,
      escolaUniversidade:
        (typeof body.escolaUniversidade === 'string' && body.escolaUniversidade.trim()) ||
        user.escolaUniversidade,
      curso: (typeof body.curso === 'string' && body.curso.trim()) || user.curso,
      anoLetivo: (typeof body.anoLetivo === 'string' && body.anoLetivo.trim()) || '2026/2027',
      codigoConvite,
      delegadoId: user.id,
      linkGrupoWhatsapp: body.linkGrupoWhatsapp?.trim() || undefined,
      webhookWhatsapp: body.webhookWhatsapp?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    db.turmas.push(turma);
    user.turmaId = turma.id;
    user.papel = 'delegado';

    return { turma, user: toUserPublic(user) };
  });

  sendOk(res, result, 201);
}

export async function handleTurmaAtual(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['GET', 'PATCH']);

  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    const turma = db.turmas.find((t) => t.id === turmaId);
    if (!turma) throw new ApiHttpError(404, 'NOT_FOUND', 'Turma não encontrada.');

    const membros = db.users.filter((u) => u.turmaId === turmaId).map(toUserPublic);
    const pedidosPendentesCount = db.pedidosEntrada.filter(
      (p) => p.turmaId === turmaId && p.status === 'pendente'
    ).length;

    sendOk(res, { turma, membros, pedidosPendentesCount });
    return;
  }

  const { turmaId } = requireRoles(req, ['delegado']);
  const body = getBody<{
    nome?: string;
    curso?: string;
    anoLetivo?: string;
    linkGrupoWhatsapp?: string;
    webhookWhatsapp?: string;
  }>(req);

  const turma = mutateDb((db) => {
    const t = db.turmas.find((item) => item.id === turmaId);
    if (!t) throw new ApiHttpError(404, 'NOT_FOUND', 'Turma não encontrada.');
    if (typeof body.nome === 'string' && body.nome.trim()) t.nome = body.nome.trim();
    if (typeof body.curso === 'string' && body.curso.trim()) t.curso = body.curso.trim();
    if (typeof body.anoLetivo === 'string' && body.anoLetivo.trim()) {
      t.anoLetivo = body.anoLetivo.trim();
    }
    if (typeof body.linkGrupoWhatsapp === 'string') {
      t.linkGrupoWhatsapp = body.linkGrupoWhatsapp.trim() || undefined;
    }
    if (typeof body.webhookWhatsapp === 'string') {
      t.webhookWhatsapp = body.webhookWhatsapp.trim() || undefined;
    }
    return t;
  });

  sendOk(res, { turma });
}

export async function handleConvitePublico(
  req: NextApiRequest,
  res: NextApiResponse,
  codigo: string
): Promise<void> {
  assertMethod(req, ['GET']);
  const db = readDb();
  const normalized = codigo.trim().toUpperCase();
  const turma = db.turmas.find((t) => t.codigoConvite.toUpperCase() === normalized);
  if (!turma) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Código de convite inválido ou turma não encontrada.');
  }

  const delegado = db.users.find((u) => u.id === turma.delegadoId);
  const totalMembros = db.users.filter((u) => u.turmaId === turma.id).length;

  const payload: TurmaConvitePublic = {
    id: turma.id,
    nome: turma.nome,
    escolaUniversidade: turma.escolaUniversidade,
    curso: turma.curso,
    codigoConvite: turma.codigoConvite,
    delegadoNome: delegado?.nome || 'Delegado',
    totalMembros,
  };

  sendOk(res, payload);
}

export async function handlePedirEntrada(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['POST']);
  const authUser = requireAuth(req);
  const body = getBody<{ codigoConvite?: string; mensagem?: string }>(req);
  const codigoConvite = requireNonEmptyString(body.codigoConvite, 'codigoConvite').toUpperCase();

  const pedido = mutateDb((db) => {
    const user = db.users.find((u) => u.id === authUser.id);
    if (!user) throw new ApiHttpError(404, 'NOT_FOUND', 'Utilizador não encontrado.');
    if (user.turmaId) {
      throw new ApiHttpError(409, 'CONFLICT', 'Já pertences a uma turma.');
    }

    const turma = db.turmas.find((t) => t.codigoConvite.toUpperCase() === codigoConvite);
    if (!turma) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Código de convite não encontrado.');
    }

    const pendente = db.pedidosEntrada.find(
      (p) => p.turmaId === turma.id && p.userId === user.id && p.status === 'pendente'
    );
    if (pendente) {
      throw new ApiHttpError(
        409,
        'CONFLICT',
        'Já tens um pedido de entrada pendente para esta turma.'
      );
    }

    const novoPedido = {
      id: newId('ped'),
      turmaId: turma.id,
      userId: user.id,
      userName: user.nome,
      userEmail: user.email,
      mensagem: body.mensagem?.trim() || undefined,
      status: 'pendente' as const,
      createdAt: new Date().toISOString(),
    };
    db.pedidosEntrada.unshift(novoPedido);

    notifyTurmaByRoles(db, turma.id, ['delegado', 'subdelegado'], {
      tipo: 'pedido_entrada',
      titulo: 'Novo pedido de entrada na turma',
      mensagem: `${user.nome} pediu para entrar na turma ${turma.nome}.`,
      referenciaId: novoPedido.id,
    });

    return novoPedido;
  });

  sendOk(res, { pedido }, 201);
}

export async function handleListarPedidos(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['GET']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const statusFilter = req.query.status as StatusPedidoEntrada | undefined;

  const db = readDb();
  let pedidos = db.pedidosEntrada.filter((p) => p.turmaId === turmaId);
  if (statusFilter && ['pendente', 'aprovado', 'rejeitado'].includes(statusFilter)) {
    pedidos = pedidos.filter((p) => p.status === statusFilter);
  }

  sendOk(res, { pedidos });
}

export async function handleResponderPedido(
  req: NextApiRequest,
  res: NextApiResponse,
  pedidoId: string
): Promise<void> {
  assertMethod(req, ['POST']);
  const { user: actor, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<{ acao?: 'aprovar' | 'rejeitar' }>(req);

  if (body.acao !== 'aprovar' && body.acao !== 'rejeitar') {
    throw new ApiHttpError(400, 'VALIDATION_ERROR', 'O campo "acao" deve ser "aprovar" ou "rejeitar".');
  }

  const pedido = mutateDb((db) => {
    const p = db.pedidosEntrada.find((item) => item.id === pedidoId && item.turmaId === turmaId);
    if (!p) throw new ApiHttpError(404, 'NOT_FOUND', 'Pedido não encontrado.');
    if (p.status !== 'pendente') {
      throw new ApiHttpError(409, 'CONFLICT', 'Este pedido já foi respondido.');
    }

    p.status = body.acao === 'aprovar' ? 'aprovado' : 'rejeitado';
    p.respondidoPor = actor.id;
    p.respondidoEm = new Date().toISOString();

    const targetUser = db.users.find((u) => u.id === p.userId);
    const turma = db.turmas.find((t) => t.id === turmaId);

    if (body.acao === 'aprovar' && targetUser) {
      targetUser.turmaId = turmaId;
      targetUser.papel = 'colega';
      pushNotification(db, {
        turmaId,
        userId: targetUser.id,
        tipo: 'entrada_aprovada',
        titulo: 'Pedido aprovado!',
        mensagem: `Foste aceite na turma ${turma?.nome || ''}. Bem-vindo(a)!`,
        referenciaId: turmaId,
      });
    } else if (body.acao === 'rejeitar' && targetUser) {
      pushNotification(db, {
        turmaId,
        userId: targetUser.id,
        tipo: 'entrada_rejeitada',
        titulo: 'Pedido não aprovado',
        mensagem: `O teu pedido para entrar na turma ${turma?.nome || ''} foi recusado.`,
        referenciaId: p.id,
      });
    }

    return p;
  });

  sendOk(res, { pedido });
}

export async function handleGerirSubdelegado(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['PATCH']);
  const { user: delegado, turmaId } = requireRoles(req, ['delegado']);
  const body = getBody<{ userId?: string; acao?: 'nomear' | 'remover' }>(req);

  const userId = requireNonEmptyString(body.userId, 'userId');
  if (body.acao !== 'nomear' && body.acao !== 'remover') {
    throw new ApiHttpError(400, 'VALIDATION_ERROR', 'O campo "acao" deve ser "nomear" ou "remover".');
  }
  if (userId === delegado.id) {
    throw new ApiHttpError(400, 'VALIDATION_ERROR', 'O delegado não pode alterar o próprio papel.');
  }

  const membro = mutateDb((db) => {
    const target = db.users.find((u) => u.id === userId && u.turmaId === turmaId);
    if (!target) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Membro não encontrado nesta turma.');
    }

    target.papel = body.acao === 'nomear' ? 'subdelegado' : 'colega';

    if (body.acao === 'nomear') {
      pushNotification(db, {
        turmaId,
        userId: target.id,
        tipo: 'nomeacao_subdelegado',
        titulo: 'Nomeação como Subdelegado',
        mensagem: `${delegado.nome} nomeou-te subdelegado(a) da turma.`,
        referenciaId: turmaId,
      });
    }

    return toUserPublic(target);
  });

  sendOk(res, { membro });
}
