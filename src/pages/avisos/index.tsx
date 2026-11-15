import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/api/client';
import type { Notificacao, TipoNotificacao } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { IconBell, IconCheck } from '@/components/ui/Icons';
import { EmptyState, formatRelativeDate } from '@/components/ui/Primitives';

const ROUTE_BY_TIPO: Record<TipoNotificacao, string> = {
  pedido_entrada: '/turma',
  entrada_aprovada: '/turma',
  entrada_rejeitada: '/turma',
  nova_falta: '/faltas',
  falta_vista: '/faltas',
  novo_anuncio: '/anuncios',
  nova_sondagem: '/sondagens',
  novo_grupo: '/grupos',
  nomeacao_subdelegado: '/turma',
};

export default function AvisosPage() {
  const { refreshBadges, showToast } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidasCount, setNaoLidasCount] = useState(0);
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas');
  const [loading, setLoading] = useState(true);

  const loadAvisos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.notificacoes.listar();
      setNotificacoes(data.notificacoes);
      setNaoLidasCount(data.naoLidasCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvisos();
  }, [loadAvisos]);

  const handleMarcarLida = async (id: string) => {
    try {
      await apiClient.notificacoes.marcarLida(id);
      await loadAvisos();
      await refreshBadges();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar.', 'error');
    }
  };

  const handleLerTodas = async () => {
    try {
      await apiClient.notificacoes.lerTodas();
      await loadAvisos();
      await refreshBadges();
      showToast('Todas as notificações marcadas como lidas.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar.', 'error');
    }
  };

  const filtradas =
    filtro === 'nao_lidas' ? notificacoes.filter((n) => !n.lida) : notificacoes;

  return (
    <AppShell title="Avisos">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h1">Avisos & Notificações</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
            Acompanha pedidos de entrada, faltas, novos anúncios e sondagens.
          </p>
        </div>

        {naoLidasCount > 0 && (
          <button type="button" className="btn btn-outline btn-sm" onClick={handleLerTodas}>
            <IconCheck size={16} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="tabs-scroll">
        <button
          type="button"
          className={`tab-pill ${filtro === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          Todas ({notificacoes.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${filtro === 'nao_lidas' ? 'active' : ''}`}
          onClick={() => setFiltro('nao_lidas')}
        >
          Por ler ({naoLidasCount})
        </button>
      </div>

      {loading ? (
        <div className="card text-sm text-muted">A carregar avisos...</div>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={<IconBell size={24} />}
          title="Sem avisos por agora"
          description="Quando houver novidades na tua turma, vais vê-las aqui."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtradas.map((n) => (
            <div
              key={n.id}
              className="card flex items-start justify-between flex-wrap gap-3"
              style={{
                borderLeft: n.lida ? undefined : '4px solid var(--color-primary)',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  {!n.lida && <span className="badge badge-primary">Novo</span>}
                  <span className="font-semibold">{n.titulo}</span>
                  <span className="text-xs text-muted">{formatRelativeDate(n.createdAt)}</span>
                </div>
                <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
                  {n.mensagem}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={ROUTE_BY_TIPO[n.tipo] || '/turma'} className="btn btn-secondary btn-sm">
                  Abrir
                </Link>
                {!n.lida && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void handleMarcarLida(n.id)}
                  >
                    Marcar lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
