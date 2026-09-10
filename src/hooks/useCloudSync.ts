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

function isNewerLocal(localVal: any, cloudVal: any): boolean {
  // For arrays: local has more items → keep local (user just added pemasukan/pengeluaran)
  if (Array.isArray(localVal) && Array.isArray(cloudVal)) {
    if (localVal.length > cloudVal.length) return true;
    // if same length but local has newer created_at (compare max)
    if (localVal.length === cloudVal.length && localVal.length > 0) {
      try {
        const maxLocal = Math.max(...localVal.map((x:any)=> new Date(x.created_at||x.tanggal||0).getTime()||0));
        const maxCloud = Math.max(...cloudVal.map((x:any)=> new Date(x.created_at||x.tanggal||0).getTime()||0));
        if (maxLocal > maxCloud) return true;
      } catch {}
    }
  }
  return false;
}

export function useCloudSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastPushRef = useRef<number>(0);
  const hasPulledRef = useRef(false);
  const lastHashRef = useRef<string>('');

  // Pull from KV → localStorage (merge, jangan overwrite kalau local lebih baru)
  const pull = async (): Promise<boolean> => {
    try {
      setStatus('syncing');
      const r = await fetch(API, { cache: 'no-store', headers: syncHeaders });
      if (r.status === 401) {
        setStatus('error');
        setError('Sync token salah — redeploy atau hard refresh');
        return false;
      }
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
      const local = readLocal();
      let changed = false;
      for (const [k, v] of Object.entries(data)) {
        const localVal = (local as any)[k];
        if (localVal !== undefined && isNewerLocal(localVal, v)) {
          // local lebih baru → jangan timpa, biarkan push yang kirim local ke cloud
          continue;
        }
        const cur = localStorage.getItem(k);
        const next = JSON.stringify(v);
        if (cur !== next) {
          localStorage.setItem(k, next);
          changed = true;
        }
      }
      if (changed) window.dispatchEvent(new Event('umkm-cloud-pulled'));
      setStatus('synced');
      setError(null);
      return changed;
    } catch (e: any) {
      setStatus('error');
      setError(String(e?.message || e));
      return false;
    }
  };

  // Push local → KV (throttle 800ms, bukan 3s)
  const push = async (): Promise<boolean> => {
    if (Date.now() - lastPushRef.current < 800) return false;
    lastPushRef.current = Date.now();
    try {
      const data = readLocal();
      if (!Object.keys(data).length) return false;
      const r = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...syncHeaders },
        body: JSON.stringify({ biz: BIZ, data }),
      });
      if (r.status === 401) {
        setStatus('error');
        setError('Sync token salah');
        return false;
      }
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
    pull().then((didPull) => {
      if (!didPull) {
        setTimeout(() => push(), 800);
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

  // Auto-push: debounce 400ms + hash check tiap 800ms + event umkm-local-changed
  useEffect(() => {
    let t: any = null;
    const schedule = () => {
      clearTimeout(t);
      t = setTimeout(() => push(), 400);
    };
    const checkHash = () => {
      try {
        const h = JSON.stringify(readLocal());
        if (h !== lastHashRef.current) {
          lastHashRef.current = h;
          schedule();
        }
      } catch {}
    };
    // init hash
    try { lastHashRef.current = JSON.stringify(readLocal()); } catch {}
    const iv = setInterval(checkHash, 800);
    window.addEventListener('storage', schedule);
    window.addEventListener('umkm-local-changed', schedule as any);
    return () => { clearInterval(iv); clearTimeout(t); window.removeEventListener('storage', schedule); window.removeEventListener('umkm-local-changed', schedule as any); };
  }, []);

  return { status, error, pull, push };
}
