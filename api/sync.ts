import type { VercelRequest, VercelResponse } from '@vercel/node';

let kv: any = null;
function findRedisConfig(): { url: string; token: string } | null {
  const env = process.env as Record<string, string | undefined>;
  const directUrl = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || env.STORAGE_REST_URL || env.STORAGE_KV_REST_API_URL || env.REDIS_REST_URL;
  const directToken = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || env.STORAGE_REST_TOKEN || env.STORAGE_KV_REST_API_TOKEN || env.REDIS_REST_TOKEN;
  if (directUrl && directToken) return { url: directUrl, token: directToken };
  let best: { url: string; token: string; key: string } | null = null;
  for (const [k, v] of Object.entries(env)) {
    if (!k.endsWith('_REST_URL') || !v || !v.startsWith('https://')) continue;
    const base = k.replace('_REST_URL', '');
    const token = env[base + '_REST_TOKEN'] || env[base + '_REST_API_TOKEN'];
    if (!token) continue;
    const cur = { url: v, token, key: k };
    if (!best) best = cur;
    else {
      const score = (c: any) => (c.key.includes('UPSTASH') ? 0 : c.key.includes('KV') ? 1 : c.key.includes('STORAGE') ? 2 : c.key.includes('REDIS') ? 3 : 10);
      if (score(cur) < score(best)) best = cur;
    }
  }
  return best ? { url: best.url, token: best.token } : null;
}
async function getKv() {
  if (kv) return kv;
  const cfg = findRedisConfig();
  if (!cfg) return null;
  try {
    const { Redis } = await import('@upstash/redis');
    kv = new Redis({ url: cfg.url, token: cfg.token });
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
    const avail = Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV') || k.includes('STORAGE')).join(', ') || '(none)';
    return res.status(503).json({
      error: 'KV_NOT_ENABLED',
      avail_keys_hint: avail,
      message: 'Redis env tidak ditemukan. Cek Vercel → Storage → Upstash Redis → env harus ke-inject (redeploy mungkin perlu).',
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
