import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiErrorCode, ApiErrorResponse, ApiSuccessResponse } from './types';

export class ApiHttpError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendOk<T>(res: NextApiResponse, data: T, status = 200): void {
  const payload: ApiSuccessResponse<T> = { ok: true, data };
  res.status(status).json(payload);
}

export function sendError(
  res: NextApiResponse,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
): void {
  const payload: ApiErrorResponse = {
    ok: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  res.status(status).json(payload);
}

export function handleRouteError(res: NextApiResponse, err: unknown): void {
  if (err instanceof ApiHttpError) {
    sendError(res, err.status, err.code, err.message, err.details);
    return;
  }
  console.error('[Delegatus API Error]', err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Erro interno do servidor.');
}

export function assertMethod(req: NextApiRequest, allowed: string[]): void {
  const method = (req.method || 'GET').toUpperCase();
  if (!allowed.includes(method)) {
    throw new ApiHttpError(
      405,
      'METHOD_NOT_ALLOWED',
      `Método ${method} não permitido. Use: ${allowed.join(', ')}`
    );
  }
}

export function getBody<T = Record<string, unknown>>(req: NextApiRequest): T {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      throw new ApiHttpError(400, 'VALIDATION_ERROR', 'JSON inválido no corpo do pedido.');
    }
  }
  return {} as T;
}

export function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiHttpError(400, 'VALIDATION_ERROR', `O campo "${fieldName}" é obrigatório.`);
  }
  return value.trim();
}
