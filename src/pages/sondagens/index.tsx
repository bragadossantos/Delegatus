import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { SondagemComResultados } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

export default function SondagensPage() {
  const { user, showToast } = useAuth();
  const [sondagens, setSondagens] = useState<SondagemComResultados[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [opcoesText, setOpcoesText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDelegadoOrSub = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.sondagens.listar();
      setSondagens(res.sondagens);
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
    const opcoes = opcoesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (opcoes.length < 2) {
      showToast('Adiciona pelo menos 2 opções (1 por linha).', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.sondagens.criar({
        titulo,
        descricao: descricao || undefined,
        opcoes,
      });
      setTitulo('');
      setDescricao('');
      setOpcoesText('');
      setShowCreate(false);
      await load();
      showToast('Sondagem criada e turma notificada!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao criar sondagem.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVotar = async (sondagemId: string, opcaoId: string) => {
    try {
      await apiClient.sondagens.votar(sondagemId, opcaoId);
      await load();
      showToast('Voto registado!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao votar.', 'error');
    }
  };

  const handleEncerrar = async (sondagemId: string) => {
    try {
      await apiClient.sondagens.encerrar(sondagemId);
      await load();
      showToast('Sondagem encerrada.', 'info');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao encerrar.', 'error');
    }
  };

  return (
    <AppShell title="Sondagens">
      <div className="flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary font-extrabold">
              Sondagens &amp; Votações
            </h1>
            <p className="font-body-md text-on-surface-variant">
              Decisões rápidas e democráticas para toda a turma (1 voto por colega).
            </p>
          </div>
          {isDelegadoOrSub && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="min-h-[44px] px-4 rounded-xl bg-primary text-on-primary font-label-md font-bold flex items-center gap-2 self-start"
            >
              <span className="material-symbols-outlined text-[20px]">{showCreate ? 'close' : 'poll'}</span>
              <span>{showCreate ? 'Cancelar' : 'Nova Sondagem'}</span>
            </button>
          )}
        </div>

        {showCreate && isDelegadoOrSub && (
          <form
            onSubmit={handleCriar}
            className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-sm"
          >
            <h2 className="font-headline-sm font-bold text-on-surface">Criar Sondagem para a Turma</h2>
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Pergunta da sondagem (ex: Melhor dia para o teste de Álgebra?)"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
            />
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Contexto adicional (opcional)"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
            />
            <textarea
              required
              rows={3}
              value={opcoesText}
              onChange={(e) => setOpcoesText(e.target.value)}
              placeholder={'Opções (uma por linha):\nSegunda-feira\nQuarta-feira\nSexta-feira'}
              className="w-full p-3.5 rounded-xl bg-surface-container-low"
            />
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 rounded-xl bg-primary text-on-primary font-label-md font-bold self-start"
            >
              {submitting ? 'A publicar...' : 'Publicar Sondagem'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant">A carregar sondagens...</div>
        ) : sondagens.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl text-center shadow-sm">
            <span className="material-symbols-outlined text-[36px] text-secondary">how_to_vote</span>
            <p className="font-headline-sm font-bold mt-2">Sem sondagens ativas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
            {sondagens.map((s) => (
              <div
                key={s.id}
                className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col justify-between gap-space-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-label-sm font-bold ${
                        !s.encerrada
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {!s.encerrada ? 'Votação Aberta' : 'Encerrada'}
                    </span>
                    <span className="font-numeric-tabular text-xs text-on-surface-variant">
                      {s.totalVotos} votos
                    </span>
                  </div>

                  <h3 className="font-headline-md text-on-surface font-bold">{s.titulo}</h3>
                  {s.descricao && <p className="font-body-sm text-on-surface-variant mb-3">{s.descricao}</p>}

                  <div className="flex flex-col gap-2 mt-2">
                    {s.opcoes.map((o) => {
                      const voted = s.meuVotoOpcaoId === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          disabled={s.encerrada}
                          onClick={() => void handleVotar(s.id, o.id)}
                          className={`relative overflow-hidden text-left p-3 rounded-xl border transition-all min-h-[46px] ${
                            voted
                              ? 'border-primary bg-primary-fixed/30'
                              : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-secondary-container/40 transition-all"
                            style={{ width: `${o.percentagem}%` }}
                          />
                          <div className="relative z-10 flex items-center justify-between gap-2">
                            <span className="font-label-lg font-semibold text-on-surface flex items-center gap-2">
                              {voted && (
                                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                              )}
                              {o.texto}
                            </span>
                            <span className="font-numeric-tabular text-xs font-bold text-primary">
                              {o.percentagem}% ({o.votosCount})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isDelegadoOrSub && !s.encerrada && (
                  <div className="pt-2 border-t border-outline-variant/30 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleEncerrar(s.id)}
                      className="px-3 min-h-[36px] rounded-lg bg-error-container/70 text-on-error-container font-label-sm font-bold"
                    >
                      Encerrar Votação
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
