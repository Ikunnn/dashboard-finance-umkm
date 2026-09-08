import React, { useMemo, useState } from 'react';
import { Calendar, Download, Printer, Target, Wallet, Package, TrendingUp, Award, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatNumber, formatDateIndo, getTodayDateString, exportToCSV } from '../../utils/formatters';
import { TARGET_HARIAN, TARGET_BULANAN, rekapHarian, rekapBulanan, labaForTransaksi, hppForItem } from '../../utils/poodyFinance';

export const RekapModule: React.FC = () => {
  const { transaksi, usaha } = useApp();
  const [dateStr, setDateStr] = useState(getTodayDateString());

  const harian = useMemo(() => rekapHarian(transaksi, dateStr), [transaksi, dateStr]);
  const ym = dateStr.slice(0, 7);
  const bulanan = useMemo(() => rekapBulanan(transaksi, ym), [transaksi, ym]);

  const perRasa = useMemo(() => {
    const map: Record<string, { name: string; qty: number; omzet: number; hpp: number }> = {};
    for (const trx of harian.list) for (const it of trx.items) {
      const key = it.nama_produk.split(' (')[0].split(' +')[0].trim();
      if (!map[key]) map[key] = { name: key, qty: 0, omzet: 0, hpp: 0 };
      map[key].qty += it.qty;
      map[key].omzet += it.subtotal;
      map[key].hpp += hppForItem(it) * it.qty;
    }
    return Object.values(map).sort((a,b)=>b.qty-a.qty);
  }, [harian.list]);

  const handlePrint = () => window.print();
  const handleExport = () => {
    const rows = [
      { Deskripsi: `Rekap Tutup Kasir ${usaha.nama_usaha} — ${dateStr}`, Nilai: '' },
      { Deskripsi: 'Omzet Hari Ini', Nilai: harian.omzet },
      { Deskripsi: 'HPP (M 5.1k / L 6.1k + topping)', Nilai: harian.hpp },
      { Deskripsi: 'Laba Kotor', Nilai: harian.labaKotor },
      { Deskripsi: 'Cup Terjual', Nilai: harian.cup },
      { Deskripsi: 'Target Harian 200rb', Nilai: `${harian.progress}% — sisa ${formatRupiah(harian.sisa)}` },
      { Deskripsi: '', Nilai: '' },
      ...harian.list.map(t => {
        const r = labaForTransaksi(t);
        return { Deskripsi: `${t.nomor_transaksi} — ${t.metode_pembayaran} — ${t.kasir_nama}`, Nilai: `${formatRupiah(r.omzet)} | HPP ${formatRupiah(r.hpp)} | Laba ${formatRupiah(r.labaKotor)}` };
      }),
    ];
    exportToCSV(`Rekap_Tutup_Kasir_${dateStr}`, rows as any);
  };

  const margin = harian.omzet > 0 ? Math.round((harian.labaKotor / harian.omzet) * 100) : 0;
  const capai = harian.omzet >= TARGET_HARIAN;

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><Receipt className="w-5 h-5" /></div>
          <div>
            <h2 className="font-black text-slate-900 tracking-tight">Rekap Tutup Kasir</h2>
            <p className="text-xs text-slate-400">Omzet • HPP real Poody • Laba kotor • Target 200rb/hari</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="bg-transparent text-xs font-semibold outline-none" />
          </div>
          <button onClick={handlePrint} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"><Printer className="w-4 h-4 text-slate-600" /></button>
          <button onClick={handleExport} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Export</button>
        </div>
      </div>

      {/* Target banner */}
      <div className={`rounded-2xl p-4 border shadow-xs ${capai ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className={`w-5 h-5 ${capai?'text-white':'text-amber-600'}`} />
            <span className="text-sm font-black">{capai ? '🎉 Target Harian Tercapai!' : `Target Harian ${formatRupiah(TARGET_HARIAN)}`}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${capai?'bg-white text-emerald-700':'bg-amber-500 text-white'}`}>{harian.progress}%</span>
          </div>
          <span className={`text-xs font-semibold ${capai?'text-emerald-100':'text-amber-700'}`}>{capai ? `+${formatRupiah(harian.omzet - TARGET_HARIAN)} di atas target` : `Sisa ${formatRupiah(harian.sisa)} lagi`}</span>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-black/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${capai?'bg-white':'bg-amber-500'}`} style={{ width: `${Math.min(100, harian.progress)}%` }} />
        </div>
        <div className="flex justify-between text-[11px] mt-1.5 font-semibold opacity-80">
          <span>{formatRupiah(harian.omzet)} / {formatRupiah(TARGET_HARIAN)}</span>
          <span>Bulanan {formatRupiah(bulanan.omzet)} / {formatRupiah(TARGET_BULANAN)} ({bulanan.progress}%)</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Omzet Hari Ini', value: formatRupiah(harian.omzet), sub: `${harian.cup} cup • avg ${formatRupiah(harian.avgCup)}/cup`, tone: 'text-slate-900' },
          { label: 'HPP Real', value: formatRupiah(harian.hpp), sub: 'M 5.1k • L 6.1k + topping HPP', tone: 'text-amber-700' },
          { label: 'Laba Kotor', value: formatRupiah(harian.labaKotor), sub: `Margin ${margin}%`, tone: harian.labaKotor>=0?'text-emerald-700':'text-red-600' },
          { label: 'Laba Bersih Est.', value: formatRupiah(harian.labaKotor), sub: 'sudah dipotong diskon', tone: 'text-teal-700' },
        ].map(c=>(
          <div key={c.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</span>
            <div className={`text-lg font-black font-mono tracking-tight mt-1 ${c.tone}`}>{c.value}</div>
            <span className="text-[11px] text-slate-500 font-medium">{c.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transaksi hari ini */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" />Transaksi Hari Ini ({harian.list.length})</h3>
          {harian.list.length===0 ? <p className="text-xs text-slate-400 text-center py-8">Belum ada transaksi di {formatDateIndo(dateStr)}</p> : (
            <div className="mt-3 divide-y divide-slate-100">
              {harian.list.map(trx => {
                const r = labaForTransaksi(trx);
                return (
                  <div key={trx.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{trx.nomor_transaksi}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{trx.metode_pembayaran}</span>
                        <span className="text-[10px] text-slate-400">{new Date(trx.tanggal).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{trx.items.map(i=>`${i.qty}x ${i.nama_produk}`).join(', ')} • {trx.kasir_nama}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black font-mono text-slate-900">{formatRupiah(r.omzet)}</div>
                      <div className="text-[11px] font-mono"><span className="text-amber-600">HPP {formatRupiah(r.hpp)}</span> <span className="text-emerald-600">• Laba {formatRupiah(r.labaKotor)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Total Hari Ini</span>
            <div className="text-right">
              <span className="text-sm font-black font-mono text-slate-900">{formatRupiah(harian.omzet)}</span>
              <span className="text-[11px] text-slate-500 ml-2">Laba {formatRupiah(harian.labaKotor)}</span>
            </div>
          </div>
        </div>

        {/* Per rasa */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Package className="w-4 h-4 text-violet-500" />Per Rasa</h3>
          <p className="text-[11px] text-slate-400 mt-1">Qty & laba kotor per varian hari ini</p>
          {perRasa.length===0 ? <p className="text-xs text-slate-400 text-center py-6">Belum ada penjualan</p> : (
            <div className="mt-3 space-y-2.5">
              {perRasa.map(r=>{
                const laba = r.omzet - r.hpp;
                return (
                  <div key={r.name} className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{r.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2">{r.qty} cup</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-slate-900">{formatRupiah(r.omzet)}</div>
                      <div className="text-[10px] font-mono text-emerald-600">Laba {formatRupiah(laba)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
            <span className="font-bold flex items-center gap-1"><Award className="w-3.5 h-3.5" />Insight</span>
            <p className="text-[11px] leading-relaxed mt-1">Margin kotor Poody ~49% (M) / 49% (L). Topping nambah laba +1.1k-1.6k per cup. Laba bersih real = laba kotor − sewa/listrik/gaji di Laporan.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
