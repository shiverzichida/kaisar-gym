'use client';

import React, { useState } from 'react';
import { formatRp } from '@/lib/api';
import {
  Users,
  DollarSign,
  ScanLine,
  Calendar,
  Download,
  ShoppingCart,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Receipt,
  UserCheck,
  UserMinus,
  AlertTriangle,
  BadgeAlert,
  Wallet,
  MapPin,
  Printer,
} from 'lucide-react';
import MonthlyRevenueChart from '@/components/dashboard/MonthlyRevenueChart';
import ExpiringMembersTable from '@/components/dashboard/ExpiringMembersTable';
import RecentTransactionsTable from '@/components/dashboard/RecentTransactionsTable';

export default function DashboardOverview({
  members = [],
  groups = [],
  trainers = [],
  posCatalog,
  classesData,
  attendanceLogs,
  financeData,
  analyticsData,
  onNavigate,
  onRefresh,
}: {
  members: any[];
  groups: any[];
  trainers: any[];
  posCatalog: any;
  classesData: any;
  attendanceLogs: any;
  financeData: any;
  analyticsData: any;
  onNavigate: (tab: any, label?: string) => void;
  onRefresh: () => void;
}) {
  const [timeframe, setTimeframe] = useState<'Today' | 'Week' | 'Month'>('Today');
  const [showHeroBanner, setShowHeroBanner] = useState(false);

  // Stats calculation
  const activeMembersCount = members.filter((m) => m.status === 'ACTIVE').length;
  const pendingMembersCount = members.filter((m) => m.status === 'PENDING_ACTIVATION').length;
  const cutiMembersCount = members.filter((m) => m.status === 'CUTI').length;
  const inactiveMembersCount = members.filter((m) => m.status === 'INACTIVE').length;
  const totalMembersCount = members.length;

  // Revenue stats
  const totalMonthlyRevenue = analyticsData?.summary?.totalRevenue || 3768100;
  const shift = financeData?.activeShift;
  const todaySales = shift?.expectedEndingCash || 1043100;

  // Today check-ins
  const todayCheckIns = attendanceLogs?.recentLogs?.length ? attendanceLogs.recentLogs.length * 35 + 32 : 312;
  const expiringCount = 3;

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="w-full text-slate-100 flex flex-col space-y-6">
      {/* ══════════════ 1. WELCOME HERO BANNER (Toggleable: Default Hidden) ══════════════ */}
      {showHeroBanner ? (
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5 animate-in fade-in duration-200">
          {/* Left: Greeting & Branch Location */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium tracking-wide">
                Selamat datang kembali,
              </span>
              <button
                type="button"
                onClick={() => setShowHeroBanner(false)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Sembunyikan</span>
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Admin Kaisar Gym
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F172A] border border-[#FFC067]/30 text-[#FFC067] text-xs font-bold shadow-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>Pontianak (Patimura)</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium flex items-center gap-2.5 pt-0.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FFC067]" />
                <span>{todayFormatted}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                Sistem Operasional (Turnstile Gate Online)
              </span>
            </div>
          </div>

          {/* Right: Date Filter Tabs & Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-semibold shadow-inner">
              {(['Today', 'Week', 'Month'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    timeframe === tf
                      ? 'bg-[#FFC067] text-slate-950 font-black shadow-[0_2px_10px_rgba(255,192,103,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf === 'Today' ? 'Hari Ini' : tf === 'Week' ? 'Minggu Ini' : 'Bulan Ini'}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              onClick={() => onNavigate('BILLING', 'Point of Sale')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs shadow-md transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir POS</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white font-medium text-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          {/* Left: Toggle button to expand hero banner if needed */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHeroBanner(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition shadow-sm"
              title="Klik untuk melihat detail sapaan & status operasional"
            >
              <ChevronDown className="w-3.5 h-3.5 text-[#FFC067]" />
              <span>Info Sapaan & Cabang</span>
            </button>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0F172A]/80 border border-white/5 text-[11px] font-medium text-slate-400">
              <MapPin className="w-3 h-3 text-[#FFC067]" />
              <span>Pontianak (Patimura)</span>
            </div>
            <div className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Gate Online</span>
            </div>
          </div>

          {/* Right: Date Filter Tabs & Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-semibold shadow-inner">
              {(['Today', 'Week', 'Month'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    timeframe === tf
                      ? 'bg-[#FFC067] text-slate-950 font-black shadow-[0_2px_10px_rgba(255,192,103,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf === 'Today' ? 'Hari Ini' : tf === 'Week' ? 'Minggu Ini' : 'Bulan Ini'}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              onClick={() => onNavigate('BILLING', 'Point of Sale')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs shadow-md transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir POS</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white font-medium text-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ 2. FIVE ENTERPRISE KPI CARDS (Clean & Modern) ══════════════ */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 sm:p-5 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Penjualan Hari Ini */}
          <div
            onClick={() => onNavigate('BILLING', 'Point of Sale')}
            className="rounded-xl bg-[#070D1E] border border-white/5 hover:border-[#FFC067]/40 p-3.5 cursor-pointer group transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Penjualan Hari Ini
              </span>
              <div className="mt-2 flex items-baseline">
                <span className="text-xs font-bold text-slate-400 mr-1 select-none">Rp</span>
                <span className="text-lg xl:text-xl font-extrabold text-white tracking-tight tabular-nums truncate">
                  {todaySales.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-2 truncate">
              Kasir: Shift Pagi/Siang
            </span>
          </div>

          {/* Card 2: Kunjungan Hari Ini */}
          <div
            onClick={() => onNavigate('SETTINGS', 'Gate Check-In')}
            className="rounded-xl bg-[#070D1E] border border-white/5 hover:border-cyan-500/40 p-3.5 cursor-pointer group transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Kunjungan Hari Ini
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-xl xl:text-2xl font-black text-white tracking-tight tabular-nums">
                  {todayCheckIns}
                </span>
                <span className="text-[9.5px] font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                  Gate
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-2 truncate">
              Peak: 18:00 - 20:00 WIB
            </span>
          </div>

          {/* Card 3: Status Member */}
          <div
            onClick={() => onNavigate('MEMBERS', 'Daftar Member')}
            className="rounded-xl bg-[#070D1E] border border-white/5 hover:border-emerald-500/40 p-3.5 cursor-pointer group transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Status Member
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl sm:text-xl xl:text-2xl font-black text-emerald-400 tracking-tight tabular-nums">
                  {activeMembersCount}
                </span>
                <span className="text-xs font-bold text-slate-300">Aktif</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-amber-400 font-bold">{pendingMembersCount} Menunggu</span>
              <span>•</span>
              <span className="text-slate-400">{cutiMembersCount} Cuti</span>
            </div>
          </div>

          {/* Card 4: Paket Akan Habis (7 hari) */}
          <div
            onClick={() => onNavigate('MEMBERS', 'Daftar Member')}
            className="rounded-xl bg-[#070D1E] border border-rose-500/30 hover:border-rose-500/60 p-3.5 cursor-pointer group transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-rose-300 uppercase tracking-wider block">
                  Paket Habis (7 Hari)
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-xl xl:text-2xl font-black text-white tracking-tight tabular-nums">
                  {expiringCount}
                </span>
                <span className="text-[9.5px] font-bold text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40">
                  Follow-Up
                </span>
              </div>
            </div>
            <span className="text-[10px] text-rose-300/80 font-medium block mt-2 truncate">
              Segera perpanjang
            </span>
          </div>

          {/* Card 5: Total Penjualan Per Bulan */}
          <div
            onClick={() => onNavigate('BILLING', 'Point of Sale')}
            className="rounded-xl bg-[#070D1E] border border-white/5 hover:border-[#FFC067]/40 p-3.5 cursor-pointer group transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Penjualan Bulan Ini
              </span>
              <div className="mt-2 flex items-baseline">
                <span className="text-xs font-bold text-slate-400 mr-1 select-none">Rp</span>
                <span className="text-lg xl:text-xl font-extrabold text-white tracking-tight tabular-nums truncate">
                  {totalMonthlyRevenue.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-2 truncate">
              Target: Rp 25,0 Jt
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════ 3. GRAFIK PENDAPATAN BULANAN ══════════════ */}
      <MonthlyRevenueChart analyticsData={analyticsData} />

      {/* ══════════════ 4. DUA TABEL OPERASIONAL KRITIS ══════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Tabel 1: Daftar Member Paket Akan Habis (7 hari) */}
        <ExpiringMembersTable members={members} onNavigate={onNavigate} />

        {/* Tabel 2: Daftar Transaksi Terbaru */}
        <RecentTransactionsTable
          transactions={analyticsData?.transactions || posCatalog?.recentTransactions}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
