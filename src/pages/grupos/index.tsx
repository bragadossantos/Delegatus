import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { GrupoTrabalho, ModoGrupo } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { IconLayers, IconPlus, IconTrash } from '@/components/ui/Icons';
import { EmptyState, Modal } from '@/components/ui/Primitives';

const MODO_LABEL: Record<ModoGrupo, string> = {
  alfabetico: 'Alfabético',
  aleatorio: 'Aleatório',
  livre: 'Entrada Livre',
};

export default function GruposPage() {
  const { user, showToast } = useAuth();
  const [grupos, setGrupos] = useState<GrupoTrabalho[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [modo, setModo] = useState<ModoGrupo>('livre');
  const [disciplina, setDisciplina] = useState('');
  const [temaBase, setTemaBase] = useState('');
  const [tamanhoGrupo, setTamanhoGrupo] = useState(4);
  const [quantidadeGrupos, setQuantidadeGrupos] = useState(4);
  const [limiteVagas, setLimiteVagas] = useState(5);
  const [temasText, setTemasText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isGestor = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const loadGrupos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.grupos.listar();
      setGrupos(data.grupos);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrupos();
  }, [loadGrupos]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modo === 'livre') {
        const temas = temasText
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean);
        await apiClient.grupos.criar({
          modo: 'livre',
          disciplina: disciplina.trim() || undefined,
          quantidadeGrupos,
          limiteVagas,
          temas: temas.length > 0 ? temas : undefined,
        });
      } else {
        await apiClient.grupos.criar({
          modo,
          disciplina: disciplina.trim() || undefined,
          temaBase: temaBase.trim() || undefined,
          tamanhoGrupo,
        });
      }
      setCreateOpen(false);
      setDisciplina('');
      setTemaBase('');
      setTemasText('');
      await loadGrupos();
      showToast('Grupos de trabalho criados!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao criar grupos.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEntrar = async (id: string) => {
    try {
      await apiClient.grupos.entrar(id);
      await loadGrupos();
      showToast('Entraste no grupo!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Não foi possível entrar.', 'error');
    }
  };

  const handleSair = async (id: string) => {
    try {
      await apiClient.grupos.sair(id);
      await loadGrupos();
      showToast('Saíste do grupo.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao sair do grupo.', 'error');
    }
  };

  const handleApagar = async (id: string) => {
    try {
      await apiClient.grupos.apagar(id);
      await loadGrupos();
      showToast('Grupo removido.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao remover grupo.', 'error');
    }
  };

  return (
    <AppShell title="Grupos de Trabalho">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h1">Grupos de Trabalho</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
            Grupos automáticos (alfabético/aleatório) ou numerados com tema e limite de vagas.
          </p>
        </div>

        {isGestor && (
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <IconPlus size={18} />
            Criar Grupos
          </button>
        )}
      </div>

      {loading ? (
        <div className="card text-sm text-muted">A carregar grupos...</div>
      ) : grupos.length === 0 ? (
        <EmptyState
          icon={<IconLayers size={24} />}
          title="Sem grupos criados"
          description="O delegado pode gerar grupos por ordem alfabética, aleatória ou por vagas."
          action={
            isGestor ? (
              <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                <IconPlus size={18} />
                Criar Grupos
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid-cards">
          {grupos.map((g) => {
            const ocupados = g.membros.length;
            const pct = g.limiteVagas > 0 ? Math.min(100, Math.round((ocupados / g.limiteVagas) * 100)) : 0;
            const lotado = ocupados >= g.limiteVagas;
            const estouDentro = Boolean(user && g.membros.some((m) => m.userId === user.id));

            const barColor =
              pct >= 100
                ? 'var(--status-danger-text)'
                : pct >= 80
                ? 'var(--status-warning-text)'
                : 'var(--color-secondary)';

            return (
              <article key={g.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-h3">{g.nome}</h2>
                      <span className="badge badge-info">{MODO_LABEL[g.modo]}</span>
                    </div>
                    {g.tema && (
                      <div className="text-sm font-semibold mt-1" style={{ color: 'var(--color-primary)' }}>
                        Tema: {g.tema}
                      </div>
                    )}
                    {g.disciplina && (
                      <div className="text-xs text-muted mt-1">{g.disciplina}</div>
                    )}
                  </div>

                  {isGestor && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label="Apagar grupo"
                      onClick={() => void handleApagar(g.id)}
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>

                {/* Vagas Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-secondary tabular-nums">
                      {ocupados} de {g.limiteVagas} vagas preenchidas
                    </span>
                    <span className="font-mono" style={{ color: barColor }}>
                      {lotado ? 'Lotado' : `${g.limiteVagas - ocupados} livres`}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                {/* Members */}
                <div className="flex flex-wrap gap-1">
                  {g.membros.length === 0 ? (
                    <span className="text-xs text-muted">Ainda sem integrantes.</span>
                  ) : (
                    g.membros.map((m) => (
                      <span key={m.userId} className="badge badge-neutral">
                        {m.nome}
                      </span>
                    ))
                  )}
                </div>

                {/* Join / Leave for livre mode */}
                {g.modo === 'livre' && (
                  <div className="mt-1">
                    {estouDentro ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-full"
                        onClick={() => void handleSair(g.id)}
                      >
                        Sair do Grupo
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-full"
                        disabled={lotado}
                        onClick={() => void handleEntrar(g.id)}
                      >
                        {lotado ? 'Grupo Lotado' : 'Entrar no Grupo'}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Criar Grupos de Trabalho">
        <form onSubmit={handleCriar} className="flex flex-col gap-3">
          <label className="field">
            <span className="field-label">Modo de Formação</span>
            <select
              className="select"
              value={modo}
              onChange={(e) => setModo(e.target.value as ModoGrupo)}
            >
              <option value="livre">Numerado com Tema e Limite de Vagas (Entrada Livre)</option>
              <option value="alfabetico">Automático — Ordem Alfabética</option>
              <option value="aleatorio">Automático — Aleatório</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Disciplina (opcional)</span>
            <input
              className="input"
              type="text"
              placeholder="Ex: Engenharia de Software"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
            />
          </label>

          {modo === 'livre' ? (
            <>
              <div className="grid-cards">
                <label className="field">
                  <span className="field-label">Nº de Grupos</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={quantidadeGrupos}
                    onChange={(e) => setQuantidadeGrupos(Number(e.target.value))}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Máx. de Vagas / Grupo</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={limiteVagas}
                    onChange={(e) => setLimiteVagas(Number(e.target.value))}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field-label">Temas por grupo (1 por linha, opcional)</span>
                <textarea
                  className="textarea"
                  placeholder={'Grupo 1: Arquitetura\nGrupo 2: Base de Dados\nGrupo 3: Frontend PWA'}
                  value={temasText}
                  onChange={(e) => setTemasText(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <label className="field">
                <span className="field-label">Pessoas por Grupo</span>
                <input
                  className="input"
                  type="number"
                  min={2}
                  max={20}
                  required
                  value={tamanhoGrupo}
                  onChange={(e) => setTamanhoGrupo(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field-label">Tema Base (opcional)</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex: Seminário Final"
                  value={temaBase}
                  onChange={(e) => setTemaBase(e.target.value)}
                />
              </label>
            </>
          )}

          <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
            {submitting ? 'A gerar grupos...' : 'Gerar Grupos'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
