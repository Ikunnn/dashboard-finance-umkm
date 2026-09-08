import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  Image,
  Layers,
  Link,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  UploadCloud,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Produk, ProdukVarian } from '../../types';
import { formatRupiah } from '../../utils/formatters';

const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format file harus berupa gambar (JPG, PNG, WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 640;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses file gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
};

export const ProdukModule: React.FC = () => {
  const { produk, addProduk, updateProduk, deleteProduk, canAccess, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingProduk, setEditingProduk] = useState<Produk | null>(null);

  // Form State
  const [namaProduk, setNamaProduk] = useState('');
  const [kategori, setKategori] = useState('Minuman');
  const [hargaJual, setHargaJual] = useState<number>(15000);
  const [hargaModal, setHargaModal] = useState<number>(7000);
  const [satuan, setSatuan] = useState('cup');
  const [gambar, setGambar] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Variant States
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProdukVarian[]>([
    { id: 'v-1', nama: 'Size M', harga_jual: 10000, harga_modal: 5000 },
    { id: 'v-2', nama: 'Size L', harga_jual: 12000, harga_modal: 6000 },
  ]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    produk.forEach(p => set.add(p.kategori));
    return ['Semua', ...Array.from(set)];
  }, [produk]);

  const filtered = useMemo(() => {
    return produk.filter(p => {
      const matchCat = selectedCategory === 'Semua' || p.kategori === selectedCategory;
      const matchSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [produk, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingProduk(null);
    setNamaProduk('');
    setKategori('Minuman');
    setHargaJual(15000);
    setHargaModal(6000);
    setSatuan('cup');
    setGambar('');
    setIsActive(true);
    setShowUrlInput(false);
    setIsDragging(false);
    setIsUploadingImage(false);
    setHasVariants(false);
    setVariantsList([
      { id: 'v-' + Date.now(), nama: 'Size M', harga_jual: 10000, harga_modal: 5000 },
      { id: 'v-' + (Date.now() + 1), nama: 'Size L', harga_jual: 12000, harga_modal: 6000 },
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (prod: Produk) => {
    setEditingProduk(prod);
    setNamaProduk(prod.nama_produk);
    setKategori(prod.kategori);
    setHargaJual(prod.harga_jual);
    setHargaModal(prod.harga_modal);
    setSatuan(prod.satuan);
    setGambar(prod.gambar || '');
    setIsActive(prod.is_active);
    setShowUrlInput(Boolean(prod.gambar && prod.gambar.startsWith('http')));
    setIsDragging(false);
    setIsUploadingImage(false);

    if (prod.varian && prod.varian.length > 0) {
      setHasVariants(true);
      setVariantsList(prod.varian.map(v => ({ ...v })));
    } else {
      setHasVariants(false);
      setVariantsList([
        { id: 'v-' + Date.now(), nama: 'Size M', harga_jual: prod.harga_jual, harga_modal: prod.harga_modal },
        { id: 'v-' + (Date.now() + 1), nama: 'Size L', harga_jual: prod.harga_jual + 2000, harga_modal: prod.harga_modal + 1000 },
      ]);
    }
    setShowModal(true);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const dataUrl = await processImageFile(file);
      setGambar(dataUrl);
      showToast('Foto produk berhasil diunggah!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengunggah foto', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddVariantRow = () => {
    setVariantsList(prev => [
      ...prev,
      {
        id: 'v-' + Date.now(),
        nama: `Size ${String.fromCharCode(65 + prev.length)}`,
        harga_jual: (prev[prev.length - 1]?.harga_jual || 10000) + 2000,
        harga_modal: (prev[prev.length - 1]?.harga_modal || 5000) + 1000,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, updates: Partial<ProdukVarian>) => {
    setVariantsList(prev => prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item)));
  };

  const handleRemoveVariant = (index: number) => {
    if (variantsList.length <= 1) return;
    setVariantsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProduk.trim()) return;

    const cleanVariants = hasVariants
      ? variantsList.filter(v => v.nama.trim() && v.harga_jual > 0)
      : undefined;

    const baseHargaJual = cleanVariants && cleanVariants.length > 0 ? cleanVariants[0].harga_jual : Number(hargaJual);
    const baseHargaModal = cleanVariants && cleanVariants.length > 0 ? (cleanVariants[0].harga_modal || 0) : Number(hargaModal);

    if (editingProduk) {
      updateProduk(editingProduk.id, {
        nama_produk: namaProduk,
        kategori,
        harga_jual: baseHargaJual,
        harga_modal: baseHargaModal,
        satuan,
        gambar: gambar.trim() || undefined,
        is_active: isActive,
        varian: cleanVariants && cleanVariants.length > 0 ? cleanVariants : undefined,
      });
    } else {
      addProduk({
        nama_produk: namaProduk,
        kategori,
        harga_jual: baseHargaJual,
        harga_modal: baseHargaModal,
        satuan,
        gambar: gambar.trim() || undefined,
        is_active: isActive,
        varian: cleanVariants && cleanVariants.length > 0 ? cleanVariants : undefined,
      });
    }
    setShowModal(false);
  };

  const isOwnerOrManager = canAccess('pengaturan') || canAccess('pemasukan');

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Manajemen Katalog Produk</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Menu, harga jual, estimasi HPP & status ketersediaan
          </p>
        </div>

        {isOwnerOrManager && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Produk</span>
          </button>
        )}
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {filtered.map(prod => {
          const hasVars = Boolean(prod.varian && prod.varian.length > 0);
          const minPrice = hasVars ? Math.min(...prod.varian!.map(v => v.harga_jual)) : prod.harga_jual;
          const maxPrice = hasVars ? Math.max(...prod.varian!.map(v => v.harga_jual)) : prod.harga_jual;
          const priceText = hasVars
            ? minPrice === maxPrice
              ? formatRupiah(minPrice)
              : `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`
            : formatRupiah(prod.harga_jual);

          const marginRp = prod.harga_jual - prod.harga_modal;
          const marginPct =
            prod.harga_jual > 0 ? Math.round((marginRp / prod.harga_jual) * 100) : 0;

          return (
            <div
              key={prod.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs flex flex-col justify-between ${
                prod.is_active ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                {/* Product Photo */}
                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center">
                  {prod.gambar ? (
                    <>
                      {/* Ambient soft background to fill container edges seamlessly */}
                      <img
                        src={prod.gambar}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none"
                      />
                      {/* Full unobstructed product image - terlihat semuanya */}
                      <img
                        src={prod.gambar}
                        alt={prod.nama_produk}
                        referrerPolicy="no-referrer"
                        className="relative z-1 max-w-full max-h-full w-auto h-auto object-contain p-1"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Image className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                  )}
                  <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-900/65 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-semibold pointer-events-none">
                    {prod.kategori}
                  </span>
                  {hasVars && (
                    <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-800/85 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold pointer-events-none">
                      {prod.varian!.length} Ukuran
                    </span>
                  )}
                  {!prod.is_active && (
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] sm:text-[10px] font-bold pointer-events-none">
                      Non-Aktif
                    </span>
                  )}
                </div>

                <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1" title={prod.nama_produk}>
                      {prod.nama_produk}
                    </h3>
                    {hasVars && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[8px] sm:text-[9px] border border-emerald-200">
                        Multi-Size
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5">
                      <span className="text-[10px] sm:text-xs text-slate-400">Harga Jual:</span>
                      <span className="font-bold text-emerald-700 text-xs sm:text-sm leading-tight">
                        {priceText}
                      </span>
                    </div>

                    {/* If variants exist, show list of sizes */}
                    {hasVars ? (
                      <div className="pt-1 border-t border-slate-100 space-y-1">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Ukuran & Harga:
                        </span>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {prod.varian!.map(v => (
                            <div
                              key={v.id}
                              className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] sm:text-[10px] flex items-center gap-1"
                            >
                              <span className="font-bold text-emerald-800">{v.nama}:</span>
                              <span className="font-mono text-slate-700">{formatRupiah(v.harga_jual)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-[11px] sm:text-xs">
                          <span className="text-slate-400">HPP:</span>
                          <span className="text-slate-600">{formatRupiah(prod.harga_modal)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 text-[11px] sm:text-xs">
                          <span className="text-slate-500 font-medium">Margin:</span>
                          <span className="font-bold text-teal-700">
                            {formatRupiah(marginRp)} ({marginPct}%)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isOwnerOrManager && (
                <div className="p-2 sm:p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => updateProduk(prod.id, { is_active: !prod.is_active })}
                    className={`text-[10px] sm:text-[11px] font-semibold underline truncate max-w-[70px] sm:max-w-none ${
                      prod.is_active ? 'text-slate-500 hover:text-slate-700' : 'text-emerald-600'
                    }`}
                  >
                    {prod.is_active ? 'Non-aktif' : 'Aktifkan'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProduk(prod.id)}
                      className="p-1 sm:p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Tambah / Edit Produk */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {editingProduk ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-[11px] text-slate-400">Atur nama, kategori, dan pilihan ukuran produk</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={namaProduk}
                  onChange={e => setNamaProduk(e.target.value)}
                  placeholder="Contoh: Poody Chocolate / Kopi Susu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <input
                    type="text"
                    value={kategori}
                    onChange={e => setKategori(e.target.value)}
                    placeholder="Minuman / Dessert / Makanan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan</label>
                  <input
                    type="text"
                    value={satuan}
                    onChange={e => setSatuan(e.target.value)}
                    placeholder="cup / porsi / botol"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-Size Variant Toggle */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chk-has-variants"
                      checked={hasVariants}
                      onChange={e => setHasVariants(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="chk-has-variants" className="text-xs font-bold text-emerald-950 cursor-pointer">
                      Punya Pilihan Ukuran / Size (Multi-Size)
                    </label>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                    1 Menu Banyak Ukuran
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Aktifkan ini untuk produk dengan beberapa ukuran (contoh: Size M Rp 10.000 & Size L Rp 12.000) tanpa memenuhi ruang daftar menu kasir.
                </p>

                {hasVariants && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-emerald-900">Daftar Ukuran & Harga:</span>
                      <button
                        type="button"
                        onClick={handleAddVariantRow}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Ukuran</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {variantsList.map((v, idx) => (
                        <div
                          key={v.id || idx}
                          className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-2xs"
                        >
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                              Nama Size
                            </label>
                            <input
                              type="text"
                              required
                              value={v.nama}
                              onChange={e => handleUpdateVariant(idx, { nama: e.target.value })}
                              placeholder="Size M / Size L"
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="w-28">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                              Harga Jual (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={v.harga_jual}
                              onChange={e => handleUpdateVariant(idx, { harga_jual: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="w-24">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                              Modal (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={v.harga_modal ?? ''}
                              onChange={e => handleUpdateVariant(idx, { harga_modal: Number(e.target.value) })}
                              placeholder="0"
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={variantsList.length <= 1}
                            onClick={() => handleRemoveVariant(idx)}
                            className={`mt-4 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ${
                              variantsList.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title="Hapus Ukuran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Standard Price when no variants */}
              {!hasVariants && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={hargaJual}
                      onChange={e => setHargaJual(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Harga Modal / HPP (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={hargaModal}
                      onChange={e => setHargaModal(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">Foto Produk</label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" />
                    <span>{showUrlInput ? 'Tutup Input URL' : 'Input via URL link'}</span>
                  </button>
                </div>

                {/* Upload or Preview Display */}
                {gambar ? (
                  <div className="relative rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-300 shadow-2xs flex items-center justify-center p-0.5">
                      <img
                        src={gambar}
                        alt="Preview Produk"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>Foto Produk Siap</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {gambar.startsWith('data:') ? 'Foto dari perangkat (tersimpan)' : gambar}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setGambar('')}
                          className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-4 text-center flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50 scale-[0.99]'
                        : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                      {isUploadingImage ? (
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isUploadingImage ? 'Mengoptimasi gambar...' : 'Klik untuk Upload Gambar atau Drag & Drop'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Pilih foto dari galeri HP atau komputer (JPG, PNG, WEBP)
                      </p>
                    </div>
                  </div>
                )}

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                />

                {/* Optional URL input fallback */}
                {showUrlInput && (
                  <div className="pt-1 animate-in fade-in duration-150">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Link URL Foto Eksternal:
                    </label>
                    <input
                      type="url"
                      value={gambar}
                      onChange={e => setGambar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-active"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chk-active" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Produk Aktif (Bisa dijual di kasir POS)
                </label>
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
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
