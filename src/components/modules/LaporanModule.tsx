import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  PieChart as PieIcon,
  Printer,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { exportToCSV, formatDateIndo, formatNumber, formatRupiah, getTodayDateString } from '../../utils/formatters';
import { hppForItem } from '../../utils/poodyFinance';

type PeriodType = 'harian' | 'mingguan' | 'bulanan' | 'custom';

export const LaporanModule: React.FC = () => {
  const { pemasukan, pengeluaran, transaksi, usaha } = useApp();

  const [period, setPeriod] = useState<PeriodType>('bulanan');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState(getTodayDateString());

  // Set date ranges automatically based on period tab
  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p);
    const today = new Date();
    const todayStr = getTodayDateString();

    if (p === 'harian') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (p === 'mingguan') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
      setEndDate(todayStr);
    } else if (p === 'bulanan') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setStartDate(`${year}-${month}-01`);
      setEndDate(todayStr);
    }
  };

  // Filtered dataset within start and end date
  const filteredPemasukan = useMemo(() => {
    return pemasukan.filter(p => p.tanggal >= startDate && p.tanggal <= endDate);
  }, [pemasukan, startDate, endDate]);

  const filteredPengeluaran = useMemo(() => {
    return pengeluaran.filter(p => p.tanggal >= startDate && p.tanggal <= endDate);
  }, [pengeluaran, startDate, endDate]);

  // Exact PRD 3.5.1 Laba Rugi Breakdown
  const financialReport = useMemo(() => {
    // 1. PENDAPATAN
    const penjualanKasir = filteredPemasukan
      .filter(p => p.kategori_nama.toLowerCase().includes('kasir') || p.transaksi_id)
      .reduce((s, p) => s + p.jumlah, 0);

    const penjualanOnline = filteredPemasukan
      .filter(
        p =>
          p.kategori_nama.toLowerCase().includes('online') ||
          p.deskripsi.toLowerCase().includes('online')
      )
      .reduce((s, p) => s + p.jumlah, 0);

    const pendapatanLain = filteredPemasukan
      .filter(
        p =>
          !p.kategori_nama.toLowerCase().includes('kasir') &&
          !p.transaksi_id &&
          !p.kategori_nama.toLowerCase().includes('online') &&
          !p.deskripsi.toLowerCase().includes('online')
      )
      .reduce((s, p) => s + p.jumlah, 0);

    const totalPendapatan = penjualanKasir + penjualanOnline + pendapatanLain;

    // 2. HPP REAL Poody (hitung per cup dari transaksi: M 5.1k / L 6.1k + topping)
    const filteredTransaksi = transaksi.filter(trx => {
      const d = trx.tanggal.slice(0, 10);
      return d >= startDate && d <= endDate;
    });
    const hppBahanBaku = filteredTransaksi.reduce(
      (sum, trx) => sum + trx.items.reduce((s, it) => s + hppForItem(it as any) * it.qty, 0),
      0
    );

    const totalHPP = hppBahanBaku;

    // 3. LABA KOTOR
    const labaKotor = totalPendapatan - totalHPP;

    // 4. BEBAN OPERASIONAL
    const bebanGaji = filteredPengeluaran
      .filter(p => p.kategori_nama.toLowerCase().includes('gaji'))
      .reduce((s, p) => s + p.jumlah, 0);

    const bebanSewa = filteredPengeluaran
      .filter(p => p.kategori_nama.toLowerCase().includes('sewa'))
      .reduce((s, p) => s + p.jumlah, 0);

    const bebanListrikAir = filteredPengeluaran
      .filter(p => p.kategori_nama.toLowerCase().includes('listrik'))
      .reduce((s, p) => s + p.jumlah, 0);

    const bebanPemasaran = filteredPengeluaran
      .filter(p => p.kategori_nama.toLowerCase().includes('pemasaran'))
      .reduce((s, p) => s + p.jumlah, 0);

    const bebanLainnya = filteredPengeluaran
      .filter(
        p =>
          !p.kategori_nama.toLowerCase().includes('bahan baku') &&
          !p.kategori_nama.toLowerCase().includes('gaji') &&
          !p.kategori_nama.toLowerCase().includes('sewa') &&
          !p.kategori_nama.toLowerCase().includes('listrik') &&
          !p.kategori_nama.toLowerCase().includes('pemasaran')
      )
      .reduce((s, p) => s + p.jumlah, 0);

    const totalBebanOperasional =
      bebanGaji + bebanSewa + bebanListrikAir + bebanPemasaran + bebanLainnya;

    // 5. LABA BERSIH
    const labaBersih = labaKotor - totalBebanOperasional;

    // 6. ANALISIS MARGIN
    const grossProfitMargin = totalPendapatan > 0 ? (labaKotor / totalPendapatan) * 100 : 0;
    const netProfitMargin = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;

    return {
      penjualanKasir,
      penjualanOnline,
      pendapatanLain,
      totalPendapatan,
      hppBahanBaku,
      totalHPP,
      labaKotor,
      bebanGaji,
      bebanSewa,
      bebanListrikAir,
      bebanPemasaran,
      bebanLainnya,
      totalBebanOperasional,
      labaBersih,
      grossProfitMargin: Math.round(grossProfitMargin * 10) / 10,
      netProfitMargin: Math.round(netProfitMargin * 10) / 10,
    };
  }, [filteredPemasukan, filteredPengeluaran, transaksi, startDate, endDate]);

  // Comparison Bar Chart data
  const comparisonChartData = [
    {
      name: 'Total Pendapatan',
      Nominal: financialReport.totalPendapatan,
      fill: '#10b981',
    },
    {
      name: 'Total HPP',
      Nominal: financialReport.totalHPP,
      fill: '#f59e0b',
    },
    {
      name: 'Laba Kotor',
      Nominal: Math.max(0, financialReport.labaKotor),
      fill: '#0d9488',
    },
    {
      name: 'Beban Operasional',
      Nominal: financialReport.totalBebanOperasional,
      fill: '#ef4444',
    },
    {
      name: 'Laba Bersih',
      Nominal: Math.max(0, financialReport.labaBersih),
      fill: '#6366f1',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      { Pos: '1. PENDAPATAN', Keterangan: '', Jumlah: '' },
      { Pos: '   Penjualan Kasir POS', Keterangan: 'Otomatis', Jumlah: financialReport.penjualanKasir },
      { Pos: '   Penjualan Online', Keterangan: 'Manual/Grab/GoFood', Jumlah: financialReport.penjualanOnline },
      { Pos: '   Pendapatan Lain-lain', Keterangan: 'Lainnya', Jumlah: financialReport.pendapatanLain },
      { Pos: '   TOTAL PENDAPATAN', Keterangan: 'A', Jumlah: financialReport.totalPendapatan },
      { Pos: '2. HARGA POKOK PENJUALAN (HPP)', Keterangan: '', Jumlah: '' },
      { Pos: '   HPP Real Poody (per cup)', Keterangan: 'M5.1k/L6.1k+topping', Jumlah: financialReport.hppBahanBaku },
      { Pos: '   TOTAL HPP', Keterangan: 'B', Jumlah: financialReport.totalHPP },
      { Pos: '3. LABA KOTOR', Keterangan: 'A - B', Jumlah: financialReport.labaKotor },
      { Pos: '4. BEBAN OPERASIONAL', Keterangan: '', Jumlah: '' },
      { Pos: '   Gaji Karyawan', Keterangan: 'SDM', Jumlah: financialReport.bebanGaji },
      { Pos: '   Sewa Tempat', Keterangan: 'Sewa', Jumlah: financialReport.bebanSewa },
      { Pos: '   Listrik, Air & Internet', Keterangan: 'Utilitas', Jumlah: financialReport.bebanListrikAir },
      { Pos: '   Pemasaran & Iklan', Keterangan: 'Marketing', Jumlah: financialReport.bebanPemasaran },
      { Pos: '   Operasional Lainnya', Keterangan: 'Lain-lain', Jumlah: financialReport.bebanLainnya },
      { Pos: '   TOTAL BEBAN OPERASIONAL', Keterangan: 'C', Jumlah: financialReport.totalBebanOperasional },
      { Pos: '5. LABA BERSIH (NET PROFIT)', Keterangan: 'Laba Kotor - C', Jumlah: financialReport.labaBersih },
      { Pos: '6. MARGIN ANALISIS', Keterangan: 'Gross Margin', Jumlah: `${financialReport.grossProfitMargin}%` },
      { Pos: '   Net Profit Margin', Keterangan: 'Net Margin', Jumlah: `${financialReport.netProfitMargin}%` },
    ];
    exportToCSV(`Laporan_Laba_Rugi_${startDate}_sd_${endDate}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Laporan Keuangan Laba Rugi</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pendapatan, HPP, beban operasional & laba bersih
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Periode Tabs & Custom Date Pickers (PRD 3.5.1) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Period Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {(['harian', 'mingguan', 'bulanan', 'custom'] as const).map(p => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                period === p ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <input
            type="date"
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
              setPeriod('custom');
            }}
            className="flex-1 sm:flex-initial px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-slate-400 text-xs px-0.5">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
              setPeriod('custom');
            }}
            className="flex-1 sm:flex-initial px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-4">
        <div className="bg-white p-3 sm:p-3.5 md:p-3 lg:p-4 rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between min-w-0">
          <div>
            <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Pendapatan
            </span>
            <div className="text-xs sm:text-sm md:text-[13px] lg:text-base xl:text-lg font-bold font-mono text-slate-900 mt-1 whitespace-nowrap tabular-nums tracking-tighter sm:tracking-tight md:tracking-tighter lg:tracking-tight truncate">
              {formatRupiah(financialReport.totalPendapatan)}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] text-emerald-600 font-semibold mt-1 block truncate">
            Omzet Usaha
          </span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 md:p-3 lg:p-4 rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between min-w-0">
          <div>
            <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Laba Kotor (Gross)
            </span>
            <div className="text-xs sm:text-sm md:text-[13px] lg:text-base xl:text-lg font-bold font-mono text-teal-700 mt-1 whitespace-nowrap tabular-nums tracking-tighter sm:tracking-tight md:tracking-tighter lg:tracking-tight truncate">
              {formatRupiah(financialReport.labaKotor)}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] text-teal-600 font-semibold mt-1 block truncate">
            Margin: {financialReport.grossProfitMargin}%
          </span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 md:p-3 lg:p-4 rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between min-w-0">
          <div>
            <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Beban Usaha
            </span>
            <div className="text-xs sm:text-sm md:text-[13px] lg:text-base xl:text-lg font-bold font-mono text-red-600 mt-1 whitespace-nowrap tabular-nums tracking-tighter sm:tracking-tight md:tracking-tighter lg:tracking-tight truncate">
              {formatRupiah(financialReport.totalHPP + financialReport.totalBebanOperasional)}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] text-red-500 font-semibold mt-1 block truncate">
            HPP + Operasional
          </span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 md:p-3 lg:p-4 rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between min-w-0">
          <div>
            <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Laba Bersih (Net)
            </span>
            <div
              className={`text-xs sm:text-sm md:text-[13px] lg:text-base xl:text-lg font-bold font-mono mt-1 whitespace-nowrap tabular-nums tracking-tighter sm:tracking-tight md:tracking-tighter lg:tracking-tight truncate ${
                financialReport.labaBersih >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatRupiah(financialReport.labaBersih)}
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] text-emerald-600 font-semibold mt-1 block truncate">
            Net Margin: {financialReport.netProfitMargin}%
          </span>
        </div>
      </div>

      {/* Visual Chart & Structured Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Analisis Visual Arus Finansial</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Perbandingan komponen laba rugi pada periode yang dipilih
            </p>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tickFormatter={val => (val >= 1000000 ? `${val / 1000000} jt` : `${val / 1000} rb`)}
                    fontSize={10}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={10}
                    stroke="#64748b"
                    width={90}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatRupiah(val), 'Jumlah']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="Nominal" radius={[0, 6, 6, 0]}>
                    {comparisonChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 mt-4">
            <span className="font-bold block mb-0.5">Analisis Margin Laba:</span>
            <p className="text-[11px] leading-relaxed">
              Dari setiap Rp 100.000 omzet yang didapat, usaha Anda menghasilkan keuntungan bersih
              sebesar <strong>{formatRupiah(financialReport.netProfitMargin * 1000)}</strong> ({financialReport.netProfitMargin}%).
            </p>
          </div>
        </div>

        {/* Structured Laporan Laba Rugi Table (PRD 3.5.1 Exact Hierarchy) */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-200 pb-4 mb-4 text-center">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              {usaha.nama_usaha}
            </h3>
            <h4 className="text-xs sm:text-sm font-bold text-slate-700">LAPORAN LABA RUGI</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Periode: {formatDateIndo(startDate)} s/d {formatDateIndo(endDate)}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. PENDAPATAN */}
            <div>
              <div className="px-3 sm:px-4 pt-1 pb-1.5 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                1. PENDAPATAN
              </div>
              <div className="py-1 space-y-0.5">
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Penjualan Kasir (POS)
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.penjualanKasir)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Penjualan Online
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.penjualanOnline)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Pendapatan Lain-lain
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.pendapatanLain)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 my-1">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-800">
                  TOTAL PENDAPATAN
                </span>
                <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                  <span className="text-[11px] font-bold text-emerald-600/70">Rp</span>
                  <span className="w-24 sm:w-28 text-right font-black text-emerald-700">
                    {formatNumber(financialReport.totalPendapatan)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. HARGA POKOK PENJUALAN */}
            <div>
              <div className="px-3 sm:px-4 pt-1 pb-1.5 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                2. HARGA POKOK PENJUALAN (HPP)
              </div>
              <div className="py-1 space-y-0.5">
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    HPP Real Poody (M 5.1k / L 6.1k + topping)
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.hppBahanBaku)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 my-1">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-800">
                  TOTAL HPP
                </span>
                <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                  <span className="text-[11px] font-bold text-amber-600/70">Rp</span>
                  <span className="w-24 sm:w-28 text-right font-black text-amber-700">
                    {formatNumber(financialReport.totalHPP)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. LABA KOTOR */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200/90 text-teal-950 my-2">
              <span className="text-xs sm:text-sm tracking-tight font-bold text-teal-950">
                3. LABA KOTOR (GROSS PROFIT)
              </span>
              <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                <span className="text-[11px] font-bold text-teal-700/80">Rp</span>
                <span className="w-24 sm:w-28 text-right font-black text-teal-800">
                  {formatNumber(financialReport.labaKotor)}
                </span>
              </div>
            </div>

            {/* 4. BEBAN OPERASIONAL */}
            <div>
              <div className="px-3 sm:px-4 pt-1 pb-1.5 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                4. BEBAN OPERASIONAL
              </div>
              <div className="py-1 space-y-0.5">
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Gaji Karyawan
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.bebanGaji)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Sewa Tempat
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.bebanSewa)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Listrik, Air & Internet
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.bebanListrikAir)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Pemasaran & Iklan
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.bebanPemasaran)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 hover:bg-slate-50/60 rounded-lg transition-colors">
                  <span className="text-slate-600 text-xs pl-3 sm:pl-4 min-w-0 truncate">
                    Operasional Lainnya
                  </span>
                  <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                    <span className="text-[11px] font-medium text-slate-400">Rp</span>
                    <span className="w-24 sm:w-28 text-right font-medium text-slate-800">
                      {formatNumber(financialReport.bebanLainnya)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 my-1">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-800">
                  TOTAL BEBAN OPERASIONAL
                </span>
                <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                  <span className="text-[11px] font-bold text-red-500/80">Rp</span>
                  <span className="w-24 sm:w-28 text-right font-black text-red-600">
                    {formatNumber(financialReport.totalBebanOperasional)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. LABA BERSIH */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xs my-2">
              <span className="text-xs sm:text-sm tracking-tight font-bold text-white">
                5. LABA BERSIH (NET PROFIT)
              </span>
              <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums shrink-0 text-xs sm:text-sm">
                <span className="text-[11px] font-bold text-slate-400">Rp</span>
                <span
                  className={`w-24 sm:w-28 text-right font-black text-xs sm:text-base ${
                    financialReport.labaBersih >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatNumber(financialReport.labaBersih)}
                </span>
              </div>
            </div>

            {/* 6. ANALISIS MARGIN */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-4 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                  Gross Profit Margin
                </span>
                <span className="text-base font-bold text-teal-700">
                  {financialReport.grossProfitMargin}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                  Net Profit Margin
                </span>
                <span className="text-base font-bold text-emerald-700">
                  {financialReport.netProfitMargin}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
