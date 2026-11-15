import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { SondagemComResultados } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { IconBarChart, IconCheck, IconPlus, IconTrash } from '@/components/ui/Icons';
import { EmptyState, formatRelativeDate, Modal } from '@/components/ui/Primitives';

export default function SondagensPage() {
  const { user, showToast } = useAuth();
  const [sondagens, setSondagens] = useState<SondagemComResultados[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [opcoes, setOpcoes] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);

  const isGestor = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const loadSondagens = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.sondagens.listar();
      setSondagens(data.sondagens);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSondagens();
  }, [loadSondagens]);

  const handleVotar = async (sondagemId: string, opcaoId: string) => {
    try {
      await apiClient.sondagens.votar(sondagemId, opcaoId);
      await loadSondagens();
      showToast('Voto registado!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao votar.', 'error');
    }
  };

  const handleEncerrar = async (id: string) => {
    try {
      await apiClient.sondagens.encerrar(id);
      await loadSondagens();
      showToast('Sondagem encerrada.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao encerrar.', 'error');
    }
  };

  const handleApagar = async (id: string) => {
    try {
      await apiClient.sondagens.apagar(id);
      await loadSondagens();
      showToast('Sondagem removida.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao apagar.', 'error');
    }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = opcoes.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      showToast('Adiciona pelo menos 2 opções.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.sondagens.criar({
        titulo,
        descricao: descricao.trim() || undefined,
        opcoes: validOptions,
      });
      setTitulo('');
      setDescricao('');
      setOpcoes(['', '']);
      setCreateOpen(false);
      await loadSondagens();
      showToast('Sondagem criada!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao criar sondagem.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Sondagem">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h1">Sondagens da Turma</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
            Votações rápidas para decisões da turma (1 voto por colega).
          </p>
        </div>

        {isGestor && (
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <IconPlus size={18} />
            Nova Sondagem
          </button>
        )}
      </div>

      {loading ? (
        <div className="card text-sm text-muted">A carregar sondagens...</div>
      ) : sondagens.length === 0 ? (
        <EmptyState
          icon={<IconBarChart size={24} />}
          title="Sem sondagens ativas"
          description="As votações criadas pelo delegado vão aparecer aqui."
          action={
            isGestor ? (
              <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                <IconPlus size={18} />
                Criar Sondagem
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sondagens.map((s) => {
            const mostrarResultados = Boolean(s.meuVotoOpcaoId) || s.encerrada;
            return (
              <article key={s.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${s.encerrada ? 'badge-neutral' : 'badge-info'}`}>
                      {s.encerrada ? 'Encerrada' : 'Aberta'}
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      {s.totalVotos} {s.totalVotos === 1 ? 'voto' : 'votos'} ·{' '}
                      {formatRelativeDate(s.createdAt)}
                    </span>
                  </div>

                  {isGestor && (
                    <div className="flex items-center gap-1">
                      {!s.encerrada && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => void handleEncerrar(s.id)}
                        >
                          Encerrar
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Apagar sondagem"
                        onClick={() => void handleApagar(s.id)}
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-h3">{s.titulo}</h2>
                  {s.descricao && (
                    <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
                      {s.descricao}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {s.opcoes.map((opt) => {
                    const isMine = s.meuVotoOpcaoId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={mostrarResultados}
                        className="poll-option-btn"
                        style={{
                          borderColor: isMine ? 'var(--color-primary)' : undefined,
                        }}
                        onClick={() => void handleVotar(s.id, opt.id)}
                      >
                        {mostrarResultados && (
                          <span
                            className="poll-option-bar"
                            style={{
                              width: `${opt.percentagem}%`,
                              backgroundColor: isMine
                                ? 'var(--color-primary-soft)'
                                : 'var(--bg-surface-muted)',
                            }}
                          />
                        )}
                        <span
                          className="flex items-center gap-2"
                          style={{ position: 'relative', zIndex: 1 }}
                        >
                          {isMine && <IconCheck size={16} />}
                          <span>{opt.texto}</span>
                        </span>
                        {mostrarResultados && (
                          <span
                            className="font-mono text-sm font-semibold tabular-nums"
                            style={{ position: 'relative', zIndex: 1 }}
                          >
                            {opt.percentagem}% ({opt.votosCount})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova Sondagem">
        <form onSubmit={handleCriar} className="flex flex-col gap-3">
          <label className="field">
            <span className="field-label">Pergunta</span>
            <input
              className="input"
              type="text"
              required
              placeholder="Ex: Melhor dia para o teste de Sistemas?"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Descrição (opcional)</span>
            <input
              className="input"
              type="text"
              placeholder="Detalhes adicionais..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="field-label">Opções (2 a 6)</span>
            {opcoes.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="input"
                  type="text"
                  required
                  placeholder={`Opção ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...opcoes];
                    next[idx] = e.target.value;
                    setOpcoes(next);
                  }}
                />
                {opcoes.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label="Remover opção"
                    onClick={() => setOpcoes(opcoes.filter((_, i) => i !== idx))}
                  >
                    <IconTrash size={16} />
                  </button>
                )}
              </div>
            ))}
            {opcoes.length < 6 && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setOpcoes([...opcoes, ''])}
              >
                <IconPlus size={16} />
                Adicionar Opção
              </button>
            )}
          </div>

          <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
            {submitting ? 'A criar...' : 'Publicar Sondagem'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
