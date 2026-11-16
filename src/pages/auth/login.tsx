import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient, ApiClientError } from '@/api/client';
import { useAuth } from '@/components/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nextUrl = typeof router.query.next === 'string' ? router.query.next : '/turma';

  const doLogin = async (loginEmail: string, loginPass: string) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await apiClient.auth.login({ email: loginEmail, password: loginPass });
      await refreshAuth();
      showToast('Sessão iniciada com sucesso!', 'success');
      void router.push(nextUrl);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Erro ao iniciar sessão.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void doLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased flex flex-col justify-between">
      {/* Header */}
      <header className="w-full px-margin lg:px-margin-desktop h-16 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">Delegatus</span>
        </Link>
        <Link
          href="/auth/registo"
          className="font-label-lg text-label-lg text-primary hover:underline"
        >
          Criar conta gratuita
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-margin py-space-lg">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold mb-space-sm">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              Acesso Seguro PWA
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight">
              Entrar na Delegatus
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Acede ao painel da tua turma, avisos, faltas e grupos de trabalho.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-label-md text-label-md text-on-surface font-semibold">
                Email institucional ou pessoal
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: delegado@delegatus.app"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-label-md text-label-md text-on-surface font-semibold">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] px-3.5 pr-11 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                  aria-label="Mostrar palavra-passe"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary-container transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.25)] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'A entrar...' : 'Entrar'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="pt-space-sm border-t border-outline-variant/40">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              Contas Demo Rápidas (Pass: 123456)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void doLogin('delegado@delegatus.app', '123456')}
                className="min-h-[40px] px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-primary font-bold transition-colors"
              >
                Delegado
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void doLogin('subdelegado@delegatus.app', '123456')}
                className="min-h-[40px] px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-primary font-bold transition-colors"
              >
                Subdelegado
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void doLogin('carla@delegatus.app', '123456')}
                className="min-h-[40px] px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-primary font-bold transition-colors"
              >
                Colega
              </button>
            </div>
          </div>

          <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
            Ainda não tens conta?{' '}
            <Link href="/auth/registo" className="text-primary font-semibold hover:underline">
              Registar agora
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
