import React, { useState } from 'react';
import { Header } from './components/Header';
import { DashboardModule } from './components/modules/DashboardModule';
import { LaporanModule } from './components/modules/LaporanModule';
import { PemasukanModule } from './components/modules/PemasukanModule';
import { PengaturanModule } from './components/modules/PengaturanModule';
import { PengeluaranModule } from './components/modules/PengeluaranModule';
import { PosModule } from './components/modules/PosModule';
import { ProdukModule } from './components/modules/ProdukModule';
import { RiwayatKasirModule } from './components/modules/RiwayatKasirModule';
import { StokModule } from './components/modules/StokModule';
import { ReceiptModal } from './components/ReceiptModal';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { LoginPage } from './components/LoginPage';
import { AppProvider, useApp } from './context/AppContext';
import { useCloudSync } from './hooks/useCloudSync';
import { Transaksi } from './types';

const MainAppContent: React.FC = () => {
  const { activeTab, isAuthenticated } = useApp();
  useCloudSync();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaksi | null>(null);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderCurrentModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardModule onSelectReceipt={setSelectedReceipt} />;
      case 'kasir':
        return <PosModule onOpenReceipt={setSelectedReceipt} />;
      case 'riwayat_kasir':
        return <RiwayatKasirModule onSelectReceipt={setSelectedReceipt} />;
      case 'produk':
        return <ProdukModule />;
      case 'pemasukan':
        return <PemasukanModule />;
      case 'pengeluaran':
        return <PengeluaranModule />;
      case 'laporan':
        return <LaporanModule />;
      case 'stok':
        return <StokModule />;
      case 'pengaturan':
        return <PengaturanModule />;
      default:
        return <DashboardModule onSelectReceipt={setSelectedReceipt} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderCurrentModule()}
        </main>

        <BottomNav onOpenMenu={() => setMobileSidebarOpen(true)} />
      </div>

      <ReceiptModal
        transaksi={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
