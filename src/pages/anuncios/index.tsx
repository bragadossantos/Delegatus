import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { Anuncio } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

export default function AnunciosPage() {
  const { user, turma, showToast } = useAuth();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [fixado, setFixado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDelegadoOrSub = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.anuncios.listar();
      setAnuncios(res.anuncios);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.anuncios.criar({ titulo, conteudo, fixado });
      setTitulo('');
      setConteudo('');
      setFixado(false);
      setShowForm(false);
      await load();
      showToast('Anúncio publicado!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao publicar anúncio.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispararWhatsapp = async (id: string) => {
    try {
      const res = await apiClient.anuncios.dispararWhatsapp(id);
      await load();
      window.open(res.whatsapp.waMeUrl, '_blank', 'noopener,noreferrer');
      showToast('Mensagem formatada pronta para o WhatsApp!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao preparar disparo.', 'error');
    }
  };

  const handleApagar = async (id: string) => {
    try {
      await apiClient.anuncios.apagar(id);
      await load();
      showToast('Anúncio removido.', 'info');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao remover.', 'error');
    }
  };

  return (
    <AppShell title="Anúncios">
      <div className="flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary font-extrabold">
              Anúncios &amp; Disparo WhatsApp
            </h1>
            <p className="font-body-md text-on-surface-variant">
              Comunicados oficiais da turma {turma ? `(${turma.nome})` : ''} com envio formatado para o WhatsApp.
            </p>
          </div>
          {isDelegadoOrSub && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="min-h-[44px] px-4 rounded-xl bg-primary text-on-primary font-label-md font-bold flex items-center gap-2 self-start shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">{showForm ? 'close' : 'add'}</span>
              <span>{showForm ? 'Cancelar' : 'Novo Anúncio'}</span>
            </button>
          )}
        </div>

        {showForm && isDelegadoOrSub && (
          <form
            onSubmit={handleCriar}
            className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-sm"
          >
            <h2 className="font-headline-sm font-bold text-on-surface">Publicar Comunicado Oficial</h2>
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do anúncio"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              required
              rows={4}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreve os detalhes do comunicado para a turma..."
              className="w-full p-3.5 rounded-xl bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 font-label-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixado}
                  onChange={(e) => setFixado(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span>Fixar no topo</span>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 rounded-xl bg-primary text-on-primary font-label-md font-bold"
              >
                {submitting ? 'A publicar...' : 'Publicar Anúncio'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-12 text-center text-on-surface-variant">A carregar anúncios...</div>
        ) : anuncios.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl text-center shadow-sm">
            <span className="material-symbols-outlined text-[36px] text-secondary">campaign</span>
            <p className="font-headline-sm font-bold mt-2">Nenhum anúncio publicado</p>
          </div>
        ) : (
          <div className="flex flex-col gap-space-md">
            {anuncios.map((a) => (
              <article
                key={a.id}
                className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm font-bold">
                      Comunicado Oficial
                    </span>
                    {a.fixado && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm font-bold">
                        <span className="material-symbols-outlined text-[14px]">push_pin</span>
                        Fixado
                      </span>
                    )}
                  </div>
                  <span className="font-body-sm text-on-surface-variant">
                    {new Date(a.createdAt).toLocaleDateString('pt-PT')} • {a.autorNome}
                  </span>
                </div>

                <h2 className="font-headline-md text-on-surface font-bold">{a.titulo}</h2>
                <p className="font-body-md text-on-surface-variant whitespace-pre-line">{a.conteudo}</p>

                {isDelegadoOrSub && (
                  <div className="pt-space-sm border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDispararWhatsapp(a.id)}
                      className="min-h-[42px] px-4 rounded-xl bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary font-label-md font-bold transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>
                        {a.disparadoWhatsapp ? 'Reenviar para WhatsApp' : 'Disparar para WhatsApp'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleApagar(a.id)}
                      className="min-h-[40px] px-3 rounded-lg bg-error-container/60 text-on-error-container font-label-sm font-bold"
                    >
                      Apagar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
