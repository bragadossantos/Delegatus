import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/context/AuthContext';
import {
  BrandLogo,
  IconBarChart,
  IconCalendarOff,
  IconLayers,
  IconMegaphone,
  IconShield,
  IconWhatsApp,
} from '@/components/ui/Icons';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3"
          style={{ maxWidth: 1024, margin: '0 auto', padding: '12px 16px' }}
        >
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={30} />
            <span className="font-bold" style={{ fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
              Delegatus
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/turma" className="btn btn-primary">
                Ir para a Turma
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-outline">
                  Entrar
                </Link>
                <Link href="/auth/registo" className="btn btn-primary">
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: 1024, margin: '0 auto', padding: '36px 16px 64px' }}>
        <section className="flex flex-col gap-5" style={{ maxWidth: 680 }}>
          <div>
            <span className="badge badge-primary">100% Gratuita · PWA Mobile-First</span>
          </div>
          <h1 className="text-hero">
            A tua turma organizada num só lugar, ligada ao WhatsApp.
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.05rem', margin: 0 }}>
            Criada para delegados, subdelegados e colegas do ensino universitário, médio e
            fundamental. Centraliza anúncios, avisos de falta, horários, fotos, sondagens e grupos
            de trabalho sem confusão no grupo de WhatsApp.
          </p>

          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/auth/registo?role=delegado" className="btn btn-primary">
              Criar Turma Grátis
            </Link>
            <Link href="/auth/registo?role=colega" className="btn btn-outline">
              Entrar com Convite
            </Link>
            <Link href="/entrar/LEIC2A" className="btn btn-secondary">
              Testar Convite Demo (LEIC2A)
            </Link>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid-cards mt-4" style={{ marginTop: 40 }}>
          <article className="card flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-success">
                <IconWhatsApp size={14} /> WhatsApp
              </span>
              <h2 className="text-h3">Anúncios com Disparo Direto</h2>
            </div>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Publica avisos oficiais na plataforma e partilha-os formatados no grupo de WhatsApp da
              turma com um único toque.
            </p>
          </article>

          <article className="card flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-warning">
                <IconCalendarOff size={14} /> Faltas
              </span>
              <h2 className="text-h3">Controlo de Faltas Diárias</h2>
            </div>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Colegas enviam justificações (doença, trabalho, outro) e o delegado revê tudo de
              forma organizada no fim do dia.
            </p>
          </article>

          <article className="card flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-info">
                <IconLayers size={14} /> Grupos
              </span>
              <h2 className="text-h3">Grupos de Trabalho Inteligentes</h2>
            </div>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Gera grupos por ordem alfabética ou aleatória, ou cria grupos numerados com tema e
              limite de vagas por ordem de chegada.
            </p>
          </article>

          <article className="card flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary">
                <IconBarChart size={14} /> Sondagens
              </span>
              <h2 className="text-h3">Votações & Segurança de Entrada</h2>
            </div>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Sondagens rápidas com 1 voto por colega, nomeação de subdelegado e aprovação manual
              de novos membros para evitar estranhos.
            </p>
          </article>
        </section>

        {/* Bottom Note */}
        <section className="card-muted flex items-center justify-between flex-wrap gap-3" style={{ marginTop: 32 }}>
          <div className="flex items-center gap-2 text-sm text-secondary">
            <IconShield size={18} />
            <span>Instala no telemóvel como app nativa (Android & iOS) sem custos.</span>
          </div>
          <Link href="/auth/login" className="btn btn-ghost">
            <IconMegaphone size={16} />
            Aceder com Conta Demo
          </Link>
        </section>
      </main>
    </div>
  );
}
