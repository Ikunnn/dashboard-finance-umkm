import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { Transaksi } from '../../types';
import { formatDateIndo, formatNumber, formatRupiah, getTodayDateString } from '../../utils/formatters';

export const DashboardModule: React.FC<{ onSelectReceipt: (trx: Transaksi) => void }> = ({
  onSelectReceipt,
}) => {
  const {
    pemasukan,
    pengeluaran,
    transaksi,
    lowStockItems,
    setActiveTab,
    usaha,
    currentUser,
  } = useApp();

  const todayStr = getTodayDateString();

  // Compute yesterday string
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Financial Metrics Today vs Yesterday
  const {
    pemasukanHariIni,
    pemasukanKemarin,
    pengeluaranHariIni,
    pengeluaranKemarin,
    labaBersihHariIni,
    labaBersihKemarin,
    pemasukanChangePct,
    pengeluaranChangePct,
  } = useMemo(() => {
    const pemHariIni = pemasukan
      .filter(p => p.tanggal === todayStr)
      .reduce((sum, p) => sum + p.jumlah, 0);

    const pemKemarin = pemasukan
      .filter(p => p.tanggal === yesterdayStr)
      .reduce((sum, p) => sum + p.jumlah, 0);

    const pengHariIni = pengeluaran
      .filter(p => p.tanggal === todayStr)
      .reduce((sum, p) => sum + p.jumlah, 0);

    const pengKemarin = pengeluaran
      .filter(p => p.tanggal === yesterdayStr)
      .reduce((sum, p) => sum + p.jumlah, 0);

    const labaHariIni = pemHariIni - pengHariIni;
    const labaKemarin = pemKemarin - pengKemarin;

    const pemChange =
      pemKemarin > 0 ? ((pemHariIni - pemKemarin) / pemKemarin) * 100 : pemHariIni > 0 ? 100 : 0;

    const pengChange =
      pengKemarin > 0 ? ((pengHariIni - pengKemarin) / pengKemarin) * 100 : pengHariIni > 0 ? 100 : 0;

    return {
      pemasukanHariIni: pemHariIni,
      pemasukanKemarin: pemKemarin,
      pengeluaranHariIni: pengHariIni,
      pengeluaranKemarin: pengKemarin,
      labaBersihHariIni: labaHariIni,
      labaBersihKemarin: labaKemarin,
      pemasukanChangePct: Math.round(pemChange),
      pengeluaranChangePct: Math.round(pengChange),
    };
  }, [pemasukan, pengeluaran, todayStr, yesterdayStr]);

  // Arus Kas 7 Hari Terakhir (PRD 3.1)
  const cashFlow7Days = useMemo(() => {
    const days: { dateStr: string; label: string; Pemasukan: number; Pengeluaran: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayLabel = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
      }).format(d);

      const inTotal = pemasukan
        .filter(p => p.tanggal === dateStr)
        .reduce((sum, p) => sum + p.jumlah, 0);

      const outTotal = pengeluaran
        .filter(p => p.tanggal === dateStr)
        .reduce((sum, p) => sum + p.jumlah, 0);

      days.push({
        dateStr,
        label: dayLabel,
        Pemasukan: inTotal,
        Pengeluaran: outTotal,
      });
    }
    return days;
  }, [pemasukan, pengeluaran]);

  // Top 5 Produk Terlaris dari Transaksi Kasir (PRD 3.1)
  const top5Produk = useMemo(() => {
    const productCounts: Record<string, { name: string; qty: number; totalRevenue: number }> = {};

    transaksi.forEach(trx => {
      trx.items.forEach(item => {
        if (!productCounts[item.nama_produk]) {
          productCounts[item.nama_produk] = {
            name: item.nama_produk,
            qty: 0,
            totalRevenue: 0,
          };
        }
        productCounts[item.nama_produk].qty += item.qty;
        productCounts[item.nama_produk].totalRevenue += item.subtotal;
      });
    });

    return Object.values(productCounts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transaksi]);

  // 10 Transaksi Terakhir (PRD 3.1)
  const recentTransactions = useMemo(() => {
    return [...transaksi].slice(0, 10);
  }, [transaksi]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
            Dashboard Finansial UMKM
          </span>
          <h2 className="text-lg sm:text-2xl font-black mt-0.5 tracking-tight">
            Selamat datang, {currentUser.nama}!
          </h2>
          <p className="text-emerald-100/80 text-xs mt-1 max-w-xl leading-relaxed">
            Pantau arus kas harian, transaksi kasir, persediaan bahan baku, dan laba bersih{' '}
            <strong className="text-white">{usaha.nama_usaha}</strong> secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('kasir')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-xs active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buka Kasir (POS)</span>
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors backdrop-blur-xs"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laba Rugi</span>
          </button>
        </div>
      </div>

      {/* Mobile Quick Action Shortcuts (visible only on mobile) */}
      <div className="grid grid-cols-4 gap-2 sm:hidden">
        <button
          onClick={() => setActiveTab('kasir')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-700">Kasir</span>
        </button>
        <button
          onClick={() => setActiveTab('pemasukan')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-700">+ Pemasukan</span>
        </button>
        <button
          onClick={() => setActiveTab('pengeluaran')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-1">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-700">- Beban</span>
        </button>
        <button
          onClick={() => setActiveTab('stok')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-700">Stok</span>
        </button>
      </div>

      {/* Summary Cards (PRD 3.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Pemasukan Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Pemasukan Hari Ini
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
              {formatRupiah(pemasukanHariIni)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 sm:gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] ${
                  pemasukanChangePct >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {pemasukanChangePct >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {pemasukanChangePct > 0 ? `+${pemasukanChangePct}%` : `${pemasukanChangePct}%`}
              </span>
              <span className="text-slate-400 text-[11px] truncate">vs kemarin ({formatRupiah(pemasukanKemarin)})</span>
            </div>
          </div>
        </div>

        {/* Pengeluaran Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-red-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Pengeluaran Hari Ini
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
              {formatRupiah(pengeluaranHariIni)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 sm:gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] ${
                  pengeluaranChangePct <= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {pengeluaranChangePct > 0 ? `+${pengeluaranChangePct}%` : `${pengeluaranChangePct}%`}
              </span>
              <span className="text-slate-400 text-[11px] truncate">vs kemarin ({formatRupiah(pengeluaranKemarin)})</span>
            </div>
          </div>
        </div>

        {/* Laba Bersih Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Laba Bersih Hari Ini
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                labaBersihHariIni >= 0 ? 'text-teal-700' : 'text-red-600'
              }`}
            >
              {formatRupiah(labaBersihHariIni)}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600 text-[11px]">
                Arus Masuk − Beban
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-700 font-bold text-[11px]">
                {pemasukanHariIni > 0
                  ? `Margin ${Math.round((labaBersihHariIni / pemasukanHariIni) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: Arus Kas 7 Hari & Top 5 Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arus Kas Line Chart (PRD 3.1) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Grafik Arus Kas (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-400">
                Perbandingan pergerakan pemasukan vs pengeluaran harian
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Update Real-Time
            </span>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlow7Days} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={val => (val >= 1000000 ? `${val / 1000000} jt` : `${val / 1000} rb`)}
                />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="Pemasukan"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Pengeluaran"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Produk Terlaris (PRD 3.1) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Top 5 Produk Terlaris</h3>
                <p className="text-xs text-slate-400">Berdasarkan kuantitas penjualan kasir</p>
              </div>
              <Package className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {top5Produk.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  Belum ada data penjualan tercatat
                </div>
              ) : (
                top5Produk.map((prod, idx) => (
                  <div key={prod.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                        {idx + 1}. {prod.name}
                      </span>
                      <span className="font-bold text-emerald-700">{prod.qty} terjual</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (prod.qty / (top5Produk[0]?.qty || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      {formatRupiah(prod.totalRevenue)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('produk')}
            className="mt-4 w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Kelola Semua Produk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Peringatan Stok Menipis & Transaksi Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peringatan Stok Menipis (PRD 3.1) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">
                Peringatan Stok ({lowStockItems.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('stok')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Lihat Stok &rarr;
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span className="font-semibold text-slate-700">Persediaan Bahan Aman</span>
                <p className="text-[11px] text-slate-400">
                  Tidak ada bahan baku yang di bawah batas minimum.
                </p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-800">{item.nama_bahan}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Batas Min: {item.stok_minimum} {item.satuan}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-xs">
                      Sisa: {item.stok_saat_ini} {item.satuan}
                    </span>
                    <button
                      onClick={() => setActiveTab('stok')}
                      className="block mt-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold underline text-right w-full"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 10 Transaksi Terakhir (PRD 3.1) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">10 Transaksi Kasir Terbaru</h3>
              <p className="text-xs text-slate-400">Riwayat penjualan kasir yang baru terjadi</p>
            </div>
            <button
              onClick={() => setActiveTab('riwayat_kasir')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Semua Riwayat <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Card List (visible on sm screens and below) */}
          <div className="md:hidden mt-3 divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Belum ada transaksi kasir tercatat
              </div>
            ) : (
              recentTransactions.map(trx => (
                <div
                  key={trx.id}
                  onClick={() => onSelectReceipt(trx)}
                  className="py-3 flex items-center justify-between gap-3 active:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 truncate">
                        {trx.nomor_transaksi}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          trx.metode_pembayaran === 'QRIS'
                            ? 'bg-purple-100 text-purple-700'
                            : trx.metode_pembayaran === 'TUNAI'
                            ? 'bg-emerald-100 text-emerald-700'
                            : trx.metode_pembayaran === 'TRANSFER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {trx.metode_pembayaran}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{formatDateIndo(trx.tanggal, true)}</span>
                      <span>•</span>
                      <span>Kasir: {trx.kasir_nama}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="font-black text-xs font-mono text-slate-900">
                        {formatRupiah(trx.total_bayar)}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                        <Receipt className="w-3 h-3" /> Struk
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 pr-3">No. Transaksi</th>
                  <th className="py-2 px-3">Waktu</th>
                  <th className="py-2 px-3">Metode</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 pl-3 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Belum ada transaksi kasir tercatat
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-3 font-semibold text-slate-800">
                        {trx.nomor_transaksi}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {trx.kasir_nama}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {formatDateIndo(trx.tanggal, true)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trx.metode_pembayaran === 'QRIS'
                              ? 'bg-purple-100 text-purple-700'
                              : trx.metode_pembayaran === 'TUNAI'
                              ? 'bg-emerald-100 text-emerald-700'
                              : trx.metode_pembayaran === 'TRANSFER'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {trx.metode_pembayaran}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                        {formatRupiah(trx.total_bayar)}
                      </td>
                      <td className="py-2.5 pl-3 text-center">
                        <button
                          onClick={() => onSelectReceipt(trx)}
                          className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Lihat / Cetak Struk"
                        >
                          <Receipt className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
