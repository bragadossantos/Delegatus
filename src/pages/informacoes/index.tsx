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

type TabKey = 'horario' | 'materias' | 'professores' | 'atividades' | 'fotos';

const DIAS: { value: DiaSemana; label: string }[] = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
];

export default function InformacoesPage() {
  const { user, showToast } = useAuth();
  const [tab, setTab] = useState<TabKey>('horario');
  const [loading, setLoading] = useState(true);

  const [horario, setHorario] = useState<HorarioItem[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [faltasProf, setFaltasProf] = useState<FaltaProfessor[]>([]);
  const [atividades, setAtividades] = useState<AtividadeExtra[]>([]);
  const [fotos, setFotos] = useState<AnexoImagem[]>([]);

  const [diaSemana, setDiaSemana] = useState<DiaSemana>('segunda');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('10:00');
  const [discHorario, setDiscHorario] = useState('');
  const [sala, setSala] = useState('');
  const [profHorario, setProfHorario] = useState('');

  const [matNome, setMatNome] = useState('');
  const [matProf, setMatProf] = useState('');
  const [matDesc, setMatDesc] = useState('');

  const [fpProf, setFpProf] = useState('');
  const [fpDisc, setFpDisc] = useState('');
  const [fpData, setFpData] = useState(() => new Date().toISOString().slice(0, 10));
  const [fpObs, setFpObs] = useState('');

  const [atTipo, setAtTipo] = useState<TipoAtividade>('tarefa_extra');
  const [atTitulo, setAtTitulo] = useState('');
  const [atDesc, setAtDesc] = useState('');
  const [atData, setAtData] = useState(() => new Date().toISOString().slice(0, 10));

  const [fotoTitulo, setFotoTitulo] = useState('');
  const [fotoCat, setFotoCat] = useState<CategoriaAnexo>('quadro');
  const [fotoDataUrl, setFotoDataUrl] = useState('');

  const isDelegadoOrSub = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const resumo = await apiClient.informacoes.resumo();
      setHorario(resumo.horario);
      setMaterias(resumo.materias);
      setFaltasProf(resumo.faltasProfessores);
      setAtividades(resumo.atividades);
      setFotos(resumo.anexos);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleAddHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.informacoes.criarHorario({
        diaSemana,
        horaInicio,
        horaFim,
        disciplina: discHorario,
        sala: sala || undefined,
        professor: profHorario || undefined,
      });
      setDiscHorario('');
      setSala('');
      setProfHorario('');
      await loadAll();
      showToast('Aula adicionada ao horário!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao adicionar horário.', 'error');
    }
  };

  const handleAddMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.informacoes.criarMateria({
        nome: matNome,
        professor: matProf || undefined,
        ementaResumo: matDesc || undefined,
      });
      setMatNome('');
      setMatProf('');
      setMatDesc('');
      await loadAll();
      showToast('Matéria registada!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao registar matéria.', 'error');
    }
  };

  const handleAddFaltaProf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.informacoes.criarFaltaProfessor({
        professor: fpProf,
        disciplina: fpDisc,
        data: fpData,
        observacao: fpObs || undefined,
      });
      setFpProf('');
      setFpDisc('');
      setFpObs('');
      await loadAll();
      showToast('Falta de docente comunicada à turma!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao registar.', 'error');
    }
  };

  const handleAddAtividade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.informacoes.criarAtividade({
        tipo: atTipo,
        titulo: atTitulo,
        descricao: atDesc,
        dataEntrega: atData,
      });
      setAtTitulo('');
      setAtDesc('');
      await loadAll();
      showToast('Atividade / tarefa publicada!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao publicar.', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoDataUrl) {
      showToast('Seleciona uma imagem primeiro.', 'error');
      return;
    }
    try {
      await apiClient.informacoes.criarAnexo({
        titulo: fotoTitulo,
        categoria: fotoCat,
        imagemUrl: fotoDataUrl,
      });
      setFotoTitulo('');
      setFotoDataUrl('');
      await loadAll();
      showToast('Foto partilhada com a turma!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao enviar foto.', 'error');
    }
  };

  return (
    <AppShell title="Informações">
      <div className="flex flex-col gap-space-lg">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary font-extrabold">
            Informações Académicas
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Horário da turma, matérias, faltas de professores, tarefas extras e fotos de quadros.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { key: 'horario', label: 'Horário', icon: 'schedule' },
            { key: 'materias', label: 'Matérias', icon: 'menu_book' },
            { key: 'professores', label: 'Falta Docentes', icon: 'person_off' },
            { key: 'atividades', label: 'Tarefas Extras', icon: 'assignment' },
            { key: 'fotos', label: 'Fotos & Quadros', icon: 'photo_library' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as TabKey)}
              className={`min-h-[42px] px-4 rounded-xl font-label-md font-bold flex items-center gap-2 shrink-0 transition-colors ${
                tab === t.key
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant">A carregar informações...</div>
        ) : (
          <>
            {tab === 'horario' && (
              <div className="flex flex-col gap-space-md">
                {isDelegadoOrSub && (
                  <form
                    onSubmit={handleAddHorario}
                    className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm grid grid-cols-1 sm:grid-cols-6 gap-2"
                  >
                    <select
                      value={diaSemana}
                      onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    >
                      {DIAS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      required
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      type="time"
                      required
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      required
                      value={discHorario}
                      onChange={(e) => setDiscHorario(e.target.value)}
                      placeholder="Disciplina"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      value={sala}
                      onChange={(e) => setSala(e.target.value)}
                      placeholder="Sala"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <button
                      type="submit"
                      className="min-h-[42px] rounded-xl bg-primary text-on-primary font-label-md font-bold"
                    >
                      Adicionar
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
                  {horario.map((item) => (
                    <div key={item.id} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold uppercase text-secondary">
                        <span>{DIAS.find((d) => d.value === item.diaSemana)?.label || item.diaSemana}</span>
                        <span>
                          {item.horaInicio} – {item.horaFim}
                        </span>
                      </div>
                      <h3 className="font-headline-sm font-bold text-on-surface mt-1">{item.disciplina}</h3>
                      <p className="font-body-sm text-on-surface-variant">
                        {item.sala ? `Sala ${item.sala}` : 'Sala a confirmar'}{' '}
                        {item.professor ? `• ${item.professor}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'materias' && (
              <div className="flex flex-col gap-space-md">
                {isDelegadoOrSub && (
                  <form
                    onSubmit={handleAddMateria}
                    className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-2"
                  >
                    <input
                      required
                      value={matNome}
                      onChange={(e) => setMatNome(e.target.value)}
                      placeholder="Nome da disciplina"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      value={matProf}
                      onChange={(e) => setMatProf(e.target.value)}
                      placeholder="Docente"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      value={matDesc}
                      onChange={(e) => setMatDesc(e.target.value)}
                      placeholder="Resumo / Ementa"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <button
                      type="submit"
                      className="min-h-[42px] rounded-xl bg-primary text-on-primary font-label-md font-bold"
                    >
                      Adicionar Matéria
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {materias.map((m) => (
                    <div key={m.id} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
                      <h3 className="font-headline-sm font-bold text-primary">{m.nome}</h3>
                      {m.professor && <p className="font-label-md text-secondary font-semibold">{m.professor}</p>}
                      {m.ementaResumo && <p className="font-body-sm text-on-surface-variant mt-1">{m.ementaResumo}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'professores' && (
              <div className="flex flex-col gap-space-md">
                {isDelegadoOrSub && (
                  <form
                    onSubmit={handleAddFaltaProf}
                    className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-2"
                  >
                    <input
                      required
                      value={fpProf}
                      onChange={(e) => setFpProf(e.target.value)}
                      placeholder="Professor(a)"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      required
                      value={fpDisc}
                      onChange={(e) => setFpDisc(e.target.value)}
                      placeholder="Disciplina"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      type="date"
                      required
                      value={fpData}
                      onChange={(e) => setFpData(e.target.value)}
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      value={fpObs}
                      onChange={(e) => setFpObs(e.target.value)}
                      placeholder="Observação / Reposição"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <button
                      type="submit"
                      className="min-h-[42px] rounded-xl bg-primary text-on-primary font-label-md font-bold"
                    >
                      Avisar Turma
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {faltasProf.map((fp) => (
                    <div
                      key={fp.id}
                      className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border-l-4 border-error"
                    >
                      <div className="flex justify-between text-xs text-error font-bold">
                        <span>FALTA DE DOCENTE</span>
                        <span>{fp.data}</span>
                      </div>
                      <h3 className="font-headline-sm font-bold text-on-surface mt-1">
                        {fp.professor} — {fp.disciplina}
                      </h3>
                      {fp.observacao && <p className="font-body-sm text-on-surface-variant mt-1">{fp.observacao}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'atividades' && (
              <div className="flex flex-col gap-space-md">
                {isDelegadoOrSub && (
                  <form
                    onSubmit={handleAddAtividade}
                    className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-2"
                  >
                    <select
                      value={atTipo}
                      onChange={(e) => setAtTipo(e.target.value as TipoAtividade)}
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    >
                      <option value="tarefa_extra">Tarefa Extra</option>
                      <option value="trabalho">Trabalho</option>
                      <option value="prova">Prova / Teste</option>
                      <option value="evento">Evento</option>
                    </select>
                    <input
                      required
                      value={atTitulo}
                      onChange={(e) => setAtTitulo(e.target.value)}
                      placeholder="Título"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      required
                      value={atDesc}
                      onChange={(e) => setAtDesc(e.target.value)}
                      placeholder="Descrição"
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <input
                      type="date"
                      required
                      value={atData}
                      onChange={(e) => setAtData(e.target.value)}
                      className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                    />
                    <button
                      type="submit"
                      className="min-h-[42px] rounded-xl bg-primary text-on-primary font-label-md font-bold"
                    >
                      Publicar
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {atividades.map((a) => (
                    <div key={a.id} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm font-bold uppercase">
                          {a.tipo.replace('_', ' ')}
                        </span>
                        <span className="font-numeric-tabular text-xs text-on-surface-variant">
                          Entrega: {a.dataEntrega}
                        </span>
                      </div>
                      <h3 className="font-headline-sm font-bold text-on-surface mt-2">{a.titulo}</h3>
                      <p className="font-body-sm text-on-surface-variant mt-1">{a.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'fotos' && (
              <div className="flex flex-col gap-space-md">
                <form
                  onSubmit={handleAddFoto}
                  className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                >
                  <input
                    required
                    value={fotoTitulo}
                    onChange={(e) => setFotoTitulo(e.target.value)}
                    placeholder="Título da foto (ex: Quadro de Redes)"
                    className="flex-1 min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                  />
                  <select
                    value={fotoCat}
                    onChange={(e) => setFotoCat(e.target.value as CategoriaAnexo)}
                    className="min-h-[42px] px-3 rounded-xl bg-surface-container-low"
                  >
                    <option value="quadro">Quadro / Apontamento</option>
                    <option value="horario">Horário</option>
                    <option value="material">Material</option>
                    <option value="evento">Evento</option>
                    <option value="outro">Outro</option>
                  </select>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs max-w-[200px]"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] px-4 rounded-xl bg-primary text-on-primary font-label-md font-bold"
                  >
                    Enviar Foto
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
                  {fotos.map((f) => (
                    <div key={f.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
                      <img src={f.imagemUrl} alt={f.titulo} className="w-full h-48 object-cover" />
                      <div className="p-space-sm">
                        <span className="font-label-sm uppercase text-secondary font-bold">{f.categoria}</span>
                        <h3 className="font-label-lg font-bold text-on-surface">{f.titulo}</h3>
                        <p className="font-body-sm text-on-surface-variant">Por {f.autorNome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
