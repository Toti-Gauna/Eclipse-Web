'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { apiClient, endpoints, errorKind, type ApiClientProfile } from '@/lib/api';
import { IS_LIVE } from '@/lib/env';

/**
 * The visitor's session with the backend, in memory only (the cookies are HttpOnly and
 * invisible to this code). Nothing is requested until a screen that needs it asks
 * (`useSession({ ensure: true })`): public pages of the landing never call the API.
 *
 * - disabled: demo mode, there is no backend.
 * - unknown: not asked yet · loading: asking.
 * - anonymous: no session (`expired` = it was there and the server refused to renew it).
 * - authenticated: the client's profile.
 * - error: the check failed (offline / server down): not the same as "logged out".
 */
export type SessionState =
  | { status: 'disabled' }
  | { status: 'unknown' }
  | { status: 'loading' }
  | { status: 'anonymous'; expired: boolean }
  | { status: 'authenticated'; client: ApiClientProfile }
  | { status: 'error' };

interface SessionApi {
  state: SessionState;
  /** Starts the one-time `GET /auth/client/me` if nobody has yet. */
  ensure: () => void;
  /** Asks again (after verifying the email, on "reintentar"…). */
  reload: () => Promise<void>;
  login: (email: string, password: string) => Promise<ApiClientProfile>;
  logout: () => Promise<void>;
}

const noop = async () => undefined;

const DISABLED: SessionApi = {
  state: { status: 'disabled' },
  ensure: () => undefined,
  reload: noop,
  login: () => Promise.reject(new Error('Backend not configured')),
  logout: noop,
};

const SessionContext = createContext<SessionApi>(DISABLED);

export function SessionProvider({ children }: { children: ReactNode }) {
  return IS_LIVE ? <LiveSession>{children}</LiveSession> : <SessionContext.Provider value={DISABLED}>{children}</SessionContext.Provider>;
}

function LiveSession({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'unknown' });
  const asked = useRef(false);

  const check = useCallback(async () => {
    setState((s) => (s.status === 'authenticated' ? s : { status: 'loading' }));
    try {
      const client = await endpoints.me();
      setState({ status: 'authenticated', client });
    } catch (error) {
      const kind = errorKind(error);
      if (kind === 'sessionExpired') setState({ status: 'anonymous', expired: false });
      else setState((s) => (s.status === 'authenticated' ? s : { status: 'error' }));
    }
  }, []);

  const ensure = useCallback(() => {
    if (asked.current) return;
    asked.current = true;
    void check();
  }, [check]);

  const reload = useCallback(async () => {
    asked.current = true;
    await check();
  }, [check]);

  const login = useCallback(async (email: string, password: string) => {
    const client = await endpoints.login(email, password);
    asked.current = true;
    setState({ status: 'authenticated', client });
    return client;
  }, []);

  const logout = useCallback(async () => {
    try {
      await endpoints.logout();
    } catch {
      /* the local session is dropped either way */
    }
    asked.current = true;
    setState({ status: 'anonymous', expired: false });
  }, []);

  // The API client tells us when a refresh was refused: the session is over.
  useEffect(
    () =>
      apiClient.onSessionLost(() => {
        asked.current = true;
        setState((s) => (s.status === 'authenticated' ? { status: 'anonymous', expired: true } : { status: 'anonymous', expired: false }));
      }),
    [],
  );

  // Coming back to the tab: make sure the session is still alive (and the verified flag fresh).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && asked.current) void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  const value = useMemo<SessionApi>(() => ({ state, ensure, reload, login, logout }), [state, ensure, reload, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** `useSession({ ensure: true })` also kicks off the session check on mount. */
export function useSession(options: { ensure?: boolean } = {}): SessionApi {
  const api = useContext(SessionContext);
  const { ensure } = api;
  const wanted = options.ensure === true;
  useEffect(() => {
    if (wanted) ensure();
  }, [wanted, ensure]);
  return api;
}
