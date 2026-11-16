import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { Notificacao } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

const TIPO_ICON: Record<string, { icon: string; tone: string }> = {
  pedido_entrada: { icon: 'person_add', tone: 'bg-primary-fixed text-on-primary-fixed-variant' },
  aprovacao: { icon: 'verified', tone: 'bg-secondary-container text-on-secondary-container' },
  anuncio: { icon: 'campaign', tone: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  falta: { icon: 'event_busy', tone: 'bg-error-container text-on-error-container' },
  sondagem: { icon: 'how_to_vote', tone: 'bg-surface-container-high text-primary' },
  grupo: { icon: 'group_work', tone: 'bg-secondary-container/60 text-on-secondary-container' },
  informacao: { icon: 'calendar_month', tone: 'bg-surface-container-high text-tertiary' },
};

export default function AvisosPage() {
  const { refreshBadges, showToast } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidasCount, setNaoLidasCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.notificacoes.listar();
      setNotificacoes(res.notificacoes);
      setNaoLidasCount(res.naoLidasCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarcarLida = async (id: string) => {
    try {
      await apiClient.notificacoes.marcarLida(id);
      await load();
      await refreshBadges();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar aviso.', 'error');
    }
  };

  const handleMarcarTodas = async () => {
    try {
      await apiClient.notificacoes.lerTodas();
      await load();
      await refreshBadges();
      showToast('Todas as notificações marcadas como lidas.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar avisos.', 'error');
    }
  };

  return (
    <AppShell title="Avisos">
      <div className="flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary font-extrabold">
              Avisos &amp; Notificações
            </h1>
            <p className="font-body-md text-on-surface-variant">
              Acompanha pedidos de entrada, novos anúncios, faltas de colegas e sondagens.
            </p>
          </div>
          {naoLidasCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarcarTodas()}
              className="min-h-[42px] px-4 rounded-xl bg-surface-container-lowest text-primary font-label-md font-bold shadow-sm hover:bg-surface-container transition-colors flex items-center gap-2 self-start"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>Marcar todas como lidas ({naoLidasCount})</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-on-surface-variant">A carregar avisos...</div>
        ) : notificacoes.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl text-center shadow-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-secondary">notifications_off</span>
            <h2 className="font-headline-sm font-bold text-on-surface">Sem avisos por agora</h2>
            <p className="font-body-sm text-on-surface-variant">
              Quando houver novidades na turma, vais recebê-las aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-space-sm">
            {notificacoes.map((n) => {
              const style = TIPO_ICON[n.tipo] || TIPO_ICON.informacao;
              return (
                <div
                  key={n.id}
                  className={`p-space-md rounded-2xl shadow-sm flex items-start justify-between gap-space-md transition-colors ${
                    n.lida ? 'bg-surface-container-lowest opacity-80' : 'bg-surface-container-lowest border-l-4 border-secondary'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.tone}`}>
                      <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-label-lg text-on-surface font-bold">{n.titulo}</h3>
                        {!n.lida && <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />}
                      </div>
                      <p className="font-body-md text-on-surface-variant mt-0.5">{n.mensagem}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-label-sm text-outline">
                          {new Date(n.createdAt).toLocaleString('pt-PT')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!n.lida && (
                    <button
                      type="button"
                      onClick={() => void handleMarcarLida(n.id)}
                      className="px-3 min-h-[36px] rounded-lg bg-surface-container text-primary font-label-sm font-bold shrink-0"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
