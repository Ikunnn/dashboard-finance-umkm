import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Minus,
  PauseCircle,
  PlayCircle,
  Plus,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { POODY_TOPPINGS } from '../../data/poodyCatalog';
import { PaymentMethod, Produk, Transaksi } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface PosModuleProps {
  onOpenReceipt: (trx: Transaksi) => void;
}

export const PosModule: React.FC<PosModuleProps> = ({ onOpenReceipt }) => {
  const {
    produk,
    cart,
    addToCart,
    updateCartQty,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    orderDiscount,
    setOrderDiscount,
    orderNote,
    setOrderNote,
    customerName,
    setCustomerName,
    heldTransactions,
    holdCurrentCart,
    restoreHeldCart,
    deleteHeldCart,
    processTransaction,
    showToast,
    usaha,
  } = useApp();

  // Mobile Tab Switcher: Katalog vs Keranjang
  const [mobileTab, setMobileTab] = useState<'katalog' | 'keranjang'>('katalog');

  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modals & Panels
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdTitleInput, setHoldTitleInput] = useState('');
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<string | null>(null);
  const [itemDiscountInput, setItemDiscountInput] = useState<number>(0);
  const [selectedProductForVariantModal, setSelectedProductForVariantModal] = useState<Produk | null>(null);
  const [modalVariantId, setModalVariantId] = useState<string | null>(null);
  const [modalToppings, setModalToppings] = useState<string[]>([]);
  const [toppingOpen, setToppingOpen] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [nominalBayar, setNominalBayar] = useState<number>(0);

  const toppingMap = Object.fromEntries(POODY_TOPPINGS.map(t => [t.id, t])) as Record<string, typeof POODY_TOPPINGS[number]>;
  const getToppingsPrice = (ids?: string[]) => (ids || []).reduce((s, id) => s + ((toppingMap[id]?.price) || 0), 0);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    produk.forEach(p => {
      if (p.is_active && p.kategori) set.add(p.kategori);
    });
    return ['Semua', ...Array.from(set)];
  }, [produk]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return produk.filter(p => {
      if (!p.is_active) return false;
      const matchCat = selectedCategory === 'Semua' || p.kategori === selectedCategory;
      const matchSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [produk, selectedCategory, searchQuery]);

  // Cart Calculations
  const totalCartQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const subtotalBeforeDiscounts = useMemo(() => {
    return cart.reduce((sum, item) => {
      const base = item.varian ? item.varian.harga_jual : item.produk.harga_jual;
      const top = getToppingsPrice(item.toppings);
      return sum + (base + top) * item.qty;
    }, 0);
  }, [cart]);

  const totalItemDiscounts = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.diskon_item || 0), 0);
  }, [cart]);

  const totalAfterItemDiscounts = Math.max(0, subtotalBeforeDiscounts - totalItemDiscounts);
  const finalTotalBayar = Math.max(0, totalAfterItemDiscounts - orderDiscount);

  // Kembalian for cash
  const kembalian = paymentMethod === 'TUNAI' ? Math.max(0, nominalBayar - finalTotalBayar) : 0;
  const isBayarCukup = paymentMethod !== 'TUNAI' || nominalBayar >= finalTotalBayar;

  // Open Checkout
  const handleOpenCheckout = () => {
    if (!cart.length) {
      showToast('Keranjang masih kosong', 'warning');
      return;
    }
    setNominalBayar(finalTotalBayar); // default uang pas
    setShowCheckoutModal(true);
  };

  // Submit Order
  const handleSubmitPayment = () => {
    if (!isBayarCukup) {
      showToast('Nominal uang yang dibayar masih kurang!', 'warning');
      return;
    }

    const completed = processTransaction(paymentMethod, nominalBayar);
    if (completed) {
      setShowCheckoutModal(false);
      setMobileTab('katalog');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (err) {
        // ignore in non-browser
      }
      onOpenReceipt(completed);
    }
  };

  // Quick Nominal shortcuts for Cash
  const quickNominals = [
    { label: 'Uang Pas', value: finalTotalBayar },
    { label: 'Rp 20.000', value: 20000 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 },
  ];

  return (
    <div className="space-y-3 lg:space-y-0">
      {/* Mobile Top Segmented Switcher (Katalog vs Keranjang) */}
      <div className="lg:hidden flex items-center bg-slate-200/90 p-1 rounded-2xl w-full">
        <button
          onClick={() => setMobileTab('katalog')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'katalog'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Katalog Menu ({filteredProducts.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('keranjang')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            mobileTab === 'keranjang'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Keranjang</span>
          {totalCartQty > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-black text-[10px]">
              {totalCartQty}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 xl:gap-10 items-start">
        {/* Left: Product Catalog Grid */}
        <div className={`flex-1 w-full space-y-3 sm:space-y-4 ${mobileTab === 'katalog' ? 'block' : 'hidden lg:block'}`}>
          {/* Search & Top Action Bar */}
          <div className="bg-white p-3.5 sm:p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 lg:gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-pos-search"
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Held Carts quick pill button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {heldTransactions.length > 0 && (
                <button
                  id="btn-pos-held-list"
                  onClick={() => setShowHoldModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors"
                >
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                  <span>{heldTransactions.length} Hold</span>
                </button>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {filteredProducts.length} Produk
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto pb-1 lg:pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid — tablet horizontal 3x3 biar menu gede */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-7">
            {filteredProducts.map(prod => {
              const hasVariants = Boolean(prod.varian && prod.varian.length > 0);
              const totalQtyInCart = cart
                .filter(item => item.produk.id === prod.id)
                .reduce((sum, item) => sum + item.qty, 0);

              const minPrice = hasVariants
                ? Math.min(...prod.varian!.map(v => v.harga_jual))
                : prod.harga_jual;
              const maxPrice = hasVariants
                ? Math.max(...prod.varian!.map(v => v.harga_jual))
                : prod.harga_jual;

              const priceLabel = hasVariants
                ? minPrice === maxPrice
                  ? formatRupiah(minPrice)
                  : `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`
                : formatRupiah(prod.harga_jual);

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    // Poody with variants -> open size+topping picker; others direct add
                    if (prod.kategori === 'Poody' && hasVariants) {
                      setModalVariantId(prod.varian![0]?.id || null);
                      setModalToppings([]);
                      setToppingOpen(false);
                      setSelectedProductForVariantModal(prod);
                    } else if (hasVariants) {
                      setSelectedProductForVariantModal(prod);
                    } else {
                      addToCart(prod);
                    }
                  }}
                  className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
                >
                  {/* Image & Category Tag */}
                  <div className="relative aspect-square lg:aspect-[4/3] w-full bg-slate-50 overflow-hidden flex items-center justify-center">
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
                          className="relative z-1 max-w-full max-h-full w-auto h-auto object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}

                    <span className="absolute top-1.5 left-1.5 z-2 px-1.5 py-0.5 rounded-md bg-slate-900/65 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-semibold pointer-events-none">
                      {prod.kategori}
                    </span>

                    {hasVariants && (
                      <span className="absolute bottom-1.5 left-1.5 z-2 px-1.5 py-0.5 rounded-md bg-emerald-800/85 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold shadow-2xs pointer-events-none">
                        {prod.varian!.length} Ukuran
                      </span>
                    )}

                    {totalQtyInCart > 0 && (
                      <span className="absolute top-1.5 right-1.5 z-2 w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-50">
                        {totalQtyInCart}
                      </span>
                    )}
                  </div>

                  {/* Info & Price */}
                  <div className="p-3.5 sm:p-4 lg:p-5 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-[15px] lg:text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {prod.nama_produk}
                      </h4>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-sm sm:text-[15px] lg:text-base font-black font-mono text-emerald-700">
                          {priceLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">/{prod.satuan}</span>
                      </div>
                    </div>

                    {/* Quick Size Selection Buttons on the Card */}
                    {prod.kategori === 'Poody' && hasVariants && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                        {prod.varian!.map(v => {
                          const varInCartQty = cart.filter(c => c.produk.id === prod.id && c.varian?.id === v.id).reduce((s,c)=>s+c.qty,0);
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalVariantId(v.id);
                                setModalToppings([]);
                                setToppingOpen(false);
                                setSelectedProductForVariantModal(prod);
                              }}
                              className="relative flex-1 py-1.5 px-1 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-emerald-950 transition-all text-center group/btn active:scale-95 flex flex-col items-center justify-center min-h-[38px]"
                              title={`Pilih ${v.nama} (${formatRupiah(v.harga_jual)})`}
                            >
                              <span className="text-[10px] font-bold leading-tight block truncate w-full group-hover/btn:text-white">
                                {v.nama}
                              </span>
                              <span className="text-[9px] font-mono font-bold opacity-90 block group-hover/btn:text-emerald-100">
                                {formatRupiah(v.harga_jual)}
                              </span>
                              {varInCartQty > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-600 group-hover/btn:bg-white group-hover/btn:text-emerald-800 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                                  {varInCartQty}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {prod.kategori !== 'Poody' && hasVariants && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                        {prod.varian!.map(v => {
                          const varInCart = cart.find(c => c.produk.id === prod.id && c.varian?.id === v.id);
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); addToCart(prod, v); showToast(`${prod.nama_produk} (${v.nama}) ditambahkan ke keranjang`, 'success'); }}
                              className="relative flex-1 py-1.5 px-1 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-emerald-950 transition-all text-center group/btn active:scale-95 flex flex-col items-center justify-center min-h-[38px]"
                            >
                              <span className="text-[10px] font-bold leading-tight">{v.nama}</span>
                              <span className="text-[9px] font-mono font-bold">{formatRupiah(v.harga_jual)}</span>
                              {varInCart && (<span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center">{varInCart.qty}</span>)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Mobile Cart Bar when items in cart & looking at catalog */}
          {cart.length > 0 && (
            <div className="lg:hidden fixed bottom-14 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
              <button
                onClick={() => setMobileTab('keranjang')}
                className="w-full p-3 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between border border-slate-700 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                    {totalCartQty}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400">Total Belanja</p>
                    <p className="text-sm font-black font-mono text-emerald-400">
                      {formatRupiah(finalTotalBayar)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors">
                  <span>Lihat Keranjang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Right: Active Cart Panel */}
        <div
          className={`w-full lg:w-[360px] xl:w-[400px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-auto lg:sticky lg:top-20 ${
            mobileTab === 'keranjang' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Keranjang Kasir</h3>
                <p className="text-[11px] text-slate-400">
                  {totalCartQty} item dipilih
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileTab('katalog')}
                className="lg:hidden text-xs text-emerald-700 hover:text-emerald-800 font-semibold px-2 py-1 rounded-lg bg-emerald-50"
              >
                + Tambah Item
              </button>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold p-1 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                  title="Kosongkan keranjang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer & Table Note Inputs */}
          <div className="p-3 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Nama Pelanggan
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Pak Anton"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Catatan / Meja
              </label>
              <input
                type="text"
                placeholder="Contoh: Meja 05"
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 p-3 overflow-y-auto max-h-[380px] divide-y divide-slate-100 space-y-2">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
                <span className="font-semibold text-slate-700">Keranjang kasir masih kosong</span>
                <p className="text-[11px] text-slate-400">Pilih menu dari katalog untuk menambahkan</p>
                <button
                  onClick={() => setMobileTab('katalog')}
                  className="lg:hidden mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Buka Katalog Menu
                </button>
              </div>
            ) : (
              cart.map(item => {
                const itemKey = item.cartItemId || `${item.produk.id}_${item.varian?.id || 'default'}`;
                const basePrice = item.varian ? item.varian.harga_jual : item.produk.harga_jual;
                const toppingPrice = getToppingsPrice(item.toppings);
                const unitPrice = basePrice + toppingPrice;
                const itemTotal = unitPrice * item.qty - (item.diskon_item || 0);
                return (
                  <div key={itemKey} className="pt-2 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-xs text-slate-800 leading-tight">
                            {item.produk.nama_produk}
                          </h4>
                          {item.varian && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                              {item.varian.nama}
                            </span>
                          )}
                          {item.toppings && item.toppings.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[9px]">
                              + {item.toppings.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {formatRupiah(basePrice)}{toppingPrice > 0 ? ` + ${formatRupiah(toppingPrice)}` : ''} = {formatRupiah(unitPrice)}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-xs font-mono text-slate-900">
                          {formatRupiah(itemTotal)}
                        </span>
                        {item.diskon_item > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Disc -{formatRupiah(item.diskon_item)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Qty & Item Discount Controls */}
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedItemForDiscount(itemKey);
                          setItemDiscountInput(item.diskon_item || 0);
                        }}
                        className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{item.diskon_item > 0 ? 'Edit Diskon' : '+ Diskon Item'}</span>
                      </button>

                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => updateCartQty(itemKey, item.qty - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-transform"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs font-mono text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(itemKey, item.qty + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-xs active:scale-95 transition-transform"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Totals & Actions */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatRupiah(subtotalBeforeDiscounts)}</span>
              </div>

              {totalItemDiscounts > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Diskon Item</span>
                  <span className="font-mono">-{formatRupiah(totalItemDiscounts)}</span>
                </div>
              )}

              {/* Total Order Discount */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600">Diskon Transaksi (Rp):</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={orderDiscount || ''}
                  onChange={e => setOrderDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-28 text-right px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">TOTAL BAYAR</span>
                <span className="font-black font-mono text-emerald-700 text-lg sm:text-xl">
                  {formatRupiah(finalTotalBayar)}
                </span>
              </div>

              {/* Hold & Checkout Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => {
                    setHoldTitleInput(customerName ? `Meja/Plg: ${customerName}` : '');
                    setShowHoldModal(true);
                  }}
                  className="col-span-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                  title="Tahan transaksi saat ini"
                >
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                  <span>Hold</span>
                </button>

                <button
                  id="btn-pos-checkout"
                  onClick={handleOpenCheckout}
                  className="col-span-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Bayar Sekarang &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Checkout / Pembayaran (PRD 3.2.2 & 3.2.3) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Pembayaran Kasir</h3>
                <p className="text-[11px] text-slate-500">Pilih metode bayar & masukkan nominal</p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Total Due Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  Total Tagihan
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">
                  {formatRupiah(finalTotalBayar)}
                </div>
              </div>

              {/* Payment Methods Grid */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'TUNAI', label: 'Tunai', icon: Banknote },
                      { id: 'QRIS', label: 'QRIS', icon: QrCode },
                      { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                      { id: 'EWALLET', label: 'E-Wallet', icon: Wallet },
                    ] as const
                  ).map(method => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => {
                          setPaymentMethod(method.id);
                          if (method.id !== 'TUNAI') {
                            setNominalBayar(finalTotalBayar);
                          }
                        }}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method Specific UI */}
              {paymentMethod === 'TUNAI' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Uang Diterima Pelanggan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={nominalBayar || ''}
                      onChange={e => setNominalBayar(Number(e.target.value))}
                      className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>

                  {/* Quick money shortcuts */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickNominals.map(q => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => setNominalBayar(q.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Kembalian:</span>
                    <span
                      className={`text-lg font-black ${
                        kembalian >= 0 && isBayarCukup ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {formatRupiah(kembalian)}
                    </span>
                  </div>

                  {!isBayarCukup && (
                    <div className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Uang pembayaran kurang {formatRupiah(finalTotalBayar - nominalBayar)}</span>
                    </div>
                  )}
                </div>
              ) : paymentMethod === 'QRIS' ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                    {/* Simulated QR Code SVG */}
                    <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 bg-slate-900 rounded">
                      <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                      <div className="bg-white col-span-1" />
                      <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                      <div className="bg-white col-span-1" />
                      <div className="bg-white col-span-1" />
                      <div className="bg-white col-span-3" />
                      <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                      <div className="bg-white col-span-1" />
                      <div className="bg-white col-span-2" />
                    </div>
                  </div>
                  <p className="font-bold text-xs text-slate-800">QRIS Dinamis - {usaha.nama_usaha}</p>
                  <p className="text-[11px] text-slate-500">
                    Arahkan aplikasi BCA, Mandiri, GoPay, OVO, atau Dana ke QR di atas
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Konfirmasi {paymentMethod}</p>
                  <p>
                    Pastikan pembayaran senilai{' '}
                    <strong className="text-emerald-700">{formatRupiah(finalTotalBayar)}</strong>{' '}
                    sudah berhasil masuk ke rekening atau e-wallet usaha.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                id="btn-confirm-transaction"
                disabled={!isBayarCukup}
                onClick={handleSubmitPayment}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Transaksi & Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Hold Transactions (PRD 3.2.3 Transaksi Hold) */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {cart.length > 0 ? 'Tahan Transaksi Saat Ini' : 'Daftar Transaksi Tertahan'}
                </h3>
              </div>
              <button
                onClick={() => setShowHoldModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length > 0 && (
              <div className="space-y-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="text-xs font-bold text-amber-900 block">
                  Beri label antrean / meja:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Meja 03 - Tamu Rombongan"
                  value={holdTitleInput}
                  onChange={e => setHoldTitleInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={() => {
                    holdCurrentCart(holdTitleInput);
                    setShowHoldModal(false);
                  }}
                  className="w-full mt-2 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  Simpan ke Daftar Hold
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Transaksi Hold Tersimpan ({heldTransactions.length})
              </h4>
              {heldTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Tidak ada transaksi yang di-hold</p>
              ) : (
                heldTransactions.map(h => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{h.hold_title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {h.cart.reduce((s, i) => s + i.qty, 0)} item • Diskon: {formatRupiah(h.diskon_total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          restoreHeldCart(h.id);
                          setShowHoldModal(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Lanjutkan</span>
                      </button>
                      <button
                        onClick={() => deleteHeldCart(h.id)}
                        className="p-1 rounded-lg hover:bg-red-100 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Diskon Per Item (PRD 3.2.3) */}
      {selectedItemForDiscount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full shadow-xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Diskon Khusus Item</h3>
            <p className="text-xs text-slate-500">
              Masukkan potongan harga dalam Rupiah untuk item ini
            </p>
            <input
              type="number"
              min="0"
              step="any"
              value={itemDiscountInput || ''}
              onChange={e => setItemDiscountInput(Math.max(0, Number(e.target.value)))}
              placeholder="Contoh: 2000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedItemForDiscount(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateCartItemDiscount(selectedItemForDiscount, itemDiscountInput);
                  setSelectedItemForDiscount(null);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Pilih Ukuran + Topping (Poody 6 rasa) */}
      {selectedProductForVariantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {selectedProductForVariantModal.kategori}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  {selectedProductForVariantModal.nama_produk}
                </h3>
                <p className="text-xs text-slate-500">Pilih ukuran + topping, lalu tambah ke keranjang:</p>
              </div>
              <button
                onClick={() => { setToppingOpen(false); setSelectedProductForVariantModal(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedProductForVariantModal.gambar && (
              <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-50 relative flex items-center justify-center border border-slate-200 shrink-0">
                <img src={selectedProductForVariantModal.gambar} alt="" aria-hidden="true" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none" />
                <img src={selectedProductForVariantModal.gambar} alt={selectedProductForVariantModal.nama_produk} referrerPolicy="no-referrer" className="relative z-1 max-w-full max-h-full w-auto h-auto object-contain p-2" />
              </div>
            )}

            {/* Size picker */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Ukuran</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedProductForVariantModal.varian?.map(v => {
                  const isActive = modalVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setModalVariantId(v.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-98 ${isActive ? 'border-emerald-600 bg-emerald-50 shadow-xs' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                    >
                      <div>
                        <span className={`font-bold text-sm ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>{v.nama}</span>
                        <span className="text-xs text-slate-400 block">1 {selectedProductForVariantModal.satuan}</span>
                      </div>
                      <span className={`font-mono font-black text-sm ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>{formatRupiah(v.harga_jual)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toppings — dropdown multi-select for Poody */}
            {selectedProductForVariantModal.kategori === 'Poody' && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Topping <span className="font-normal text-slate-400">(opsional, bisa pilih banyak)</span></p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setToppingOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <span className="truncate">{modalToppings.length === 0 ? 'Pilih topping...' : `${modalToppings.length} topping dipilih: ${modalToppings.join(', ')}`}</span>
                    <span className={`ml-2 shrink-0 w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] transition-transform ${toppingOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {toppingOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                      <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                        {POODY_TOPPINGS.map(t => {
                          const active = modalToppings.includes(t.id);
                          return (
                            <label key={t.id} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${active ? 'bg-amber-50 border border-amber-300' : 'hover:bg-slate-50 border border-transparent'}`}>
                              <span className="flex items-center gap-2">
                                <input type="checkbox" checked={active} onChange={() => setModalToppings(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
                                <span className={`font-bold ${active ? 'text-slate-900' : 'text-slate-700'}`}>{t.label}</span>
                              </span>
                              <span className="font-mono font-bold text-[11px] text-amber-700">+{formatRupiah(t.price).replace('Rp','').trim()}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500">{modalToppings.length} dipilih</span>
                        <button type="button" onClick={() => setToppingOpen(false)} className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold">Selesai</button>
                      </div>
                    </div>
                  )}
                </div>
                {modalToppings.length > 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">Topping: +{formatRupiah(getToppingsPrice(modalToppings))} • Total: {formatRupiah((selectedProductForVariantModal.varian?.find(v=>v.id===modalVariantId)?.harga_jual || 0) + getToppingsPrice(modalToppings))}</p>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button type="button" onClick={() => { setToppingOpen(false); setSelectedProductForVariantModal(null); }} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50">Batal</button>
              <button
                type="button"
                onClick={() => {
                  const varian = selectedProductForVariantModal.varian?.find(v => v.id === modalVariantId) || selectedProductForVariantModal.varian?.[0];
                  addToCart(selectedProductForVariantModal, varian, selectedProductForVariantModal.kategori === 'Poody' ? modalToppings : []);
                  const topLabel = modalToppings.length ? ` + ${modalToppings.join(', ')}` : '';
                  showToast(`${selectedProductForVariantModal.nama_produk} (${varian?.nama})${topLabel} ditambahkan!`, 'success');
                  setToppingOpen(false);
                  setSelectedProductForVariantModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
