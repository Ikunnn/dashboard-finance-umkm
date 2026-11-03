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

// Keys that hold arrays with 'id' field — used for merge
const ARRAY_KEYS = [
  'umkm_users',
  'umkm_produk',
  'umkm_bahan_baku',
  'umkm_riwayat_stok',
  'umkm_transaksi',
  'umkm_pemasukan',
  'umkm_pengeluaran',
  'umkm_kategori',
] as const;

// Track which ids have been explicitly deleted locally — survives until next push
const DELETED_IDS_KEY = 'umkm_deleted_ids';

function getDeletedIds(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function addDeletedId(storeKey: string, id: string) {
  const map = getDeletedIds();
  if (!map[storeKey]) map[storeKey] = [];
  if (!map[storeKey].includes(id)) map[storeKey].push(id);
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(map));
}

function clearDeletedIds() {
  localStorage.removeItem(DELETED_IDS_KEY);
}

// Hook: call from any component that deletes items to track the deletion
export function trackDeletion(storeKey: string, id: string) {
  addDeletedId(storeKey, id);
}

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

/**
 * Deep-merge two arrays by 'id' field.
 * - Items in both (same id) → keep the one with the newer created_at/updated_at/tanggal, fallback to local
 * - Items only in local → keep
 * - Items only in cloud → keep (unless in deletedIds for that key)
 */
function mergeArrays(localArr: any[], cloudArr: any[], deletedIds: string[]): any[] {
  const map = new Map<string, any>();

  // Start with cloud items
  for (const item of cloudArr) {
    if (item && item.id) {
      if (deletedIds.includes(item.id)) continue; // skip items deleted locally
      map.set(item.id, item);
    }
  }

  // Layer local items on top — local wins on conflict if newer or same age
  for (const item of localArr) {
    if (!item || !item.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      // compare timestamps: prefer newer
      const localTime = getItemTime(item);
      const cloudTime = getItemTime(existing);
      if (localTime >= cloudTime) {
        map.set(item.id, item);
      }
      // else cloud version is newer, keep it
    }
  }

  // Sort by created_at descending (newest first) for transaction-like arrays
  const result = Array.from(map.values());
  result.sort((a, b) => {
    const ta = getItemTime(a);
    const tb = getItemTime(b);
    return tb - ta; // newest first
  });
  return result;
}

function getItemTime(item: any): number {
  const t = item.created_at || item.updated_at || item.tanggal;
  if (!t) return 0;
  try { return new Date(t).getTime() || 0; } catch { return 0; }
}

export function useCloudSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastPushRef = useRef<number>(0);
  const hasPulledRef = useRef(false);
  const lastHashRef = useRef<string>('');

  // Pull from KV → merge into localStorage
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
      const deletedMap = getDeletedIds();
      let changed = false;

      for (const [k, cloudVal] of Object.entries(data)) {
        const localVal = local[k];

        // For array-based keys → merge by id
        if ((ARRAY_KEYS as readonly string[]).includes(k) && Array.isArray(cloudVal)) {
          const localArr = Array.isArray(localVal) ? localVal : [];
          const deletedIds = deletedMap[k] || [];
          const merged = mergeArrays(localArr, cloudVal, deletedIds);
          const next = JSON.stringify(merged);
          const cur = localStorage.getItem(k);
          if (cur !== next) {
            localStorage.setItem(k, next);
            changed = true;
          }
        } else {
          // Object keys (umkm_usaha) — compare updated_at, prefer newer
          if (localVal && cloudVal && typeof localVal === 'object' && typeof cloudVal === 'object') {
            const localTime = getItemTime(localVal);
            const cloudTime = getItemTime(cloudVal);
            if (localTime > cloudTime) continue; // local is newer, skip
          }
          const cur = localStorage.getItem(k);
          const next = JSON.stringify(cloudVal);
          if (cur !== next) {
            localStorage.setItem(k, next);
            changed = true;
          }
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

  // Push local → KV (throttle 800ms)
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
      // After successful push, clear tracked deletions (cloud now has the correct state)
      clearDeletedIds();
      setStatus('synced');
      setError(null);
      return true;
    } catch (e: any) {
      setStatus('error');
      setError(String(e?.message || e));
      return false;
    }
  };

  // Initial pull once, then push if nothing to pull
  useEffect(() => {
    if (hasPulledRef.current) return;
    hasPulledRef.current = true;
    pull().then((didPull) => {
      // Always push after first pull to ensure cloud gets any local-only data
      setTimeout(() => push(), 800);
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
