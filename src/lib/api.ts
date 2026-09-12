import type { ApiResponse, SessionState } from '../types';
import { getApiUrl, loadSession } from './session';

export async function api<T>(action: string, payload: Record<string, unknown> = {}, sessionOverride?: SessionState | null): Promise<T> {
  const url = getApiUrl();
  if (!url) throw new Error('لم يتم ضبط رابط Google Apps Script بعد.');

  const session = sessionOverride === undefined ? loadSession() : sessionOverride;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action,
      sessionToken: session?.token,
      ...payload,
    }),
  });

  if (!response.ok) throw new Error(`فشل الاتصال بالخادم (${response.status})`);
  const result = (await response.json()) as ApiResponse<T>;
  if (!result.ok) {
    const error = new Error(result.message || 'تعذر تنفيذ الطلب');
    (error as Error & { code?: string }).code = result.code;
    throw error;
  }
  return result.data as T;
}

export async function pingApi(): Promise<boolean> {
  try {
    const result = await api<{ version: string }>('ping', {}, null);
    return Boolean(result?.version);
  } catch {
    return false;
  }
}
