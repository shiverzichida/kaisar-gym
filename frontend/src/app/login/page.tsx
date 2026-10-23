'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Building2,
  Check,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('kaisar123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRoleKey, setActiveRoleKey] = useState('owner');

  const demoRoles = [
    {
      key: 'owner',
      label: 'Admin / Owner',
      username: 'owner',
      password: 'kaisar123',
      name: 'Kaisar Putra',
      role: 'Super Admin',
      note: 'Akses penuh omset & master data',
    },
    {
      key: 'manager',
      label: 'Ops Manager',
      username: 'manager',
      password: 'kaisar123',
      name: 'Dimas Prakoso',
      role: 'Ops Manager',
      note: 'Kontrol gate, shift, & approval',
    },
    {
      key: 'kasir',
      label: 'Kasir / Front Desk',
      username: 'kasir',
      password: 'kaisar123',
      name: 'Rina Marlina',
      role: 'Cashier',
      note: 'POS kasir, nota A4, & buka gate',
    },
    {
      key: 'marketing',
      label: 'Marketing & CRM',
      username: 'sales',
      password: 'kaisar123',
      name: 'Kevin Sanjaya',
      role: 'Marketing',
      note: 'Voucher promo & WhatsApp member',
    },
  ];

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    if (!u.trim()) {
      showError('Harap masukkan username', 'Username Kosong');
      return;
    }

    setLoading(true);
    try {
      const user = await login(u.trim(), p);
      showSuccess(`Selamat datang, ${user.fullName}`, 'Login Berhasil');
      router.push('/');
    } catch (err: any) {
      showError(err.message || 'Username atau kata sandi tidak valid', 'Gagal Masuk');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSelect = (role: (typeof demoRoles)[0]) => {
    setActiveRoleKey(role.key);
    setUsername(role.username);
    setPassword(role.password);
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-[#0A1128]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img
            src="/assets/img/kaisar-gym-logo-circle.png"
            alt="Kaisar Gym"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-[#FFC067]/40"
          />
          <div>
            <span className="font-extrabold text-white text-sm tracking-tight">
              Kaisar<span className="text-[#FFC067]">GYM</span>
            </span>
            <span className="text-slate-500 text-xs ml-2 hidden sm:inline">• Jl. Patimura No.84, Pontianak</span>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5"
        >
          <span>Langsung ke Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-block p-2.5 rounded-2xl bg-[#070D1E] border border-white/10 mb-3.5 shadow-md">
                <img
                  src="/assets/img/kaisar-gym-logo-circle.png"
                  alt="Kaisar Gym"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Masuk ke Sistem POS &amp; Gym
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan kredensial kerja Anda untuk membuka sesi
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070D1E] border border-white/10 focus:border-[#FFC067] text-white text-xs placeholder:text-slate-500 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Kata Sandi
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Default: <code className="text-[#FFC067] font-mono">kaisar123</code>
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#070D1E] border border-white/10 focus:border-[#FFC067] text-white text-xs placeholder:text-slate-500 focus:outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-[#FFC067]/15 disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Segmented Switcher */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Pilihan Akun Demo</span>
                <span className="text-[10px] text-slate-500 normal-case font-normal">Klik untuk mengisi form, lalu tekan Masuk</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {demoRoles.map((role) => {
                  const isActive = activeRoleKey === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => handleQuickRoleSelect(role)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? 'border-[#FFC067] bg-[#FFC067]/10'
                          : 'border-white/5 bg-[#070D1E] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate block">
                          {role.label}
                        </span>
                        {isActive && <Check className="w-3 h-3 text-[#FFC067] shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        {role.username} • kaisar123
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-white/5">
        <span>Kaisar Gym Pontianak • Sistem Operasional &amp; Kontrol Turnstile Gate Terintegrasi</span>
      </footer>
    </div>
  );
}
