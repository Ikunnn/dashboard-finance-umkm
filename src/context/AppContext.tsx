import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_BAHAN_BAKU,
  INITIAL_KATEGORI,
  INITIAL_PEMASUKAN,
  INITIAL_PENGELUARAN,
  INITIAL_PRODUK,
  INITIAL_RIWAYAT_STOK,
  INITIAL_TRANSAKSI,
  INITIAL_USAHA,
  INITIAL_USERS,
} from '../data/initialData';
import {
  BahanBaku,
  CartItem,
  HeldTransaction,
  KategoriItem,
  PaymentMethod,
  Pemasukan,
  Pengeluaran,
  Produk,
  ProdukVarian,
  RiwayatStok,
  Transaksi,
  Usaha,
  User,
  UserRole,
} from '../types';
import { getTodayDateString } from '../utils/formatters';
import { sha256Hex } from '../utils/hash';

export type NavTab =
  | 'dashboard'
  | 'kasir'
  | 'riwayat_kasir'
  | 'produk'
  | 'pemasukan'
  | 'pengeluaran'
  | 'laporan'
  | 'stok'
  | 'pengaturan';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  // Navigation & Role
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (id: string, updates: Partial<User> & { password?: string }) => Promise<void>;
  deleteUser: (id: string) => void;
  usaha: Usaha;
  updateUsaha: (updates: Partial<Usaha>) => void;
  // Auth
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // POS & Cart
  cart: CartItem[];
  addToCart: (produk: Produk, varian?: ProdukVarian) => void;
  updateCartQty: (cartItemId: string, qty: number) => void;
  updateCartItemDiscount: (cartItemId: string, discount: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  orderDiscount: number;
  setOrderDiscount: (discount: number) => void;
  orderNote: string;
  setOrderNote: (note: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;

  // Held transactions
  heldTransactions: HeldTransaction[];
  holdCurrentCart: (title: string) => void;
  restoreHeldCart: (heldId: string) => void;
  deleteHeldCart: (heldId: string) => void;

  // Products
  produk: Produk[];
  addProduk: (prod: Omit<Produk, 'id' | 'created_at'>) => void;
  updateProduk: (id: string, updates: Partial<Produk>) => void;
  deleteProduk: (id: string) => void;

  // Transactions & Receipt
  transaksi: Transaksi[];
  processTransaction: (paymentMethod: PaymentMethod, paidAmount: number) => Transaksi | null;
  lastCompletedTrx: Transaksi | null;
  setLastCompletedTrx: (trx: Transaksi | null) => void;

  // Income & Expenses
  pemasukan: Pemasukan[];
  addPemasukan: (pem: Omit<Pemasukan, 'id' | 'created_at'>) => void;
  deletePemasukan: (id: string) => void;

  pengeluaran: Pengeluaran[];
  addPengeluaran: (peng: Omit<Pengeluaran, 'id' | 'created_at'>, alsoUpdateStock?: { bahanId: string; qty: number; satuan: string }) => void;
  deletePengeluaran: (id: string) => void;

  // Stock Management
  bahanBaku: BahanBaku[];
  riwayatStok: RiwayatStok[];
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'updated_at'>) => void;
  updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => void;
  deleteBahanBaku: (id: string) => void;
  recordStokMasuk: (
    bahanId: string,
    qty: number,
    hargaSatuan: number,
    keterangan: string,
    recordAsExpense: boolean,
    vendor?: string
  ) => void;
  recordStokKeluar: (bahanId: string, qty: number, keterangan: string) => void;

  // Categories
  kategori: KategoriItem[];
  addKategori: (nama: string, tipe: 'PEMASUKAN' | 'PENGELUARAN' | 'PRODUK') => void;
  deleteKategori: (id: string) => void;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Helpers
  lowStockItems: BahanBaku[];
  canAccess: (permissionModule: 'dashboard' | 'kasir' | 'pemasukan' | 'pengeluaran' | 'laporan' | 'stok' | 'pengaturan') => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Business and Users
  const [usaha, setUsaha] = useState<Usaha>(() => {
    const saved = localStorage.getItem('umkm_usaha');
    return saved ? JSON.parse(saved) : INITIAL_USAHA;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('umkm_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // migration: ensure Rizqan has password_hash if missing
        const riz = parsed.find(u => u.email.toLowerCase() === 'rizqan@poody.id');
        if (riz && !riz.password_hash) {
          riz.password_hash = '51da9f111dab19bfb83aee8904fbd071c444c579cf6b60f3712164f28aa19e58'; // rizqan123
        }
        return parsed;
      } catch { return INITIAL_USERS; }
    }
    return INITIAL_USERS;
  });

  // Auth - session persisted as user id
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const sessionId = localStorage.getItem('umkm_session');
    if (sessionId) {
      const saved = localStorage.getItem('umkm_users');
      const list: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
      const found = list.find(u => u.id === sessionId && u.is_active);
      if (found) return found;
    }
    return null;
  });

  const isAuthenticated = currentUser !== null && currentUser.is_active;

  const login = async (email: string, password: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalized);
    if (!user || !user.is_active) return false;
    // if account has no password_hash yet (legacy), allow any password and set it
    if (!user.password_hash) {
      const hash = await sha256Hex(password);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, password_hash: hash } : u));
      setCurrentUser({ ...user, password_hash: hash });
      localStorage.setItem('umkm_session', user.id);
      showToast(`Selamat datang, ${user.nama}!`, 'success');
      return true;
    }
    const hash = await sha256Hex(password);
    if (hash !== user.password_hash) return false;
    setCurrentUser(user);
    localStorage.setItem('umkm_session', user.id);
    showToast(`Selamat datang, ${user.nama}!`, 'success');
    return true;
  };

  const logout = () => {
    localStorage.removeItem('umkm_session');
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('Berhasil keluar', 'info');
  };

  // Keep currentUser in sync when users list changes (e.g. password change)
  useEffect(() => {
    if (currentUser) {
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh) {
        if (fresh.password_hash !== currentUser.password_hash || fresh.nama !== currentUser.nama || fresh.role !== currentUser.role) {
          setCurrentUser(fresh);
        }
      } else {
        // user deleted
        logout();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // Catalog & Inventory
  const [produk, setProduk] = useState<Produk[]>(() => {
    const saved = localStorage.getItem('umkm_produk');
    if (saved) {
      try {
        const parsed: Produk[] = JSON.parse(saved);
        const poodyIdx = parsed.findIndex(p => p.nama_produk.toLowerCase().includes('poody'));
        if (poodyIdx > -1) {
          parsed[poodyIdx] = {
            ...parsed[poodyIdx],
            kategori: parsed[poodyIdx].kategori || 'Dessert',
            harga_jual: 10000,
            harga_modal: 5500,
            satuan: parsed[poodyIdx].satuan || 'cup',
            varian: [
              { id: 'var-poody-m', nama: 'Size M', harga_jual: 10000, harga_modal: 5500 },
              { id: 'var-poody-l', nama: 'Size L', harga_jual: 12000, harga_modal: 6500 },
            ],
          };
          return parsed;
        } else {
          return [INITIAL_PRODUK[0], ...parsed];
        }
      } catch (e) {
        return INITIAL_PRODUK;
      }
    }
    return INITIAL_PRODUK;
  });

  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>(() => {
    const saved = localStorage.getItem('umkm_bahan_baku');
    return saved ? JSON.parse(saved) : INITIAL_BAHAN_BAKU;
  });

  const [riwayatStok, setRiwayatStok] = useState<RiwayatStok[]>(() => {
    const saved = localStorage.getItem('umkm_riwayat_stok');
    return saved ? JSON.parse(saved) : INITIAL_RIWAYAT_STOK;
  });

  // Transactions, Income, Expense
  const [transaksi, setTransaksi] = useState<Transaksi[]>(() => {
    const saved = localStorage.getItem('umkm_transaksi');
    return saved ? JSON.parse(saved) : INITIAL_TRANSAKSI;
  });

  const [pemasukan, setPemasukan] = useState<Pemasukan[]>(() => {
    const saved = localStorage.getItem('umkm_pemasukan');
    return saved ? JSON.parse(saved) : INITIAL_PEMASUKAN;
  });

  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>(() => {
    const saved = localStorage.getItem('umkm_pengeluaran');
    return saved ? JSON.parse(saved) : INITIAL_PENGELUARAN;
  });

  const [kategori, setKategori] = useState<KategoriItem[]>(() => {
    const saved = localStorage.getItem('umkm_kategori');
    return saved ? JSON.parse(saved) : INITIAL_KATEGORI;
  });

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderNote, setOrderNote] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [lastCompletedTrx, setLastCompletedTrx] = useState<Transaksi | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('umkm_usaha', JSON.stringify(usaha));
  }, [usaha]);

  useEffect(() => {
    localStorage.setItem('umkm_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('umkm_produk', JSON.stringify(produk));
  }, [produk]);

  useEffect(() => {
    localStorage.setItem('umkm_bahan_baku', JSON.stringify(bahanBaku));
  }, [bahanBaku]);

  useEffect(() => {
    localStorage.setItem('umkm_riwayat_stok', JSON.stringify(riwayatStok));
  }, [riwayatStok]);

  useEffect(() => {
    localStorage.setItem('umkm_transaksi', JSON.stringify(transaksi));
  }, [transaksi]);

  useEffect(() => {
    localStorage.setItem('umkm_pemasukan', JSON.stringify(pemasukan));
  }, [pemasukan]);

  useEffect(() => {
    localStorage.setItem('umkm_pengeluaran', JSON.stringify(pengeluaran));
  }, [pengeluaran]);

  // Role permissions per PRD 3.7.1
  const canAccess = (module: 'dashboard' | 'kasir' | 'pemasukan' | 'pengeluaran' | 'laporan' | 'stok' | 'pengaturan'): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'OWNER') return true;
    if (role === 'MANAGER') {
      return module !== 'pengaturan';
    }
    if (role === 'KASIR') {
      return module === 'dashboard' || module === 'kasir' || module === 'stok';
    }
    if (role === 'VIEWER') {
      return module !== 'kasir' && module !== 'pengaturan';
    }
    return true;
  };

  const switchRole = (role: UserRole) => {
    const targetUser = users.find(u => u.role === role) || {
      id: `user-${role.toLowerCase()}`,
      nama: role === 'OWNER' ? 'Rizqan' : role === 'MANAGER' ? 'Manager' : role === 'KASIR' ? 'Kasir' : 'Viewer',
      email: `${role.toLowerCase()}@poody.id`,
      role,
      is_active: true,
      usaha_id: usaha.id,
    };
    setCurrentUser(targetUser);
    localStorage.setItem('umkm_session', targetUser.id);
    showToast(`Beralih peran sebagai ${role} (${targetUser.nama})`, 'info');
  };

  // Cart Management
  const addToCart = (prod: Produk, varian?: ProdukVarian) => {
    const targetVariant = varian || (prod.varian && prod.varian.length > 0 ? prod.varian[0] : undefined);
    const cartItemId = `${prod.id}_${targetVariant ? targetVariant.id : 'default'}`;

    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId || (!item.cartItemId && item.produk.id === prod.id && !item.varian));
      if (existing) {
        return prev.map(item =>
          (item.cartItemId === cartItemId || (!item.cartItemId && item.produk.id === prod.id && !item.varian))
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          produk: prod,
          varian: targetVariant,
          qty: 1,
          diskon_item: 0,
        },
      ];
    });
  };

  const updateCartQty = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.cartItemId === cartItemId || item.produk.id === cartItemId
          ? { ...item, qty }
          : item
      )
    );
  };

  const updateCartItemDiscount = (cartItemId: string, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.cartItemId === cartItemId || item.produk.id === cartItemId
          ? { ...item, diskon_item: Math.max(0, discount) }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev =>
      prev.filter(item => item.cartItemId !== cartItemId && item.produk.id !== cartItemId)
    );
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscount(0);
    setOrderNote('');
    setCustomerName('');
  };

  // Hold Transaction
  const holdCurrentCart = (title: string) => {
    if (!cart.length) {
      showToast('Keranjang masih kosong, tidak bisa di-hold', 'warning');
      return;
    }
    const newHold: HeldTransaction = {
      id: 'hold-' + Date.now(),
      hold_title: title || `Antrean Meja #${heldTransactions.length + 1}`,
      customer_name: customerName,
      created_at: new Date().toISOString(),
      cart: [...cart],
      diskon_total: orderDiscount,
      catatan: orderNote,
    };
    setHeldTransactions(prev => [newHold, ...prev]);
    clearCart();
    showToast(`Transaksi "${newHold.hold_title}" berhasil ditahan`, 'info');
  };

  const restoreHeldCart = (heldId: string) => {
    const found = heldTransactions.find(h => h.id === heldId);
    if (!found) return;
    setCart(found.cart);
    setOrderDiscount(found.diskon_total);
    setOrderNote(found.catatan || '');
    setCustomerName(found.customer_name || '');
    setHeldTransactions(prev => prev.filter(h => h.id !== heldId));
    showToast(`Transaksi "${found.hold_title}" dipulihkan ke keranjang`, 'success');
  };

  const deleteHeldCart = (heldId: string) => {
    setHeldTransactions(prev => prev.filter(h => h.id !== heldId));
    showToast('Transaksi hold dihapus', 'info');
  };

  // Process Transaction
  const processTransaction = (paymentMethod: PaymentMethod, paidAmount: number): Transaksi | null => {
    if (!cart.length) return null;
    if (!currentUser) { showToast('Harus login dulu', 'warning'); return null; }

    const subtotal = cart.reduce((sum, item) => {
      const price = item.varian ? item.varian.harga_jual : item.produk.harga_jual;
      const itemPrice = price * item.qty - (item.diskon_item || 0);
      return sum + Math.max(0, itemPrice);
    }, 0);

    const totalBayar = Math.max(0, subtotal - orderDiscount);
    const kembalian = paymentMethod === 'TUNAI' ? Math.max(0, paidAmount - totalBayar) : 0;

    const date = new Date();
    const dateFormatted = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = String(transaksi.length + 1).padStart(4, '0');
    const trxNumber = `TRX-${dateFormatted}-${randomSuffix}`;

    const newTrx: Transaksi = {
      id: 'trx-' + Date.now(),
      nomor_transaksi: trxNumber,
      tanggal: date.toISOString(),
      total_sebelum_diskon: subtotal,
      diskon_total: orderDiscount,
      total_bayar: totalBayar,
      metode_pembayaran: paymentMethod,
      nominal_dibayar: paymentMethod === 'TUNAI' ? paidAmount : totalBayar,
      kembalian,
      catatan: customerName ? `${orderNote ? orderNote + ' | ' : ''}Pelanggan: ${customerName}` : orderNote,
      kasir_id: currentUser.id,
      kasir_nama: currentUser.nama,
      items: cart.map((item, idx) => {
        const unitPrice = item.varian ? item.varian.harga_jual : item.produk.harga_jual;
        const displayName = item.varian
          ? `${item.produk.nama_produk} (${item.varian.nama})`
          : item.produk.nama_produk;
        return {
          id: `item-${Date.now()}-${idx}`,
          transaksi_id: 'trx-' + Date.now(),
          produk_id: item.produk.id,
          nama_produk: displayName,
          varian_nama: item.varian?.nama,
          harga_satuan: unitPrice,
          qty: item.qty,
          diskon_item: item.diskon_item || 0,
          subtotal: unitPrice * item.qty - (item.diskon_item || 0),
        };
      }),
      created_at: date.toISOString(),
    };

    // Save transaction
    setTransaksi(prev => [newTrx, ...prev]);

    const itemSummaries = cart
      .map(c => {
        const name = c.varian ? `${c.produk.nama_produk} (${c.varian.nama})` : c.produk.nama_produk;
        return `${c.qty}x ${name}`;
      })
      .join(', ');

    const autoPemasukan: Pemasukan = {
      id: 'pem-auto-' + Date.now(),
      tanggal: getTodayDateString(),
      kategori_id: 'kat-in-1',
      kategori_nama: 'Penjualan Kasir',
      jumlah: totalBayar,
      deskripsi: `Penjualan kasir ${trxNumber} (${itemSummaries})`,
      transaksi_id: newTrx.id,
      user_id: currentUser.id,
      user_nama: currentUser.nama,
      created_at: date.toISOString(),
    };
    setPemasukan(prev => [autoPemasukan, ...prev]);

    setLastCompletedTrx(newTrx);
    clearCart();
    showToast(`Transaksi ${trxNumber} berhasil disimpan!`, 'success');
    return newTrx;
  };

  // Product CRUD
  const addProduk = (data: Omit<Produk, 'id' | 'created_at'>) => {
    const newProd: Produk = {
      ...data,
      id: 'prod-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setProduk(prev => [newProd, ...prev]);
    showToast(`Produk "${newProd.nama_produk}" berhasil ditambahkan`, 'success');
  };

  const updateProduk = (id: string, updates: Partial<Produk>) => {
    setProduk(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Data produk diperbarui', 'success');
  };

  const deleteProduk = (id: string) => {
    setProduk(prev => prev.filter(p => p.id !== id));
    showToast('Produk berhasil dihapus', 'info');
  };

  // Pemasukan CRUD
  const addPemasukan = (pem: Omit<Pemasukan, 'id' | 'created_at'>) => {
    const newPem: Pemasukan = {
      ...pem,
      id: 'pem-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setPemasukan(prev => [newPem, ...prev]);
    showToast(`Pemasukan Rp ${newPem.jumlah.toLocaleString('id-ID')} dicatat`, 'success');
  };

  const deletePemasukan = (id: string) => {
    setPemasukan(prev => prev.filter(p => p.id !== id));
    showToast('Catatan pemasukan dihapus', 'info');
  };

  // Pengeluaran CRUD
  const addPengeluaran = (
    peng: Omit<Pengeluaran, 'id' | 'created_at'>,
    alsoUpdateStock?: { bahanId: string; qty: number; satuan: string }
  ) => {
    const newPeng: Pengeluaran = {
      ...peng,
      id: 'peng-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setPengeluaran(prev => [newPeng, ...prev]);

    if (alsoUpdateStock && alsoUpdateStock.bahanId && alsoUpdateStock.qty > 0) {
      setBahanBaku(prev =>
        prev.map(b =>
          b.id === alsoUpdateStock.bahanId
            ? {
                ...b,
                stok_saat_ini: b.stok_saat_ini + alsoUpdateStock.qty,
                harga_terakhir: Math.round(newPeng.jumlah / alsoUpdateStock.qty),
                updated_at: new Date().toISOString(),
              }
            : b
        )
      );

      const targetBahan = bahanBaku.find(b => b.id === alsoUpdateStock.bahanId);
      const newStockLog: RiwayatStok = {
        id: 'log-' + Date.now(),
        bahan_id: alsoUpdateStock.bahanId,
        bahan_nama: targetBahan ? targetBahan.nama_bahan : 'Bahan Baku',
        tipe: 'MASUK',
        jumlah: alsoUpdateStock.qty,
        satuan: alsoUpdateStock.satuan,
        harga_satuan: Math.round(newPeng.jumlah / alsoUpdateStock.qty),
        total_harga: newPeng.jumlah,
        keterangan: `Pembelian dari pengeluaran: ${newPeng.deskripsi}`,
        tanggal: newPeng.tanggal,
        user_nama: currentUser?.nama || 'Sistem',
        created_at: new Date().toISOString(),
      };
      setRiwayatStok(prev => [newStockLog, ...prev]);
    }

    showToast(`Pengeluaran Rp ${newPeng.jumlah.toLocaleString('id-ID')} berhasil dicatat`, 'success');
  };

  const deletePengeluaran = (id: string) => {
    setPengeluaran(prev => prev.filter(p => p.id !== id));
    showToast('Catatan pengeluaran dihapus', 'info');
  };

  // Raw Materials CRUD & Stock Movements
  const addBahanBaku = (bahan: Omit<BahanBaku, 'id' | 'updated_at'>) => {
    const newBahan: BahanBaku = {
      ...bahan,
      id: 'bb-' + Date.now(),
      updated_at: new Date().toISOString(),
    };
    setBahanBaku(prev => [newBahan, ...prev]);
    showToast(`Bahan baku "${newBahan.nama_bahan}" ditambahkan`, 'success');
  };

  const updateBahanBaku = (id: string, updates: Partial<BahanBaku>) => {
    setBahanBaku(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b))
    );
    showToast('Bahan baku diperbarui', 'success');
  };

  const deleteBahanBaku = (id: string) => {
    setBahanBaku(prev => prev.filter(b => b.id !== id));
    showToast('Bahan baku dihapus', 'info');
  };

  const recordStokMasuk = (
    bahanId: string,
    qty: number,
    hargaSatuan: number,
    keterangan: string,
    recordAsExpense: boolean,
    vendor?: string
  ) => {
    const target = bahanBaku.find(b => b.id === bahanId);
    if (!target) return;

    const totalHarga = qty * hargaSatuan;
    setBahanBaku(prev =>
      prev.map(b =>
        b.id === bahanId
          ? {
              ...b,
              stok_saat_ini: b.stok_saat_ini + qty,
              harga_terakhir: hargaSatuan > 0 ? hargaSatuan : b.harga_terakhir,
              updated_at: new Date().toISOString(),
            }
          : b
      )
    );

    const log: RiwayatStok = {
      id: 'log-' + Date.now(),
      bahan_id: bahanId,
      bahan_nama: target.nama_bahan,
      tipe: 'MASUK',
      jumlah: qty,
      satuan: target.satuan,
      harga_satuan: hargaSatuan,
      total_harga: totalHarga,
      keterangan: keterangan || 'Input stok masuk',
      tanggal: getTodayDateString(),
      user_nama: currentUser?.nama || 'Sistem',
      created_at: new Date().toISOString(),
    };
    setRiwayatStok(prev => [log, ...prev]);

    if (recordAsExpense && totalHarga > 0) {
      const exp: Pengeluaran = {
        id: 'peng-stock-' + Date.now(),
        tanggal: getTodayDateString(),
        kategori_id: 'kat-ex-1',
        kategori_nama: 'Bahan Baku',
        jumlah: totalHarga,
        deskripsi: `Restock ${target.nama_bahan} (${qty} ${target.satuan}) - ${keterangan}`,
        vendor: vendor || target.supplier || 'Supplier Bahan Baku',
        user_id: currentUser?.id || 'system',
        user_nama: currentUser?.nama || 'Sistem',
        created_at: new Date().toISOString(),
      };
      setPengeluaran(prev => [exp, ...prev]);
    }

    showToast(`Stok ${target.nama_bahan} berhasil ditambah (+${qty} ${target.satuan})`, 'success');
  };

  const recordStokKeluar = (bahanId: string, qty: number, keterangan: string) => {
    const target = bahanBaku.find(b => b.id === bahanId);
    if (!target) return;

    if (qty > target.stok_saat_ini) {
      showToast(`Jumlah keluar (${qty}) melebihi stok yang ada (${target.stok_saat_ini})!`, 'warning');
    }

    const newStock = Math.max(0, target.stok_saat_ini - qty);
    setBahanBaku(prev =>
      prev.map(b =>
        b.id === bahanId
          ? {
              ...b,
              stok_saat_ini: newStock,
              updated_at: new Date().toISOString(),
            }
          : b
      )
    );

    const log: RiwayatStok = {
      id: 'log-' + Date.now(),
      bahan_id: bahanId,
      bahan_nama: target.nama_bahan,
      tipe: 'KELUAR',
      jumlah: qty,
      satuan: target.satuan,
      keterangan: keterangan || 'Penggunaan bahan baku operasional',
      tanggal: getTodayDateString(),
      user_nama: currentUser?.nama || 'Sistem',
      created_at: new Date().toISOString(),
    };
    setRiwayatStok(prev => [log, ...prev]);

    showToast(`Stok ${target.nama_bahan} dikurangi (-${qty} ${target.satuan})`, 'info');
  };

  // Category
  const addKategori = (nama: string, tipe: 'PEMASUKAN' | 'PENGELUARAN' | 'PRODUK') => {
    const newKat: KategoriItem = {
      id: 'kat-' + Date.now(),
      nama,
      tipe,
    };
    setKategori(prev => [...prev, newKat]);
    showToast(`Kategori "${nama}" berhasil ditambahkan`, 'success');
  };

  const deleteKategori = (id: string) => {
    setKategori(prev => prev.filter(k => k.id !== id));
    showToast('Kategori dihapus', 'info');
  };

  // Settings & Users (with password_hash)
  const updateUsaha = (updates: Partial<Usaha>) => {
    setUsaha(prev => ({ ...prev, ...updates }));
    showToast('Profil usaha berhasil diperbarui', 'success');
  };

  const addUser = async (userData: Omit<User, 'id'> & { password?: string }) => {
    const { password, ...rest } = userData as any;
    let password_hash: string | undefined;
    if (password) {
      password_hash = await sha256Hex(password);
    } else {
      // default temp password = 123456
      password_hash = await sha256Hex('123456');
    }
    const newUser: User = {
      ...(rest as Omit<User, 'id'>),
      id: 'user-' + Date.now(),
      password_hash,
    };
    setUsers(prev => [...prev, newUser]);
    showToast(`Pengguna "${newUser.nama}" (${newUser.role}) ditambahkan`, 'success');
  };

  const updateUser = async (id: string, updates: Partial<User> & { password?: string }) => {
    const { password, ...rest } = updates as any;
    let patch: Partial<User> = { ...rest };
    if (password) {
      patch.password_hash = await sha256Hex(password);
    }
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...patch } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? ({ ...prev, ...patch }) : prev);
    }
    showToast('Data pengguna diperbarui', 'success');
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      showToast('Tidak bisa hapus — minimal 1 akun harus ada', 'warning');
      return;
    }
    if (id === currentUser?.id) {
      showToast('Tidak bisa hapus akun yang sedang login', 'warning');
      return;
    }
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast(`Pengguna "${target?.nama || id}" dihapus`, 'info');
  };

  // Low stock calculation
  const lowStockItems = bahanBaku.filter(b => b.stok_saat_ini <= b.stok_minimum);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        switchRole,
        users,
        addUser,
        updateUser,
        deleteUser,
        usaha,
        updateUsaha,
        isAuthenticated,
        login,
        logout,
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
        produk,
        addProduk,
        updateProduk,
        deleteProduk,
        transaksi,
        processTransaction,
        lastCompletedTrx,
        setLastCompletedTrx,
        pemasukan,
        addPemasukan,
        deletePemasukan,
        pengeluaran,
        addPengeluaran,
        deletePengeluaran,
        bahanBaku,
        riwayatStok,
        addBahanBaku,
        updateBahanBaku,
        deleteBahanBaku,
        recordStokMasuk,
        recordStokKeluar,
        kategori,
        addKategori,
        deleteKategori,
        toasts,
        showToast,
        removeToast,
        lowStockItems,
        canAccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
