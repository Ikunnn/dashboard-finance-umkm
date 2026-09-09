import { useEffect, useRef, useState } from 'react';

const BIZ = 'biz_poody';
const API = '/api/sync?biz=' + BIZ;
// baked at build — set VITE_SYNC_TOKEN in Vercel env to override
const SYNC_TOKEN: string = (import.meta as any).env?.VITE_SYNC_TOKEN || 'o4cR-KIf_50VvVX1CZOtDyPAnCzSvHf2';
const syncHeaders: HeadersInit = SYNC_TOKEN ? { 'x-sync-token': SYNC_TOKEN } : {};

type SyncStatus = 'idle' | 'local' | 'syncing' | 'synced' | 'kv_not_enabled' | 'error';

const KEYS = [
  'umkm_users',
  'umkm_usaha',
  'umkm_produk',
  'umkm_bahan_baku',
  'umkm_riwayat_stok',
  'umkm_transaksi',
  'umkm_pemasukan',
  'umkm_pengeluaran',
  'umkm_kategori',
] as const;

function readLocal(): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of KEYS) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try { out[k] = JSON.parse(raw); } catch { /* ignore */ }
    }
  }
  return out;
}

export function useCloudSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastPushRef = useRef<number>(0);
  const hasPulledRef = useRef(false);

  // Pull from KV → localStorage
  const pull = async (): Promise<boolean> => {
    try {
      setStatus('syncing');
      const r = await fetch(API, { cache: 'no-store', headers: syncHeaders });
      if (r.status === 503) {
        const j = await r.json().catch(() => ({}));
        setStatus('kv_not_enabled');
        setError(j?.message || 'KV belum diaktifkan di Vercel Dashboard');
        return false;
      }
      if (!r.ok) throw new Error('GET ' + r.status);
      const j = await r.json();
      const data = j.data || {};
      if (!j.hasAny) {
        setStatus('local');
        return false;
      }
      // write to localStorage
      for (const [k, v] of Object.entries(data)) {
        localStorage.setItem(k, JSON.stringify(v));
      }
      window.dispatchEvent(new Event('umkm-cloud-pulled'));
      setStatus('synced');
      setError(null);
      return true;
    } catch (e: any) {
      setStatus('error');
      setError(String(e?.message || e));
      return false;
    }
  };

  // Push local → KV
  const push = async (): Promise<boolean> => {
    // throttle 3s
    if (Date.now() - lastPushRef.current < 3000) return false;
    lastPushRef.current = Date.now();
    try {
      const data = readLocal();
      if (!Object.keys(data).length) return false;
      const r = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...syncHeaders },
        body: JSON.stringify({ biz: BIZ, data }),
      });
      if (r.status === 503) {
        const j = await r.json().catch(() => ({}));
        setStatus('kv_not_enabled');
        setError(j?.message || 'KV belum diaktifkan');
        return false;
      }
      if (!r.ok) throw new Error('POST ' + r.status);
      setStatus('synced');
      setError(null);
      return true;
    } catch (e: any) {
      setStatus('error');
      setError(String(e?.message || e));
      return false;
    }
  };

  // Initial pull once
  useEffect(() => {
    if (hasPulledRef.current) return;
    hasPulledRef.current = true;
    // pull in background, don't block render
    pull().then((didPull) => {
      if (!didPull) {
        // first time: push local defaults to cloud so other devices can pull
        setTimeout(() => push(), 1500);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll pull every 15s when tab visible
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        pull();
      }
    }, 15000);
    const onVis = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) pull();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onVis);
    };
  }, []);

  // Debounced auto-push on local changes (listen storage & interval check)
  useEffect(() => {
    let t: any = null;
    const schedule = () => {
      clearTimeout(t);
      t = setTimeout(() => push(), 1200);
    };
    // check every 2s if local changed vs last push
    const iv = setInterval(schedule, 2500);
    window.addEventListener('storage', schedule);
    return () => { clearInterval(iv); clearTimeout(t); window.removeEventListener('storage', schedule); };
  }, []);

  return { status, error, pull, push };
}
