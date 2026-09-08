import React, { useState } from 'react';
import {
  Archive,
  Database,
  Download,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Settings,
  Shield,
  Store,
  Tag,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'OWNER', label: 'OWNER', desc: 'Akses penuh' },
  { value: 'MANAGER', label: 'MANAGER', desc: 'Operasional + laporan' },
  { value: 'KASIR', label: 'KASIR', desc: 'POS & pemasukan' },
  { value: 'VIEWER', label: 'VIEWER', desc: 'Read-only' },
];

export const PengaturanModule: React.FC = () => {
  const {
    usaha,
    updateUsaha,
    kategori,
    addKategori,
    deleteKategori,
    users,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    showToast,
  } = useApp();

  // Business Profile Form
  const [namaUsaha, setNamaUsaha] = useState(usaha.nama_usaha);
  const [jenisUsaha, setJenisUsaha] = useState(usaha.jenis_usaha);
  const [alamat, setAlamat] = useState(usaha.alamat);
  const [noTelepon, setNoTelepon] = useState(usaha.no_telepon);
  const [footerStruk, setFooterStruk] = useState(
    usaha.footer_struk || 'Terima kasih atas kunjungan Anda!'
  );
  const [logoPreview, setLogoPreview] = useState(usaha.logo || '/logo-poody.png');

  // Category Form
  const [namaKategoriBaru, setNamaKategoriBaru] = useState('');
  const [tipeKategoriBaru, setTipeKategoriBaru] = useState<'PEMASUKAN' | 'PENGELUARAN'>('PENGELUARAN');

  // User CRUD modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formHp, setFormHp] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('KASIR');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPass, setShowFormPass] = useState(false);

  const isOwner = currentUser?.role === 'OWNER';

  const openAddUser = () => {
    if (!isOwner) { showToast('Hanya OWNER yang bisa tambah pengguna', 'warning'); return; }
    setEditingId(null);
    setFormNama('');
    setFormEmail('');
    setFormHp('');
    setFormPassword('');
    setShowFormPass(false);
    setFormRole('KASIR');
    setShowUserModal(true);
  };

  const openEditUser = (u: typeof users[0]) => {
    if (!isOwner) { showToast('Hanya OWNER yang bisa edit pengguna', 'warning'); return; }
    setEditingId(u.id);
    setFormNama(u.nama);
    setFormEmail(u.email);
    setFormHp(u.no_hp || '');
    setFormPassword('');
    setShowFormPass(false);
    setFormRole(u.role);
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formEmail.trim()) {
      showToast('Nama & email wajib diisi', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      showToast('Format email tidak valid', 'warning');
      return;
    }
    // duplicate email guard
    const dup = users.find(u => u.email.toLowerCase() === formEmail.trim().toLowerCase() && u.id !== editingId);
    if (dup) { showToast('Email sudah dipakai pengguna lain', 'warning'); return; }

    if (editingId) {
      await updateUser(editingId, {
        nama: formNama.trim(),
        email: formEmail.trim().toLowerCase(),
        no_hp: formHp.trim() || undefined,
        role: formRole,
        ...(formPassword ? { password: formPassword } : {}),
      });
    } else {
      if (!formPassword || formPassword.length < 6) {
        showToast('Password minimal 6 karakter', 'warning');
        return;
      }
      await addUser({
        nama: formNama.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        no_hp: formHp.trim() || undefined,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(formEmail.trim().toLowerCase())}`,
        is_active: true,
        usaha_id: usaha.id,
        password: formPassword,
      });
    }
    setShowUserModal(false);
    setEditingId(null);
  };

  const handleDeleteUser = (id: string) => {
    if (!isOwner) { showToast('Hanya OWNER yang bisa hapus', 'warning'); return; }
    if (!confirm('Hapus pengguna ini? Tidak bisa dibatalkan.')) return;
    deleteUser(id);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('File harus gambar (PNG/JPG)', 'warning'); return; }
    if (file.size > 800 * 1024) { showToast('Maks 800KB biar ringan di HP', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
    // reset input biar bisa pilih file sama lagi
    e.target.value = '';
  };
  const handleResetLogo = () => {
    setLogoPreview('/logo-poody.png');
    showToast('Logo direset ke default Poody', 'info');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUsaha({
      nama_usaha: namaUsaha,
      jenis_usaha: jenisUsaha,
      alamat,
      no_telepon: noTelepon,
      footer_struk: footerStruk,
      logo: logoPreview,
    });
  };

  const handleAddKategori = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategoriBaru.trim()) return;
    addKategori(namaKategoriBaru.trim(), tipeKategoriBaru);
    setNamaKategoriBaru('');
  };

  // Backup 1-klik: export/import JSON semua data warung
  const BACKUP_KEYS = ['umkm_usaha','umkm_users','umkm_produk','umkm_bahan_baku','umkm_riwayat_stok','umkm_transaksi','umkm_pemasukan','umkm_pengeluaran','umkm_kategori'] as const;
  const handleExportBackup = () => {
    const payload: Record<string, any> = {};
    for (const k of BACKUP_KEYS) {
      const raw = localStorage.getItem(k);
      try { payload[k] = raw ? JSON.parse(raw) : null; } catch { payload[k] = raw; }
    }
    const out = { version: 1, app: 'Poody Warung OS', exportedAt: new Date().toISOString(), data: payload };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date().toISOString().slice(0,10);
    a.href = url; a.download = `poody-backup-${d}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup JSON berhasil diunduh', 'success');
  };
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const data = parsed.data || parsed; // support both wrapped and raw
        const hasAnyKey = BACKUP_KEYS.some(k => k in data);
        if (!hasAnyKey) { showToast('File backup tidak valid', 'error'); return; }
        if (!confirm('Restore backup? Data sekarang akan diganti dengan isi file. Lanjutkan?')) return;
        for (const k of BACKUP_KEYS) {
          if (k in data && data[k] !== null && data[k] !== undefined) {
            localStorage.setItem(k, JSON.stringify(data[k]));
          }
        }
        showToast('Restore berhasil — halaman akan dimuat ulang', 'success');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        showToast('Gagal baca file backup — pastikan JSON valid', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Pengaturan Sistem & Hak Akses</h2>
            <p className="text-xs text-slate-400">
              Profil UMKM, kategori transaksi & manajemen role pengguna
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Profil Usaha */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="font-bold text-sm text-slate-900">Profil Usaha (Struk & Laporan)</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            {/* Logo Icon — OWNER can change */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <img src={logoPreview} alt="Logo Poody" className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-200 p-1.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <label className="font-bold text-slate-700 block mb-1">Logo Icon</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
                    <span>📷 Ganti Logo</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoFile} className="hidden" />
                  </label>
                  <button type="button" onClick={handleResetLogo} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Reset default</button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">PNG/JPG/WebP max 800KB. Akan nongol di Sidebar, Header & Login di semua HP (sinkron).</p>
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Usaha *</label>
              <input
                type="text"
                required
                value={namaUsaha}
                onChange={e => setNamaUsaha(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Bidang / Jenis Usaha</label>
              <input
                type="text"
                value={jenisUsaha}
                onChange={e => setJenisUsaha(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Alamat Usaha</label>
              <textarea
                rows={2}
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">No. WhatsApp / Telp</label>
                <input
                  type="text"
                  value={noTelepon}
                  onChange={e => setNoTelepon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Kaki Struk</label>
                <input
                  type="text"
                  value={footerStruk}
                  onChange={e => setFooterStruk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Manajemen Pengguna (RBAC) — full CRUD */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">Manajemen Pengguna</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {users.length} Akun
              </span>
              <button
                onClick={openAddUser}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors ${isOwner ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                title={isOwner ? 'Tambah pengguna baru' : 'Hanya OWNER'}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Klik kartu untuk <b>beralih akun</b> (uji hak akses). {isOwner ? 'OWNER bisa tambah / edit / hapus.' : 'Hanya OWNER yang bisa kelola.'}
          </p>

          <div className="space-y-2">
            {users.map(u => {
              const isCurrent = currentUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    showToast(`Beralih ke ${u.nama} (${u.role})`, 'info');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {u.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <span className="truncate">{u.nama}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                            Aktif
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      {u.no_hp && <p className="text-[10px] text-slate-400">{u.no_hp}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        u.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'MANAGER'
                          ? 'bg-blue-100 text-blue-800'
                          : u.role === 'KASIR'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                    {/* actions — stopPropagation so card click doesn't fire */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditUser(u); }}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                      disabled={users.length <= 1 || u.id === currentUser?.id}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center ${users.length <= 1 || u.id === currentUser?.id ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600'}`}
                      title={u.id === currentUser?.id ? 'Tidak bisa hapus akun login' : users.length <= 1 ? 'Minimal 1 akun' : 'Hapus'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RBAC Matrix */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
            <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>Matriks Izin Role:</span>
            </h5>
            <ul className="text-slate-600 space-y-1 pl-1">
              <li>• <strong>OWNER:</strong> Akses penuh semua modul & pengaturan.</li>
              <li>• <strong>MANAGER:</strong> Kasir, pemasukan, pengeluaran, stok, laporan.</li>
              <li>• <strong>KASIR:</strong> Dashboard, kasir POS, stok.</li>
              <li>• <strong>VIEWER:</strong> Dashboard & laporan (read-only).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit User */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowUserModal(false)} />
          <form
            onSubmit={handleSubmitUser}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 animate-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h4>
              <button type="button" onClick={() => setShowUserModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ani Kasir"
                  value={formNama}
                  onChange={e => setFormNama(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="ani@poody.id"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">No. HP (opsional)</label>
                <input
                  type="tel"
                  placeholder="0812-xxxx-xxxx"
                  value={formHp}
                  onChange={e => setFormHp(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {editingId ? 'Password baru (kosongkan jika tidak ganti)' : 'Password * (min 6)'}
                </label>
                <div className="relative">
                  <input
                    type={showFormPass ? 'text' : 'password'}
                    required={!editingId}
                    placeholder={editingId ? '••••••' : 'min 6 karakter'}
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPass(!showFormPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
                  >
                    {showFormPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role / Hak Akses *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`px-3 py-2.5 rounded-xl border cursor-pointer flex flex-col gap-0.5 transition-colors ${formRole === opt.value ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value={opt.value}
                          checked={formRole === opt.value}
                          onChange={() => setFormRole(opt.value)}
                          className="accent-emerald-600"
                        />
                        <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 ml-6">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">Data tersimpan di browser (localStorage), tanpa edit code.</p>
          </form>
        </div>
      )}

      {/* 3. Backup 1-Klik (OWNER only) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">Backup & Restore</h3>
          <span className="ml-auto text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">1-klik</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">Export semua data warung (transaksi, stok, pemasukan, user, kategori) jadi 1 file JSON. Simpan di Google Drive. Kalau HP hilang / ganti HP, Restore file itu — semua balik.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
          >
            <Download className="w-4 h-4" /> Export Backup (.json)
          </button>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer">
            <Upload className="w-4 h-4" /> Restore Backup
            <input type="file" accept=".json,application/json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Archive className="w-3.5 h-3.5 shrink-0" />
          <span>Tips: Export tiap <b className="text-slate-600">minggu</b> atau sebelum tutup bulan. File aman dibuka offline.</span>
        </div>
      </div>

      {/* 4. Manajemen Kategori */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Kategori Pemasukan & Pengeluaran ({kategori.length})
            </h3>
          </div>
        </div>

        <form onSubmit={handleAddKategori} className="flex flex-col sm:flex-row gap-2">
          <select
            value={tipeKategoriBaru}
            onChange={e => setTipeKategoriBaru(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="PEMASUKAN">Pemasukan (+)</option>
            <option value="PENGELUARAN">Pengeluaran (-)</option>
          </select>

          <input
            type="text"
            required
            placeholder="Nama kategori baru (contoh: Biaya Kemasan)..."
            value={namaKategoriBaru}
            onChange={e => setNamaKategoriBaru(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
            <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
              Kategori Pemasukan
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {kategori
                .filter(k => k.tipe === 'PEMASUKAN')
                .map(k => (
                  <span
                    key={k.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-medium shadow-2xs"
                  >
                    <span>{k.nama}</span>
                    <button
                      onClick={() => deleteKategori(k.id)}
                      className="text-slate-400 hover:text-red-500"
                      title="Hapus"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-red-100 bg-red-50/40 space-y-2">
            <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">
              Kategori Pengeluaran
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {kategori
                .filter(k => k.tipe === 'PENGELUARAN')
                .map(k => (
                  <span
                    key={k.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-800 text-xs font-medium shadow-2xs"
                  >
                    <span>{k.nama}</span>
                    <button
                      onClick={() => deleteKategori(k.id)}
                      className="text-slate-400 hover:text-red-500"
                      title="Hapus"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
