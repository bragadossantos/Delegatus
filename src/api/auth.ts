import crypto from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiHttpError } from './http';
import { readDb } from './store';
import type { PapelUsuario, UserPublic, UserRecord } from './types';

const TOKEN_COOKIE_NAME = 'delegatus_token';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

function getAuthSecret(): string {
  return process.env.DELEGATUS_AUTH_SECRET || 'delegatus-dev-secret-change-in-prod';
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuf = Buffer.from(key, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

interface TokenPayload {
  sub: string;
  exp: number;
}

export function signAuthToken(userId: string): string {
  const payload: TokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!parsed.sub || typeof parsed.exp !== 'number') return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    cookies[key] = val;
  }
  return cookies;
}

export function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[TOKEN_COOKIE_NAME] || null;
}

export function setAuthCookie(res: NextApiResponse, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${TOKEN_TTL_SECONDS}`,
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res: NextApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${TOKEN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function toUserPublic(user: UserRecord): UserPublic {
  const { passwordHash: _removed, ...rest } = user;
  return rest;
}

export function getOptionalUser(req: NextApiRequest): UserRecord | null {
  const token = extractToken(req);
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload) return null;
  const db = readDb();
  return db.users.find((u) => u.id === payload.sub) || null;
}

export function requireAuth(req: NextApiRequest): UserRecord {
  const user = getOptionalUser(req);
  if (!user) {
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada. Inicia sessão.');
  }
  return user;
}

export function requireTurmaMember(req: NextApiRequest): { user: UserRecord; turmaId: string } {
  const user = requireAuth(req);
  if (!user.turmaId) {
    throw new ApiHttpError(
      403,
      'FORBIDDEN',
      'Ainda não pertences a nenhuma turma aprovada.'
    );
  }
  return { user, turmaId: user.turmaId };
}

export function requireRoles(
  req: NextApiRequest,
  roles: PapelUsuario[]
): { user: UserRecord; turmaId: string } {
  const { user, turmaId } = requireTurmaMember(req);
  if (!roles.includes(user.papel)) {
    throw new ApiHttpError(
      403,
      'FORBIDDEN',
      'Não tens permissão para executar esta ação.'
    );
  }
  return { user, turmaId };
}
