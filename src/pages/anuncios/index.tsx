import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { Anuncio, WhatsappDisparoResult } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import {
  IconMegaphone,
  IconPin,
  IconPlus,
  IconTrash,
  IconWhatsApp,
} from '@/components/ui/Icons';
import {
  EmptyState,
  formatRelativeDate,
  Modal,
  WhatsAppShareModal,
} from '@/components/ui/Primitives';

export default function AnunciosPage() {
  const { user, showToast } = useAuth();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [fixado, setFixado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [waPreview, setWaPreview] = useState<WhatsappDisparoResult | null>(null);

  const isGestor = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const loadAnuncios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.anuncios.listar();
      setAnuncios(data.anuncios);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnuncios();
  }, [loadAnuncios]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.anuncios.criar({ titulo, conteudo, fixado });
      setTitulo('');
      setConteudo('');
      setFixado(false);
      setCreateOpen(false);
      await loadAnuncios();
      showToast('Anúncio publicado!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao criar anúncio.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApagar = async (id: string) => {
    try {
      await apiClient.anuncios.apagar(id);
      await loadAnuncios();
      showToast('Anúncio removido.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao apagar.', 'error');
    }
  };

  const handleDispararWhatsapp = async (id: string) => {
    try {
      const res = await apiClient.anuncios.dispararWhatsapp(id, { dispararWebhook: true });
      setWaPreview(res.whatsapp);
      await loadAnuncios();
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Erro ao preparar partilha WhatsApp.',
        'error'
      );
    }
  };

  return (
    <AppShell title="Anúncios">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h1">Anúncios da Turma</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
            Comunicados oficiais do delegado e disparo direto para o grupo do WhatsApp.
          </p>
        </div>

        {isGestor && (
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <IconPlus size={18} />
            Novo Anúncio
          </button>
        )}
      </div>

      {loading ? (
        <div className="card text-sm text-muted">A carregar anúncios...</div>
      ) : anuncios.length === 0 ? (
        <EmptyState
          icon={<IconMegaphone size={24} />}
          title="Ainda não há anúncios"
          description="Os comunicados oficiais da turma vão aparecer aqui."
          action={
            isGestor ? (
              <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                <IconPlus size={18} />
                Criar Primeiro Anúncio
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {anuncios.map((a) => (
            <article key={a.id} className="card flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.fixado && (
                    <span className="badge badge-primary">
                      <IconPin size={12} /> Fixado
                    </span>
                  )}
                  {a.disparadoWhatsapp && (
                    <span className="badge badge-success">Enviado no WhatsApp</span>
                  )}
                  <span className="text-xs text-muted">
                    {a.autorNome} · {formatRelativeDate(a.createdAt)}
                  </span>
                </div>

                {isGestor && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void handleApagar(a.id)}
                    aria-label="Apagar anúncio"
                  >
                    <IconTrash size={16} />
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-h3">{a.titulo}</h2>
                <p
                  className="text-sm text-secondary mt-1"
                  style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}
                >
                  {a.conteudo}
                </p>
              </div>

              {isGestor && (
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    className="btn btn-whatsapp btn-sm"
                    onClick={() => void handleDispararWhatsapp(a.id)}
                  >
                    <IconWhatsApp size={18} />
                    Disparar no WhatsApp
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo Anúncio">
        <form onSubmit={handleCriar} className="flex flex-col gap-3">
          <label className="field">
            <span className="field-label">Título</span>
            <input
              className="input"
              type="text"
              required
              placeholder="Ex: Alteração de sala — Cálculo II"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Mensagem</span>
            <textarea
              className="textarea"
              required
              placeholder="Escreve os detalhes do comunicado..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold" style={{ minHeight: 44 }}>
            <input
              type="checkbox"
              checked={fixado}
              onChange={(e) => setFixado(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Fixar anúncio no topo
          </label>
          <button type="submit" className="btn btn-primary mt-1" disabled={submitting}>
            {submitting ? 'A publicar...' : 'Publicar Anúncio'}
          </button>
        </form>
      </Modal>

      <WhatsAppShareModal
        open={Boolean(waPreview)}
        onClose={() => setWaPreview(null)}
        title="Disparar Anúncio no WhatsApp"
        textoFormatado={waPreview?.textoFormatado || ''}
        waMeUrl={waPreview?.waMeUrl || '#'}
        onCopySuccess={() => showToast('Anúncio copiado para colar no WhatsApp!', 'success')}
      />
    </AppShell>
  );
}
