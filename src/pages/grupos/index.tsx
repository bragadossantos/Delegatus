import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { GrupoTrabalho, ModoGrupo } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

export default function GruposPage() {
  const { user, showToast } = useAuth();
  const [grupos, setGrupos] = useState<GrupoTrabalho[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [modo, setModo] = useState<ModoGrupo>('livre');
  const [quantidadeGrupos, setQuantidadeGrupos] = useState(4);
  const [limiteVagas, setLimiteVagas] = useState(5);
  const [temasText, setTemasText] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDelegadoOrSub = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.grupos.listar();
      setGrupos(res.grupos);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCriarGrupos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const temas = temasText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      if (modo === 'livre') {
        await apiClient.grupos.criar({
          modo: 'livre',
          quantidadeGrupos,
          limiteVagas,
          temas,
          disciplina: disciplina || undefined,
        });
      } else {
        await apiClient.grupos.criar({
          modo,
          tamanhoGrupo: limiteVagas,
          temaBase: temas[0] || undefined,
          disciplina: disciplina || undefined,
        });
      }

      setShowCreate(false);
      setTemasText('');
      await load();
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
      await load();
      showToast('Entraste no grupo!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Não foi possível entrar.', 'error');
    }
  };

  const handleSair = async (id: string) => {
    try {
      await apiClient.grupos.sair(id);
      await load();
      showToast('Saíste do grupo.', 'info');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao sair.', 'error');
    }
  };

  const handleApagar = async (id: string) => {
    try {
      await apiClient.grupos.apagar(id);
      await load();
      showToast('Grupo removido.', 'info');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao remover.', 'error');
    }
  };

  return (
    <AppShell title="Grupos">
      <div className="flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary font-extrabold">
              Grupos de Trabalho
            </h1>
            <p className="font-body-md text-on-surface-variant">
              Organização por ordem alfabética, aleatória ou entrada livre com limite de vagas e tema.
            </p>
          </div>
          {isDelegadoOrSub && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="min-h-[44px] px-4 rounded-xl bg-primary text-on-primary font-label-md font-bold flex items-center gap-2 self-start"
            >
              <span className="material-symbols-outlined text-[20px]">{showCreate ? 'close' : 'group_add'}</span>
              <span>{showCreate ? 'Cancelar' : 'Criar Grupos'}</span>
            </button>
          )}
        </div>

        {showCreate && isDelegadoOrSub && (
          <form
            onSubmit={handleCriarGrupos}
            className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-sm"
          >
            <h2 className="font-headline-sm font-bold text-on-surface">Gerar Grupos de Trabalho</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm font-bold text-on-surface-variant">Modo de Formação</label>
                <select
                  value={modo}
                  onChange={(e) => setModo(e.target.value as ModoGrupo)}
                  className="min-h-[44px] px-3 rounded-xl bg-surface-container-low"
                >
                  <option value="livre">Entrada Livre (com limite de vagas)</option>
                  <option value="alfabetico">Ordem Alfabética Automática</option>
                  <option value="aleatorio">Distribuição Aleatória Automática</option>
                </select>
              </div>
              {modo === 'livre' && (
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-bold text-on-surface-variant">Nº de Grupos</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantidadeGrupos}
                    onChange={(e) => setQuantidadeGrupos(Number(e.target.value))}
                    className="min-h-[44px] px-3 rounded-xl bg-surface-container-low"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm font-bold text-on-surface-variant">Limite de Vagas / Grupo</label>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={limiteVagas}
                  onChange={(e) => setLimiteVagas(Number(e.target.value))}
                  className="min-h-[44px] px-3 rounded-xl bg-surface-container-low"
                />
              </div>
            </div>

            <input
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              placeholder="Disciplina (opcional, ex: Sistemas Operativos)"
              className="min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
            />
            <textarea
              rows={3}
              value={temasText}
              onChange={(e) => setTemasText(e.target.value)}
              placeholder={
                modo === 'livre'
                  ? 'Temas (1 por linha, opcional — ex: Tema 1: Escalonamento)'
                  : 'Tema base (opcional)'
              }
              className="p-3.5 rounded-xl bg-surface-container-low"
            />
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 rounded-xl bg-primary text-on-primary font-label-md font-bold self-start"
            >
              {submitting ? 'A gerar...' : 'Gerar Grupos'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant">A carregar grupos...</div>
        ) : grupos.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl text-center shadow-sm">
            <span className="material-symbols-outlined text-[36px] text-secondary">group_work</span>
            <p className="font-headline-sm font-bold mt-2">Nenhum grupo criado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {grupos.map((g) => {
              const count = g.membros.length;
              const pct = Math.min(100, Math.round((count / g.limiteVagas) * 100));
              const isFull = count >= g.limiteVagas;
              const isMember = g.membros.some((m) => m.userId === user?.id);

              return (
                <div
                  key={g.id}
                  className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm font-bold uppercase">
                        {g.modo}
                      </span>
                      <span
                        className={`font-numeric-tabular text-xs font-bold ${
                          isFull ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        {count}/{g.limiteVagas} vagas
                      </span>
                    </div>

                    <h3 className="font-headline-md text-on-surface font-bold mt-2">{g.nome}</h3>
                    {g.tema && <p className="font-label-md text-secondary font-semibold">{g.tema}</p>}
                    {g.disciplina && <p className="font-body-sm text-on-surface-variant">{g.disciplina}</p>}

                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? 'bg-error' : 'bg-secondary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {g.membros.length === 0 ? (
                        <span className="font-body-sm text-outline">Sem integrantes ainda</span>
                      ) : (
                        g.membros.map((m) => (
                          <span
                            key={m.userId}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-low font-label-sm text-on-surface"
                          >
                            {m.nome}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-outline-variant/30">
                    {isMember ? (
                      <button
                        type="button"
                        onClick={() => void handleSair(g.id)}
                        className="flex-1 min-h-[40px] rounded-xl bg-error-container text-on-error-container font-label-md font-bold"
                      >
                        Sair do Grupo
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isFull}
                        onClick={() => void handleEntrar(g.id)}
                        className="flex-1 min-h-[40px] rounded-xl bg-primary text-on-primary font-label-md font-bold disabled:opacity-40"
                      >
                        {isFull ? 'Grupo Cheio' : 'Entrar no Grupo'}
                      </button>
                    )}

                    {isDelegadoOrSub && (
                      <button
                        type="button"
                        onClick={() => void handleApagar(g.id)}
                        className="w-10 h-10 rounded-xl bg-surface-container text-error flex items-center justify-center"
                        title="Remover grupo"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
