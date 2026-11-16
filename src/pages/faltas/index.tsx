import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { Falta, MotivoFalta, StatusFalta } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

const MOTIVO_LABEL: Record<MotivoFalta, string> = {
  doenca: 'Doença',
  trabalho: 'Trabalho',
  outro: 'Outro',
};

const STATUS_BADGE: Record<StatusFalta, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-error-container text-on-error-container' },
  visto: { label: 'Visto pelo Delegado', cls: 'bg-secondary-container text-on-secondary-container' },
};

export default function FaltasPage() {
  const { user, showToast } = useAuth();
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | StatusFalta>('todas');

  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [disciplina, setDisciplina] = useState('');
  const [motivo, setMotivo] = useState<MotivoFalta>('doenca');
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDelegadoOrSub = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.faltas.listar();
      setFaltas(res.faltas);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.faltas.registar({ data, disciplina, motivo, descricao });
      setDisciplina('');
      setDescricao('');
      await load();
      showToast('Aviso de falta enviado ao delegado!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao registar falta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarcarVista = async (id: string) => {
    try {
      await apiClient.faltas.marcarVista(id);
      await load();
      showToast('Falta marcada como vista.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar.', 'error');
    }
  };

  const filtered = filtro === 'todas' ? faltas : faltas.filter((f) => f.status === filtro);

  return (
    <AppShell title="Faltas">
      <div className="flex flex-col gap-space-lg">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary font-extrabold">
            Gestão de Faltas
          </h1>
          <p className="font-body-md text-on-surface-variant">
            {isDelegadoOrSub
              ? 'Revê durante ou no fim do dia os avisos de falta enviados pelos colegas.'
              : 'Avisa o delegado caso não possas comparecer por motivo de doença, trabalho ou outro.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-sm"
        >
          <h2 className="font-headline-sm font-bold text-on-surface">Comunicar Falta ao Delegado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
            />
            <input
              required
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              placeholder="Disciplina / Aula"
              className="min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
            />
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoFalta)}
              className="min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
            >
              <option value="doenca">Doença</option>
              <option value="trabalho">Trabalho</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <textarea
            required
            rows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreve brevemente o motivo (ex: consulta médica, turno no trabalho...)"
            className="w-full p-3.5 rounded-xl bg-surface-container-low"
          />
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] px-5 rounded-xl bg-primary text-on-primary font-label-md font-bold self-start"
          >
            {submitting ? 'A enviar...' : 'Enviar Aviso de Falta'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {(['todas', 'pendente', 'visto'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFiltro(tab)}
              className={`min-h-[38px] px-4 rounded-full font-label-md font-semibold transition-colors ${
                filtro === tab
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab === 'todas' ? 'Todas' : STATUS_BADGE[tab].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant">A carregar faltas...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl text-center shadow-sm">
            <span className="material-symbols-outlined text-[36px] text-secondary">event_available</span>
            <p className="font-headline-sm font-bold mt-2">Sem registos neste filtro</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {filtered.map((f) => {
              const st = STATUS_BADGE[f.status];
              return (
                <div
                  key={f.id}
                  className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full font-label-sm font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                      <span className="font-numeric-tabular text-xs text-on-surface-variant">{f.data}</span>
                    </div>
                    <h3 className="font-headline-sm font-bold text-on-surface">{f.alunoNome}</h3>
                    <p className="font-label-md text-secondary font-semibold">
                      {f.disciplina} • {MOTIVO_LABEL[f.motivo]}
                    </p>
                    <p className="font-body-md text-on-surface-variant mt-1">{f.descricao}</p>
                  </div>

                  {isDelegadoOrSub && f.status === 'pendente' && (
                    <div className="flex gap-2 pt-2 border-t border-outline-variant/30">
                      <button
                        type="button"
                        onClick={() => void handleMarcarVista(f.id)}
                        className="flex-1 min-h-[38px] rounded-lg bg-secondary-container text-on-secondary-container font-label-sm font-bold"
                      >
                        Marcar como Visto
                      </button>
                    </div>
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
