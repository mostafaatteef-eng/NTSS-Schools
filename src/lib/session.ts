import type { SessionState } from '../types';

const SESSION_KEY = 'ntss_session_v1';
const API_KEY = 'ntss_api_url_v1';

export function loadSession(): SessionState | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionState | null): void {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

export function getApiUrl(): string {
  return (import.meta.env.VITE_API_URL || localStorage.getItem(API_KEY) || '').trim();
}

export function saveApiUrl(url: string): void {
  localStorage.setItem(API_KEY, url.trim());
}
