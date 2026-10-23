'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  History,
  Users,
  DollarSign,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [anRes, finRes] = await Promise.all([
        apiFetch('/finance/analytics'),
        apiFetch('/finance/overview'),
      ]);
      setAnalyticsData(anRes);
      setFinanceData(finRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = analyticsData?.summary;
  const peakHours = analyticsData?.peakHours || [];
  const auditLogs = analyticsData?.auditLogs || [];

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Laporan Analitik, Jam Sibuk &amp; Audit Trail
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Operational Analytics
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualisasi jam kedatangan puncak member (Peak Hours), rekap omzet kotor &amp; log forensik audit keamanan kasir.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">
            <div className="text-xs font-bold text-slate-400">Total Omzet Keseluruhan</div>
            <div className="text-2xl font-black text-white mt-1">
              {formatRp(summary?.totalRevenue || 0)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">
              Akumulasi Penjualan Kasir POS
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">
            <div className="text-xs font-bold text-slate-400">Pengeluaran Operasional</div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {formatRp(summary?.totalExpense || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Petty Cash &amp; Maintenance Rutin
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">
            <div className="text-xs font-bold text-slate-400">Net Profit Kas Bersih</div>
            <div className="text-2xl font-black text-[#FFC067] mt-1">
              {formatRp(summary?.netProfit || 0)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">
              Margin Sehat &amp; Kas Seimbang
            </div>
          </div>
        </div>

        {/* Visualisasi Jam Sibuk Gym */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FFC067]" />
                Distribusi Jam Sibuk Gym (Hourly Arrival Traffic)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Berdasarkan data sensor tap kartu / QR Turnstile Gate check-in per jam.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pt-2">
            {peakHours.map((ph: any) => {
              const maxCount = Math.max(...peakHours.map((p: any) => p.count), 1);
              const heightPct = Math.max(15, Math.round((ph.count / maxCount) * 100));
              const isPeak = ph.count >= 8;

              return (
                <div
                  key={ph.hour}
                  className="bg-[#070D1E] rounded-xl p-3 border border-white/5 flex flex-col justify-between h-32 text-center"
                >
                  <div className="text-[11px] font-mono font-bold text-slate-400">{ph.hour}</div>
                  <div className="w-full flex-1 flex items-end justify-center py-2">
                    <div
                      className={`w-6 rounded-t-lg transition-all duration-500 ${
                        isPeak
                          ? 'bg-rose-500 shadow-md shadow-rose-500/30'
                          : 'bg-[#FFC067] shadow-md shadow-[#FFC067]/20'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <div className="text-xs font-extrabold text-white">{ph.count} check-in</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Audit Trail Log */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Audit Trail &amp; Log Keamanan Sistem
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pencatatan tamper-proof aktivitas staf: Void nota transaksi, koreksi tanggal paket, dan otorisasi manajerial.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1E] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Pengguna</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Aksi Audit</th>
                  <th className="py-2.5 px-4">Entitas Target</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Belum ada audit trail yang tercatat.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-white">{log.userName}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#FFC067]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {log.entityName} #{log.entityId?.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          LOGGED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
