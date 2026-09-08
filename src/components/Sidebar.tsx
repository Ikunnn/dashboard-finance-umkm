import React from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  FileSpreadsheet,
  LayoutDashboard,
  Lock,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  X,
} from 'lucide-react';
import { NavTab, useApp } from '../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, canAccess, lowStockItems, heldTransactions, currentUser } = useApp();

  const navItems: {
    tab: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permissionKey: 'dashboard' | 'kasir' | 'pemasukan' | 'pengeluaran' | 'laporan' | 'stok' | 'pengaturan';
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      tab: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permissionKey: 'dashboard',
    },
    {
      tab: 'kasir',
      label: 'Kasir / POS',
      icon: ShoppingCart,
      permissionKey: 'kasir',
      badge: heldTransactions.length > 0 ? `${heldTransactions.length} Hold` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      tab: 'riwayat_kasir',
      label: 'Riwayat Transaksi',
      icon: Receipt,
      permissionKey: 'kasir',
    },
    {
      tab: 'produk',
      label: 'Katalog Produk',
      icon: Package,
      permissionKey: 'kasir',
    },
    {
      tab: 'pemasukan',
      label: 'Pencatatan Pemasukan',
      icon: ArrowDownLeft,
      permissionKey: 'pemasukan',
    },
    {
      tab: 'pengeluaran',
      label: 'Pencatatan Pengeluaran',
      icon: ArrowUpRight,
      permissionKey: 'pengeluaran',
    },
    {
      tab: 'laporan',
      label: 'Laporan Laba Rugi',
      icon: FileSpreadsheet,
      permissionKey: 'laporan',
    },
    {
      tab: 'stok',
      label: 'Stok Bahan Baku',
      icon: Boxes,
      permissionKey: 'stok',
      badge: lowStockItems.length > 0 ? lowStockItems.length : undefined,
      badgeColor: 'bg-red-100 text-red-700 border-red-300',
    },
    {
      tab: 'pengaturan',
      label: 'Pengaturan & Akses',
      icon: Settings,
      permissionKey: 'pengaturan',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
              F
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight block">
                Finance UMKM
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide block uppercase">
                Solusi Kasir & Laba Rugi
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {navItems.map(item => {
            const allowed = canAccess(item.permissionKey);
            const isActive = activeTab === item.tab;
            const Icon = item.icon;

            return (
              <button
                key={item.tab}
                id={`nav-${item.tab}`}
                disabled={!allowed}
                onClick={() => {
                  if (allowed) {
                    setActiveTab(item.tab);
                    onCloseMobile();
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : allowed
                    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : allowed ? 'text-slate-400' : 'text-slate-600'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {!allowed && <Lock className="w-3 h-3 text-slate-500" />}
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Low Stock Warning Card on Bottom Sidebar if any */}
        {lowStockItems.length > 0 && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-[11px] mb-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{lowStockItems.length} Bahan Baku Menipis</span>
            </div>
            <p className="text-[10px] text-amber-200/80 leading-snug">
              Ada stok bahan baku di bawah batas minimum. Harap segera restock.
            </p>
            <button
              onClick={() => {
                setActiveTab('stok');
                onCloseMobile();
              }}
              className="mt-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 underline"
            >
              Lihat Detail Stok &rarr;
            </button>
          </div>
        )}

        {/* User Role Status Footer */}
        <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400">Status Akun:</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
              {currentUser.role}
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-300 truncate mt-1">
            {currentUser.nama}
          </p>
        </div>
      </aside>
    </>
  );
};
