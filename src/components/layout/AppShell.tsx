import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/context/AuthContext';

interface AppShellProps {
  title?: string;
  children: React.ReactNode;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ROLE_LABELS: Record<string, string> = {
  delegado: 'Delegado de Turma',
  subdelegado: 'Subdelegado',
  colega: 'Colega de Turma',
};

export function AppShell({ title, children }: AppShellProps) {
  const router = useRouter();
  const { user, turma, loading, naoLidasCount, pedidosPendentesCount, darkMode, toggleDarkMode, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissInstall, setDismissInstall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOffline(!navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstall);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onInstall);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      void router.replace('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMoreOpen(false);
  }, [router.pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md animate-pulse">
            <span className="material-symbols-outlined text-[26px]">school</span>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant">A carregar Delegatus...</span>
        </div>
      </div>
    );
  }

  const isDelegadoOrSub = user.papel === 'delegado' || user.papel === 'subdelegado';

  const navItems = [
    {
      href: '/turma',
      label: 'Turma',
      icon: 'groups',
      badge: isDelegadoOrSub && pedidosPendentesCount > 0 ? `${pedidosPendentesCount} Pend.` : undefined,
      badgeTone: 'secondary',
    },
    {
      href: '/avisos',
      label: 'Avisos & Notificações',
      shortLabel: 'Avisos',
      icon: 'notifications_active',
      badge: naoLidasCount > 0 ? String(naoLidasCount) : undefined,
      badgeTone: 'error',
    },
    { href: '/informacoes', label: 'Informações', icon: 'calendar_month' },
    { href: '/faltas', label: 'Faltas de Colegas', shortLabel: 'Faltas', icon: 'event_busy' },
    { href: '/anuncios', label: 'Anúncios WhatsApp', shortLabel: 'Anúncios', icon: 'campaign' },
    { href: '/sondagens', label: 'Sondagens', icon: 'how_to_vote' },
    { href: '/grupos', label: 'Grupos de Trabalho', shortLabel: 'Grupos', icon: 'group_work' },
  ];

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(`${href}/`);
  const isMoreActive = ['/informacoes', '/sondagens', '/grupos'].some((p) => isActive(p));

  const initials = user.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 hidden md:flex flex-col justify-between">
        <div className="flex flex-col">
          <div className="h-16 px-space-lg flex items-center justify-between">
            <Link href="/turma" className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary font-bold leading-none tracking-tight">
                  Delegatus
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">
                  Gestão de Turmas
                </span>
              </div>
            </Link>
          </div>

          <div className="px-space-md py-space-sm">
            <Link
              href="/turma"
              className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low text-left hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">school</span>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
                    {turma ? turma.nome : 'Sem turma associada'}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {turma ? turma.escolaUniversidade : user.escolaUniversidade}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
            </Link>
          </div>

          {isDelegadoOrSub && (
            <div className="px-space-md py-space-xs">
              <Link
                href="/anuncios"
                className="w-full flex items-center justify-center gap-space-sm py-2.5 px-space-md rounded-lg bg-secondary-container text-on-secondary-container font-label-lg text-label-lg shadow-[0_4px_14px_0_rgba(37,211,102,0.25)] hover:bg-secondary hover:text-on-secondary transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Disparar no WhatsApp</span>
              </Link>
            </div>
          )}

