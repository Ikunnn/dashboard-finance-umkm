import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Boxes,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Paperclip,
  PieChart as PieIcon,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';
import { Pengeluaran } from '../../types';
import { exportToCSV, formatDateIndo, formatRupiah, getTodayDateString } from '../../utils/formatters';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

export const PengeluaranModule: React.FC = () => {
  const {
    pengeluaran,
    addPengeluaran,
    deletePengeluaran,
    kategori,
    bahanBaku,
    updateBahanBakuStock,
    currentUser,
    canAccess,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [selectedDate, setSelectedDate] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [tanggal, setTanggal] = useState(getTodayDateString());
  const [kategoriId, setKategoriId] = useState('kat-ex-1'); // default Bahan Baku
  const [jumlah, setJumlah] = useState<number>(50000);
  const [deskripsi, setDeskripsi] = useState('');
  const [buktiUrl, setBuktiUrl] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState('TUNAI');

  // Option: direct restock sync
  const [isSyncRestock, setIsSyncRestock] = useState(false);
  const [selectedBahanId, setSelectedBahanId] = useState('');
  const [restockQty, setRestockQty] = useState<number>(1);

  const kategoriPengeluaran = useMemo(() => {
    return kategori.filter(k => k.tipe === 'PENGELUARAN');
  }, [kategori]);

  const filtered = useMemo(() => {
    return pengeluaran.filter(p => {
      const matchSearch =
        p.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kategori_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user_nama.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedKategori === 'Semua' || p.kategori_nama === selectedKategori;
      const matchDate = !selectedDate || p.tanggal === selectedDate;

      return matchSearch && matchCat && matchDate;
    });
  }, [pengeluaran, searchQuery, selectedKategori, selectedDate]);

  const totalPengeluaranFiltered = useMemo(() => {
    return filtered.reduce((sum, p) => sum + p.jumlah, 0);
  }, [filtered]);

  // Breakdown by Category for small pie chart
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(p => {
      map[p.kategori_nama] = (map[p.kategori_nama] || 0) + p.jumlah;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const handleOpenAdd = () => {
    setTanggal(getTodayDateString());
    setKategoriId('kat-ex-1');
    setJumlah(75000);
    setDeskripsi('');
    setBuktiUrl('');
    setMetodePembayaran('TUNAI');
    setIsSyncRestock(false);
    setSelectedBahanId(bahanBaku[0]?.id || '');
    setRestockQty(1);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumlah || jumlah <= 0) return;

    const katObj = kategoriPengeluaran.find(k => k.id === kategoriId);

    // If sync restock enabled, update stock too
    if (isSyncRestock && selectedBahanId) {
      const bItem = bahanBaku.find(b => b.id === selectedBahanId);
      if (bItem && restockQty > 0) {
        updateBahanBakuStock(
          selectedBahanId,
          restockQty,
          'MASUK',
          `Restock via Pengeluaran: ${deskripsi || katObj?.nama || 'Pembelian'}`,
          Number(jumlah)
        );
      }
    }

    addPengeluaran({
      tanggal,
      kategori_id: kategoriId,
      kategori_nama: katObj ? katObj.nama : 'Lain-lain',
      jumlah: Number(jumlah),
      deskripsi: deskripsi || 'Biaya operasional',
      bukti: buktiUrl.trim() || undefined,
      user_id: currentUser!.id,
      user_nama: currentUser!.nama,
      metode_pembayaran: metodePembayaran,
    });

    setShowModal(false);
  };

  const handleExportCSV = () => {
    const rows = filtered.map(p => ({
      Tanggal: formatDateIndo(p.tanggal),
      Kategori: p.kategori_nama,
      Jumlah: p.jumlah,
      Deskripsi: p.deskripsi,
      'Metode Bayar': p.metode_pembayaran || 'TUNAI',
      'Dicatat Oleh': p.user_nama,
    }));
    exportToCSV(`Pengeluaran_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const canEdit = canAccess('pengeluaran');

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Pencatatan Pengeluaran</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Catat operasional, gaji, bahan baku & belanja usaha
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Pengeluaran
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-red-600">
              {formatRupiah(totalPengeluaranFiltered)}
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Pengeluaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Breakdown Cards & Category Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Pie Chart */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <PieIcon className="w-3.5 h-3.5 text-red-500" />
              <span>Komposisi Beban Pengeluaran</span>
            </h4>
            <div className="h-44 w-full mt-2">
              {categoryBreakdown.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Tidak ada data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatRupiah(val), 'Jumlah']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-1 text-[11px] pt-2 border-t border-slate-100">
            {categoryBreakdown.slice(0, 4).map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className="font-semibold">{formatRupiah(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Table Container (Span 2) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari deskripsi / kategori..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <select
              value={selectedKategori}
              onChange={e => setSelectedKategori(e.target.value)}
              className="px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="Semua">Semua Kategori</option>
              {kategoriPengeluaran.map(k => (
                <option key={k.id} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Records List Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Mobile Card View (visible on mobile) */}
            <div className="md:hidden divide-y divide-slate-100 p-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada pengeluaran yang sesuai kriteria
                </div>
              ) : (
                filtered.map(item => (
                  <div key={item.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {formatDateIndo(item.tanggal)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          {item.kategori_nama}
                        </span>
                      </div>
                      <span className="font-black font-mono text-red-600 text-sm">
                        -{formatRupiah(item.jumlah)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-800">{item.deskripsi}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-600">
                          {item.metode_pembayaran || 'TUNAI'}
                        </span>
                        <span>•</span>
                        <span>Oleh: {item.user_nama}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.bukti && (
                          <a
                            href={item.bukti}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
                          >
                            <Paperclip className="w-3 h-3" /> Nota
                          </a>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => deletePengeluaran(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">Tanggal</th>
                    <th className="py-2.5 px-3.5">Kategori</th>
                    <th className="py-2.5 px-3.5">Keterangan</th>
                    <th className="py-2.5 px-3.5">Metode</th>
                    <th className="py-2.5 px-3.5 text-right">Jumlah</th>
                    {canEdit && <th className="py-2.5 px-3.5 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                        Tidak ada pengeluaran yang sesuai kriteria
                      </td>
                    </tr>
                  ) : (
                    filtered.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-semibold text-slate-700">
                          {formatDateIndo(item.tanggal)}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            {item.kategori_nama}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-800 font-medium">
                          {item.deskripsi}
                          {item.bukti && (
                            <a
                              href={item.bukti}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline ml-2"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>Nota</span>
                            </a>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {item.metode_pembayaran || 'TUNAI'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-black font-mono text-red-600 text-sm">
                          -{formatRupiah(item.jumlah)}
                        </td>
                        {canEdit && (
                          <td className="py-2.5 px-3.5 text-center">
                            <button
                              onClick={() => deletePengeluaran(item.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Catat Pengeluaran Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Catat Pengeluaran Baru</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="font-bold text-slate-700 block mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div className="min-w-0">
                  <label className="font-bold text-slate-700 block mb-1">Kategori *</label>
                  <select
                    value={kategoriId}
                    onChange={e => setKategoriId(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {kategoriPengeluaran.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jumlah Biaya (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={jumlah}
                  onChange={e => setJumlah(Number(e.target.value))}
                  placeholder="Contoh: 75000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Metode Pembayaran</label>
                <select
                  value={metodePembayaran}
                  onChange={e => setMetodePembayaran(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="TUNAI">Kas Tunai</option>
                  <option value="TRANSFER">Transfer Bank / Rekening Usaha</option>
                  <option value="EWALLET">E-Wallet Usaha</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Deskripsi *</label>
                <textarea
                  required
                  rows={2}
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Belanja gula pasir 10 kg di Pasar Segar"
                  className="w-full min-w-0 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Interkoneksi Restock Bahan Baku (PRD 3.6.4) */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-sync-stock"
                    checked={isSyncRestock}
                    onChange={e => setIsSyncRestock(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="chk-sync-stock"
                    className="text-xs font-bold text-amber-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Sinkronisasi Otomatis ke Stok Bahan Baku</span>
                  </label>
                </div>

                {isSyncRestock && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">
                        Pilih Bahan Baku:
                      </label>
                      <select
                        value={selectedBahanId}
                        onChange={e => setSelectedBahanId(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold focus:outline-none"
                      >
                        {bahanBaku.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.nama_bahan} ({b.satuan})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">
                        Jumlah Masuk:
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={restockQty}
                        onChange={e => setRestockQty(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Foto Nota / Struk Bukti (URL Opsional)
                </label>
                <input
                  type="url"
                  value={buktiUrl}
                  onChange={e => setBuktiUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full min-w-0 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
