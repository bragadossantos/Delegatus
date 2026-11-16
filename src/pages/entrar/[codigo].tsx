import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient, ApiClientError } from '@/api/client';
import type { TurmaConvitePublic } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';

export default function EntrarConvitePage() {
  const router = useRouter();
  const { user, refreshAuth, showToast } = useAuth();
  const codigo = typeof router.query.codigo === 'string' ? router.query.codigo : '';

  const [turmaInfo, setTurmaInfo] = useState<TurmaConvitePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!codigo) return;
    setLoading(true);
    apiClient.turmas
      .convitePublico(codigo)
      .then((res) => {
        setTurmaInfo(res);
        setErrorMsg(null);
      })
      .catch((err) => {
        setErrorMsg(err instanceof ApiClientError ? err.message : 'Convite inválido ou expirado.');
      })
      .finally(() => setLoading(false));
  }, [codigo]);

  const handlePedirEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo) return;
    setSubmitting(true);
    try {
      await apiClient.turmas.pedirEntrada({ codigoConvite: codigo, mensagem: mensagem || undefined });
      await refreshAuth();
      setRequested(true);
      showToast('Pedido enviado! O delegado recebeu uma notificação.', 'success');
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Erro ao enviar pedido.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased flex flex-col">
      <header className="w-full px-margin h-16 flex items-center justify-between max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-primary font-bold">Delegatus</span>
        </Link>
        {user ? (
          <Link href="/turma" className="font-label-md text-primary font-semibold hover:underline">
            Ir para Turma
          </Link>
        ) : (
          <Link href={`/auth/login?next=/entrar/${encodeURIComponent(codigo)}`} className="font-label-md text-primary font-semibold hover:underline">
            Entrar
          </Link>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-margin py-space-lg">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
          {loading ? (
            <div className="py-10 text-center text-on-surface-variant">A validar convite...</div>
          ) : errorMsg || !turmaInfo ? (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">link_off</span>
              </div>
              <h1 className="font-headline-md text-on-surface font-bold">Convite não encontrado</h1>
              <p className="font-body-sm text-on-surface-variant">{errorMsg}</p>
              <Link href="/" className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md">
                Voltar ao início
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-primary text-on-primary rounded-xl p-space-md relative overflow-hidden">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-bold mb-2">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Convite Oficial de Turma
                </span>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold text-on-primary">
                  {turmaInfo.nome}
                </h1>
                <p className="font-body-sm text-primary-fixed-dim mt-1">
                  {turmaInfo.escolaUniversidade} • {turmaInfo.curso}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-primary-fixed">
                  <span>Delegado: <strong>{turmaInfo.delegadoNome}</strong></span>
                  <span>{turmaInfo.totalMembros} membros</span>
                </div>
              </div>

              {!user ? (
                <div className="flex flex-col gap-2">
                  <p className="font-body-md text-on-surface-variant">
                    Para proteger a turma contra estranhos, cria a tua conta gratuita ou entra para pedir aprovação ao delegado.
                  </p>
                  <Link
                    href={`/auth/registo?codigo=${encodeURIComponent(codigo)}`}
                    className="w-full min-h-[46px] rounded-xl bg-primary text-on-primary font-label-lg font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span>Criar Conta e Pedir Entrada</span>
                  </Link>
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(`/entrar/${codigo}`)}`}
                    className="w-full min-h-[44px] rounded-xl bg-surface-container text-primary font-label-md font-bold flex items-center justify-center"
                  >
                    Já tenho conta — Entrar
                  </Link>
                </div>
              ) : user.turmaId === turmaInfo.id ? (
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <span className="material-symbols-outlined text-[36px] text-secondary">check_circle</span>
                  <p className="font-label-lg font-bold text-on-surface">Já fazes parte desta turma!</p>
                  <Link href="/turma" className="w-full min-h-[44px] rounded-xl bg-primary text-on-primary font-label-md font-bold flex items-center justify-center">
                    Abrir Painel da Turma
                  </Link>
                </div>
              ) : requested ? (
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <span className="material-symbols-outlined text-[36px] text-secondary">hourglass_top</span>
                  <p className="font-label-lg font-bold text-on-surface">Pedido enviado com sucesso!</p>
                  <p className="font-body-sm text-on-surface-variant">
                    O delegado {turmaInfo.delegadoNome} recebeu uma notificação para aprovar a tua entrada.
                  </p>
                  <Link href="/turma" className="w-full min-h-[44px] rounded-xl bg-surface-container text-primary font-label-md font-bold flex items-center justify-center">
                    Ir para a minha área
                  </Link>
                </div>
              ) : (
                <form onSubmit={handlePedirEntrada} className="flex flex-col gap-space-sm">
                  <label htmlFor="mensagem" className="font-label-md font-semibold text-on-surface">
                    Mensagem para o delegado (opcional)
                  </label>
                  <input
                    id="mensagem"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Ex: Olá! Sou o/a colega do turno da manhã."
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[46px] rounded-xl bg-primary text-on-primary font-label-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    <span>{submitting ? 'A enviar pedido...' : 'Pedir Aprovação para Entrar'}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
