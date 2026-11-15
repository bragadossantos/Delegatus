import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient, ApiClientError } from '@/api/client';
import type { TurmaConvitePublic } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { BrandLogo, IconCheck, IconShield, IconUsers } from '@/components/ui/Icons';

export default function EntrarConvitePage() {
  const router = useRouter();
  const { user, refreshAuth, showToast } = useAuth();
  const codigo = typeof router.query.codigo === 'string' ? router.query.codigo : '';

  const [convite, setConvite] = useState<TurmaConvitePublic | null>(null);
  const [loadingConvite, setLoadingConvite] = useState(true);
  const [error, setError] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!codigo) return;
    setLoadingConvite(true);
    apiClient.turmas
      .convitePublico(codigo)
      .then((data) => {
        setConvite(data);
        setError('');
      })
      .catch((err) => {
        setError(
          err instanceof ApiClientError ? err.message : 'Convite inválido ou não encontrado.'
        );
      })
      .finally(() => setLoadingConvite(false));
  }, [codigo]);

  const handlePedirEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convite) return;
    setSubmitting(true);
    try {
      await apiClient.turmas.pedirEntrada({
        codigoConvite: convite.codigoConvite,
        mensagem: mensagem.trim() || undefined,
      });
      setEnviado(true);
      await refreshAuth();
      showToast('Pedido enviado! Aguarda aprovação do delegado.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao enviar pedido.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        padding: '24px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={28} />
            <span className="font-bold">Delegatus</span>
          </Link>
          {user ? (
            <Link href="/turma" className="btn btn-ghost">
              Minha Turma
            </Link>
          ) : (
            <Link href="/auth/login" className="btn btn-ghost">
              Entrar
            </Link>
          )}
        </div>

        <div className="card">
          {loadingConvite ? (
            <p className="text-sm text-muted">A verificar código de convite...</p>
          ) : error || !convite ? (
            <div className="flex flex-col gap-3">
              <h1 className="text-h1">Convite não encontrado</h1>
              <p className="text-sm text-secondary" style={{ margin: 0 }}>
                {error || 'Verifica o código junto do teu delegado.'}
              </p>
              <Link href="/" className="btn btn-outline">
                Voltar ao início
              </Link>
            </div>
          ) : enviado ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-warning">A aguardar aprovação</span>
              </div>
              <h1 className="text-h1">Pedido enviado para {convite.nome}</h1>
              <p className="text-sm text-secondary" style={{ margin: 0 }}>
                O delegado <strong>{convite.delegadoNome}</strong> recebeu uma notificação para
                aprovar a tua entrada e garantir que apenas colegas da turma acedem.
              </p>
              <Link href="/turma" className="btn btn-primary btn-full mt-2">
                <IconCheck size={18} />
                Ir para o Painel
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <span className="badge badge-primary">Convite de Turma</span>
                <h1 className="text-h1 mt-2">{convite.nome}</h1>
                <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
                  {convite.escolaUniversidade} · {convite.curso}
                </p>
              </div>

              <div className="card-muted flex items-center justify-between gap-3">
                <div className="text-sm">
                  <div>
                    <span className="text-muted">Delegado:</span>{' '}
                    <strong>{convite.delegadoNome}</strong>
                  </div>
                  <div className="flex items-center gap-1 text-muted text-xs mt-1">
                    <IconUsers size={14} />
                    <span>{convite.totalMembros} membros aprovados</span>
                  </div>
                </div>
                <span className="font-mono badge badge-neutral">{convite.codigoConvite}</span>
              </div>

              {user ? (
                user.turmaId === convite.id ? (
                  <Link href="/turma" className="btn btn-primary btn-full">
                    Já pertences a esta turma — Abrir
                  </Link>
                ) : (
                  <form onSubmit={handlePedirEntrada} className="flex flex-col gap-3">
                    <label className="field">
                      <span className="field-label">Mensagem para o delegado (opcional)</span>
                      <input
                        className="input"
                        type="text"
                        placeholder="Ex: Olá, sou o João do turno da manhã"
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={submitting}
                    >
                      <IconShield size={18} />
                      {submitting ? 'A enviar pedido...' : 'Pedir Entrada na Turma'}
                    </button>
                  </form>
                )
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/auth/registo?codigo=${encodeURIComponent(convite.codigoConvite)}`}
                    className="btn btn-primary btn-full"
                  >
                    Criar Conta e Pedir Entrada
                  </Link>
                  <Link
                    href={`/auth/login?codigo=${encodeURIComponent(convite.codigoConvite)}`}
                    className="btn btn-outline btn-full"
                  >
                    Já tenho conta — Entrar
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
