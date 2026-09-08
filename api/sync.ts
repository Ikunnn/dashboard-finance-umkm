import type { VercelRequest, VercelResponse } from '@vercel/node';

let kv: any = null;
async function getKv() {
  if (kv) return kv;
  // Prefer Upstash (new) → fallback KV (legacy)
  const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasKv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  if (!hasUpstash && !hasKv) return null;
  try {
    if (hasUpstash) {
      const { Redis } = await import('@upstash/redis');
      kv = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      return kv;
    }
    const mod = await import('@vercel/kv');
    kv = mod.kv;
    return kv;
  } catch {
    return null;
  }
}

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

function keyFor(biz: string, k: string) {
  return `biz:${biz}:${k}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const kvs = await getKv();
  if (!kvs) {
    return res.status(503).json({
      error: 'KV_NOT_ENABLED',
      message: 'Aktifkan Redis di Vercel: vercel.com → dashboard-finance-umkm → Storage → Create Database → Upstash Redis → Connect. Tanpa ini data masih kesimpen lokal per-HP.',
    });
  }

  const biz = (req.query.biz as string) || (req.body?.biz as string) || 'biz_poody';

  if (req.method === 'GET') {
    try {
      const entries = await Promise.all(
        KEYS.map(async (k) => {
          const v = await kvs.get(keyFor(biz, k));
          return [k, v] as const;
        })
      );
      const data: Record<string, any> = {};
      let hasAny = false;
      for (const [k, v] of entries) {
        if (v !== null && v !== undefined) {
          data[k] = typeof v === 'string' ? JSON.parse(v) : v;
          hasAny = true;
        }
      }
      return res.status(200).json({ biz, hasAny, data });
    } catch (e: any) {
      return res.status(500).json({ error: 'KV_GET_FAILED', message: String(e?.message || e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (body.key && body.value !== undefined) {
        const val = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);
        await kvs.set(keyFor(biz, body.key), val);
        return res.status(200).json({ ok: true, key: body.key });
      }
      if (body.data && typeof body.data === 'object') {
        const data = body.data as Record<string, any>;
        await Promise.all(
          Object.entries(data).map(([k, v]) => {
            if (!KEYS.includes(k as any)) return Promise.resolve();
            const val = typeof v === 'string' ? v : JSON.stringify(v);
            return kvs.set(keyFor(biz, k), val);
          })
        );
        return res.status(200).json({ ok: true, keys: Object.keys(data) });
      }
      return res.status(400).json({ error: 'BAD_BODY', message: 'Kirim {key,value} atau {data:{umkm_users:...}}' });
    } catch (e: any) {
      return res.status(500).json({ error: 'KV_SET_FAILED', message: String(e?.message || e) });
    }
  }

  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
