import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { Falta, MotivoFalta, StatusFalta } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { IconCalendarOff, IconCheck, IconPlus } from '@/components/ui/Icons';
import { EmptyState, formatRelativeDate, Modal } from '@/components/ui/Primitives';

const MOTIVO_LABEL: Record<MotivoFalta, string> = {
  doenca: 'Doença',
  trabalho: 'Trabalho',
  outro: 'Outro',
};

export default function FaltasPage() {
  const { user, showToast } = useAuth();
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<'todas' | StatusFalta>('todas');
  const [motivoFiltro, setMotivoFiltro] = useState<'todos' | MotivoFalta>('todos');

  const [createOpen, setCreateOpen] = useState(false);
  const [dataFalta, setDataFalta] = useState(() => new Date().toISOString().slice(0, 10));
  const [disciplina, setDisciplina] = useState('');
  const [motivo, setMotivo] = useState<MotivoFalta>('doenca');
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isGestor = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const loadFaltas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.faltas.listar({
        status: statusFiltro === 'todas' ? undefined : statusFiltro,
        motivo: motivoFiltro === 'todos' ? undefined : motivoFiltro,
      });
      setFaltas(data.faltas);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFiltro, motivoFiltro]);

  useEffect(() => {
    void loadFaltas();
  }, [loadFaltas]);

  const handleRegistarFalta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.faltas.registar({
        data: dataFalta,
        disciplina,
        motivo,
        descricao,
      });
      setDisciplina('');
      setDescricao('');
      setCreateOpen(false);
      await loadFaltas();
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
      await loadFaltas();
      showToast('Falta marcada como vista.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar falta.', 'error');
    }
  };

  return (
    <AppShell title="Faltas">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h1">Avisos de Falta</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
            {isGestor
              ? 'Revê os avisos de falta dos colegas durante ou no fim do dia.'
              : 'Envia o teu aviso de falta para o delegado justificar junto dos professores.'}
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <IconPlus size={18} />
          Registar Falta
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="tabs-scroll">
          <button
            type="button"
            className={`tab-pill ${statusFiltro === 'todas' ? 'active' : ''}`}
            onClick={() => setStatusFiltro('todas')}
          >
            Todas
          </button>
          <button
            type="button"
            className={`tab-pill ${statusFiltro === 'pendente' ? 'active' : ''}`}
            onClick={() => setStatusFiltro('pendente')}
          >
            Pendentes
          </button>
          <button
            type="button"
            className={`tab-pill ${statusFiltro === 'visto' ? 'active' : ''}`}
            onClick={() => setStatusFiltro('visto')}
          >
            Vistas
          </button>
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 160 }}
          value={motivoFiltro}
          onChange={(e) => setMotivoFiltro(e.target.value as 'todos' | MotivoFalta)}
          aria-label="Filtrar por motivo"
        >
          <option value="todos">Todos os motivos</option>
          <option value="doenca">Doença</option>
          <option value="trabalho">Trabalho</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      {loading ? (
        <div className="card text-sm text-muted">A carregar faltas...</div>
      ) : faltas.length === 0 ? (
        <EmptyState
          icon={<IconCalendarOff size={24} />}
          title="Sem avisos de falta"
          description="Nenhum registo encontrado com os filtros atuais."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <IconPlus size={18} />
              Enviar Aviso de Falta
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {faltas.map((f) => (
            <article key={f.id} className="card flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{f.alunoNome}</span>
                  <span className="badge badge-neutral">{MOTIVO_LABEL[f.motivo]}</span>
                  <span
                    className={`badge ${
                      f.status === 'visto' ? 'badge-success' : 'badge-warning'
                    }`}
                  >
                    {f.status === 'visto' ? 'Visto' : 'Pendente'}
                  </span>
                </div>
                <span className="font-mono text-xs text-muted">{f.data}</span>
              </div>

              <div className="text-sm font-semibold">{f.disciplina}</div>
              <p className="text-sm text-secondary" style={{ margin: 0 }}>
                {f.descricao}
              </p>

              <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
                <span className="text-xs text-muted">
                  Enviado {formatRelativeDate(f.createdAt)}
                  {f.vistoPorNome ? ` · Visto por ${f.vistoPorNome}` : ''}
                </span>

                {isGestor && f.status === 'pendente' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => void handleMarcarVista(f.id)}
                  >
                    <IconCheck size={16} />
                    Marcar como visto
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Registar Aviso de Falta">
        <form onSubmit={handleRegistarFalta} className="flex flex-col gap-3">
          <label className="field">
            <span className="field-label">Data da Falta</span>
            <input
              className="input"
              type="date"
              required
              value={dataFalta}
              onChange={(e) => setDataFalta(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Disciplina / Aula</span>
            <input
              className="input"
              type="text"
              required
              placeholder="Ex: Algoritmos e Estruturas de Dados"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Motivo</span>
            <select
              className="select"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoFalta)}
            >
              <option value="doenca">Doença / Consulta Médica</option>
              <option value="trabalho">Trabalho / Estágio</option>
              <option value="outro">Outro Motivo</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Descrição / Justificação</span>
            <textarea
              className="textarea"
              required
              placeholder="Explica brevemente o motivo para o delegado..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn-primary mt-1" disabled={submitting}>
            {submitting ? 'A enviar...' : 'Enviar Aviso de Falta'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
