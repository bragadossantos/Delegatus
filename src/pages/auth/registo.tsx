import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient, ApiClientError } from '@/api/client';
import type { NivelEnsino } from '@/api/types';
import { useAuth } from '@/components/context/AuthContext';
import { BrandLogo } from '@/components/ui/Icons';

export default function RegistoPage() {
  const router = useRouter();
  const { refreshAuth, showToast } = useAuth();
  const codigoQuery = typeof router.query.codigo === 'string' ? router.query.codigo : '';
  const roleQuery = typeof router.query.role === 'string' ? router.query.role : '';

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nivelEnsino, setNivelEnsino] = useState<NivelEnsino>('universitario');
  const [escolaUniversidade, setEscolaUniversidade] = useState('');
  const [curso, setCurso] = useState('');
  const [codigoConvite, setCodigoConvite] = useState(codigoQuery);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiClient.auth.register({
        nome,
        email,
        password,
        nivelEnsino,
        escolaUniversidade,
        curso,
      });

      const code = (codigoConvite || codigoQuery).trim();
      if (code) {
        try {
          await apiClient.turmas.pedirEntrada({ codigoConvite: code });
          showToast('Conta criada e pedido de entrada enviado ao delegado!', 'success');
        } catch (joinErr) {
          showToast(
            joinErr instanceof ApiClientError
              ? joinErr.message
              : 'Conta criada, mas não foi possível pedir entrada com esse código.',
            'error'
          );
        }
      } else {
        showToast('Conta criada com sucesso!', 'success');
      }

      await refreshAuth();
      void router.push(roleQuery === 'delegado' ? '/turma?acao=criar' : '/turma');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao criar conta.');
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
          <Link href="/auth/login" className="btn btn-ghost">
            Já tenho conta
          </Link>
        </div>

        <div className="card">
          <h1 className="text-h1">Criar Conta Grátis</h1>
          <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 18px' }}>
            Preenche os teus dados académicos para criar ou entrar numa turma.
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
              <span className="field-label">Nome completo</span>
              <input
                className="input"
                type="text"
                required
                placeholder="Ex: Maria Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </label>

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
              <span className="field-label">Password (mín. 6 caracteres)</span>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Nível de Ensino</span>
              <select
                className="select"
                value={nivelEnsino}
                onChange={(e) => setNivelEnsino(e.target.value as NivelEnsino)}
              >
                <option value="universitario">Ensino Universitário</option>
                <option value="medio">Ensino Médio / Secundário</option>
                <option value="fundamental">Ensino Fundamental / Básico</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Escola ou Universidade</span>
              <input
                className="input"
                type="text"
                required
                placeholder="Ex: Universidade do Porto / Escola Secundária..."
                value={escolaUniversidade}
                onChange={(e) => setEscolaUniversidade(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Curso / Ano / Turma</span>
              <input
                className="input"
                type="text"
                required
                placeholder="Ex: Engenharia Informática — 2º Ano"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
              />
            </label>

            {(codigoQuery || roleQuery === 'colega') && (
              <label className="field">
                <span className="field-label">Código de Convite (opcional)</span>
                <input
                  className="input font-mono"
                  type="text"
                  placeholder="Ex: LEIC2A"
                  value={codigoConvite || codigoQuery}
                  onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
                />
              </label>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full mt-2"
              disabled={submitting}
            >
              {submitting ? 'A criar conta...' : 'Criar Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
