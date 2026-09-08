import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Shield, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email & password wajib diisi');
      return;
    }
    setLoading(true);
    const ok = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!ok) {
      setError('Email atau password salah, atau akun nonaktif');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <img src="/logo-poody.png" alt="Poody" className="w-14 h-14 rounded-2xl object-contain bg-white p-1.5 shadow mx-auto border border-slate-100" />
          <h1 className="mt-3 font-black text-slate-900 text-xl tracking-tight">Finance UMKM</h1>
          <p className="text-xs text-slate-500 mt-1">Masuk untuk kelola kasir, stok & laporan</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="rizqan@poody.id"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {loading ? 'Memeriksa...' : 'Masuk'}
          </button>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Demo akun awal:
            </p>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] leading-relaxed text-slate-600">
              <b>Rizqan (OWNER)</b><br />
              rizqan@poody.id / <code className="bg-white px-1 py-0.5 rounded border">rizqan123</code>
              <br />
              <span className="text-slate-400">Ganti password di Pengaturan → Manajemen Pengguna → Edit</span>
            </div>
          </div>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Lupa password? Minta OWNER reset di Pengaturan.
        </p>
      </div>
    </div>
  );
};
