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
  (window as any).process = window.processPolyfill;
}

export {};