export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:4000/api';
}

export const API_BASE_URL = getApiBaseUrl();

// In-Memory Client Cache for ultra-fast instant page transitions
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds TTL

export function clearApiCache(pathPrefix?: string) {
  if (!pathPrefix) {
    apiCache.clear();
  } else {
    apiCache.forEach((_, key) => {
      if (key.startsWith(pathPrefix)) {
        apiCache.delete(key);
      }
    });
  }
}

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Return from in-memory cache if valid GET request
  if (isGet && options?.cache !== 'no-store') {
    const cached = apiCache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let errMsg = `HTTP Error ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errMsg;
    } catch {}
    throw new Error(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
  }

  const data = await res.json();

  if (isGet) {
    apiCache.set(path, { data, timestamp: Date.now() });
  } else {
    // Invalidate cache on mutations (POST, PUT, PATCH, DELETE)
    apiCache.clear();
  }

  return data;
}

export function formatRp(amount: number | undefined | null): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export function formatDateId(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Synthesize real beep sound for Gate / POS Check-in feedback
export function playGateBeep(success: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // High C6 beep
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Low alert buzzer
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch {}
}
