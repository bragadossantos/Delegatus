import React, { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { PedidoEntrada, Turma, UserPublic } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import {
  IconCheck,
  IconCopy,
  IconPlus,
  IconShield,
  IconUsers,
  IconWhatsApp,
  IconX,
} from '@/components/ui/Icons';
import { Modal, RoleBadge, WhatsAppShareModal } from '@/components/ui/Primitives';

export default function TurmaPage() {
  const { user, refreshAuth, refreshBadges, showToast } = useAuth();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [membros, setMembros] = useState<UserPublic[]>([]);
  const [pedidos, setPedidos] = useState<PedidoEntrada[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Onboarding states (when user has no turmaId)
  const [onboardingTab, setOnboardingTab] = useState<'criar' | 'entrar'>('criar');
  const [nomeTurma, setNomeTurma] = useState('');
  const [anoLetivo, setAnoLetivo] = useState('2026/2027');
  const [linkWhatsapp, setLinkWhatsapp] = useState('');
  const [codigoConviteInput, setCodigoConviteInput] = useState('');
  const [mensagemPedido, setMensagemPedido] = useState('');
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  // Modals
  const [shareOpen, setShareOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editNomeTurma, setEditNomeTurma] = useState('');
  const [editLinkWhatsapp, setEditLinkWhatsapp] = useState('');
  const [editWebhook, setEditWebhook] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isGestor = user?.papel === 'delegado' || user?.papel === 'subdelegado';
  const isDelegado = user?.papel === 'delegado';

  const loadTurma = useCallback(async () => {
    if (!user?.turmaId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    try {
      const data = await apiClient.turmas.atual();
      setTurma(data.turma);
      setMembros(data.membros);
      setEditNomeTurma(data.turma.nome);
      setEditLinkWhatsapp(data.turma.linkGrupoWhatsapp || '');
      setEditWebhook(data.turma.webhookWhatsapp || '');

      if (user.papel === 'delegado' || user.papel === 'subdelegado') {
        const ped = await apiClient.turmas.listarPedidos('pendente');
        setPedidos(ped.pedidos);
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  }, [user?.turmaId, user?.papel]);

  useEffect(() => {
    void loadTurma();
  }, [loadTurma]);

  const handleCriarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.turmas.criar({
        nome: nomeTurma,
        anoLetivo,
        linkGrupoWhatsapp: linkWhatsapp.trim() || undefined,
      });
      await refreshAuth();
      showToast('Turma criada! Já podes partilhar o convite no WhatsApp.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao criar turma.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePedirEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.turmas.pedirEntrada({
        codigoConvite: codigoConviteInput.trim().toUpperCase(),
        mensagem: mensagemPedido.trim() || undefined,
      });
      setPedidoEnviado(true);
      showToast('Pedido enviado ao delegado!', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao pedir entrada.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResponderPedido = async (pedidoId: string, acao: 'aprovar' | 'rejeitar') => {
    try {
      await apiClient.turmas.responderPedido(pedidoId, acao);
      showToast(acao === 'aprovar' ? 'Colega aprovado na turma!' : 'Pedido rejeitado.', 'success');
      await loadTurma();
      await refreshBadges();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao responder pedido.', 'error');
    }
  };

  const handleSubdelegado = async (userId: string, acao: 'nomear' | 'remover') => {
    try {
      await apiClient.turmas.gerirSubdelegado(userId, acao);
      showToast(
        acao === 'nomear' ? 'Subdelegado nomeado com sucesso!' : 'Subdelegado removido.',
        'success'
      );
      await loadTurma();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao atualizar papel.', 'error');
    }
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.turmas.atualizarAtual({
        nome: editNomeTurma,
        linkGrupoWhatsapp: editLinkWhatsapp.trim() || undefined,
        webhookWhatsapp: editWebhook.trim() || undefined,
      });
      setConfigOpen(false);
      await loadTurma();
      await refreshAuth();
      showToast('Definições da turma guardadas.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao guardar.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inviteUrl =
    typeof window !== 'undefined' && turma
      ? `${window.location.origin}/entrar/${turma.codigoConvite}`
      : turma
      ? `/entrar/${turma.codigoConvite}`
      : '';

  const whatsappInviteText = turma
    ? `Olá turma! Entra na nossa plataforma *Delegatus* (${turma.nome} — ${turma.escolaUniversidade}).\n\nCódigo: *${turma.codigoConvite}*\nLink direto: ${inviteUrl}\n\nDepois de pedires entrada, o delegado aprova o teu acesso.`
    : '';

  const whatsappInviteWaUrl = `https://wa.me/?text=${encodeURIComponent(whatsappInviteText)}`;

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast('Link de convite copiado!', 'success');
    } catch {
      // ignore
    }
  };

  return (
    <AppShell title="Turma">
      {!user?.turmaId ? (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-h1">Bem-vindo à Delegatus</h1>
            <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
              Ainda não estás associado a uma turma. Cria uma nova turma como delegado ou pede
              entrada com o código de convite.
            </p>
          </div>

          <div className="tabs-scroll">
            <button
              type="button"
              className={`tab-pill ${onboardingTab === 'criar' ? 'active' : ''}`}
              onClick={() => setOnboardingTab('criar')}
            >
              <IconPlus size={16} />
              Sou Delegado — Criar Turma
            </button>
            <button
              type="button"
              className={`tab-pill ${onboardingTab === 'entrar' ? 'active' : ''}`}
              onClick={() => setOnboardingTab('entrar')}
            >
              <IconUsers size={16} />
              Sou Colega — Entrar com Código
            </button>
          </div>

          {onboardingTab === 'criar' ? (
            <form onSubmit={handleCriarTurma} className="card flex flex-col gap-3">
              <h2 className="text-h2">Criar Nova Turma</h2>
              <label className="field">
                <span className="field-label">Nome da Turma</span>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="Ex: LEIC 2º Ano — Turma A"
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Ano Letivo</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex: 2026/2027"
                  value={anoLetivo}
                  onChange={(e) => setAnoLetivo(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Link do Grupo WhatsApp (opcional)</span>
                <input
                  className="input"
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={linkWhatsapp}
                  onChange={(e) => setLinkWhatsapp(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'A criar turma...' : 'Criar Turma e Gerar Convite'}
              </button>
            </form>
          ) : pedidoEnviado ? (
            <div className="card flex flex-col gap-3">
              <span className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>
                A aguardar aprovação
              </span>
              <h2 className="text-h2">Pedido enviado com sucesso</h2>
              <p className="text-sm text-secondary" style={{ margin: 0 }}>
                O delegado da turma recebeu uma notificação. Assim que aprovar o teu pedido, terás
                acesso completo a todos os menus.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => void refreshAuth()}
              >
                Verificar se já fui aprovado
              </button>
            </div>
          ) : (
            <form onSubmit={handlePedirEntrada} className="card flex flex-col gap-3">
              <h2 className="text-h2">Entrar numa Turma</h2>
              <label className="field">
                <span className="field-label">Código de Convite</span>
                <input
                  className="input font-mono"
                  type="text"
                  required
                  placeholder="Ex: LEIC2A"
                  value={codigoConviteInput}
                  onChange={(e) => setCodigoConviteInput(e.target.value.toUpperCase())}
                />
              </label>
              <label className="field">
                <span className="field-label">Mensagem para o delegado (opcional)</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex: Olá, sou colega da turma da manhã"
                  value={mensagemPedido}
                  onChange={(e) => setMensagemPedido(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'A enviar...' : 'Pedir Entrada'}
              </button>
            </form>
          )}
        </div>
      ) : loadingData || !turma ? (
        <div className="card text-sm text-muted">A carregar informações da turma...</div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Turma Header & Invite */}
          <section className="card flex flex-col gap-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <span className="badge badge-primary">{turma.anoLetivo}</span>
                <h1 className="text-h1 mt-2">{turma.nome}</h1>
                <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
                  {turma.escolaUniversidade} · {turma.curso}
                </p>
              </div>
              {isDelegado && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setConfigOpen(true)}
                >
                  Definições & WhatsApp
                </button>
              )}
            </div>

            <div className="card-muted flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-semibold text-muted">CÓDIGO DE CONVITE</div>
                <div className="font-mono font-bold" style={{ fontSize: '1.2rem' }}>
                  {turma.codigoConvite}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={handleCopyInvite}>
                  <IconCopy size={16} />
                  Copiar Link
                </button>
                <button
                  type="button"
                  className="btn btn-whatsapp btn-sm"
                  onClick={() => setShareOpen(true)}
                >
                  <IconWhatsApp size={18} />
                  Partilhar no WhatsApp
                </button>
              </div>
            </div>
          </section>

          {/* Pending Requests (Delegado / Subdelegado) */}
          {isGestor && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-h2">Pedidos de Entrada Pendentes</h2>
                <span className="badge badge-warning tabular-nums">{pedidos.length}</span>
              </div>

              {pedidos.length === 0 ? (
                <div className="card text-sm text-muted">
                  Sem pedidos de entrada pendentes no momento.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pedidos.map((p) => (
                    <div
                      key={p.id}
                      className="card flex items-center justify-between flex-wrap gap-3"
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="font-semibold">{p.userName}</div>
                        <div className="text-xs text-muted">{p.userEmail}</div>
                        {p.mensagem && (
                          <div className="text-sm text-secondary mt-1">“{p.mensagem}”</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => void handleResponderPedido(p.id, 'rejeitar')}
                        >
                          <IconX size={16} />
                          Rejeitar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void handleResponderPedido(p.id, 'aprovar')}
                        >
                          <IconCheck size={16} />
                          Aprovar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Members List */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">Membros da Turma</h2>
              <span className="badge badge-neutral tabular-nums">{membros.length} membros</span>
            </div>

            <div className="flex flex-col gap-2">
              {membros.map((m) => (
                <div
                  key={m.id}
                  className="card flex items-center justify-between flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        backgroundColor: 'var(--color-primary-soft)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {m.nome.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semibold truncate">{m.nome}</div>
                      <div className="text-xs text-muted truncate">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleBadge papel={m.papel} />
                    {isDelegado && m.id !== user.id && m.papel !== 'delegado' && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          void handleSubdelegado(
                            m.id,
                            m.papel === 'subdelegado' ? 'remover' : 'nomear'
                          )
                        }
                      >
                        <IconShield size={14} />
                        {m.papel === 'subdelegado' ? 'Remover Subdelegado' : 'Nomear Subdelegado'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Share Invite Modal */}
      <WhatsAppShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Partilhar Convite no WhatsApp"
        textoFormatado={whatsappInviteText}
        waMeUrl={whatsappInviteWaUrl}
        onCopySuccess={() => showToast('Texto do convite copiado!', 'success')}
      />

      {/* Config Modal */}
      <Modal open={configOpen} onClose={() => setConfigOpen(false)} title="Definições da Turma">
        <form onSubmit={handleSalvarConfig} className="flex flex-col gap-3">
          <label className="field">
            <span className="field-label">Nome da Turma</span>
            <input
              className="input"
              type="text"
              required
              value={editNomeTurma}
              onChange={(e) => setEditNomeTurma(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Link do Grupo WhatsApp (opcional)</span>
            <input
              className="input"
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              value={editLinkWhatsapp}
              onChange={(e) => setEditLinkWhatsapp(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Webhook WhatsApp (opcional)</span>
            <input
              className="input"
              type="url"
              placeholder="https://..."
              value={editWebhook}
              onChange={(e) => setEditWebhook(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary mt-2" disabled={submitting}>
            {submitting ? 'A guardar...' : 'Guardar Alterações'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
