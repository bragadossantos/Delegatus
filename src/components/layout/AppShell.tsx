import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/context/AuthContext';
import {
  BrandLogo,
  IconBarChart,
  IconBell,
  IconBookOpen,
  IconCalendarOff,
  IconLayers,
  IconLogOut,
  IconMegaphone,
  IconMenu,
  IconMoon,
  IconSun,
  IconUsers,
  IconWifiOff,
} from '@/components/ui/Icons';
import { Modal, RoleBadge } from '@/components/ui/Primitives';

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const ALL_MENUS = [
  { href: '/turma', label: 'Turma', icon: IconUsers },
  { href: '/avisos', label: 'Avisos', icon: IconBell },
  { href: '/informacoes', label: 'Informações', icon: IconBookOpen },
  { href: '/faltas', label: 'Faltas', icon: IconCalendarOff },
  { href: '/anuncios', label: 'Anúncios', icon: IconMegaphone },
  { href: '/sondagens', label: 'Sondagem', icon: IconBarChart },
  { href: '/grupos', label: 'Grupos de Trabalho', icon: IconLayers },
];

export function AppShell({ title, children }: AppShellProps) {
  const router = useRouter();
  const {
    user,
    turma,
    loading,
    naoLidasCount,
    pedidosPendentesCount,
    darkMode,
    toggleDarkMode,
    logout,
  } = useAuth();

  const [moreOpen, setMoreOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      void router.replace('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOffline(!navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  if (loading || !user) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size={40} />
          <span className="text-sm text-muted">A carregar Delegatus...</span>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    void router.push('/');
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const isActive = (href: string) => router.pathname === href;

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="sidebar" aria-label="Navegação principal">
        <Link href="/turma" className="flex items-center gap-2" style={{ padding: '8px 10px 14px' }}>
          <BrandLogo size={30} />
          <div style={{ minWidth: 0 }}>
            <div className="font-bold" style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
              Delegatus
            </div>
            <div className="text-xs text-muted truncate">
              {turma ? turma.nome : 'Sem turma associada'}
            </div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1" style={{ flex: 1 }}>
          {ALL_MENUS.map((item) => {
            const Icon = item.icon;
            const badgeCount =
              item.href === '/turma'
                ? pedidosPendentesCount
                : item.href === '/avisos'
                ? naoLidasCount
                : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </span>
                {badgeCount > 0 && (
                  <span className="badge badge-danger tabular-nums">{badgeCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className="flex flex-col gap-2"
          style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}
        >
          <div className="flex items-center justify-between gap-2" style={{ padding: '0 8px' }}>
            <div style={{ minWidth: 0 }}>
              <div className="text-sm font-semibold truncate">{user.nome}</div>
              <div className="text-xs text-muted truncate">{user.escolaUniversidade}</div>
            </div>
            <RoleBadge papel={user.papel} />
          </div>

          <button type="button" className="btn btn-ghost btn-full" onClick={toggleDarkMode}>
            {darkMode ? <IconSun size={18} /> : <IconMoon size={18} />}
            {darkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>

          <button type="button" className="btn btn-ghost btn-full" onClick={handleLogout}>
            <IconLogOut size={18} />
            Terminar Sessão
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        {/* Top App Bar */}
        <header className="top-bar">
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <Link href="/turma" className="flex items-center gap-2" style={{ minWidth: 0 }}>
              <BrandLogo size={26} />
              <div style={{ minWidth: 0 }}>
                <div className="font-bold text-sm truncate">
                  {turma ? turma.nome : title}
                </div>
                <div className="text-xs text-muted truncate">
                  {turma ? turma.escolaUniversidade : user.escolaUniversidade}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <RoleBadge papel={user.papel} />
            <Link
              href="/avisos"
              className="btn btn-ghost"
              aria-label="Avisos e notificações"
              style={{ width: 44, height: 44, padding: 0, position: 'relative' }}
            >
              <IconBell size={20} />
              {naoLidasCount > 0 && (
                <span
                  className="nav-badge"
                  style={{ top: 4, right: 4 }}
                >
                  {naoLidasCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              style={{ width: 44, height: 44, padding: 0 }}
            >
              {darkMode ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
          </div>
        </header>

        {/* Offline / PWA Install Banners */}
        {isOffline && (
          <div
            className="flex items-center justify-center gap-2 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning-text)',
              padding: '8px 16px',
            }}
          >
            <IconWifiOff size={14} />
            Modo offline — algumas ações requerem ligação à internet.
          </div>
        )}

        {installPrompt && (
          <div
            className="flex items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
              padding: '8px 16px',
            }}
          >
            <span className="text-xs font-semibold">
              Instala a Delegatus no ecrã inicial como app!
            </span>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleInstallPwa}>
              Instalar
            </button>
          </div>
        )}

        <main className="main-content">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar (5 slots) */}
      <nav className="bottom-nav" aria-label="Menu inferior">
        <Link
          href="/turma"
          className={`bottom-nav-item ${isActive('/turma') ? 'active' : ''}`}
        >
          <IconUsers size={20} />
          <span>Turma</span>
          {pedidosPendentesCount > 0 && <span className="nav-badge">{pedidosPendentesCount}</span>}
        </Link>

        <Link
          href="/anuncios"
          className={`bottom-nav-item ${isActive('/anuncios') ? 'active' : ''}`}
        >
          <IconMegaphone size={20} />
          <span>Anúncios</span>
        </Link>

        <Link
          href="/faltas"
          className={`bottom-nav-item ${isActive('/faltas') ? 'active' : ''}`}
        >
          <IconCalendarOff size={20} />
          <span>Faltas</span>
        </Link>

        <Link
          href="/grupos"
          className={`bottom-nav-item ${isActive('/grupos') ? 'active' : ''}`}
        >
          <IconLayers size={20} />
          <span>Grupos</span>
        </Link>

        <button
          type="button"
          className={`bottom-nav-item ${
            ['/avisos', '/informacoes', '/sondagens'].includes(router.pathname) ? 'active' : ''
          }`}
          onClick={() => setMoreOpen(true)}
        >
          <IconMenu size={20} />
          <span>Mais</span>
          {naoLidasCount > 0 && <span className="nav-badge">{naoLidasCount}</span>}
        </button>
      </nav>

      {/* "Mais" Bottom Sheet */}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais Menus">
        <div className="flex flex-col gap-2">
          <Link
            href="/avisos"
            className="btn btn-outline btn-full"
            style={{ justifyContent: 'space-between' }}
            onClick={() => setMoreOpen(false)}
          >
            <span className="flex items-center gap-2">
              <IconBell size={18} />
              Avisos & Notificações
            </span>
            {naoLidasCount > 0 && <span className="badge badge-danger">{naoLidasCount}</span>}
          </Link>

          <Link
            href="/informacoes"
            className="btn btn-outline btn-full"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMoreOpen(false)}
          >
            <IconBookOpen size={18} />
            Informações, Horário & Fotos
          </Link>

          <Link
            href="/sondagens"
            className="btn btn-outline btn-full"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMoreOpen(false)}
          >
            <IconBarChart size={18} />
            Sondagens da Turma
          </Link>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle)', margin: '6px 0' }} />

          <button
            type="button"
            className="btn btn-ghost btn-full"
            style={{ justifyContent: 'flex-start' }}
            onClick={toggleDarkMode}
          >
            {darkMode ? <IconSun size={18} /> : <IconMoon size={18} />}
            {darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          </button>

          <button
            type="button"
            className="btn btn-danger btn-full"
            style={{ justifyContent: 'flex-start' }}
            onClick={handleLogout}
          >
            <IconLogOut size={18} />
            Terminar Sessão
          </button>
        </div>
      </Modal>
    </div>
  );
}
