import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type {
  AnexoImagem,
  AtividadeExtra,
  CategoriaAnexo,
  DiaSemana,
  FaltaProfessor,
  HorarioItem,
  Materia,
  TipoAtividade,
} from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { IconBookOpen, IconCheck, IconPlus, IconTrash } from '@/components/ui/Icons';
import { EmptyState, formatRelativeDate, ImageUpload, Modal } from '@/components/ui/Primitives';

type InfoTab = 'horario' | 'materias' | 'professores' | 'atividades' | 'fotos';

const DIAS_LABEL: Record<DiaSemana, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
};

const TIPO_ATIVIDADE_LABEL: Record<TipoAtividade, string> = {
  trabalho: 'Trabalho',
  prova: 'Prova',
  evento: 'Evento',
  tarefa_extra: 'Tarefa Extra',
};

const CATEGORIA_ANEXO_LABEL: Record<CategoriaAnexo, string> = {
  quadro: 'Quadro',
  horario: 'Horário',
  evento: 'Evento',
  material: 'Material',
  outro: 'Outro',
};

export default function InformacoesPage() {
  const { user, showToast } = useAuth();
  const [tab, setTab] = useState<InfoTab>('horario');
  const [loading, setLoading] = useState(true);

  const [horario, setHorario] = useState<HorarioItem[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [faltasProfs, setFaltasProfs] = useState<FaltaProfessor[]>([]);
  const [atividades, setAtividades] = useState<AtividadeExtra[]>([]);
  const [anexos, setAnexos] = useState<AnexoImagem[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [diaSemana, setDiaSemana] = useState<DiaSemana>('segunda');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFim, setHoraFim] = useState('11:00');
  const [disciplina, setDisciplina] = useState('');
  const [sala, setSala] = useState('');
  const [professor, setProfessor] = useState('');

  const [nomeMateria, setNomeMateria] = useState('');
  const [ementa, setEmenta] = useState('');

  const [dataProf, setDataProf] = useState(() => new Date().toISOString().slice(0, 10));
  const [obsProf, setObsProf] = useState('');

  const [tituloAtiv, setTituloAtiv] = useState('');
  const [tipoAtiv, setTipoAtiv] = useState<TipoAtividade>('tarefa_extra');
  const [dataEntrega, setDataEntrega] = useState(() => new Date().toISOString().slice(0, 10));
  const [descAtiv, setDescAtiv] = useState('');

  const [tituloFoto, setTituloFoto] = useState('');
  const [categoriaFoto, setCategoriaFoto] = useState<CategoriaAnexo>('quadro');
  const [imagemUrl, setImagemUrl] = useState('');

  const isGestor = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const loadResumo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.informacoes.resumo();
      setHorario(data.horario);
      setMaterias(data.materias);
      setFaltasProfs(data.faltasProfessores);
      setAtividades(data.atividades);
      setAnexos(data.anexos);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResumo();
  }, [loadResumo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === 'horario') {
        await apiClient.informacoes.criarHorario({
          diaSemana,
          horaInicio,
          horaFim,
          disciplina,
          sala: sala.trim() || undefined,
          professor: professor.trim() || undefined,
        });
      } else if (tab === 'materias') {
        await apiClient.informacoes.criarMateria({
          nome: nomeMateria,
          professor: professor.trim() || undefined,
          ementaResumo: ementa.trim() || undefined,
        });
      } else if (tab === 'professores') {
        await apiClient.informacoes.criarFaltaProfessor({
          professor,
          disciplina,
          data: dataProf,
          observacao: obsProf.trim() || undefined,
        });
      } else if (tab === 'atividades') {
        await apiClient.informacoes.criarAtividade({
          titulo: tituloAtiv,
          disciplina: disciplina.trim() || undefined,
          tipo: tipoAtiv,
          dataEntrega,
          descricao: descAtiv,
        });
      } else if (tab === 'fotos') {
        if (!imagemUrl) {
          showToast('Seleciona uma imagem primeiro.', 'error');
          setSubmitting(false);
          return;
        }
        await apiClient.informacoes.criarAnexo({
          titulo: tituloFoto,
          categoria: categoriaFoto,
          imagemUrl,
        });
      }
      setModalOpen(false);
      setDisciplina('');
      setSala('');
      setProfessor('');
      setNomeMateria('');
      setEmenta('');
      setObsProf('');
      setTituloAtiv('');
      setDescAtiv('');
      setTituloFoto('');
      setImagemUrl('');
      await loadResumo();
      showToast('Informação adicionada!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao guardar.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canAddInCurrentTab = tab === 'fotos' || isGestor;

  return (
    <AppShell title="Informações">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h1">Informações da Turma</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
            Horário, matérias, falta de professores, tarefas extras e galeria de fotos.
          </p>
        </div>

        {canAddInCurrentTab && (
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <IconPlus size={18} />
            {tab === 'fotos' ? 'Partilhar Foto' : 'Adicionar'}
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="tabs-scroll">
        <button
          type="button"
          className={`tab-pill ${tab === 'horario' ? 'active' : ''}`}
          onClick={() => setTab('horario')}
        >
          Horário ({horario.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === 'materias' ? 'active' : ''}`}
          onClick={() => setTab('materias')}
        >
          Matérias ({materias.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === 'professores' ? 'active' : ''}`}
          onClick={() => setTab('professores')}
        >
          Falta Profs ({faltasProfs.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === 'atividades' ? 'active' : ''}`}
          onClick={() => setTab('atividades')}
        >
          Tarefas ({atividades.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === 'fotos' ? 'active' : ''}`}
          onClick={() => setTab('fotos')}
        >
          Fotos ({anexos.length})
        </button>
      </div>

      {loading ? (
        <div className="card text-sm text-muted">A carregar informações...</div>
      ) : (
        <>
          {tab === 'horario' &&
            (horario.length === 0 ? (
              <EmptyState
                icon={<IconBookOpen size={24} />}
                title="Horário vazio"
                description="O delegado ainda não publicou o horário semanal."
              />
            ) : (
              <div className="grid-cards">
                {horario.map((h) => (
                  <div key={h.id} className="card flex items-start justify-between gap-2">
                    <div>
                      <span className="badge badge-primary">{DIAS_LABEL[h.diaSemana]}</span>
                      <div className="font-mono text-sm font-bold mt-2">
                        {h.horaInicio} – {h.horaFim}
                      </div>
                      <div className="font-semibold mt-1">{h.disciplina}</div>
                      <div className="text-xs text-muted mt-1">
                        {[h.sala ? `Sala ${h.sala}` : '', h.professor || '']
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                    {isGestor && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Apagar horário"
                        onClick={() =>
                          void apiClient.informacoes.apagarHorario(h.id).then(loadResumo)
                        }
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {tab === 'materias' &&
            (materias.length === 0 ? (
              <EmptyState
                icon={<IconBookOpen size={24} />}
                title="Sem matérias registadas"
                description="As disciplinas e resumos aparecem aqui."
              />
            ) : (
              <div className="grid-cards">
                {materias.map((m) => (
                  <div key={m.id} className="card flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-h3">{m.nome}</h3>
                      {m.professor && (
                        <div className="text-xs text-muted mt-1">Prof. {m.professor}</div>
                      )}
                      {m.ementaResumo && (
                        <p className="text-sm text-secondary mt-2" style={{ margin: '8px 0 0' }}>
                          {m.ementaResumo}
                        </p>
                      )}
                    </div>
                    {isGestor && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Apagar matéria"
                        onClick={() =>
                          void apiClient.informacoes.apagarMateria(m.id).then(loadResumo)
                        }
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {tab === 'professores' &&
            (faltasProfs.length === 0 ? (
              <EmptyState
                icon={<IconBookOpen size={24} />}
                title="Sem faltas de professores"
                description="Todas as aulas previstas decorrem normalmente."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {faltasProfs.map((fp) => (
                  <div key={fp.id} className="card flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-danger">Falta de Professor</span>
                        <span className="font-mono text-xs text-muted">{fp.data}</span>
                      </div>
                      <div className="font-semibold mt-1">
                        {fp.disciplina} — {fp.professor}
                      </div>
                      {fp.observacao && (
                        <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
                          {fp.observacao}
                        </p>
                      )}
                    </div>
                    {isGestor && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label="Apagar registo"
                        onClick={() =>
                          void apiClient.informacoes.apagarFaltaProfessor(fp.id).then(loadResumo)
                        }
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {tab === 'atividades' &&
            (atividades.length === 0 ? (
              <EmptyState
                icon={<IconBookOpen size={24} />}
                title="Sem atividades ou tarefas extras"
                description="Trabalhos, provas e tarefas extras da turma aparecem aqui."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {atividades.map((at) => (
                  <div key={at.id} className="card flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-info">
                          {TIPO_ATIVIDADE_LABEL[at.tipo]}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          Entrega: {at.dataEntrega}
                        </span>
                        {at.concluida && <span className="badge badge-success">Concluída</span>}
                      </div>
                      <h3 className="text-h3 mt-1">{at.titulo}</h3>
                      <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
                        {at.descricao}
                      </p>
                    </div>
                    {isGestor && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            void apiClient.informacoes
                              .atualizarAtividade(at.id, { concluida: !at.concluida })
                              .then(loadResumo)
                          }
                        >
                          <IconCheck size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-label="Apagar atividade"
                          onClick={() =>
                            void apiClient.informacoes.apagarAtividade(at.id).then(loadResumo)
                          }
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {tab === 'fotos' &&
            (anexos.length === 0 ? (
              <EmptyState
                icon={<IconBookOpen size={24} />}
                title="Galeria vazia"
                description="Partilha fotos do quadro, horários ou apontamentos com a turma."
                action={
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setModalOpen(true)}
                  >
                    <IconPlus size={18} />
                    Partilhar Primeira Foto
                  </button>
                }
              />
            ) : (
              <div className="grid-cards">
                {anexos.map((ax) => (
                  <article key={ax.id} className="card flex flex-col gap-2">
                    <img
                      src={ax.imagemUrl}
                      alt={ax.titulo}
                      style={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderRadius: 12,
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="badge badge-neutral">
                          {CATEGORIA_ANEXO_LABEL[ax.categoria]}
                        </span>
                        <h3 className="text-h3 mt-1">{ax.titulo}</h3>
                        <div className="text-xs text-muted">
                          {ax.autorNome} · {formatRelativeDate(ax.createdAt)}
                        </div>
                      </div>
                      {(isGestor || ax.autorId === user?.id) && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-label="Apagar foto"
                          onClick={() =>
                            void apiClient.informacoes.apagarAnexo(ax.id).then(loadResumo)
                          }
                        >
                          <IconTrash size={16} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ))}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          tab === 'horario'
            ? 'Adicionar Aula ao Horário'
            : tab === 'materias'
            ? 'Adicionar Matéria'
            : tab === 'professores'
            ? 'Registar Falta de Professor'
            : tab === 'atividades'
            ? 'Adicionar Tarefa / Atividade'
            : 'Partilhar Foto / Imagem'
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {tab === 'horario' && (
            <>
              <label className="field">
                <span className="field-label">Dia da Semana</span>
                <select
                  className="select"
                  value={diaSemana}
                  onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}
                >
                  {Object.entries(DIAS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid-cards">
                <label className="field">
                  <span className="field-label">Início</span>
                  <input
                    className="input"
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Fim</span>
                  <input
                    className="input"
                    type="time"
                    required
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Disciplina</span>
                <input
                  className="input"
                  type="text"
                  required
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Sala (opcional)</span>
                <input
                  className="input"
                  type="text"
                  value={sala}
                  onChange={(e) => setSala(e.target.value)}
                />
              </label>
            </>
          )}

          {tab === 'materias' && (
            <>
              <label className="field">
                <span className="field-label">Nome da Matéria / Disciplina</span>
                <input
                  className="input"
                  type="text"
                  required
                  value={nomeMateria}
                  onChange={(e) => setNomeMateria(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Professor (opcional)</span>
                <input
                  className="input"
                  type="text"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Resumo / Ementa</span>
                <textarea
                  className="textarea"
                  value={ementa}
                  onChange={(e) => setEmenta(e.target.value)}
                />
              </label>
            </>
          )}

          {tab === 'professores' && (
            <>
              <label className="field">
                <span className="field-label">Professor</span>
                <input
                  className="input"
                  type="text"
                  required
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Disciplina</span>
                <input
                  className="input"
                  type="text"
                  required
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Data</span>
                <input
                  className="input"
                  type="date"
                  required
                  value={dataProf}
                  onChange={(e) => setDataProf(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Observação</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex: Aula compensada na sexta"
                  value={obsProf}
                  onChange={(e) => setObsProf(e.target.value)}
                />
              </label>
            </>
          )}

          {tab === 'atividades' && (
            <>
              <label className="field">
                <span className="field-label">Título</span>
                <input
                  className="input"
                  type="text"
                  required
                  value={tituloAtiv}
                  onChange={(e) => setTituloAtiv(e.target.value)}
                />
              </label>
              <div className="grid-cards">
                <label className="field">
                  <span className="field-label">Tipo</span>
                  <select
                    className="select"
                    value={tipoAtiv}
                    onChange={(e) => setTipoAtiv(e.target.value as TipoAtividade)}
                  >
                    <option value="tarefa_extra">Tarefa Extra</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="prova">Prova</option>
                    <option value="evento">Evento</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Data de Entrega</span>
                  <input
                    className="input"
                    type="date"
                    required
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Descrição</span>
                <textarea
                  className="textarea"
                  required
                  value={descAtiv}
                  onChange={(e) => setDescAtiv(e.target.value)}
                />
              </label>
            </>
          )}

          {tab === 'fotos' && (
            <>
              <label className="field">
                <span className="field-label">Título da Foto</span>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="Ex: Quadro da aula de Cálculo"
                  value={tituloFoto}
                  onChange={(e) => setTituloFoto(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Categoria</span>
                <select
                  className="select"
                  value={categoriaFoto}
                  onChange={(e) => setCategoriaFoto(e.target.value as CategoriaAnexo)}
                >
                  <option value="quadro">Quadro / Apontamentos</option>
                  <option value="horario">Horário</option>
                  <option value="material">Material de Apoio</option>
                  <option value="evento">Evento</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
              <div className="field">
                <span className="field-label">Imagem</span>
                <ImageUpload
                  value={imagemUrl}
                  onChange={setImagemUrl}
                  onError={(msg) => showToast(msg, 'error')}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
            {submitting ? 'A guardar...' : 'Guardar'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
