import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Download,
  Eye,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Transaksi } from '../../types';
import { exportToCSV, formatDateIndo, formatRupiah } from '../../utils/formatters';

export const RiwayatKasirModule: React.FC<{ onSelectReceipt: (trx: Transaksi) => void }> = ({
  onSelectReceipt,
}) => {
  const { transaksi, setActiveTab, deleteTransaksi, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('SEMUA');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [expandedTrxId, setExpandedTrxId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Transaksi | null>(null);

  const canDelete = currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER';

  // Filtered Transaksi
  const filtered = useMemo(() => {
    return transaksi.filter(t => {
      const matchSearch =
        t.nomor_transaksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kasir_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.catatan && t.catatan.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMethod = selectedMethod === 'SEMUA' || t.metode_pembayaran === selectedMethod;
      const matchDate = !selectedDate || t.tanggal.startsWith(selectedDate);

      return matchSearch && matchMethod && matchDate;
    });
  }, [transaksi, searchQuery, selectedMethod, selectedDate]);

  // Statistics
  const totalOmzet = useMemo(() => {
    return filtered.reduce((sum, t) => sum + t.total_bayar, 0);
  }, [filtered]);

  const handleExportCSV = () => {
    const rows = filtered.map(t => ({
      'No Transaksi': t.nomor_transaksi,
      Tanggal: formatDateIndo(t.tanggal, true),
      Kasir: t.kasir_nama,
      Metode: t.metode_pembayaran,
      Subtotal: t.total_sebelum_diskon,
      Diskon: t.diskon_total,
      'Total Bayar': t.total_bayar,
      Catatan: t.catatan || '',
      'Rincian Item': t.items.map(i => `${i.qty}x ${i.nama_produk}`).join('; '),
    }));
    exportToCSV(`Riwayat_Transaksi_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteTransaksi(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5">
      {/* Header & Stats Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Riwayat Transaksi Kasir</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar penjualan kasir POS yang telah selesai — geser/hapus jika salah input
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Penjualan
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
              {formatRupiah(totalOmzet)}
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('kasir')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kasir Baru</span>
          </button>
        </div>
      </div>
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. transaksi / kasir / catatan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        {/* Payment Method Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Metode:</span>
          <select
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="SEMUA">Semua Metode</option>
            <option value="TUNAI">Tunai</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer Bank</option>
            <option value="EWALLET">E-Wallet</option>
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
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      {/* Transactions Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Card View (visible on mobile) */}
        <div className="md:hidden divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada riwayat transaksi yang cocok dengan filter
            </div>
          ) : (
            filtered.map(trx => {
              const isExpanded = expandedTrxId === trx.id;
              const totalItemsCount = trx.items.reduce((s, i) => s + i.qty, 0);

              return (
                <div key={trx.id} className="p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs font-mono">{trx.nomor_transaksi}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateIndo(trx.tanggal, true)} • Kasir: {trx.kasir_nama}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        trx.metode_pembayaran === 'QRIS'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : trx.metode_pembayaran === 'TUNAI'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : trx.metode_pembayaran === 'TRANSFER'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {trx.metode_pembayaran}
                    </span>
                  </div>

                  {trx.catatan && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg italic">
                      "{trx.catatan}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Bayar</span>
                      <span className="font-black text-slate-900 text-sm font-mono">
                        {formatRupiah(trx.total_bayar)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setExpandedTrxId(isExpanded ? null : trx.id)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {totalItemsCount} item {isExpanded ? '▲' : '▼'}
                      </button>
                      <button
                        onClick={() => onSelectReceipt(trx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDelete(trx)}
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Order Breakdown Mobile */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mt-2">
                      <h5 className="font-bold text-slate-700 pb-1 border-b border-slate-200 text-[11px]">
                        Rincian Item Transaksi:
                      </h5>
                      {trx.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-slate-700">
                            {item.qty}x {item.nama_produk}{' '}
                            <span className="text-slate-400">
                              (@ {formatRupiah(item.harga_satuan)})
                            </span>
                          </span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                        <span>Subtotal: {formatRupiah(trx.total_sebelum_diskon)}</span>
                        {trx.diskon_total > 0 && (
                          <span className="text-emerald-600 font-medium">
                            Diskon: -{formatRupiah(trx.diskon_total)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Bayar</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Tidak ada riwayat transaksi yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                filtered.map(trx => {
                  const isExpanded = expandedTrxId === trx.id;
                  return (
                    <React.Fragment key={trx.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {trx.nomor_transaksi}
                          {trx.catatan && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                              {trx.catatan}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {formatDateIndo(trx.tanggal, true)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {trx.kasir_nama}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              trx.metode_pembayaran === 'QRIS'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : trx.metode_pembayaran === 'TUNAI'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : trx.metode_pembayaran === 'TRANSFER'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {trx.metode_pembayaran}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setExpandedTrxId(isExpanded ? null : trx.id)}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline"
                          >
                            {trx.items.reduce((s, i) => s + i.qty, 0)} item {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                          {formatRupiah(trx.total_bayar)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onSelectReceipt(trx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                              title="Buka Struk"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Struk</span>
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => setConfirmDelete(trx)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                                title="Hapus transaksi (koreksi salah input)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="p-3 bg-white rounded-xl border border-slate-200 max-w-xl text-xs space-y-1.5">
                              <h5 className="font-bold text-slate-700 pb-1 border-b border-slate-100 text-[11px]">
                                Rincian Item Transaksi:
                              </h5>
                              {trx.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-[11px]">
                                  <span className="text-slate-700">
                                    {item.qty}x {item.nama_produk}{' '}
                                    <span className="text-slate-400">
                                      (@ {formatRupiah(item.harga_satuan)})
                                    </span>
                                  </span>
                                  <span className="font-semibold text-slate-900">
                                    {formatRupiah(item.subtotal)}
                                  </span>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
                                <span>Subtotal: {formatRupiah(trx.total_sebelum_diskon)}</span>
                                {trx.diskon_total > 0 && (
                                  <span className="text-emerald-600 font-medium">
                                    Diskon: -{formatRupiah(trx.diskon_total)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-slate-900">Hapus transaksi ini?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-mono font-bold text-slate-900">{confirmDelete.nomor_transaksi}</span> — {formatRupiah(confirmDelete.total_bayar)} akan dihapus permanen. Pemasukan otomatis terkait juga ikut terhapus.
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-2">
                  Untuk koreksi salah input kasir. Tidak bisa di-undo.
                </p>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