          <nav className="mt-space-md px-space-md flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between px-space-md py-2.5 rounded-lg transition-colors font-label-md text-label-md ${
                    active
                      ? 'bg-primary-container text-on-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeTone === 'error'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-space-md flex flex-col gap-2">
          <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-error' : 'bg-secondary animate-pulse'}`} />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                  {isOffline ? 'Modo Offline' : 'WhatsApp Sync'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {turma?.linkGrupoWhatsapp ? 'Grupo Associado' : 'Pronto a partilhar'}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary text-[20px]">sync</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-label-sm text-label-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
              <span>{darkMode ? 'Claro' : 'Escuro'}</span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-error-container/60 text-on-error-container hover:bg-error-container font-label-sm text-label-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Topbar (Desktop & Mobile) */}
        <header className="fixed top-0 left-0 md:left-72 right-0 h-16 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-margin md:px-space-lg flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <Link href="/turma" className="flex items-center gap-space-xs md:hidden shrink-0">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight leading-none">
                  {title || 'Delegatus'}
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant truncate max-w-[140px]">
                  {turma ? turma.nome : user.escolaUniversidade}
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
              <span>{ROLE_LABELS[user.papel] || user.papel}</span>
            </div>
            {turma && (
              <div className="hidden lg:flex items-center gap-2 pl-space-sm text-on-surface-variant font-body-sm text-body-sm truncate">
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span className="truncate">
                  {turma.nome} — {turma.escolaUniversidade}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-space-sm shrink-0">
            <div className="hidden sm:flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>{isOffline ? 'Offline' : 'WA Conectado'}</span>
            </div>

            <Link
              href="/avisos"
              aria-label="Avisos e Notificações"
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {naoLidasCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex items-center gap-space-sm pl-space-xs text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                {initials || 'U'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                  {user.nome}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant leading-none">
                  {ROLE_LABELS[user.papel] || user.papel}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-16 pb-24 md:pb-10 w-full">
          {isOffline && (
            <div className="bg-error-container text-on-error-container px-margin py-2 text-center font-label-sm text-label-sm font-semibold">
              Modo offline — a mostrar dados em cache. Algumas ações requerem ligação.
            </div>
          )}

          {installPrompt && !dismissInstall && (
            <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop pt-space-md">
              <div className="bg-primary text-on-primary rounded-xl p-space-sm px-space-md flex items-center justify-between gap-space-sm shadow-sm">
                <div className="flex items-center gap-2 text-body-sm">
                  <span className="material-symbols-outlined text-[20px] text-secondary-fixed">install_mobile</span>
                  <span>Instala a <strong>Delegatus</strong> no ecrã inicial como app PWA!</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      await installPrompt.prompt();
                      setInstallPrompt(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm font-bold"
                  >
                    Instalar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissInstall(true)}
                    className="p-1 text-primary-fixed-dim hover:text-on-primary"
                    aria-label="Fechar"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="w-full max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-md lg:py-space-lg">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="h-16 px-1 flex items-stretch justify-around">
          {[
            { href: '/turma', label: 'Turma', icon: 'groups', badge: isDelegadoOrSub ? pedidosPendentesCount : 0 },
            { href: '/avisos', label: 'Avisos', icon: 'notifications', badge: naoLidasCount },
            { href: '/faltas', label: 'Faltas', icon: 'assignment_late', badge: 0 },
            { href: '/anuncios', label: 'Anúncios', icon: 'campaign', badge: 0 },
          ].map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 min-w-[48px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-primary-container font-semibold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      active ? 'material-symbols-filled' : ''
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-[16px] rounded-full bg-error text-on-error font-numeric-tabular text-[9px] font-bold flex items-center justify-center leading-none">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="font-label-sm text-[10px] tracking-tight truncate max-w-full px-0.5">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex-1 min-w-[48px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isMoreActive ? 'text-primary-container font-semibold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">apps</span>
            <span className="font-label-sm text-[10px] tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* More / Profile Sheet */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-surface-container-lowest w-full max-w-md rounded-t-2xl md:rounded-2xl p-space-md shadow-2xl flex flex-col gap-space-sm pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/40">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm font-bold shrink-0">
                  {initials || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{user.nome}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {ROLE_LABELS[user.papel] || user.papel} • {user.escolaUniversidade}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 py-1">
              <Link
                href="/informacoes"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  <span className="font-label-lg text-on-surface">Informações, Horário & Fotos</span>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </Link>
              <Link
                href="/sondagens"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">how_to_vote</span>
                  <span className="font-label-lg text-on-surface">Sondagens & Votações</span>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </Link>
              <Link
                href="/grupos"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">group_work</span>
                  <span className="font-label-lg text-on-surface">Grupos de Trabalho</span>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-surface-container text-on-surface font-label-md"
              >
                <span className="material-symbols-outlined text-[18px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
                <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-error-container text-on-error-container font-label-md"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Terminar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
