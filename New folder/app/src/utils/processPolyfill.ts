/**
 * Browser polyfill for the Node.js `process` object.
 * Prevents "process is not defined" in browser builds.
 *
 * BUG FIX M-3: previously this polyfill unconditionally set
 *   process.env.NODE_ENV = 'production'
 * for the renderer, which broke prod-vs-dev branches in shared modules
 * (e.g. encryption.ts uses NODE_ENV to decide whether to require a real
 * pepper). It also let any code mutate `process.env` freely.
 *
 * The polyfill now:
 *  - reads the build-time flag from Vite (`import.meta.env.MODE`)
 *  - exposes `env` via a read-only Proxy that ignores writes
 *  - exposes only the well-known `node/browser` platform string
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const runtimeMode: string = (() => {
  try {
    // import.meta.env is replaced statically by Vite at build time.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return (import.meta as any).env.MODE as string;
    }
  } catch { /* no-op */ }
  // Fallback: we always operate in production by default in renderer builds.
  return 'production';
})();

function createReadonlyEnv(env: Record<string, string>): any {
  return new Proxy(env, {
    set() { return true; },        // silently drop writes
    deleteProperty() { return true; },
    defineProperty() { return true; },
  });
}

const processStub: any = {
  env: createReadonlyEnv({
    NODE_ENV: runtimeMode,
    BABEL_ENV: runtimeMode,
  }),
  platform: 'browser',
  nextTick: (cb: () => void) => setTimeout(cb, 0),
  // Versions are intentionally not exposed — they leak Node/Electron versions
  // and were the source of an earlier audit finding (L-3).
  versions: {},
};

if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = processStub;
}
if (typeof globalThis !== 'undefined' && !(globalThis as any).process) {
  (globalThis as any).process = processStub;
}

export { };
