import { useState, useEffect } from 'react';

/**
 * Fetches the real application version from Electron's main process
 * via the `app:getVersion` IPC handler. Falls back to '1.0.0' when the
 * Electron API is unavailable (e.g. running in a plain browser).
 */
export function useAppVersion(): string {
  const [version, setVersion] = useState<string>('1.0.0');

  useEffect(() => {
    const api = (window as any).electronSecureAPI;
    if (api?.app?.getVersion) {
      api.app.getVersion()
        .then((v: string) => {
          if (v) setVersion(v);
        })
        .catch(() => {
          // keep default
        });
    }
  }, []);

  return version;
}

/**
 * Synchronous variant for non-React contexts. Returns a promise.
 */
export async function getAppVersion(): Promise<string> {
  const api = (window as any).electronSecureAPI;
  if (api?.app?.getVersion) {
    try {
      const v = await api.app.getVersion();
      if (v) return v;
    } catch {
      // fall through
    }
  }
  return '1.0.0';
}
