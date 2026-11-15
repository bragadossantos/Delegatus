import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/api/client';
import type { Turma, UserPublic } from '@/api/types';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface AuthContextValue {
  user: UserPublic | null;
  turma: Turma | null;
  loading: boolean;
  naoLidasCount: number;
  pedidosPendentesCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
  refreshAuth: () => Promise<void>;
  refreshBadges: () => Promise<void>;
  logout: () => Promise<void>;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(true);
  const [naoLidasCount, setNaoLidasCount] = useState(0);
  const [pedidosPendentesCount, setPedidosPendentesCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const refreshBadges = useCallback(async () => {
    try {
      const notifRes = await apiClient.notificacoes.listar();
      setNaoLidasCount(notifRes.naoLidasCount);
    } catch {
      // ignore if unauthenticated
    }

    try {
      const turmaRes = await apiClient.turmas.atual();
      setPedidosPendentesCount(turmaRes.pedidosPendentesCount);
    } catch {
      setPedidosPendentesCount(0);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await apiClient.auth.me();
      setUser(data.user);
      setTurma(data.turma);
      await refreshBadges();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setUser(null);
        setTurma(null);
        setNaoLidasCount(0);
        setPedidosPendentesCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshBadges]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('delegatus_dark') : null;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = stored ? stored === 'true' : prefersDark;
    setDarkMode(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    }
    void refreshAuth();
  }, [refreshAuth]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('delegatus_dark', String(next));
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } finally {
      setUser(null);
      setTurma(null);
      setNaoLidasCount(0);
      setPedidosPendentesCount(0);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        turma,
        loading,
        naoLidasCount,
        pedidosPendentesCount,
        darkMode,
        toggleDarkMode,
        refreshAuth,
        refreshBadges,
        logout,
        showToast,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div className="toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast ${
                t.type === 'error'
                  ? 'toast-error'
                  : t.type === 'success'
                  ? 'toast-success'
                  : ''
              }`}
            >
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
