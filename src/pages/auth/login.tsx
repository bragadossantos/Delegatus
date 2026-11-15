import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient, ApiClientError } from '@/api/client';
import { useAuth } from '@/components/context/AuthContext';
import { BrandLogo } from '@/components/ui/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth, showToast } = useAuth();
  const codigoQuery = typeof router.query.codigo === 'string' ? router.query.codigo : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setSubmitting(true);
    try {
      await apiClient.auth.login({ email: loginEmail, password: loginPassword });
      await refreshAuth();
      showToast('Sessão iniciada!', 'success');
      if (codigoQuery) {
        void router.push(`/entrar/${encodeURIComponent(codigoQuery)}`);
      } else {
        void router.push('/turma');
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Credenciais inválidas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
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
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={28} />
            <span className="font-bold">Delegatus</span>
          </Link>
          <Link href="/auth/registo" className="btn btn-ghost">
            Criar conta
          </Link>
        </div>

        <div className="card">
          <h1 className="text-h1">Entrar na Delegatus</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 18px' }}>
            Acede à tua turma para ver anúncios, faltas, grupos e sondagens.
          </p>

          {error && (
            <div
              className="badge badge-danger w-full mb-3"
              style={{ borderRadius: 12, padding: '10px 12px', whiteSpace: 'normal' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="input"
                type="email"
                required
                placeholder="nome@universidade.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <input
                className="input"
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-full mt-2"
              disabled={submitting}
            >
              {submitting ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle)', margin: '20px 0 14px' }} />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted">
              ACESSO RÁPIDO (CONTAS DEMO)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={submitting}
                onClick={() => void doLogin('delegado@delegatus.app', '123456')}
              >
                Delegado
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={submitting}
                onClick={() => void doLogin('subdelegado@delegatus.app', '123456')}
              >
                Subdelegado
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={submitting}
                onClick={() => void doLogin('carla@delegatus.app', '123456')}
              >
                Colega (Carla)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
