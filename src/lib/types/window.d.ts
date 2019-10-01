declare global {
  interface Window {
    DEBUG?: boolean;
    bgImage?: string;
    g_scaleRatio?: number;
    debugInfo: { loaded?: boolean; score?: number[] };
  }
}

export {};
