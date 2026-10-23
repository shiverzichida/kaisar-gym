'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { apiFetch } from '@/lib/api';
import {
  Users,
  Award,
  ArrowLeft,
  Lock,
  Phone,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginAsMember, loginAsCoach, user } = usePortalAuth();

  const [activeTab, setActiveTab] = useState<'MEMBER' | 'COACH'>('MEMBER');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample data for quick 1-click demo login
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'coach') setActiveTab('COACH');
    else if (tabParam === 'member') setActiveTab('MEMBER');

    // Fetch members and trainers for quick 1-click test
    Promise.all([
      apiFetch('/members').catch(() => []),
      apiFetch('/trainers').catch(() => []),
    ]).then(([mList, tList]) => {
      setAvailableMembers(Array.isArray(mList) ? mList.slice(0, 4) : []);
      setAvailableTrainers(Array.isArray(tList) ? tList.slice(0, 4) : []);
    });
  }, [searchParams]);

  // Handle manual login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'MEMBER') {
        // Find member in DB
        const members = await apiFetch<any[]>('/members');
        const found = members.find(
          (m) =>
            m.memberCode.toLowerCase() === identifier.trim().toLowerCase() ||
            (m.phone && m.phone.replace(/[^0-9]/g, '') === identifier.trim().replace(/[^0-9]/g, '')) ||
            m.fullName.toLowerCase().includes(identifier.trim().toLowerCase())
        );

        if (!found) {
          throw new Error('Data Member tidak ditemukan. Silakan cek Kode Member atau No HP.');
        }

        loginAsMember(found);
        router.push('/member');
      } else {
        // Find trainer in DB
        const trainers = await apiFetch<any[]>('/trainers');
        const found = trainers.find(
          (t) =>
            t.code.toLowerCase() === identifier.trim().toLowerCase() ||
            (t.phone && t.phone.replace(/[^0-9]/g, '') === identifier.trim().replace(/[^0-9]/g, '')) ||
            t.fullName.toLowerCase().includes(identifier.trim().toLowerCase())
        );

        if (!found) {
          throw new Error('Data Coach/Trainer tidak ditemukan. Cek Kode PT (contoh: TR-001) atau No HP.');
        }

        loginAsCoach(found);
        router.push('/coach');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali data login Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click login helper
  const handleQuickMemberLogin = (m: any) => {
    loginAsMember(m);
    router.push('/member');
  };

  const handleQuickCoachLogin = (t: any) => {
    loginAsCoach(t);
    router.push('/coach');
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-[#FFC067] selection:text-slate-950 font-sans">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto pt-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl bg-[#0F172A] border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Website</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-emerald-400 font-bold">PORTAL ONLINE</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
        {/* Brand Badge */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#FFC067] mx-auto shadow-gold bg-black flex items-center justify-center p-1">
            <img
              src="/assets/img/kaisar-gym-logo.png"
              alt="Kaisar Gym"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            KAISAR <span className="text-[#FFC067]">GYM</span>
          </h1>
          <p className="text-xs text-slate-400">
            Masuk ke portal khusus Member atau Personal Trainer
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="p-1 rounded-2xl bg-[#0F172A] border border-white/10 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('MEMBER');
              setError('');
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'MEMBER'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Portal Member</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('COACH');
              setError('');
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'COACH'
                ? 'bg-gradient-to-r from-[#FFC067] to-[#E5A850] text-slate-950 shadow-gold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Portal Coach (PT)</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 rounded-3xl bg-[#0F172A] border border-white/10 p-6 shadow-2xl">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">
              {activeTab === 'MEMBER' ? 'Kode Member atau No. Telepon / WA' : 'Kode Trainer atau No. Telepon'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={activeTab === 'MEMBER' ? 'Contoh: KG-2026-0001 atau 0812...' : 'Contoh: TR-001 atau PT-031'}
                required
                className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">PIN Keamanan (Default: 1234)</label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                maxLength={6}
                className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-4 py-3 text-xs text-white tracking-widest focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 ${
              activeTab === 'MEMBER'
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                : 'bg-gradient-to-r from-[#FFC067] to-[#E5A850] hover:from-[#ffd089] text-slate-950 shadow-gold'
            }`}
          >
            {loading ? (
              <span>Memverifikasi Akun...</span>
            ) : (
              <span>Masuk ke {activeTab === 'MEMBER' ? 'Portal Member' : 'Portal Personal Trainer'} »</span>
            )}
          </button>
        </form>

        {/* 1-Click Fast Demo Login Switcher */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC067]" />
            <span>Akses Cepat (Demo Langsung):</span>
          </div>

          {activeTab === 'MEMBER' ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickMemberLogin({
                    id: '19fa0f84-34ae-45cb-8b1b-cc8a7b6babf0',
                    memberCode: 'KG-2026-0011',
                    fullName: 'NAHEL AL FATH ICHIDA',
                    phone: '08716237124124',
                    status: 'ACTIVE',
                  })
                }
                className="w-full text-left p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-cyan-500/30 text-xs transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>NAHEL AL FATH ICHIDA</span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">KG-2026-0011</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Member VIP Aktif (Sesuai Referensi Portal)
                  </div>
                </div>
                <span className="text-[11px] font-bold text-cyan-400 shrink-0">Pilih »</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickMemberLogin({
                    id: 'e89a9c2e-27f7-4b97-9887-f8494dd396a0',
                    memberCode: 'KG-2026-0001',
                    fullName: 'Budi Santoso',
                    phone: '081299887766',
                    status: 'ACTIVE',
                  })
                }
                className="w-full text-left p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Budi Santoso</span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">KG-2026-0001</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Paket 12 Sesi PT dengan Coach Hendra
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Pilih »</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickCoachLogin({
                    id: 'd4300469-6528-41a0-9516-6e44a0754a1e',
                    code: 'TR-001',
                    fullName: 'Coach Hendra Pratama',
                    specialization: 'Strength & Conditioning',
                    phone: '081288990011',
                  })
                }
                className="w-full text-left p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-[#FFC067]/40 text-xs transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Coach Hendra Pratama</span>
                    <span className="font-mono text-[10px] text-[#FFC067] font-bold">TR-001</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Strength Coach • 3 Klien Aktif • Komisi Flat 50%
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#FFC067] shrink-0">Pilih »</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickCoachLogin({
                    id: 'c26ec09d-f000-4ccb-b56b-97b66b603518',
                    code: 'TR-003',
                    fullName: 'Coach Riko Saputra',
                    specialization: 'Functional Boxing & Combat',
                    phone: '081288990033',
                  })
                }
                className="w-full text-left p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Coach Riko Saputra</span>
                    <span className="font-mono text-[10px] text-blue-400 font-bold">TR-003</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Boxing &amp; Combat Specialist
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Pilih »</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-slate-500 text-xs py-2">
        Kaisar Gym Pontianak © 2026 • Single Source of Truth Database
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070D1E] flex items-center justify-center text-slate-400 text-xs font-semibold">
          Memuat Portal Kaisar Gym...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
