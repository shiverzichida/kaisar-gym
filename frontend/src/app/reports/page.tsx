'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
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
  const { showError } = useToast();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ txLimit: '200' });
      if (startDate) qs.set('startDate', startDate);
      if (endDate) qs.set('endDate', endDate);
      const [anRes, finRes] = await Promise.all([
        apiFetch(`/finance/analytics?${qs.toString()}`),
        apiFetch('/finance/overview'),
      ]);
      setAnalyticsData(anRes);
      setFinanceData(finRes);
    } catch (err: any) {
      console.error(err);
      showError(err?.message || 'Gagal memuat laporan analitik', 'Gagal Memuat Data');
    } finally {
      setLoading(false);
    }
  }, [showError, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = analyticsData?.summary;
  const peakHours = analyticsData?.peakHoursHeatmap || analyticsData?.peakHours || [];
  const auditLogs = analyticsData?.auditLogs || [];
  const transactions = analyticsData?.transactions || [];
  const expensesList = analyticsData?.expensesList || [];

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportTransactions = () => {
    downloadCsv(
      `kaisar-gym-transaksi-${startDate || 'all'}-${endDate || 'all'}.csv`,
      ['No Invoice', 'Tanggal', 'Member / Tamu', 'Kasir', 'Metode', 'Subtotal', 'Diskon', 'Grand Total'],
      transactions.map((t: any) => [
        t.invoiceNumber,
        formatDateId(t.createdAt),
        t.member?.fullName || t.guestName || 'Walk-In',
        t.cashierName,
        t.paymentMethod,
        t.subtotal,
        t.discountAmount,
        t.grandTotal,
      ]),
    );
  };

  const handleExportExpenses = () => {
    downloadCsv(
      `kaisar-gym-pengeluaran-${startDate || 'all'}-${endDate || 'all'}.csv`,
      ['Tanggal', 'Kategori', 'Deskripsi', 'Nominal', 'Dicatat Oleh'],
      expensesList.map((e: any) => [
        formatDateId(e.createdAt),
        e.category,
        e.description,
        e.amount,
        e.recordedBy,
      ]),
    );
  };

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

          {/* Date Filter & Export CSV */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl bg-[#0F172A] border border-white/10 px-3 py-1.5 text-xs text-white"
              title="Dari Tanggal"
            />
            <span className="text-xs text-slate-500">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl bg-[#0F172A] border border-white/10 px-3 py-1.5 text-xs text-white"
              title="Sampai Tanggal"
            />
            <button
              onClick={handleExportTransactions}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Omset CSV
            </button>
            <button
              onClick={handleExportExpenses}
              className="px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Pengeluaran CSV
            </button>
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
              {formatRp(summary?.totalExpenses || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Petty Cash &amp; Maintenance Rutin
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">
            <div className="text-xs font-bold text-slate-400">Net Profit Kas Bersih</div>
            <div className="text-2xl font-black text-[#FFC067] mt-1">
              {formatRp(summary?.netOperatingIncome || 0)}
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
                Pencatatan tamper-proof aktivitas staf: perubahan Master Paket &amp; Produk, Member, Trainer, Kelas, Void nota transaksi, dan otorisasi manajerial.
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
                  auditLogs.map((log: any) => {
                    const targetLabel =
                      log.afterJson?.name ||
                      log.afterJson?.fullName ||
                      log.afterJson?.title ||
                      log.afterJson?.invoiceNumber ||
                      log.afterJson?.className ||
                      log.afterJson?.code ||
                      '';
                    return (
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
                        <span className="font-semibold text-white">{log.entityName}</span>
                        {targetLabel ? <span className="text-slate-300"> · {targetLabel}</span> : null}
                        {log.entityId ? (
                          <span className="text-slate-500 font-mono text-[11px] ml-1.5">
                            #{log.entityId.slice(0, 8)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          LOGGED
                        </span>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
