'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Banknote,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  DollarSign,
  TrendingDown,
  History,
} from 'lucide-react';

export default function ShiftPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const [expenseForm, setExpenseForm] = useState({
    category: 'OPERASIONAL',
    description: '',
    amount: 50000,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/finance/overview');
      setFinanceData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenShift = async () => {
    const floatInput = window.prompt(
      'Masukkan modal kas awal laci (Starting Cash Float):',
      '500000',
    );
    if (floatInput === null) return;
    try {
      await apiFetch('/finance/shifts/open', {
        method: 'POST',
        body: JSON.stringify({
          cashierName: currentUser?.fullName || 'Kasir Front Desk',
          startingCashFloat: Number(floatInput),
          notes: 'Pembukaan Shift Kasir Baru',
        }),
      });
      showSuccess('Shift Kasir baru berhasil dibuka (OPEN)!', 'Buka Shift Sukses');
      setFeedback('✓ Shift Kasir baru berhasil dibuka (OPEN).');
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Buka Shift');
    }
  };

  const handleCloseShift = async () => {
    const shift = financeData?.activeShift;
    if (!shift) return;
    const actual = window.prompt(
      `Closing Shift Kasir (${shift.cashierName}).\nSaldo tunai seharusnya di laci: ${formatRp(
        shift.expectedEndingCash,
      )}.\nMasukkan jumlah uang fisik aktual di laci:`,
      String(shift.expectedEndingCash),
    );
    if (actual === null) return;
    try {
      await apiFetch(`/finance/shifts/${shift.id}/close`, {
        method: 'POST',
        body: JSON.stringify({
          actualEndingCash: Number(actual),
          notes: 'Closing Shift Harian via Dashboard',
        }),
      });
      showSuccess('Shift Kasir berhasil ditutup (CLOSED) dan direkonsiliasi!', 'Closing Shift Berhasil');
      setFeedback('✓ Shift Kasir berhasil ditutup (CLOSED) dan direkonsiliasi.');
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Closing Shift');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description) return;
    try {
      await apiFetch('/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          recordedBy: currentUser?.fullName || 'Kasir Front Desk',
        }),
      });
      setExpenseForm({ ...expenseForm, description: '' });
      showSuccess('Pengeluaran kas kecil (Petty Cash) berhasil dicatat!', 'Petty Cash Tersimpan');
      setFeedback('✓ Pengeluaran kas kecil (Petty Cash) berhasil dicatat dan memotong saldo laci kasir.');
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Catat Pengeluaran');
    }
  };

  const shift = financeData?.activeShift;

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Shift Kasir Harian &amp; Petty Cash
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Cash Reconciliation
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengelolaan modal kas laci kasir, pencatatan biaya operasional kas kecil &amp; rekonsiliasi fisik uang.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="rounded-2xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-xs font-semibold text-[#FFC067] flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback('')} className="underline text-[11px]">
              Tutup
            </button>
          </div>
        )}

        {/* Shift Kasir Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Laci Kasir */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FFC067]" /> Status Shift Laci Kasir
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  shift?.status === 'OPEN'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {shift?.status === 'OPEN' ? '🟢 SHIFT AKTIF (OPEN)' : '⚪ SHIFT CLOSED'}
              </span>
            </div>

            {shift ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#070D1E] p-3 rounded-xl border border-white/5">
                    <div className="text-slate-400">Kasir Bertugas:</div>
                    <div className="font-bold text-white text-sm mt-0.5">{shift.cashierName}</div>
                  </div>
                  <div className="bg-[#070D1E] p-3 rounded-xl border border-white/5">
                    <div className="text-slate-400">Waktu Buka:</div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {new Date(shift.startTime).toLocaleTimeString('id-ID')} WIB
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#070D1E] p-4 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Modal Kas Awal (Starting Float):</span>
                    <strong className="text-white">{formatRp(shift.startingCashFloat)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Pemasukan Tunai POS:</span>
                    <strong className="text-emerald-400">+{formatRp(shift.totalCashIn)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Pengeluaran Petty Cash:</span>
                    <strong className="text-rose-400">-{formatRp(shift.totalExpenseOut)}</strong>
                  </div>
                  <div className="flex justify-between font-black text-sm text-[#FFC067] pt-2 border-t border-white/10">
                    <span>Saldo Kas Akhir Seharusnya di Laci:</span>
                    <span>{formatRp(shift.expectedEndingCash)}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleCloseShift}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Tutup Shift &amp; Rekonsiliasi Kas Laci</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-slate-400">Saat ini tidak ada shift kasir yang sedang aktif.</p>
                <button
                  onClick={handleOpenShift}
                  className="px-5 py-2.5 rounded-xl bg-[#FFC067] text-slate-950 font-bold text-xs inline-flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Shift Kasir Baru</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Petty Cash */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" /> Catat Pengeluaran Kas Kecil (Petty Cash)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Biaya air galon, pembersih lantai gym, perbaikan darurat kasir.
              </p>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Kategori Pengeluaran:</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white"
                >
                  <option value="OPERASIONAL">Operasional Harian Gym</option>
                  <option value="MAINTENANCE">Maintenance &amp; Kebersihan</option>
                  <option value="KONSUMSI">Konsumsi &amp; Air Minum</option>
                  <option value="LAINNYA">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Keterangan / Deskripsi Biaya:</label>
                <input
                  required
                  type="text"
                  placeholder="Beli 3 galon air mineral & cairan disinfektan..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Nominal (Rp):</label>
                <input
                  required
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-xs font-bold text-[#FFC067] flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Pengeluaran Kas Kecil</span>
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Riwayat Pengeluaran */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Riwayat Pengeluaran Kas Kecil Terbaru
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1E] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Dicatat Oleh</th>
                  <th className="py-2.5 px-3 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {financeData?.expenses?.map((ex: any) => (
                  <tr key={ex.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-slate-400">{formatDateId(ex.createdAt)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{ex.category}</td>
                    <td className="py-2.5 px-3 text-white">{ex.description}</td>
                    <td className="py-2.5 px-3 text-slate-400">{ex.recordedBy}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400 font-mono">
                      -{formatRp(ex.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
