import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  LayoutDashboard,
  Menu,
  Receipt,
  ShoppingCart,
} from 'lucide-react';
import { NavTab, useApp } from '../context/AppContext';

interface BottomNavProps {
  onOpenMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMenu }) => {
  const {
    activeTab,
    setActiveTab,
    cart,
    heldTransactions,
    lowStockItems,
    canAccess,
  } = useApp();

  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  const navItems: {
    tab: NavTab | 'menu';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    action?: () => void;
  }[] = [
    {
      tab: 'dashboard',
      label: 'Beranda',
      icon: LayoutDashboard,
      action: () => setActiveTab('dashboard'),
    },
    {
      tab: 'kasir',
      label: 'Kasir',
      icon: ShoppingCart,
      badge: totalCartQty > 0 ? totalCartQty : heldTransactions.length > 0 ? `${heldTransactions.length}H` : undefined,
      badgeColor: totalCartQty > 0 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950',
      action: () => setActiveTab('kasir'),
    },
    {
      tab: 'pemasukan',
      label: 'Pemasukan',
      icon: ArrowDownLeft,
      action: () => {
        if (canAccess('pemasukan')) setActiveTab('pemasukan');
      },
    },
    {
      tab: 'pengeluaran',
      label: 'Pengeluaran',
      icon: ArrowUpRight,
      action: () => {
        if (canAccess('pengeluaran')) setActiveTab('pengeluaran');
      },
    },
    {
      tab: 'menu',
      label: 'Menu',
      icon: Menu,
      badge: lowStockItems.length > 0 ? lowStockItems.length : undefined,
      badgeColor: 'bg-red-500 text-white',
      action: onOpenMenu,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom shadow-lg"
    >
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map(item => {
          const isActive = item.tab !== 'menu' && activeTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-emerald-600" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-black shadow-xs ${
                      item.badgeColor || 'bg-slate-800 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-emerald-700' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
