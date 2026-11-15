import type { NextApiRequest, NextApiResponse } from 'next';
import {
  clearAuthCookie,
  hashPassword,
  requireAuth,
  setAuthCookie,
  signAuthToken,
  toUserPublic,
  verifyPassword,
} from '../auth';
import {
  ApiHttpError,
  assertMethod,
  getBody,
  requireNonEmptyString,
  sendOk,
} from '../http';
import { mutateDb, newId, readDb } from '../store';
import type { LoginInput, NivelEnsino, RegisterInput } from '../types';

const VALID_NIVEIS: NivelEnsino[] = ['fundamental', 'medio', 'universitario'];

export async function handleRegister(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['POST']);
  const body = getBody<Partial<RegisterInput>>(req);

  const nome = requireNonEmptyString(body.nome, 'nome');
  const email = requireNonEmptyString(body.email, 'email').toLowerCase();
  const password = requireNonEmptyString(body.password, 'password');
  const escolaUniversidade = requireNonEmptyString(
    body.escolaUniversidade,
    'escolaUniversidade'
  );
  const curso = requireNonEmptyString(body.curso, 'curso');
  const nivelEnsino: NivelEnsino =
    body.nivelEnsino && VALID_NIVEIS.includes(body.nivelEnsino)
      ? body.nivelEnsino
      : 'universitario';

  if (password.length < 6) {
    throw new ApiHttpError(
      400,
      'VALIDATION_ERROR',
      'A password deve ter pelo menos 6 caracteres.'
    );
  }

  const user = mutateDb((db) => {
    const exists = db.users.some((u) => u.email === email);
    if (exists) {
      throw new ApiHttpError(409, 'CONFLICT', 'Já existe uma conta com este email.');
    }

    const newUser = {
      id: newId('user'),
      nome,
      email,
      passwordHash: hashPassword(password),
      escolaUniversidade,
      nivelEnsino,
      curso,
      turmaId: null,
      papel: 'colega' as const,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    return newUser;
  });

  const token = signAuthToken(user.id);
  setAuthCookie(res, token);
  sendOk(res, { user: toUserPublic(user), token }, 201);
}

export async function handleLogin(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['POST']);
  const body = getBody<Partial<LoginInput>>(req);

  const email = requireNonEmptyString(body.email, 'email').toLowerCase();
  const password = requireNonEmptyString(body.password, 'password');

  const db = readDb();
  const user = db.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Email ou password incorretos.');
  }

  const token = signAuthToken(user.id);
  setAuthCookie(res, token);
  sendOk(res, { user: toUserPublic(user), token });
}

export async function handleLogout(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['POST']);
  clearAuthCookie(res);
  sendOk(res, { loggedOut: true });
}

export async function handleMe(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  assertMethod(req, ['GET', 'PATCH']);

  if (req.method === 'GET') {
    const user = requireAuth(req);
    const db = readDb();
    const turma = user.turmaId ? db.turmas.find((t) => t.id === user.turmaId) || null : null;
    sendOk(res, { user: toUserPublic(user), turma });
    return;
  }

  const authUser = requireAuth(req);
  const body = getBody<{
    nome?: string;
    escolaUniversidade?: string;
    nivelEnsino?: NivelEnsino;
    curso?: string;
  }>(req);

  const updated = mutateDb((db) => {
    const user = db.users.find((u) => u.id === authUser.id);
    if (!user) {
      throw new ApiHttpError(404, 'NOT_FOUND', 'Utilizador não encontrado.');
    }
    if (typeof body.nome === 'string' && body.nome.trim()) user.nome = body.nome.trim();
    if (typeof body.escolaUniversidade === 'string' && body.escolaUniversidade.trim()) {
      user.escolaUniversidade = body.escolaUniversidade.trim();
    }
    if (typeof body.curso === 'string' && body.curso.trim()) user.curso = body.curso.trim();
    if (body.nivelEnsino && VALID_NIVEIS.includes(body.nivelEnsino)) {
      user.nivelEnsino = body.nivelEnsino;
    }
    return user;
  });

  sendOk(res, { user: toUserPublic(updated) });
}
