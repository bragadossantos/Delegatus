import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient, ApiClientError } from '@/api/client';
import type { NivelEnsino } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';

export default function RegistoPage() {
  const router = useRouter();
  const { refreshAuth, showToast } = useAuth();

  const conviteCodigo = typeof router.query.codigo === 'string' ? router.query.codigo : undefined;

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [escolaUniversidade, setEscolaUniversidade] = useState('');
  const [nivelEnsino, setNivelEnsino] = useState<NivelEnsino>('universitario');
  const [curso, setCurso] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await apiClient.auth.register({
        nome,
        email,
        password,
        escolaUniversidade,
        nivelEnsino,
        curso: curso.trim() || 'Geral',
      });
      await refreshAuth();
      showToast('Conta criada com sucesso!', 'success');
      if (conviteCodigo) {
        void router.push(`/entrar/${encodeURIComponent(conviteCodigo)}`);
      } else {
        void router.push('/turma');
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Não foi possível criar a conta.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased flex flex-col">
      <header className="w-full px-margin lg:px-margin-desktop h-16 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">Delegatus</span>
        </Link>
        <Link href="/auth/login" className="font-label-lg text-label-lg text-primary hover:underline">
          Já tenho conta
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-margin py-space-lg">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold mb-space-sm">
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              100% Gratuito
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight">
              Criar Conta na Delegatus
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Preenche os teus dados académicos para criar ou entrar numa turma.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
            <div className="flex flex-col gap-1">
              <label htmlFor="nome" className="font-label-md text-label-md font-semibold">
                Nome completo
              </label>
              <input
                id="nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Diogo Martins"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-label-md text-label-md font-semibold">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@universidade.pt"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="font-label-md text-label-md font-semibold">
                  Palavra-passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="escola" className="font-label-md text-label-md font-semibold">
                Escola ou Universidade
              </label>
              <input
                id="escola"
                required
                value={escolaUniversidade}
                onChange={(e) => setEscolaUniversidade(e.target.value)}
                placeholder="Ex: Universidade do Porto — FEUP"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label htmlFor="nivel" className="font-label-md text-label-md font-semibold">
                  Nível de Ensino
                </label>
                <select
                  id="nivel"
                  value={nivelEnsino}
                  onChange={(e) => setNivelEnsino(e.target.value as NivelEnsino)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="universitario">Ensino Universitário</option>
                  <option value="medio">Ensino Médio / Secundário</option>
                  <option value="fundamental">Ensino Fundamental</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="curso" className="font-label-md text-label-md font-semibold">
                  Curso / Ano
                </label>
                <input
                  id="curso"
                  required
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ex: Eng. Informática 3º Ano"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full min-h-[46px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary-container transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.25)] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'A criar conta...' : 'Criar Conta e Continuar'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
