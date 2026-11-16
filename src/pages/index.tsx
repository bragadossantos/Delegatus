import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      void router.replace('/turma');
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-7xl mx-auto px-gutter lg:px-gutter-desktop flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <Link href="/" className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[22px]">school</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
                    Delegatus
                  </span>
                  <span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm">
                    WhatsApp Ready
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium leading-none">
                  Gestão de Turmas
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-space-xs">
              <a
                href="#funcionalidades"
                className="px-space-md py-space-sm rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                Funcionalidades
              </a>
              <a
                href="#como-funciona"
                className="px-space-md py-space-sm rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                Como Funciona
              </a>
              <a
                href="#para-delegados"
                className="px-space-md py-space-sm rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                Para Delegados
              </a>
              <a
                href="#para-turma"
                className="px-space-md py-space-sm rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                Para a Turma
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-space-sm">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-space-md py-space-sm rounded-lg font-label-lg text-label-lg text-primary hover:bg-surface-container-high transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/registo"
              className="inline-flex items-center justify-center px-space-lg py-space-sm rounded-lg font-label-lg text-label-lg bg-primary text-on-primary hover:bg-primary-container transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.25)]"
            >
              Criar Turma Grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-24 pb-16">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden px-gutter lg:px-gutter-desktop pt-space-md lg:pt-space-xl pb-space-xl">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[680px] h-[360px] bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-tertiary-fixed/30 rounded-full blur-2xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-high text-on-surface shadow-sm mb-space-md">
              <span className="text-sm">🎓</span>
              <span className="font-label-md text-label-md text-primary font-semibold">
                Plataforma Gratuita &amp; PWA Mobile-First para Ensino Universitário e Secundário
              </span>
            </div>

            <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-primary max-w-4xl tracking-tight leading-tight mb-space-sm">
              Acaba com o caos no grupo de WhatsApp da tua turma.
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-space-lg">
              A plataforma centralizada que organiza avisos oficiais, faltas de docentes e colegas, formação automática de grupos, sondagens e fotos de quadro — com disparo instantâneo para o WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-space-sm w-full max-w-md mx-auto mb-space-sm">
              <Link
                href="/auth/registo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 rounded-lg font-label-lg text-label-lg bg-primary text-on-primary hover:bg-primary-container shadow-[0_4px_14px_0_rgba(37,211,102,0.25)] transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                <span>Criar Turma Grátis</span>
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 rounded-lg font-label-lg text-label-lg bg-surface-container-lowest text-primary hover:bg-surface-container-high shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                <span>Entrar na Plataforma</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-space-md gap-y-space-xs text-on-surface-variant font-label-sm text-label-sm mb-space-xl">
              <span className="flex items-center gap-1 text-secondary font-medium">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> 100% Gratuito
              </span>
              <span className="flex items-center gap-1 text-secondary font-medium">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> App Instalável (PWA leve)
              </span>
              <span className="flex items-center gap-1 text-secondary font-medium">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Acesso blindado por aprovação
              </span>
            </div>

            {/* Split Screen Showcase */}
            <div className="relative w-full max-w-5xl mt-space-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md p-space-md lg:p-space-lg rounded-xl bg-surface-container-low shadow-sm">
                {/* Left: Delegatus Panel */}
                <div className="md:col-span-6 flex flex-col text-left bg-surface-container-lowest rounded-lg p-space-md shadow-sm justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm bg-surface-container-low px-space-sm py-2 rounded-lg">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" />
                        <span className="font-label-sm text-label-sm font-bold text-primary ml-2">
                          Delegatus Workspace • LEI 2.º Ano
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary-fixed font-label-sm text-label-sm text-on-primary-fixed font-semibold">
                        Oficial
                      </span>
                    </div>

                    <div className="space-y-space-sm mb-space-md">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface-variant">Tipo de Publicação:</span>
                        <span className="font-label-sm text-label-sm font-semibold text-error bg-error-container px-2 py-0.5 rounded-full">
                          Comunicado Urgente
                        </span>
                      </div>
                      <div className="p-space-sm bg-surface-container rounded-lg">
                        <p className="font-label-sm text-label-sm text-on-surface font-semibold">
                          Cálculo Diferencial II • Prof.ª Helena Mota
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Adiamento do Mini-Teste 1 para terça-feira seguinte (10:00). Sala mantida na B201.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/auth/login"
                    className="w-full inline-flex items-center justify-center gap-space-xs py-2.5 px-space-md rounded-lg bg-secondary text-on-secondary font-label-md text-label-md shadow-[0_4px_14px_0_rgba(37,211,102,0.25)] hover:bg-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Disparar Cópia Formatada para o WhatsApp</span>
                  </Link>
                </div>

                {/* Right: WhatsApp Preview */}
                <div className="md:col-span-6 flex flex-col text-left bg-[#0B141A] rounded-lg p-space-md text-white shadow-sm justify-between">
                  <div>
                    <div className="flex items-center gap-space-sm pb-space-sm mb-space-sm border-b border-[#222E35]">
                      <div className="w-9 h-9 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-sm">
                        LEI
                      </div>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-white leading-tight">
                          LEI — Turma B 2024/2025
                        </h4>
                        <p className="font-label-sm text-label-sm text-[#8696A0]">
                          Delegado, Subdelegado, +38 colegas...
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#005C4B] rounded-lg p-space-sm text-left max-w-[94%] shadow-sm">
                      <div className="flex items-center gap-1 text-[#25D366] font-bold text-xs mb-1">
                        <span>📢</span>
                        <span>[COMUNICADO OFICIAL • DELEGATUS]</span>
                      </div>
                      <p className="text-xs text-[#E9EDEF] leading-relaxed">
                        <strong>Cálculo Diferencial II</strong>: Mini-Teste 1 adiado para terça-feira às 10:00 (Sala B201).
                        Consulta o horário e as tarefas extras atualizadas na plataforma!
                      </p>
                      <p className="text-[10px] text-[#8696A0] text-right mt-1">14:32 ✓✓</p>
                    </div>
                  </div>

                  <div className="mt-space-sm pt-space-xs border-t border-[#222E35] flex items-center justify-between text-[11px] text-[#8696A0]">
                    <span>Sincronização imediata via WhatsApp</span>
                    <span className="text-[#25D366] font-semibold">WA Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="funcionalidades" className="max-w-7xl mx-auto px-gutter lg:px-gutter-desktop py-space-xl">
          <div className="text-center max-w-2xl mx-auto mb-space-xl">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
              Tudo num só lugar
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mt-1">
              7 ferramentas desenhadas para delegados e colegas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {[
              {
                icon: 'how_to_reg',
                title: 'Turma Blindada & Subdelegado',
                desc: 'Partilha o link de convite no WhatsApp e aprova cada colega manualmente. Nomeia um subdelegado quando precisares de apoio.',
              },
              {
                icon: 'campaign',
                title: 'Anúncios & Disparo WhatsApp',
                desc: 'Publica comunicados oficiais na plataforma e envia-os formatados com um toque diretamente para o grupo da turma.',
              },
              {
                icon: 'event_busy',
                title: 'Registo de Faltas dos Colegas',
                desc: 'Colegas doentes ou a trabalhar enviam o aviso de falta na app; o delegado revê tudo organizado durante ou no fim do dia.',
              },
              {
                icon: 'group_work',
                title: 'Grupos de Trabalho Inteligentes',
                desc: 'Cria grupos por ordem alfabética, aleatória ou com limite de vagas (ex: 5 alunos, os primeiros 5 entram) e tema definido.',
              },
              {
                icon: 'how_to_vote',
                title: 'Sondagens & Votações',
                desc: 'Cria votações rápidas para decidir datas de testes, trabalhos ou reuniões com contagem transparente (1 voto por colega).',
              },
              {
                icon: 'calendar_month',
                title: 'Horários, Matérias & Fotos',
                desc: 'Centraliza o horário semanal, falta de professores, tarefas extras e galeria de fotos de apontamentos e quadros.',
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm"
              >
                <div className="w-11 h-11 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">{feat.icon}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{feat.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" className="max-w-7xl mx-auto px-gutter lg:px-gutter-desktop py-space-lg">
          <div id="para-delegados" className="bg-primary text-on-primary rounded-2xl p-space-lg lg:p-space-xl shadow-lg">
            <div id="para-turma" className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              <div>
                <span className="font-label-sm text-label-sm text-secondary-fixed uppercase font-bold">Passo 1</span>
                <h3 className="font-headline-md text-headline-md text-on-primary mt-1">Cria conta e a tua turma</h3>
                <p className="font-body-md text-body-md text-primary-fixed-dim mt-2">
                  Indica a escola ou universidade, curso e ano. Recebes na hora o código e link de convite.
                </p>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-secondary-fixed uppercase font-bold">Passo 2</span>
                <h3 className="font-headline-md text-headline-md text-on-primary mt-1">Aprova os colegas</h3>
                <p className="font-body-md text-body-md text-primary-fixed-dim mt-2">
                  Partilha o link no WhatsApp. Recebes notificação de cada pedido e aprovas apenas colegas reais.
                </p>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-secondary-fixed uppercase font-bold">Passo 3</span>
                <h3 className="font-headline-md text-headline-md text-on-primary mt-1">Gere tudo num só painel</h3>
                <p className="font-body-md text-body-md text-primary-fixed-dim mt-2">
                  Anúncios, faltas, grupos de trabalho, sondagens e horário sempre organizados e sincronizados.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
