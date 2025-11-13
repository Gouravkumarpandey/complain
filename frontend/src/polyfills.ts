// src/polyfills.ts
declare global {
  interface Window {
    processPolyfill: {
      env: Record<string, string | undefined>;
      platform: string;
      version: string;
      browser: boolean;
    };
  }
}

// Create a simple polyfill for the process object
if (typeof window !== 'undefined') {
  window.processPolyfill = {
    env: {},
    platform: 'win32',
    version: '1.0.0',
    browser: true
  };
  
  // Some libraries might check for process.env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).process = window.processPolyfill;

  // Per-tab auth storage shim
  // Goal: Make auth-related data (token, user, refreshToken, etc.) tab-isolated
  // by transparently redirecting localStorage access for these keys to sessionStorage.
  // This lets each browser tab require its own sign-in and run independently.
  try {
    const PER_TAB_KEYS = new Set<string>([
      'token',
      'user',
      'refreshToken',
      'lastTokenRefresh',
      'server_session_id',
    ]);

    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    // Only intercept when the target storage is localStorage and the key is in our allowlist
    Storage.prototype.getItem = function (this: Storage, key: string): string | null {
      try {
        if (this === window.localStorage && PER_TAB_KEYS.has(key)) {
          return window.sessionStorage.getItem(key);
        }
      } catch {
        // Fallback to original behavior on any error
      }
      return originalGetItem.call(this, key);
    };

    Storage.prototype.setItem = function (this: Storage, key: string, value: string): void {
      try {
        if (this === window.localStorage && PER_TAB_KEYS.has(key)) {
          window.sessionStorage.setItem(key, value);
          return;
        }
      } catch {
        // Ignore and fallback
      }
      originalSetItem.call(this, key, value);
    };

    Storage.prototype.removeItem = function (this: Storage, key: string): void {
      try {
        if (this === window.localStorage && PER_TAB_KEYS.has(key)) {
          window.sessionStorage.removeItem(key);
          return;
        }
      } catch {
        // Ignore and fallback
      }
      originalRemoveItem.call(this, key);
    };
  } catch (e) {
    // If the environment forbids modifying Storage prototype, skip gracefully
    console.warn('Per-tab auth storage shim not applied:', e);
  }
}

export {};