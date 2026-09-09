import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  DollarSign,
  Download,
  History,
  Minus,
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BahanBaku } from '../../types';
import { exportToCSV, formatDateIndo, formatNumber, formatRupiah, getTodayDateString } from '../../utils/formatters';

export const StokModule: React.FC = () => {
  const {
    bahanBaku,
    riwayatStok,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    recordStokMasuk,
    recordStokKeluar,
    currentUser,
    canAccess,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'daftar' | 'riwayat'>('daftar');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'KRITIS' | 'AMAN'>('SEMUA');

  // Modals
  const [showAddBahanModal, setShowAddBahanModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBahan, setEditingBahan] = useState<BahanBaku | null>(null);
  const [editForm, setEditForm] = useState({ nama_bahan: '', kategori: '', satuan: 'kg', stok_minimum: 1, harga_terakhir: 0, supplier: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<BahanBaku | null>(null);
  const [stockModalType, setStockModalType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [selectedBahan, setSelectedBahan] = useState<BahanBaku | null>(null);

  // Stock Adjustment Form State
  const [stockAmount, setStockAmount] = useState<number>(1);
  const [stockKeterangan, setStockKeterangan] = useState('');
  const [stockHargaSatuan, setStockHargaSatuan] = useState<number>(0);
  const [autoRecordExpense, setAutoRecordExpense] = useState(true);

  // New Bahan Form State
  const [namaBahan, setNamaBahan] = useState('');
  const [kategoriBahan, setKategoriBahan] = useState('Bahan Utama');
  const [satuan, setSatuan] = useState('kg');
  const [stokAwal, setStokAwal] = useState<number>(10);
  const [stokMin, setStokMin] = useState<number>(5);
  const [hargaBeli, setHargaBeli] = useState<number>(25000);
  const [supplier, setSupplier] = useState('');

  // Total valuation of current raw materials stock
  const totalValuasiAset = useMemo(() => {
    return bahanBaku.reduce((sum, b) => sum + b.stok_saat_ini * b.harga_terakhir, 0);
  }, [bahanBaku]);

  // Filtered Bahan Baku
  const filteredBahan = useMemo(() => {
    return bahanBaku.filter(b => {
      const matchSearch =
        b.nama_bahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.supplier && b.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

      const isLow = b.stok_saat_ini <= b.stok_minimum;
      if (filterStatus === 'KRITIS' && !isLow) return false;
      if (filterStatus === 'AMAN' && isLow) return false;

      return matchSearch;
    });
  }, [bahanBaku, searchQuery, filterStatus]);

  const handleOpenStockModal = (b: BahanBaku, type: 'MASUK' | 'KELUAR') => {
    setSelectedBahan(b);
    setStockModalType(type);
    setStockAmount(type === 'MASUK' ? 5 : 1);
    setStockKeterangan(type === 'MASUK' ? `Restock ${b.nama_bahan}` : `Pemakaian harian operasional`);
    setStockHargaSatuan(b.harga_terakhir);
    setAutoRecordExpense(true);
    setShowStockModal(true);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBahan || stockAmount <= 0) return;

    if (stockModalType === 'MASUK') {
      recordStokMasuk(
        selectedBahan.id,
        stockAmount,
        stockHargaSatuan,
        stockKeterangan,
        autoRecordExpense,
        selectedBahan.supplier
      );
    } else {
      recordStokKeluar(selectedBahan.id, stockAmount, stockKeterangan);
    }
    setShowStockModal(false);
  };

  const handleAddBahanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBahan.trim()) return;

    addBahanBaku({
      nama_bahan: namaBahan,
      kategori: kategoriBahan,
      satuan,
      stok_saat_ini: Number(stokAwal),
      stok_minimum: Number(stokMin),
      harga_terakhir: Number(hargaBeli),
      supplier: supplier.trim() || undefined,
    });
    setShowAddBahanModal(false);
  };

  const openEditModal = (b: BahanBaku) => {
    setEditingBahan(b);
    setEditForm({ nama_bahan: b.nama_bahan, kategori: b.kategori, satuan: b.satuan, stok_minimum: b.stok_minimum, harga_terakhir: b.harga_terakhir, supplier: b.supplier || '' });
    setShowEditModal(true);
  };
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBahan || !editForm.nama_bahan.trim()) return;
    updateBahanBaku(editingBahan.id, { nama_bahan: editForm.nama_bahan.trim(), kategori: editForm.kategori.trim() || 'Bahan Utama', satuan: editForm.satuan, stok_minimum: Number(editForm.stok_minimum), harga_terakhir: Number(editForm.harga_terakhir), supplier: editForm.supplier.trim() || undefined });
    setShowEditModal(false);
    setEditingBahan(null);
  };
  const handleDeleteBahan = () => {
    if (!deleteConfirm) return;
    deleteBahanBaku(deleteConfirm.id);
    setDeleteConfirm(null);
  };
  const handleExportCSV = () => {
    if (activeTab === 'daftar') {
      const rows = bahanBaku.map(b => ({
        'Nama Bahan': b.nama_bahan,
        Kategori: b.kategori,
        Satuan: b.satuan,
        'Stok Saat Ini': b.stok_saat_ini,
        'Stok Minimum': b.stok_minimum,
        'Status Stok': b.stok_saat_ini <= b.stok_minimum ? 'Kritis / Menipis' : 'Aman',
        'Harga Beli Terakhir': b.harga_terakhir,
        'Valuasi Stok': b.stok_saat_ini * b.harga_terakhir,
        Supplier: b.supplier || '-',
      }));
      exportToCSV(`Stok_Bahan_Baku_${new Date().toISOString().slice(0, 10)}`, rows);
    } else {
      const rows = riwayatStok.map(l => ({
        Waktu: formatDateIndo(l.tanggal, true),
        'Nama Bahan': l.bahan_nama,
        Tipe: l.tipe,
        Jumlah: `${l.jumlah} ${l.satuan}`,
        'Harga Satuan': l.harga_satuan || 0,
        'Total Biaya': l.total_harga || 0,
        Keterangan: l.keterangan,
        User: l.user_nama,
      }));
      exportToCSV(`Riwayat_Pergerakan_Stok_${new Date().toISOString().slice(0, 10)}`, rows);
    }
  };

  const canEdit = canAccess('stok');
  const canManageBahan = currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER';

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Manajemen Stok Bahan Baku</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau persediaan bahan & kontrol batas minimum
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Nilai Aset Stok
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-slate-900">
              {formatRupiah(totalValuasiAset)}
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
              onClick={() => setShowAddBahanModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Bahan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'daftar'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Katalog ({bahanBaku.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'riwayat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Log ({riwayatStok.length})</span>
          </button>
        </div>

        {activeTab === 'daftar' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bahan / supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="SEMUA">Semua</option>
              <option value="KRITIS">⚠️ Kritis</option>
              <option value="AMAN">✅ Aman</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Daftar Bahan Baku */}
      {activeTab === 'daftar' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mobile Card View (visible on mobile) */}
          <div className="md:hidden divide-y divide-slate-100 p-2">
            {filteredBahan.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada data bahan baku yang sesuai
              </div>
            ) : (
              filteredBahan.map(b => {
                const isLow = b.stok_saat_ini <= b.stok_minimum;
                const valuasi = b.stok_saat_ini * b.harga_terakhir;
                return (
                  <div key={b.id} className="p-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{b.nama_bahan}</div>
                        <div className="text-[11px] text-slate-400">{b.kategori} • Supplier: {b.supplier || '-'}</div>
                      </div>
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Kritis</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aman</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Stok Saat Ini</span>
                        <span className={`font-black font-mono text-sm ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                          {formatNumber(b.stok_saat_ini)} {b.satuan}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Min: {b.stok_minimum} {b.satuan}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Valuasi Stok</span>
                        <span className="font-bold font-mono text-slate-800 text-xs block">
                          {formatRupiah(valuasi)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">@{formatRupiah(b.harga_terakhir)}/{b.satuan}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenStockModal(b, 'MASUK')}
                        className="flex-1 min-w-[92px] py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Masuk</span>
                      </button>
                      <button
                        onClick={() => handleOpenStockModal(b, 'KELUAR')}
                        className="flex-1 min-w-[92px] py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Pakai</span>
                      </button>
                      {canManageBahan && (
                        <>
                          <button onClick={() => openEditModal(b)} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />Edit</button>
                          <button onClick={() => setDeleteConfirm(b)} className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Hapus</button>
                        </>
                      )}
                    </div>
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
                  <th className="py-3 px-4">Nama Bahan Baku</th>
                  <th className="py-3 px-4">Stok Saat Ini</th>
                  <th className="py-3 px-4">Batas Min.</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Harga Terakhir</th>
                  <th className="py-3 px-4">Nilai Valuasi</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBahan.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      Tidak ada data bahan baku yang sesuai
                    </td>
                  </tr>
                ) : (
                  filteredBahan.map(b => {
                    const isLow = b.stok_saat_ini <= b.stok_minimum;
                    const valuasi = b.stok_saat_ini * b.harga_terakhir;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {b.nama_bahan}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {b.kategori}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-sm">
                          <span className={isLow ? 'text-red-600' : 'text-slate-800'}>
                            {formatNumber(b.stok_saat_ini)} {b.satuan}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {b.stok_minimum} {b.satuan}
                        </td>
                        <td className="py-3 px-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Menipis</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aman</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatRupiah(b.harga_terakhir)}/{b.satuan}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {formatRupiah(valuasi)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {b.supplier || '-'}
                        </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => handleOpenStockModal(b, 'MASUK')} className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-0.5" title="Stok Masuk"><Plus className="w-3 h-3" />Masuk</button>
                              <button onClick={() => handleOpenStockModal(b, 'KELUAR')} className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-0.5" title="Pakai"><Minus className="w-3 h-3" />Pakai</button>
                              {canManageBahan && (<>
                                <button onClick={() => openEditModal(b)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeleteConfirm(b)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                              </>)}
                            </div>
                          </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Riwayat Pergerakan Stok (Log) */}
      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mobile Card View (visible on mobile) */}
          <div className="md:hidden divide-y divide-slate-100 p-2">
            {riwayatStok.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada riwayat pergerakan stok
              </div>
            ) : (
              riwayatStok.map(l => (
                <div key={l.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.tipe === 'MASUK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {l.tipe === 'MASUK' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span>{l.tipe}</span>
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{l.bahan_nama}</span>
                    </div>

                    <span className={`font-black font-mono text-xs ${l.tipe === 'MASUK' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {l.tipe === 'MASUK' ? '+' : '-'}{l.jumlah} {l.satuan}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{l.keterangan}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{formatDateIndo(l.tanggal, true)}</span>
                    <div className="flex items-center gap-2">
                      {l.total_harga && l.total_harga > 0 && (
                        <span className="font-semibold text-slate-700">{formatRupiah(l.total_harga)}</span>
                      )}
                      <span>• {l.user_nama}</span>
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
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Bahan Baku</th>
                  <th className="py-3 px-4">Aktivitas</th>
                  <th className="py-3 px-4">Jumlah Perubahan</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Biaya Tercatat</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riwayatStok.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      Belum ada riwayat pergerakan stok bahan baku
                    </td>
                  </tr>
                ) : (
                  riwayatStok.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDateIndo(l.tanggal, true)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{l.bahan_nama}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.tipe === 'MASUK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {l.tipe === 'MASUK' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>Stok {l.tipe}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={l.tipe === 'MASUK' ? 'text-emerald-700' : 'text-red-600'}>
                          {l.tipe === 'MASUK' ? '+' : '-'}
                          {l.jumlah} {l.satuan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{l.keterangan}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {l.total_harga && l.total_harga > 0 ? formatRupiah(l.total_harga) : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{l.user_nama}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Sesuaikan Stok (Masuk / Keluar) */}
      {showStockModal && selectedBahan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {stockModalType === 'MASUK' ? 'Input Stok Masuk (Restock)' : 'Input Stok Keluar (Pemakaian)'}
                </h3>
                <p className="text-xs text-slate-400">{selectedBahan.nama_bahan}</p>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Stok Saat Ini:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedBahan.stok_saat_ini} {selectedBahan.satuan}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Jumlah {stockModalType === 'MASUK' ? 'Masuk' : 'Keluar'} ({selectedBahan.satuan}) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={stockAmount}
                  onChange={e => setStockAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {stockModalType === 'MASUK' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Harga Beli / Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stockHargaSatuan}
                    onChange={e => setStockHargaSatuan(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                    <span>Total Biaya Pembelian:</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(stockAmount * stockHargaSatuan)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="chk-auto-pengeluaran"
                      checked={autoRecordExpense}
                      onChange={e => setAutoRecordExpense(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="chk-auto-pengeluaran" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Otomatis catat biaya ini ke Pencatatan Pengeluaran
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan *</label>
                <input
                  type="text"
                  required
                  value={stockKeterangan}
                  onChange={e => setStockKeterangan(e.target.value)}
                  placeholder="Contoh: Belanja dari Toko Jaya / Pemakaian shift pagi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold ${
                    stockModalType === 'MASUK'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Bahan Baku */}
      {showEditModal && editingBahan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Edit Bahan Baku</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div><label className="font-bold text-slate-700 block mb-1">Nama Bahan Baku *</label><input type="text" required value={editForm.nama_bahan} onChange={e=>setEditForm(s=>({...s,nama_bahan:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="font-bold text-slate-700 block mb-1">Kategori</label><input type="text" value={editForm.kategori} onChange={e=>setEditForm(s=>({...s,kategori:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div><div><label className="font-bold text-slate-700 block mb-1">Satuan</label><select value={editForm.satuan} onChange={e=>setEditForm(s=>({...s,satuan:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"><option value="kg">kg</option><option value="gram">gram</option><option value="liter">liter</option><option value="ml">ml</option><option value="pcs">pcs</option><option value="pack">pack</option><option value="cup">cup</option></select></div></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="font-bold text-slate-700 block mb-1">Batas Minimum *</label><input type="number" min="0" step="any" required value={editForm.stok_minimum} onChange={e=>setEditForm(s=>({...s,stok_minimum:Number(e.target.value)}))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div><div><label className="font-bold text-slate-700 block mb-1">Harga / Satuan (Rp)</label><input type="number" min="0" step="any" value={editForm.harga_terakhir} onChange={e=>setEditForm(s=>({...s,harga_terakhir:Number(e.target.value)}))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div></div>
              <div><label className="font-bold text-slate-700 block mb-1">Supplier</label><input type="text" value={editForm.supplier} onChange={e=>setEditForm(s=>({...s,supplier:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100"><button type="button" onClick={()=>setShowEditModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold">Batal</button><button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Simpan Perubahan</button></div>
            </form>
          </div>
        </div>
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-600" /> Hapus Bahan Baku?</h3>
            <p className="text-xs text-slate-600">Yakin hapus <b>{deleteConfirm.nama_bahan}</b> ({deleteConfirm.satuan})? Riwayat stok tetap tersimpan, tapi bahan hilang dari katalog. Tidak bisa di-undo.</p>
            <div className="flex justify-end gap-2 pt-2"><button onClick={()=>setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold">Batal</button><button onClick={handleDeleteBahan} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold">Hapus</button></div>
          </div>
        </div>
      )}
      {/* MODAL: Tambah Bahan Baku Baru */}
      {showAddBahanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Tambah Bahan Baku Baru</h3>
              <button
                onClick={() => setShowAddBahanModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBahanSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  required
                  value={namaBahan}
                  onChange={e => setNamaBahan(e.target.value)}
                  placeholder="Contoh: Susu Segar Full Cream"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Bahan</label>
                  <input
                    type="text"
                    value={kategoriBahan}
                    onChange={e => setKategoriBahan(e.target.value)}
                    placeholder="Bahan Utama / Kemasan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan *</label>
                  <select
                    value={satuan}
                    onChange={e => setSatuan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="gram">gram</option>
                    <option value="liter">liter</option>
                    <option value="ml">ml (Mililiter)</option>
                    <option value="pcs">pcs / butir</option>
                    <option value="pack">pack / dus</option>
                    <option value="cup">cup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Batas Stok Minimum *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={stokMin}
                    onChange={e => setStokMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stokAwal}
                    onChange={e => setStokAwal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Beli / Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={hargaBeli}
                    onChange={e => setHargaBeli(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Supplier / Toko</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="Contoh: Toko Bahan Jaya"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBahanModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Bahan Baku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
