import type { NextApiRequest, NextApiResponse } from 'next';
import {
  handleAnuncioItem,
  handleAnunciosCollection,
  handleAnuncioWhatsapp,
} from './handlers/anuncios';
import { handleLogin, handleLogout, handleMe, handleRegister } from './handlers/auth';
import { handleFaltasCollection, handleFaltaVisto } from './handlers/faltas';
import {
  handleGrupoDelete,
  handleGrupoEntrar,
  handleGrupoSair,
  handleGruposCollection,
} from './handlers/grupos';
import {
  handleAnexoDelete,
  handleAnexosCollection,
  handleAtividadeItem,
  handleAtividadesCollection,
  handleFaltaProfessorDelete,
  handleFaltasProfessoresCollection,
  handleHorarioCollection,
  handleHorarioDelete,
  handleInformacoesResumo,
  handleMateriaDelete,
  handleMateriasCollection,
} from './handlers/informacoes';
import {
  handleNotificacaoLida,
  handleNotificacoesCollection,
  handleNotificacoesLerTodas,
} from './handlers/notificacoes';
import {
  handleSondagemDelete,
  handleSondagemEncerrar,
  handleSondagensCollection,
  handleSondagemVotar,
} from './handlers/sondagens';
import {
  handleConvitePublico,
  handleCreateTurma,
  handleGerirSubdelegado,
  handleListarPedidos,
  handlePedirEntrada,
  handleResponderPedido,
  handleTurmaAtual,
} from './handlers/turmas';
import { ApiHttpError, handleRouteError, sendOk } from './http';

function getSegments(req: NextApiRequest): string[] {
  const queryPath = req.query.path;
  if (Array.isArray(queryPath)) return queryPath;
  if (typeof queryPath === 'string' && queryPath.length > 0) return [queryPath];

  const rawUrl = (req.url || '').split('?')[0];
  const clean = rawUrl.replace(/^\/api\/?/, '');
  return clean ? clean.split('/').filter(Boolean) : [];
}

export async function handleApiRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const segments = getSegments(req);
    const [r0, r1, r2, r3] = segments;

    if (!r0 || r0 === 'health') {
      sendOk(res, { status: 'ok', service: 'delegatus-api' });
      return;
    }

    // /api/auth/*
    if (r0 === 'auth') {
      if (r1 === 'register' && !r2) return await handleRegister(req, res);
      if (r1 === 'login' && !r2) return await handleLogin(req, res);
      if (r1 === 'logout' && !r2) return await handleLogout(req, res);
      if (r1 === 'me' && !r2) return await handleMe(req, res);
    }

    // /api/turmas/*
    if (r0 === 'turmas') {
      if (!r1) return await handleCreateTurma(req, res);
      if (r1 === 'atual' && !r2) return await handleTurmaAtual(req, res);
      if (r1 === 'convite' && r2 && !r3) return await handleConvitePublico(req, res, r2);
      if (r1 === 'entrar' && !r2) return await handlePedirEntrada(req, res);
      if (r1 === 'pedidos' && !r2) return await handleListarPedidos(req, res);
      if (r1 === 'pedidos' && r2 && r3 === 'responder') {
        return await handleResponderPedido(req, res, r2);
      }
      if (r1 === 'subdelegado' && !r2) return await handleGerirSubdelegado(req, res);
    }

    // /api/anuncios/*
    if (r0 === 'anuncios') {
      if (!r1) return await handleAnunciosCollection(req, res);
      if (r1 && !r2) return await handleAnuncioItem(req, res, r1);
      if (r1 && r2 === 'whatsapp' && !r3) return await handleAnuncioWhatsapp(req, res, r1);
    }

    // /api/faltas/*
    if (r0 === 'faltas') {
      if (!r1) return await handleFaltasCollection(req, res);
      if (r1 && r2 === 'visto' && !r3) return await handleFaltaVisto(req, res, r1);
    }

    // /api/informacoes/*
    if (r0 === 'informacoes') {
      if (r1 === 'resumo' && !r2) return await handleInformacoesResumo(req, res);
      if (r1 === 'horario' && !r2) return await handleHorarioCollection(req, res);
      if (r1 === 'horario' && r2 && !r3) return await handleHorarioDelete(req, res, r2);
      if (r1 === 'materias' && !r2) return await handleMateriasCollection(req, res);
      if (r1 === 'materias' && r2 && !r3) return await handleMateriaDelete(req, res, r2);
      if (r1 === 'faltas-professores' && !r2) {
        return await handleFaltasProfessoresCollection(req, res);
      }
      if (r1 === 'faltas-professores' && r2 && !r3) {
        return await handleFaltaProfessorDelete(req, res, r2);
      }
      if (r1 === 'atividades' && !r2) return await handleAtividadesCollection(req, res);
      if (r1 === 'atividades' && r2 && !r3) return await handleAtividadeItem(req, res, r2);
      if (r1 === 'anexos' && !r2) return await handleAnexosCollection(req, res);
      if (r1 === 'anexos' && r2 && !r3) return await handleAnexoDelete(req, res, r2);
    }

    // /api/grupos/*
    if (r0 === 'grupos') {
      if (!r1) return await handleGruposCollection(req, res);
      if (r1 && r2 === 'entrar' && !r3) return await handleGrupoEntrar(req, res, r1);
      if (r1 && r2 === 'sair' && !r3) return await handleGrupoSair(req, res, r1);
      if (r1 && !r2) return await handleGrupoDelete(req, res, r1);
    }

    // /api/sondagens/*
    if (r0 === 'sondagens') {
      if (!r1) return await handleSondagensCollection(req, res);
      if (r1 && r2 === 'votar' && !r3) return await handleSondagemVotar(req, res, r1);
      if (r1 && r2 === 'encerrar' && !r3) return await handleSondagemEncerrar(req, res, r1);
      if (r1 && !r2) return await handleSondagemDelete(req, res, r1);
    }

    // /api/notificacoes/*
    if (r0 === 'notificacoes') {
      if (!r1) return await handleNotificacoesCollection(req, res);
      if (r1 === 'ler-todas' && !r2) return await handleNotificacoesLerTodas(req, res);
      if (r1 && r2 === 'lida' && !r3) return await handleNotificacaoLida(req, res, r1);
    }

    throw new ApiHttpError(404, 'NOT_FOUND', `Endpoint /api/${segments.join('/')} não encontrado.`);
  } catch (err) {
    handleRouteError(res, err);
  }
}
