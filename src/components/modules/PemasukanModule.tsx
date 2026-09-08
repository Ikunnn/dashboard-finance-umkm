import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  Calendar,
  Download,
  FileText,
  Filter,
  Paperclip,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Pemasukan } from '../../types';
import { exportToCSV, formatDateIndo, formatRupiah, getTodayDateString } from '../../utils/formatters';

export const PemasukanModule: React.FC = () => {
  const { pemasukan, addPemasukan, deletePemasukan, kategori, currentUser, canAccess } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [selectedDate, setSelectedDate] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [tanggal, setTanggal] = useState(getTodayDateString());
  const [kategoriId, setKategoriId] = useState('kat-in-2'); // default Penjualan Online
  const [jumlah, setJumlah] = useState<number>(100000);
  const [deskripsi, setDeskripsi] = useState('');
  const [buktiUrl, setBuktiUrl] = useState('');

  const kategoriPemasukan = useMemo(() => {
    return kategori.filter(k => k.tipe === 'PEMASUKAN');
  }, [kategori]);

  const filtered = useMemo(() => {
    return pemasukan.filter(p => {
      const matchSearch =
        p.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kategori_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user_nama.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedKategori === 'Semua' || p.kategori_nama === selectedKategori;
      const matchDate = !selectedDate || p.tanggal === selectedDate;

      return matchSearch && matchCat && matchDate;
    });
  }, [pemasukan, searchQuery, selectedKategori, selectedDate]);

  const totalPemasukanFiltered = useMemo(() => {
    return filtered.reduce((sum, p) => sum + p.jumlah, 0);
  }, [filtered]);

  const handleOpenAdd = () => {
    setTanggal(getTodayDateString());
    setKategoriId('kat-in-2');
    setJumlah(150000);
    setDeskripsi('');
    setBuktiUrl('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumlah || jumlah <= 0) return;

    const katObj = kategoriPemasukan.find(k => k.id === kategoriId);

    addPemasukan({
      tanggal,
      kategori_id: kategoriId,
      kategori_nama: katObj ? katObj.nama : 'Pemasukan Lain',
      jumlah: Number(jumlah),
      deskripsi: deskripsi || 'Pemasukan operasional usaha',
      bukti: buktiUrl.trim() || undefined,
      user_id: currentUser!.id,
      user_nama: currentUser!.nama,
    });

    setShowModal(false);
  };

  const handleExportCSV = () => {
    const rows = filtered.map(p => ({
      Tanggal: formatDateIndo(p.tanggal),
      Kategori: p.kategori_nama,
      Jumlah: p.jumlah,
      Deskripsi: p.deskripsi,
      'Dicatat Oleh': p.user_nama,
      Sumber: p.transaksi_id ? 'Otomatis Kasir' : 'Input Manual',
    }));
    exportToCSV(`Pemasukan_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const canEdit = canAccess('pemasukan');

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Pencatatan Pemasukan</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Catat semua pemasukan otomatis kasir & manual
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Pemasukan
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-700">
              {formatRupiah(totalPemasukanFiltered)}
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Pemasukan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari deskripsi / kategori / nama..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <select
            value={selectedKategori}
            onChange={e => setSelectedKategori(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Kategori</option>
            {kategoriPemasukan.map(k => (
              <option key={k.id} value={k.nama}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-400 hover:text-slate-600 underline shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Records Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Card View (visible on mobile) */}
        <div className="md:hidden divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada catatan pemasukan yang sesuai
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {formatDateIndo(item.tanggal)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.kategori_nama}
                    </span>
                  </div>
                  <span className="font-black font-mono text-emerald-700 text-sm">
                    +{formatRupiah(item.jumlah)}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-800">{item.deskripsi}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    {item.transaksi_id ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        <Receipt className="w-3 h-3" /> Kasir
                      </span>
                    ) : (
                      <span>Manual</span>
                    )}
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
                        <Paperclip className="w-3 h-3" /> Bukti
                      </a>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => deletePemasukan(item.id)}
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
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Deskripsi / Keterangan</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                <th className="py-3 px-4 text-right">Jumlah</th>
                {canEdit && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Tidak ada catatan pemasukan yang sesuai
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {formatDateIndo(item.tanggal)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.kategori_nama}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {item.deskripsi}
                      {item.bukti && (
                        <a
                          href={item.bukti}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline ml-2"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Bukti</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.transaksi_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          <Receipt className="w-3 h-3" />
                          <span>Dari Kasir</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Input Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{item.user_nama}</td>
                    <td className="py-3 px-4 text-right font-black font-mono text-emerald-700 text-sm">
                      +{formatRupiah(item.jumlah)}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deletePemasukan(item.id)}
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

      {/* MODAL: Tambah Pemasukan Manual */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Input Pemasukan Manual</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori *</label>
                  <select
                    value={kategoriId}
                    onChange={e => setKategoriId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {kategoriPemasukan.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jumlah Nominal (Rp) *</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={jumlah}
                  onChange={e => setJumlah(Number(e.target.value))}
                  placeholder="Contoh: 250000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi / Catatan *</label>
                <textarea
                  required
                  rows={2}
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Pesanan katering kantor / pelunasan piutang"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Bukti Nota / Transfer (URL Opsional)
                </label>
                <input
                  type="url"
                  value={buktiUrl}
                  onChange={e => setBuktiUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Pemasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
