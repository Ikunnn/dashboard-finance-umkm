import { POODY_SIZES, POODY_TOPPINGS } from '../data/poodyCatalog';
import type { Transaksi, TransaksiItem } from '../types';

export const TARGET_HARIAN = 200_000;
export const TARGET_BULANAN = 6_000_000;

const toppingHppMap: Record<string, number> = Object.fromEntries(POODY_TOPPINGS.map(t => [t.id, t.hpp]));

export function hppForItem(item: TransaksiItem): number {
  const isL = item.varian_nama === 'L';
  const baseHpp = isL ? POODY_SIZES.L.hpp : POODY_SIZES.M.hpp;
  const toppingHpp = (item.toppings || []).reduce((s, id) => s + (toppingHppMap[id] || 0), 0);
  return baseHpp + toppingHpp;
}

export function labaForTransaksi(trx: Transaksi): { omzet: number; hpp: number; labaKotor: number; cup: number } {
  let hpp = 0;
  let cup = 0;
  for (const it of trx.items) {
    hpp += hppForItem(it) * it.qty;
    cup += it.qty;
  }
  const omzet = trx.total_bayar;
  // diskon item already in trx.total_bayar; hpp tetap full
  return { omzet, hpp, labaKotor: omzet - hpp, cup };
}

export function rekapHarian(transaksi: Transaksi[], dateStr: string) {
  const list = transaksi.filter(t => t.tanggal.slice(0, 10) === dateStr);
  let omzet = 0, hpp = 0, cup = 0;
  for (const trx of list) {
    const r = labaForTransaksi(trx);
    omzet += r.omzet;
    hpp += r.hpp;
    cup += r.cup;
  }
  const labaKotor = omzet - hpp;
  const progress = TARGET_HARIAN > 0 ? Math.min(100, Math.round((omzet / TARGET_HARIAN) * 100)) : 0;
  const sisa = Math.max(0, TARGET_HARIAN - omzet);
  const avgCup = cup > 0 ? Math.round(omzet / cup) : 0;
  return { list, omzet, hpp, labaKotor, cup, progress, sisa, avgCup };
}

export function rekapBulanan(transaksi: Transaksi[], yearMonth: string) {
  // yearMonth = YYYY-MM
  const list = transaksi.filter(t => t.tanggal.slice(0, 7) === yearMonth);
  let omzet = 0, hpp = 0, cup = 0;
  for (const trx of list) { const r = labaForTransaksi(trx); omzet += r.omzet; hpp += r.hpp; cup += r.cup; }
  const progress = TARGET_BULANAN > 0 ? Math.min(100, Math.round((omzet / TARGET_BULANAN) * 100)) : 0;
  return { omzet, hpp, labaKotor: omzet - hpp, cup, progress, sisa: Math.max(0, TARGET_BULANAN - omzet) };
}
