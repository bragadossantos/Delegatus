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
import type { CreateAnuncioInput, WhatsappDisparoResult } from '../types';

export async function handleAnunciosCollection(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  assertMethod(req, ['GET', 'POST']);

  if (req.method === 'GET') {
    const { turmaId } = requireTurmaMember(req);
    const db = readDb();
    const anuncios = db.anuncios
      .filter((a) => a.turmaId === turmaId)
      .sort((a, b) => {
        if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
    sendOk(res, { anuncios });
    return;
  }

  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<Partial<CreateAnuncioInput>>(req);

  const titulo = requireNonEmptyString(body.titulo, 'titulo');
  const conteudo = requireNonEmptyString(body.conteudo, 'conteudo');
  const fixado = Boolean(body.fixado);
  const now = new Date().toISOString();

  const anuncio = mutateDb((db) => {
    const novo = {
      id: newId('anun'),
      turmaId,
      autorId: user.id,
      autorNome: user.nome,
      titulo,
      conteudo,
      fixado,
      disparadoWhatsapp: false,
      createdAt: now,
      updatedAt: now,
    };
    db.anuncios.unshift(novo);

    notifyAllTurmaMembers(
      db,
      turmaId,
      {
        tipo: 'novo_anuncio',
        titulo: `Novo anúncio: ${titulo}`,
        mensagem: conteudo.slice(0, 110) + (conteudo.length > 110 ? '...' : ''),
        referenciaId: novo.id,
      },
      user.id
    );

    return novo;
  });

  sendOk(res, { anuncio }, 201);
}

export async function handleAnuncioItem(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['PATCH', 'DELETE']);
  const { turmaId } = requireRoles(req, ['delegado', 'subdelegado']);

  if (req.method === 'PATCH') {
    const body = getBody<Partial<CreateAnuncioInput>>(req);
    const anuncio = mutateDb((db) => {
      const target = db.anuncios.find((a) => a.id === id && a.turmaId === turmaId);
      if (!target) throw new ApiHttpError(404, 'NOT_FOUND', 'Anúncio não encontrado.');

      if (typeof body.titulo === 'string' && body.titulo.trim()) {
        target.titulo = body.titulo.trim();
      }
      if (typeof body.conteudo === 'string' && body.conteudo.trim()) {
        target.conteudo = body.conteudo.trim();
      }
      if (typeof body.fixado === 'boolean') {
        target.fixado = body.fixado;
      }
      target.updatedAt = new Date().toISOString();
      return target;
    });

    sendOk(res, { anuncio });
    return;
  }

  mutateDb((db) => {
    const idx = db.anuncios.findIndex((a) => a.id === id && a.turmaId === turmaId);
    if (idx === -1) throw new ApiHttpError(404, 'NOT_FOUND', 'Anúncio não encontrado.');
    db.anuncios.splice(idx, 1);
  });

  sendOk(res, { deletedId: id });
}

export async function handleAnuncioWhatsapp(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
): Promise<void> {
  assertMethod(req, ['POST']);
  const { user, turmaId } = requireRoles(req, ['delegado', 'subdelegado']);
  const body = getBody<{ telefoneDestino?: string; dispararWebhook?: boolean }>(req);

  const db = readDb();
  const anuncioExistente = db.anuncios.find((a) => a.id === id && a.turmaId === turmaId);
  if (!anuncioExistente) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Anúncio não encontrado.');
  }
  const turma = db.turmas.find((t) => t.id === turmaId);

  const textoFormatado = [
    `📢 *${anuncioExistente.titulo}*`,
    turma ? `_${turma.nome}_` : '',
    '',
    anuncioExistente.conteudo,
    '',
    `— Enviado via *Delegatus* por ${user.nome}`,
  ]
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n');

  const cleanPhone = body.telefoneDestino?.replace(/[^\d]/g, '') || '';
  const waMeUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textoFormatado)}`
    : `https://wa.me/?text=${encodeURIComponent(textoFormatado)}`;

  let webhookDisparado = false;
  let webhookStatus: number | undefined;

  if (body.dispararWebhook !== false && turma?.webhookWhatsapp) {
    try {
      const resp = await fetch(turma.webhookWhatsapp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turmaId: turma.id,
          turmaNome: turma.nome,
          anuncioId: anuncioExistente.id,
          titulo: anuncioExistente.titulo,
          conteudo: anuncioExistente.conteudo,
          textoFormatado,
          autorNome: user.nome,
        }),
      });
      webhookDisparado = resp.ok;
      webhookStatus = resp.status;
    } catch {
      webhookDisparado = false;
    }
  }

  const anuncio = mutateDb((mutableDb) => {
    const target = mutableDb.anuncios.find((a) => a.id === id && a.turmaId === turmaId);
    if (!target) throw new ApiHttpError(404, 'NOT_FOUND', 'Anúncio não encontrado.');
    target.disparadoWhatsapp = true;
    target.whatsappEnviadoEm = new Date().toISOString();
    return target;
  });

  const whatsapp: WhatsappDisparoResult = {
    textoFormatado,
    waMeUrl,
    webhookDisparado,
    ...(webhookStatus !== undefined ? { webhookStatus } : {}),
  };

  sendOk(res, { anuncio, whatsapp });
}
