'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Sparkles,
  Users,
  Calendar,
  Award,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Percent,
  QrCode,
  Zap,
  Flame,
  HeartPulse,
  ExternalLink,
  Lock,
  MessageCircle,
  Activity,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  const [selectedDay, setSelectedDay] = useState<'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU'>('SENIN');

  const scheduleData = {
    SENIN: [
      { name: 'PILATES MIX', time: '09:00 - 10:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 3, category: 'PILATES REFORMER' },
      { name: 'Reformer Strength', time: '16:00 - 17:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 2, category: 'PILATES REFORMER' },
      { name: 'BODY COMBAT', time: '18:30 - 19:30', coach: 'Coach Riko', room: 'Studio Aerobik 1', spots: 6, category: 'BODY COMBAT' },
      { name: 'HIIT Performance', time: '19:45 - 20:45', coach: 'Coach Hendra', room: 'Functional Area', spots: 5, category: 'STRENGTH' },
    ],
    SELASA: [
      { name: 'PILATES BODY FIT', time: '09:00 - 10:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 4, category: 'PILATES REFORMER' },
      { name: 'Tower Strength', time: '10:15 - 11:15', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 2, category: 'PILATES REFORMER' },
      { name: 'ZUMBA DANCE PARTY', time: '18:30 - 19:30', coach: 'Coach Indah', room: 'Studio Aerobik 1', spots: 8, category: 'DANCE FITNESS' },
    ],
    RABU: [
      { name: 'Pilates Reformer Ring', time: '09:00 - 10:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 3, category: 'PILATES REFORMER' },
      { name: 'Boxing Functional', time: '17:00 - 18:00', coach: 'Coach Riko', room: 'Boxing Arena', spots: 4, category: 'COMBAT' },
      { name: 'Tower Flow', time: '19:00 - 20:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 1, category: 'PILATES REFORMER' },
    ],
    KAMIS: [
      { name: 'Reformer Booty & Abs', time: '09:00 - 10:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 2, category: 'PILATES REFORMER' },
      { name: 'Body Sculpting', time: '18:30 - 19:30', coach: 'Coach Hendra', room: 'Studio Aerobik 1', spots: 5, category: 'STRENGTH' },
    ],
    JUMAT: [
      { name: 'Reformer Burn', time: '09:00 - 10:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 3, category: 'PILATES REFORMER' },
      { name: 'Core & Mobility Flow', time: '17:30 - 18:30', coach: 'Coach Rio', room: 'Functional Area', spots: 6, category: 'MOBILITY' },
      { name: 'Friday Night Combat', time: '19:00 - 20:00', coach: 'Coach Riko', room: 'Studio Aerobik 1', spots: 4, category: 'BODY COMBAT' },
    ],
    SABTU: [
      { name: 'Weekend Reformer Flow', time: '09:00 - 10:00', coach: 'Coach MEI', room: 'Pilates Sanctuary', spots: 2, category: 'PILATES REFORMER' },
      { name: 'Super Zumba Weekend', time: '10:30 - 11:30', coach: 'Coach Indah', room: 'Studio Aerobik 1', spots: 10, category: 'DANCE FITNESS' },
      { name: 'Hypertrophy Workshop', time: '16:00 - 17:30', coach: 'Coach Hendra', room: 'Gym Olympic Floor', spots: 5, category: 'STRENGTH' },
    ],
  };

  const coaches = [
    {
      name: 'Coach Hendra Pratama',
      role: 'Head Coach • Strength & Conditioning',
      spec: 'Hypertrophy, Olympic Lifting & Athletic Bodybuilding',
      exp: '8+ Tahun Pengalaman',
      code: 'TR-001',
      badge: 'Certified CSCS',
    },
    {
      name: 'Coach MEI',
      role: 'Lead Pilates Reformer Instructor',
      spec: 'Reformer Ring, Cadillac Tower, Core & Postural Rehab',
      exp: 'Master Pilates Trainer',
      code: 'PT-031',
      badge: 'Certified Pilates',
    },
    {
      name: 'Coach Riko Saputra',
      role: 'Combat & Functional Specialist',
      spec: 'Boxing Functional, Body Combat & High-Intensity Conditioning',
      exp: '6+ Tahun Pengalaman',
      code: 'TR-003',
      badge: 'Boxing Coach',
    },
    {
      name: 'Coach Rio Junior Putra',
      role: 'Body Transformation Specialist',
      spec: 'Fat Loss, Muscle Hypertrophy & Nutrition Coaching',
      exp: '5+ Tahun Pengalaman',
      code: 'TR-004',
      badge: 'Certified Trainer',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 selection:bg-[#FFC067] selection:text-slate-950 font-sans antialiased">
      {/* ══════════════ 1. TOP GLOBAL ANNOUNCEMENT BAR ══════════════ */}
      <div className="bg-[#050A18] border-b border-white/10 px-4 py-2 text-[11px] text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Status Gym: Buka Hari Ini</span>
            <span className="text-slate-400 hidden sm:inline">• 06:00 – 22:00 WIB</span>
            <span className="text-slate-500 hidden md:inline">| Jl. Patimura No.84, Pontianak</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
            >
              <span>Kasir &amp; POS (pos.kaisargym.com)</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
          </div>
        </div>
      </div>

      {/* ══════════════ 2. STICKY NAVBAR ══════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070D1E]/90 border-b border-white/10 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFC067]/70 shadow-gold group-hover:scale-105 transition shrink-0 bg-black flex items-center justify-center p-0.5">
              <img
                src="/assets/img/kaisar-gym-logo.png"
                alt="Kaisar Gym Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-wider text-white">KAISAR</span>
                <span className="font-black text-xl tracking-wider text-[#FFC067]">GYM</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Pontianak Luxury Fitness
              </p>
            </div>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#portal-akses" className="hover:text-[#FFC067] transition">Portal Online</a>
            <a href="#fasilitas" className="hover:text-[#FFC067] transition">Fasilitas</a>
            <a href="#jadwal" className="hover:text-[#FFC067] transition">Jadwal Studio</a>
            <a href="#coaches" className="hover:text-[#FFC067] transition">Personal Trainer</a>
            <a href="#membership" className="hover:text-[#FFC067] transition">Membership</a>
            <a href="#lokasi" className="hover:text-[#FFC067] transition">Lokasi</a>
          </nav>

          {/* Right Action: Login Portal */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] hover:from-[#ffd089] hover:to-[#f0b55f] text-slate-950 font-black text-xs shadow-gold hover:shadow-lg transition active:scale-95 flex items-center gap-2 hover-shine"
            >
              <Users className="w-4 h-4" />
              <span>Masuk Portal »</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════ 3. HERO SECTION (ASYMMETRIC SPLIT SCREEN) ══════════════ */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 border-b border-white/10">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#FFC067]/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-bold text-[#FFC067]">
                <Sparkles className="w-3.5 h-3.5 text-[#FFC067]" />
                <span>PUSAT KEBUGARAN &amp; PILATES REFORMER TERLENGKAP DI PONTIANAK</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Standar Kebugaran Baru, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC067] via-amber-200 to-white">
                  Fasilitas Bintang Lima
                </span>{' '}
                &amp; Pelatihan Terukur.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Nikmati pengalaman gym premium di jantung kota Pontianak. Dilengkapi Pilates Reformer Sanctuary privat, platform Olympic Deadlift berperedam suara, studio kelas energik, Smart Face ID gate, dan Personal Trainer tersertifikasi dengan komitmen bagi hasil adil.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] hover:from-[#ffd089] hover:to-[#f0b55f] text-slate-950 font-black text-sm shadow-gold flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 hover-shine"
                >
                  <Users className="w-4 h-4" />
                  <span>Akses Portal Member &amp; Coach</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#jadwal"
                  className="px-6 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Jadwal Kelas Hari Ini</span>
                </a>
              </div>

              {/* 4 Highlights Ticker */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10">
                <div>
                  <div className="text-2xl font-black text-[#FFC067]">1,200+</div>
                  <div className="text-xs text-slate-400 font-semibold">Member Aktif</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-cyan-400">10+</div>
                  <div className="text-xs text-slate-400 font-semibold">Certified Coaches</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">28+</div>
                  <div className="text-xs text-slate-400 font-semibold">Kelas / Minggu</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-purple-400">50 : 50</div>
                  <div className="text-xs text-slate-400 font-semibold">Flat Coach Split</div>
                </div>
              </div>
            </div>

            {/* Right Card Visual (5 Cols) with Real Kaisar Gym Image & Shine Effect */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#0F172A] to-[#070D1E] p-3 shadow-2xl overflow-hidden relative group">
                <div className="rounded-2xl overflow-hidden relative h-[380px] sm:h-[440px] bg-slate-950">
                  <img
                    src="/assets/img/kaisar-gym-gate-access.png"
                    alt="Kaisar Gym Smart Gate Turnstile & Facility"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  {/* Kilapan Cahaya Emas / Light Sweep Sheen */}
                  <div className="shine-overlay" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Overlaid Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Smart Face ID Turnstile Access</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      Live Gate
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#0F172A]/90 backdrop-blur-md border border-white/15 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Kapasitas Gym Saat Ini:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> 184 Member Latihan
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Akses cepat tanpa antre dengan scan wajah atau QR Code di HP Anda.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 4. SECTION DUA PORTAL KHUSUS (MEMBER & PT) ══════════════ */}
      <section id="portal-akses" className="py-20 bg-[#050A18] border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-[#FFC067] uppercase tracking-widest">
              Akses Mandiri Dari HP
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Satu Ekosistem, Dua Portal Khusus
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Pengalaman digital praktis untuk Member dan Coach Kaisar Gym tanpa perlu instal aplikasi berat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card 1: Portal Member */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F172A] to-[#070D1E] p-6 sm:p-8 space-y-6 shadow-2xl hover:border-cyan-500/40 transition flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-500/30">
                    Untuk Member Gym
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">Portal Member Kaisar Gym</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Semua kebutuhan gym Anda dalam satu genggaman tangan.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/10 h-44 relative bg-slate-900">
                  <img
                    src="/assets/img/kaisar-gym-mobile-booking.png"
                    alt="Member Mobile Booking & E-Card"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-[11px] text-white font-bold bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    📱 VIP E-Card QR Code &amp; Jadwal Sesi PT Transparan
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>E-Card &amp; QR Code Digital:</strong> Buka pintu gate otomatis tanpa kartu fisik.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Pelacak Kuota Sesi PT:</strong> Cek sisa sesi latihan live langsung dari smartphone.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>1-Klik Booking Studio:</strong> Amankan slot Reformer &amp; Zumba tanpa antre.</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?tab=member"
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Masuk ke Portal Member</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 2: Portal Personal Trainer */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F172A] to-[#070D1E] p-6 sm:p-8 space-y-6 shadow-2xl hover:border-[#FFC067]/40 transition flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFC067]/20 border border-[#FFC067]/30 flex items-center justify-center text-[#FFC067] shadow-gold-sm">
                    <Award className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FFC067]/10 text-[#FFC067] text-[10px] font-black uppercase tracking-wider border border-[#FFC067]/30">
                    Untuk Coach &amp; PT
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">Portal Personal Trainer (Coach)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Dashboard profesional untuk mengelola bimbingan klien &amp; komisi.
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/10 h-44 relative bg-slate-900">
                  <img
                    src="/assets/img/kaisar-gym-pt-session.png"
                    alt="PT Coaching Session & Digital Verification"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-[11px] text-white font-bold bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    🏋️ 1-Klik Presensi Sesi Latihan &amp; Live Bagi Hasil 50:50
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FFC067] shrink-0 mt-0.5" />
                    <span><strong>1-Klik Sign-Off Sesi:</strong> Potong sesi klien langsung sehabis melatih dari HP.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FFC067] shrink-0 mt-0.5" />
                    <span><strong>Live Komisi Flat 50%:</strong> Saldo komisi per sesi terhitung otomatis dan transparan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FFC067] shrink-0 mt-0.5" />
                    <span><strong>Kelola Klien Bimbingan:</strong> Riwayat beban, otot yang dilatih, dan evaluasi.</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?tab=coach"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] hover:from-[#ffd089] hover:to-[#f0b55f] text-slate-950 font-black text-xs shadow-gold transition flex items-center justify-center gap-2"
              >
                <span>Masuk ke Portal Coach (PT)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 5. FASILITAS BINTANG LIMA ══════════════ */}
      <section id="fasilitas" className="py-20 border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-[#FFC067] uppercase tracking-widest">
              Fasilitas Eksklusif
            </span>
            <h2 className="text-3xl font-black text-white">
              Lingkungan Latihan Mewah &amp; Higienis
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Dirancang dengan standar estetika tinggi, sirkulasi udara optimal, dan mesin kebugaran berstandar olimpiade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Pilates Reformer Sanctuary</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Studio khusus dengan mesin Pilates Reformer &amp; Cadillac Tower impor untuk melatih kekuatan otot inti (*core*), memperbaiki postur tulang belakang, dan kelenturan tubuh.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Olympic Free Weights Area</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform Olympic deadlift berlantai karet peredam suara tebal, squat rack kompetisi, dumbbell hingga 50kg, dan jajaran cable selectorized machines lengkap.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Studio Aerobik &amp; Combat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lantai kayu pegas anti cedera dengan tata cahaya modern dan sistem tata suara berkualitas konser untuk kelas Zumba, Body Combat, dan functional boxing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Turnstile Gate AI Face Recognition</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Akses masuk otomatis cepat 0.3 detik menggunakan teknologi pengenalan wajah atau QR Code digital dari HP tanpa harus repot membawa kartu fisik.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Locker Room, Hot Shower &amp; Sauna</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Loker digital pribadi, kamar bilas air panas yang wangi dan bersih, serta ruang sauna kering untuk pemulihan optimal otot seusai latihan berat.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 space-y-4 hover:border-white/20 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Protein Shake &amp; Coffee Bar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menyediakan minuman whey protein shake segar, BCAA, elektrolit dingin, dan kopi espresso sehat untuk menunjang energi latihan Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 6. JADWAL KELAS STUDIO MINGGUAN ══════════════ */}
      <section id="jadwal" className="py-20 bg-[#050A18] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Jadwal Studio Interaktif
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Jadwal Kelas Pilates &amp; Studio Mingguan
              </h2>
            </div>

            <Link
              href="/login?tab=member"
              className="text-xs font-bold text-[#FFC067] hover:underline flex items-center gap-1.5"
            >
              <span>Booking Kelas Melalui Portal Member</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Day Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
            {(['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'] as const).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
                  selectedDay === day
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'bg-[#0F172A] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scheduleData[selectedDay].map((cls, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-3 hover:border-cyan-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30">
                      {cls.category}
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">
                      Sisa {cls.spots} Slot
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-white">{cls.name}</h3>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cls.time}</span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium">
                    {cls.coach} • <span className="text-slate-500">{cls.room}</span>
                  </div>
                </div>

                <Link
                  href="/login?tab=member"
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-bold text-xs border border-cyan-500/30 transition text-center"
                >
                  Book Slot di Portal Member
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 7. PERSONAL TRAINERS & SKEMA FLAT 50:50 ══════════════ */}
      <section id="coaches" className="py-20 border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-[#FFC067] uppercase tracking-widest">
              Pelatih Tersertifikasi
            </span>
            <h2 className="text-3xl font-black text-white">
              Bimbingan Personal Trainer Berdedikasi Penuh
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Di Kaisar Gym, kesejahteraan pelatih adalah prioritas utama. Dengan <strong>Skema Bagi Hasil Flat 50%</strong> yang adil dan transparan, setiap coach mendedikasikan fokus terbaik untuk memandu setiap repetisi dan nutrisi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coaches.map((c) => (
              <div
                key={c.code}
                className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 space-y-4 hover:border-[#FFC067]/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#FFC067] border border-white/10 font-bold">
                      {c.code}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {c.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-white">{c.name}</h3>
                    <p className="text-xs text-[#FFC067] font-semibold mt-0.5">{c.role}</p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{c.spec}</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>{c.exp}</span>
                  <span className="text-emerald-400 font-bold">Flat 50:50 PT</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Split Policy Box */}
          <div className="mt-12 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0F172A] to-blue-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">Komitmen Bagi Hasil Adil: 50% Pelatih : 50% Kaisar Gym</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Setiap sesi yang terlaksana langsung membagi hasil rata 50:50 tanpa potongan komisi sales closing dan tanpa sistem tiering bertingkat.
                </p>
              </div>
            </div>

            <Link
              href="/login?tab=coach"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 transition"
            >
              Cek Portal Coach PT »
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ 8. PILIHAN MEMBERSHIP ══════════════ */}
      <section id="membership" className="py-20 bg-[#050A18] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-[#FFC067] uppercase tracking-widest">
              Investasi Kebugaran Anda
            </span>
            <h2 className="text-3xl font-black text-white">Pilihan Paket Membership &amp; PT</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tanpa biaya pendaftaran tersembunyi. Akses penuh ke seluruh fasilitas gym dan fasilitas studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Plan 1 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Harian / Non-Member</span>
                <h3 className="text-xl font-black text-white">Daily Pass</h3>
                <div className="text-2xl font-black text-white">
                  Rp 50.000 <span className="text-xs text-slate-400 font-normal">/ kedatangan</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ Akses Gym Free Weights Sepuasnya</li>
                  <li className="flex items-center gap-2">✓ Akses Loker &amp; Kamar Mandi Air Hangat</li>
                  <li className="flex items-center gap-2">✓ Bebas Biaya Parkir Kendaraan</li>
                </ul>
              </div>
              <Link
                href="/login?tab=member"
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition text-center"
              >
                Pilih Daily Pass
              </Link>
            </div>

            {/* Plan 2: Featured */}
            <div className="rounded-3xl border-2 border-[#FFC067] bg-gradient-to-b from-[#0F172A] via-[#0F172A] to-[#0A1128] p-7 space-y-5 flex flex-col justify-between shadow-gold relative overflow-hidden group">
              {/* Sheen Shine Kilap Emas */}
              <div className="shine-overlay" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#FFC067] text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md z-10">
                Paling Diminati
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#FFC067] uppercase tracking-wider">Membership Rutin</span>
                <h3 className="text-xl font-black text-white">1 Bulan All-Access</h3>
                <div className="text-2xl font-black text-[#FFC067]">
                  Rp 350.000 <span className="text-xs text-slate-400 font-normal">/ bulan</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2 text-white font-semibold">✓ Akses Gate Face ID &amp; QR Code Digital</li>
                  <li className="flex items-center gap-2">✓ Akses Unlimited Gym Floor 7 Hari/Minggu</li>
                  <li className="flex items-center gap-2">✓ Gratis Akses Kelas Studio Reguler</li>
                  <li className="flex items-center gap-2">✓ Fasilitas Sauna Kering &amp; Shower</li>
                  <li className="flex items-center gap-2">✓ Akses Portal Member di Smartphone</li>
                </ul>
              </div>
              <Link
                href="/login?tab=member"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] hover:from-[#ffd089] hover:to-[#f0b55f] text-slate-950 font-black text-xs shadow-gold transition text-center"
              >
                Daftar Membership Sekarang
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Dedicated Coaching</span>
                <h3 className="text-xl font-black text-white">Paket 12 Sesi PT</h3>
                <div className="text-2xl font-black text-white">
                  Rp 2.100.000 <span className="text-xs text-slate-400 font-normal">(Rp 175rb/sesi)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ 1-on-1 Dedicated Certified Coach</li>
                  <li className="flex items-center gap-2">✓ Program Latihan &amp; Nutrisi Terukur</li>
                  <li className="flex items-center gap-2">✓ Presensi &amp; Sisa Kuota Terpantau di Portal</li>
                  <li className="flex items-center gap-2">✓ Masa Berlaku 60 Hari</li>
                </ul>
              </div>
              <Link
                href="/login?tab=member"
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition text-center"
              >
                Pilih Paket PT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 9. LOKASI & KONTAK ══════════════ */}
      <section id="lokasi" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#FFC067] uppercase tracking-widest">
                  Kunjungi Kami di Pontianak
                </span>
                <h2 className="text-3xl font-black text-white">
                  Lokasi Strategis &amp; Jam Buka
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Berlokasi di pusat kota Pontianak dengan akses parkir luas dan fasilitas keamanan 24 jam.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#FFC067] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm">KAISAR GYM PONTIANAK</strong>
                    <p className="text-slate-400 mt-0.5">
                      Jl. Patimura No.84, Benua Melayu Darat, Pontianak Selatan, Kalimantan Barat 78122
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm">Jam Operasional:</strong>
                    <p className="text-slate-400 mt-0.5">
                      Senin – Sabtu: 06:00 – 22:00 WIB <br />
                      Minggu &amp; Hari Libur: 07:00 – 20:00 WIB
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm">Hotline &amp; Customer Concierge:</strong>
                    <p className="text-slate-400 mt-0.5">WhatsApp: +62 812-3456-7890</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] text-slate-950 font-black text-xs shadow-gold hover:shadow-lg transition"
                >
                  Buka Portal Member / Coach
                </Link>

                <a
                  href="https://wa.me/6281234567890?text=Halo%20Kaisar%20Gym%20Pontianak,%20saya%20ingin%20tanya%20info%20membership"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat WhatsApp Customer Care</span>
                </a>
              </div>
            </div>

            {/* Map Preview Card */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#070D1E] h-72 lg:h-96 relative flex items-center justify-center p-6 text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FFC067]/10 border border-[#FFC067]/30 text-[#FFC067] flex items-center justify-center mx-auto shadow-gold">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-white text-lg">Pusat Kebugaran Kaisar Gym</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Jl. Patimura No.84, Pontianak Selatan (Area Parkir Luas &amp; Akses Nyaman)
                </p>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  ● Buka Hari Ini Hingga 22:00 WIB
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 10. FOOTER ══════════════ */}
      <footer className="border-t border-white/10 bg-[#050A18] py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">KAISAR GYM</span>
            <span>— The Ultimate Luxury Fitness Experience in Pontianak.</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/login?tab=member" className="hover:text-slate-300 transition">Portal Member</Link>
            <Link href="/login?tab=coach" className="hover:text-slate-300 transition">Portal Coach PT</Link>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">
              Dashboard POS Kasir ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
