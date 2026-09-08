export type UserRole = 'OWNER' | 'MANAGER' | 'KASIR' | 'VIEWER';

export interface User {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  no_hp?: string;
  avatar?: string;
  is_active: boolean;
  usaha_id: string;
  password_hash?: string; // SHA-256 hex
}

export interface Usaha {
  id: string;
  nama_usaha: string;
  jenis_usaha: string;
  alamat: string;
  no_telepon: string;
  logo?: string;
}

export interface ProdukVarian {
  id: string;
  nama: string; // e.g. "Size M", "Size L", "Regular", "Large"
  harga_jual: number;
  harga_modal?: number;
}

export interface Produk {
  id: string;
  nama_produk: string;
  kategori: string;
  harga_jual: number;
  harga_modal: number;
  satuan: string;
  gambar?: string;
  is_active: boolean;
  created_at: string;
  varian?: ProdukVarian[];
}

export type PaymentMethod = 'TUNAI' | 'TRANSFER' | 'QRIS' | 'EWALLET';

export interface CartItem {
  cartItemId: string; // `${produk.id}_${varian?.id || 'default'}_${toppings?.sort().join(',') || ''}`
  produk: Produk;
  varian?: ProdukVarian;
  toppings?: string[]; // POODY_TOPPINGS ids e.g. ['keju','oreo crumb']
  qty: number;
  diskon_item: number; // in Rupiah
}

export interface ItemTransaksi {
  id: string;
  transaksi_id: string;
  produk_id: string;
  nama_produk: string;
  varian_nama?: string;
  toppings?: string[];
  harga_satuan: number;
  qty: number;
  diskon_item: number;
  subtotal: number;
}

export interface Transaksi {
  id: string;
  nomor_transaksi: string;
  tanggal: string; // ISO string
  total_sebelum_diskon: number;
  diskon_total: number;
  total_bayar: number;
  metode_pembayaran: PaymentMethod;
  nominal_dibayar: number;
  kembalian: number;
  catatan?: string;
  kasir_id: string;
  kasir_nama: string;
  items: ItemTransaksi[];
  created_at: string;
}

export interface HeldTransaction {
  id: string;
  hold_title: string;
  customer_name?: string;
  created_at: string;
  cart: CartItem[];
  diskon_total: number;
  catatan?: string;
}

export interface Pemasukan {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kategori_id: string;
  kategori_nama: string;
  jumlah: number;
  deskripsi: string;
  transaksi_id?: string;
  bukti?: string;
  user_id: string;
  user_nama: string;
  created_at: string;
}

export interface Pengeluaran {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kategori_id: string;
  kategori_nama: string;
  jumlah: number;
  deskripsi: string;
  vendor?: string;
  bukti?: string;
  user_id: string;
  user_nama: string;
  created_at: string;
}

export interface BahanBaku {
  id: string;
  nama_bahan: string;
  kategori: string;
  satuan: string; // kg, liter, pcs, gram, etc.
  stok_saat_ini: number;
  stok_minimum: number;
  harga_terakhir: number;
  supplier?: string;
  updated_at: string;
}

export type TipeStok = 'MASUK' | 'KELUAR';

export interface RiwayatStok {
  id: string;
  bahan_id: string;
  bahan_nama: string;
  tipe: TipeStok;
  jumlah: number;
  satuan: string;
  harga_satuan?: number;
  total_harga?: number;
  keterangan: string;
  tanggal: string; // YYYY-MM-DD
  user_nama: string;
  created_at: string;
}

export interface KategoriItem {
  id: string;
  nama: string;
  tipe: 'PEMASUKAN' | 'PENGELUARAN' | 'PRODUK';
}
