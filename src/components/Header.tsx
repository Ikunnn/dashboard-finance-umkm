import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Layers,
  PlusCircle,
  Receipt,
  ShieldCheck,
  Store,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const Header: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const {
    usaha,
    currentUser,
    switchRole,
    lowStockItems,
    setActiveTab,
    heldTransactions,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  // Today in Indonesian
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const roles: { role: UserRole; label: string; desc: string; badgeColor: string }[] = [
    {
      role: 'OWNER',
      label: 'Pemilik (Owner)',
      desc: 'Akses penuh ke semua modul, laporan, dan pengaturan',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      role: 'MANAGER',
      label: 'Manajer Operasional',
      desc: 'Kelola kasir, stok, pemasukan & pengeluaran harian',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      role: 'KASIR',
      label: 'Kasir / Staff',
      desc: 'Fokus transaksi POS kasir & cek ketersediaan stok',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      role: 'VIEWER',
      label: 'Viewer / Investor',
      desc: 'Pantau kinerja dashboard & laporan keuangan (view-only)',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile hamburger & Store Quick Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="btn-mobile-menu"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition-colors"
            title="Buka menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-slate-900 text-xs sm:text-base leading-tight truncate">
                  {usaha.nama_usaha}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {usaha.jenis_usaha}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{todayFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Tools: Quick Action, Alerts, Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
          {/* Quick Pos Action */}
          <button
            id="btn-quick-pos"
            onClick={() => setActiveTab('kasir')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Kasir Baru</span>
            {heldTransactions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-bold text-[10px]">
                {heldTransactions.length} Hold
              </span>
            )}
          </button>

          {/* Low Stock Notification Dropdown */}
          <div className="relative">
            <button
              id="btn-stock-alerts"
              onClick={() => {
                setShowAlertMenu(!showAlertMenu);
                setShowRoleMenu(false);
              }}
              className={`relative p-2 rounded-xl border transition-colors ${
                lowStockItems.length > 0
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Pemberitahuan Stok"
            >
              <Bell className="w-4 h-4" />
              {lowStockItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            {showAlertMenu && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white p-3.5 shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs text-slate-800">
                      Stok Bahan Menipis ({lowStockItems.length})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('stok');
                      setShowAlertMenu(false);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    Buka Stok <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-2 divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {lowStockItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <span>Semua stok bahan baku aman</span>
                    </div>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{item.nama_bahan}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Kategori: {item.kategori}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-bold text-[11px]">
                            {item.stok_saat_ini} {item.satuan}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Min: {item.stok_minimum} {item.satuan}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Selector */}
          <div className="relative">
            <button
              id="btn-role-switcher"
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowAlertMenu(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-emerald-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.nama} className="w-full h-full object-cover" />
                ) : (
                  currentUser.nama.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.nama}
                </p>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white p-2.5 shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Ganti Peran Pengguna (RBAC)</p>
                  <p className="text-[11px] text-slate-500">
                    Pilih akun untuk menguji batasan hak akses sistem
                  </p>
                </div>
                <div className="mt-1 space-y-1">
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start gap-2.5 ${
                        currentUser.role === r.role
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${r.badgeColor}`}
                      >
                        {r.role}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{r.label}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
