import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { PedidoEntrada, Turma, UserPublic } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

export default function TurmaPage() {
  const { user, refreshAuth, refreshBadges, showToast } = useAuth();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [membros, setMembros] = useState<UserPublic[]>([]);
  const [pedidos, setPedidos] = useState<PedidoEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [nome, setNome] = useState('');
  const [escolaUniversidade, setEscolaUniversidade] = useState(user?.escolaUniversidade || '');
  const [curso, setCurso] = useState(user?.curso || '');
  const [anoLetivo, setAnoLetivo] = useState('2025/2026');
  const [linkGrupoWhatsapp, setLinkGrupoWhatsapp] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTurma = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.turmas.atual();
      setTurma(data.turma);
      setMembros(data.membros);
      if (data.turma && (user?.papel === 'delegado' || user?.papel === 'subdelegado')) {
        const pedRes = await apiClient.turmas.listarPedidos('pendente');
        setPedidos(pedRes.pedidos);
      } else {
        setPedidos([]);
      }
    } catch {
      setTurma(null);
    } finally {
      setLoading(false);
    }
  }, [user?.papel]);

  useEffect(() => {
    if (user) {
      setEscolaUniversidade(user.escolaUniversidade);
      setCurso(user.curso || '');
      void loadTurma();
    }
  }, [user, loadTurma]);

  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.turmas.criar({
        nome,
        escolaUniversidade,
        curso,
        anoLetivo,
        linkGrupoWhatsapp: linkGrupoWhatsapp || undefined,
      });
      await refreshAuth();
      await loadTurma();
      showToast('Turma criada com sucesso!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao criar turma.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.turmas.pedirEntrada({ codigoConvite: codigoInput.trim() });
      setCodigoInput('');
      showToast('Pedido enviado! Aguarda a aprovação do delegado.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Código inválido.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecidirPedido = async (pedidoId: string, decisao: 'aprovar' | 'rejeitar') => {
    try {
      await apiClient.turmas.responderPedido(pedidoId, decisao);
      await loadTurma();
      await refreshBadges();
      showToast(
        decisao === 'aprovar' ? 'Colega aprovado e notificado!' : 'Pedido rejeitado.',
        decisao === 'aprovar' ? 'success' : 'info',
      );
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao processar pedido.', 'error');
    }
  };

  const handleDefinirSubdelegado = async (membroId: string, isCurrentlySub: boolean) => {
    try {
      await apiClient.turmas.gerirSubdelegado(membroId, isCurrentlySub ? 'remover' : 'nomear');
      await loadTurma();
      showToast(isCurrentlySub ? 'Subdelegado removido.' : 'Subdelegado nomeado com sucesso!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar subdelegado.', 'error');
    }
  };

  const isDelegado = user?.papel === 'delegado';
  const isDelegadoOrSub = user?.papel === 'delegado' || user?.papel === 'subdelegado';

  const inviteUrl =
    typeof window !== 'undefined' && turma ? `${window.location.origin}/entrar/${turma.codigoConvite}` : '';

  const whatsappInviteUrl = turma
    ? `https://wa.me/?text=${encodeURIComponent(
        `Olá turma! Entra na nossa plataforma *Delegatus* (${turma.nome} — ${turma.escolaUniversidade}).\n\nCódigo: *${turma.codigoConvite}*\nLink direto: ${inviteUrl}\n\nDepois de pedires entrada, o delegado aprova o teu acesso.`,
      )}`
    : '#';

  const filteredMembros = membros.filter(
    (m) =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  const subdelegadoAtual = membros.find((m) => m.papel === 'subdelegado');

  return (
    <AppShell title="Turma">
      {loading ? (
        <div className="py-12 text-center text-on-surface-variant">A carregar dados da turma...</div>
      ) : !turma ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <h1 className="font-headline-lg text-primary font-extrabold">Bem-vindo à Delegatus</h1>
            <p className="font-body-md text-on-surface-variant mt-1 mb-space-md">
              Ainda não estás associado a nenhuma turma. Cria a tua turma como delegado ou pede entrada com um código de convite.
            </p>
            <form onSubmit={handleJoinByCode} className="flex flex-col gap-space-sm">
              <label className="font-label-md font-semibold">Entrar numa turma existente (Código)</label>
              <div className="flex gap-2">
                <input
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  placeholder="Ex: LEI2B-2026"
                  className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 min-h-[44px] rounded-xl bg-primary text-on-primary font-label-md font-bold"
                >
                  Pedir Entrada
                </button>
              </div>
            </form>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <h2 className="font-headline-md text-on-surface font-bold mb-space-sm">Criar Nova Turma</h2>
            <form onSubmit={handleCreateTurma} className="flex flex-col gap-space-sm">
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da turma (ex: Eng. Informática 3º B)"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
              />
              <input
                required
                value={escolaUniversidade}
                onChange={(e) => setEscolaUniversidade(e.target.value)}
                placeholder="Escola / Universidade"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Curso / Ano"
                  className="min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
                />
                <input
                  required
                  value={anoLetivo}
                  onChange={(e) => setAnoLetivo(e.target.value)}
                  placeholder="Ano letivo"
                  className="min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
                />
              </div>
              <input
                value={linkGrupoWhatsapp}
                onChange={(e) => setLinkGrupoWhatsapp(e.target.value)}
                placeholder="Link do grupo do WhatsApp (opcional)"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low"
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 min-h-[46px] rounded-xl bg-primary text-on-primary font-label-lg font-bold"
              >
                {submitting ? 'A criar...' : 'Criar Turma e Gerar Link'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-widest">
                <span className="text-secondary font-bold">{turma.escolaUniversidade}</span>
                <span>/</span>
                <span>{turma.curso}</span>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <h1 className="font-headline-lg-mobile md:font-headline-xl text-primary font-extrabold tracking-tight">
                  {turma.nome}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Ano {turma.anoLetivo}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-sm pl-space-md rounded-xl shadow-sm self-start lg:self-auto">
              <div className="flex flex-col">
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Código de Convite</span>
                <span className="font-headline-sm text-primary tracking-wider font-mono font-bold">
                  {turma.codigoConvite}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl || turma.codigoConvite);
                  showToast('Link de convite copiado!', 'success');
                }}
                className="p-2.5 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary transition-colors"
                title="Copiar link de convite"
              >
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant uppercase">Membros Aprovados</span>
                <span className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </span>
              </div>
              <p className="font-headline-lg text-primary font-extrabold mt-2">{membros.length}</p>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant uppercase">Pedidos Pendentes</span>
                <span className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                </span>
              </div>
              <p className="font-headline-lg text-error font-extrabold mt-2">{pedidos.length}</p>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant uppercase">Subdelegado</span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </span>
              </div>
              <p className="font-label-lg text-on-surface font-bold mt-2 truncate">
                {subdelegadoAtual ? subdelegadoAtual.nome : 'Não definido'}
              </p>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant uppercase">Grupo WhatsApp</span>
                <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </span>
              </div>
              {turma.linkGrupoWhatsapp ? (
                <a
                  href={turma.linkGrupoWhatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="font-label-md text-secondary font-bold mt-2 hover:underline truncate"
                >
                  Abrir Grupo WA →
                </a>
              ) : (
                <span className="font-body-sm text-on-surface-variant mt-2">Pronto a partilhar</span>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-primary text-on-primary p-space-md lg:p-space-lg shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-1 max-w-2xl">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container w-fit font-label-sm">
                <span className="material-symbols-outlined text-[14px]">link</span>
                Link Oficial da Turma
              </span>
              <h2 className="font-headline-md text-on-primary font-bold">
                Convida os colegas pelo WhatsApp com entrada controlada
              </h2>
              <p className="font-body-sm text-primary-fixed-dim">
                Qualquer colega que abrir o link precisa da tua aprovação para aceder à turma.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <a
                href={whatsappInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 lg:flex-none min-h-[44px] px-4 rounded-xl bg-secondary-container text-on-secondary-container font-label-md font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Partilhar no WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl);
                  showToast('Link copiado!', 'success');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-primary-container text-on-primary font-label-md font-bold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                <span>Copiar Link</span>
              </button>
            </div>
          </div>

          {isDelegadoOrSub && (
            <section className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-on-surface font-bold">Pedidos de Entrada Pendentes</h2>
                  <p className="font-body-sm text-on-surface-variant">
                    Aprova ou rejeita colegas antes de terem acesso à turma.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm font-bold">
                  {pedidos.length} pendentes
                </span>
              </div>

              {pedidos.length === 0 ? (
                <div className="p-space-md rounded-xl bg-surface-container-low text-center flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-[28px]">check_circle</span>
                  <span className="font-label-lg font-bold text-on-surface">Tudo limpo!</span>
                  <span className="font-body-sm text-on-surface-variant">
                    Não existem pedidos de adesão pendentes no momento.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {pedidos.map((p) => (
                    <div
                      key={p.id}
                      className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-sm"
                    >
                      <div>
                        <p className="font-label-lg text-on-surface font-bold">{p.userName}</p>
                        <p className="font-body-sm text-on-surface-variant">{p.userEmail}</p>
                        {p.mensagem && (
                          <p className="font-body-sm text-on-surface mt-1.5 italic">&ldquo;{p.mensagem}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDecidirPedido(p.id, 'aprovar')}
                          className="flex-1 min-h-[40px] rounded-lg bg-primary text-on-primary font-label-md font-bold"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDecidirPedido(p.id, 'rejeitar')}
                          className="flex-1 min-h-[40px] rounded-lg bg-error-container text-on-error-container font-label-md font-bold"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="bg-surface-container-lowest rounded-2xl p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <h2 className="font-headline-md text-on-surface font-bold">Colegas da Turma ({membros.length})</h2>
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Procurar colega..."
                  className="w-full min-h-[42px] pl-9 pr-3 rounded-xl bg-surface-container-low text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
              {filteredMembros.map((m) => {
                const init = m.nome
                  .split(' ')
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase() || '')
                  .join('');
                const isSub = m.papel === 'subdelegado';
                const isDel = m.id === turma.delegadoId;
                return (
                  <div
                    key={m.id}
                    className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between gap-space-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center font-headline-sm font-bold shrink-0">
                        {init}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-label-lg text-on-surface font-bold truncate">{m.nome}</span>
                          {isDel && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-[10px]">
                              Delegado
                            </span>
                          )}
                          {isSub && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px]">
                              Subdelegado
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-on-surface-variant truncate block">{m.email}</span>
                      </div>
                    </div>

                    {isDelegado && !isDel && (
                      <button
                        type="button"
                        onClick={() => void handleDefinirSubdelegado(m.id, isSub)}
                        className={`px-3 min-h-[36px] rounded-lg font-label-sm font-bold shrink-0 ${
                          isSub
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary'
                        }`}
                      >
                        {isSub ? 'Remover Sub' : 'Tornar Sub'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
