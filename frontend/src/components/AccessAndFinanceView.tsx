'use client';

import React, { useState } from 'react';
import { apiFetch, formatRp, formatDateId, playGateBeep } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Wallet,
  Package,
  BarChart3,
  History,
  Volume2,
  Camera,
} from 'lucide-react';

export default function AccessAndFinanceView({
  attendanceLogs,
  financeData,
  analyticsData,
  currentUser,
  onRefresh,
}: {
  attendanceLogs: any;
  financeData: any;
  analyticsData: any;
  currentUser: any;
  onRefresh: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [scanInput, setScanInput] = useState('KG-2026-0001');
  const [gateResult, setGateResult] = useState<any>(null);
  const [staffGpsResult, setStaffGpsResult] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({
    category: 'OPERASIONAL',
    description: '',
    amount: 50000,
  });
  const [feedback, setFeedback] = useState('');

  const handleGateCheckIn = async (codeOverride?: string) => {
    const query = codeOverride || scanInput;
    try {
      const res = await apiFetch('/attendance/member-checkin', {
        method: 'POST',
        body: JSON.stringify({ query, method: 'QR_SCAN' }),
      });
      setGateResult(res);
      playGateBeep(res.allowed);
      if (res.allowed) {
        showSuccess(res.reason || 'Check-in Gate Berhasil! Palang terbuka.', 'Akses Diberikan');
      } else {
        showError(res.reason || 'Akses ditolak!', 'Akses Ditolak');
      }
      onRefresh();
    } catch (err: any) {
      playGateBeep(false);
      showError(err.message, 'Gagal Check-in');
    }
  };

  const handleStaffSelfieGps = async (preset: 'INSIDE' | 'OUTSIDE' | 'FAKE_GPS') => {
    const coords =
      preset === 'INSIDE'
        ? { latitude: -6.2089, longitude: 106.8457, isMockLocation: false }
        : preset === 'OUTSIDE'
        ? { latitude: -6.225, longitude: 106.86, isMockLocation: false }
        : { latitude: -6.2088, longitude: 106.8456, isMockLocation: true };

    try {
      const res = await apiFetch('/attendance/staff-selfie', {
        method: 'POST',
        body: JSON.stringify({
          staffName: currentUser?.fullName || 'Coach Hendra Pratama',
          role: currentUser?.role || 'TRAINER',
          type: 'CLOCK_IN',
          ...coords,
        }),
      });
      setStaffGpsResult(res);
      if (res.valid) {
        showSuccess(res.note || 'Presensi selfie staff tervalidasi!', 'Presensi Berhasil');
      } else {
        showError(res.note || 'Presensi gagal divalidasi', 'Presensi Ditolak');
      }
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Presensi');
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
          recordedBy: currentUser?.fullName || 'Rina Marlina (Front Desk)',
        }),
      });
      setExpenseForm({ ...expenseForm, description: '' });
      showSuccess('Pengeluaran kas kecil (Petty Cash) berhasil dicatat!', 'Petty Cash Tersimpan');
      setFeedback('✓ Pengeluaran kas kecil (Petty Cash) berhasil dicatat dan memotong saldo laci shift.');
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Catat Pengeluaran');
    }
  };

  const handleStockOpname = async (prd: any) => {
    const input = window.prompt(`Masukkan jumlah stok fisik terbaru untuk "${prd.name}" (Stok sistem saat ini: ${prd.stock}):`, String(prd.stock));
    if (input === null) return;
    try {
      await apiFetch(`/finance/products/${prd.id}/opname`, {
        method: 'POST',
        body: JSON.stringify({
          newStock: Number(input),
          notes: 'Penyesuaian Stock Opname Fisik',
          recordedBy: currentUser?.fullName || 'Admin Inventory',
        }),
      });
      showSuccess(`Stok "${prd.name}" berhasil diperbarui ke ${input} pcs!`, 'Stock Opname Sukses');
      setFeedback(`[OK] Kartu Stok "${prd.name}" berhasil diperbarui ke ${input} pcs.`);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Stock Opname');
    }
  };

  const handleCloseShift = async () => {
    if (!shift) return;
    const actual = window.prompt(
      `Closing Shift Kasir (${shift.cashierName}).\nSaldo tunai seharusnya di laci: ${formatRp(shift.expectedEndingCash)}.\nMasukkan jumlah uang fisik aktual di laci:`,
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
      setFeedback('[OK] Shift Kasir berhasil ditutup (CLOSED) dan direkonsiliasi.');
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Closing Shift');
    }
  };

  const handleOpenShift = async () => {
    const floatInput = window.prompt('Masukkan modal kas awal laci (Starting Cash Float):', '500000');
    if (floatInput === null) return;
    try {
      await apiFetch('/finance/shifts/open', {
        method: 'POST',
        body: JSON.stringify({
          cashierName: currentUser?.fullName || 'Rina Marlina (Front Desk)',
          startingCashFloat: Number(floatInput),
          notes: 'Pembukaan Shift Baru',
        }),
      });
      showSuccess('Shift Kasir baru berhasil dibuka (OPEN)!', 'Buka Shift Sukses');
      setFeedback('[OK] Shift Kasir baru berhasil dibuka (OPEN).');
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Buka Shift');
    }
  };

  const shift = financeData?.activeShift;
  const summary = analyticsData?.summary;

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="rounded-xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-sm font-medium text-[#FFC067] flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs underline">
            Tutup
          </button>
        </div>
      )}

      {/* Modul 8: Kontrol Akses, Turnstile Gate & Absensi Selfie GPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8.1 & 8.2 Check-in Member & Turnstile Gate */}
        <div className="rounded-2xl border border-white/[0.08] glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#FFC067]" /> Kontrol Akses Member & Turnstile Gate
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-[#FFC067]" /> Audio Beep Aktif
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan Barcode / Ketik Kode Member..."
              className="flex-1 rounded-xl border border-white/[0.12] bg-[#09090B] px-3.5 py-2 text-sm font-mono"
            />
            <button
              onClick={() => handleGateCheckIn()}
              className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-extrabold text-xs"
            >
              Scan Check-In
            </button>
          </div>

          {/* Tombol Simulasi Cepat 3 Kondisi Member */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                setScanInput('KG-2026-0001');
                handleGateCheckIn('KG-2026-0001');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
            >
              🟢 Uji Member Aktif (KG-2026-0001)
            </button>
            <button
              onClick={() => {
                setScanInput('KG-2026-0003');
                handleGateCheckIn('KG-2026-0003');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#FFC067]/20 text-[#FFC067] border border-[#FFC067]/40 font-semibold"
            >
              🟡 Uji Member Cuti (KG-2026-0003)
            </button>
            <button
              onClick={() => {
                setScanInput('KG-2026-0004');
                handleGateCheckIn('KG-2026-0004');
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold"
            >
              🔴 Uji Member Expired (KG-2026-0004)
            </button>
          </div>

          {gateResult && (
            <div
              className={`rounded-2xl p-4 border-2 transition ${
                gateResult.allowed
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-rose-500 bg-rose-950/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  {gateResult.allowed ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  )}
                  {gateResult.allowed ? 'AKSES DIIZINKAN — BEEP HIJAU' : 'AKSES DITOLAK — BEEP MERAH!'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#121217] text-slate-300">
                  Gate Relay: {gateResult.turnstileCommand}
                </span>
              </div>
              <div className="mt-2 text-xs space-y-1">
                <p className="font-bold text-sm text-white">
                  {gateResult.member?.fullName} ({gateResult.member?.memberCode})
                </p>
                {gateResult.allowed ? (
                  <p className="text-emerald-300">
                    Sisa Masa Aktif Paket: <strong>{gateResult.daysRemaining} Hari</strong> • Parkir STNK:{' '}
                    {gateResult.member?.plateNumber || 'Aktif'}
                  </p>
                ) : (
                  <p className="text-rose-300 font-bold">{gateResult.denialReason}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 8.3 Absensi Staf & Trainer (Selfie + Geolocation Attendance) */}
        <div className="rounded-2xl border border-white/[0.08] glass-card p-5 space-y-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#FFC067]" /> Absensi Staf & Trainer (Selfie + GPS Geofencing)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Radius maksimal 250 meter dari gedung Kaisar Gym Jakarta + Deteksi Anti-Fake GPS / Mock Location.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleStaffSelfieGps('INSIDE')}
              className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Selfie di Area Gym (Valid GPS)</span>
            </button>
            <button
              onClick={() => handleStaffSelfieGps('OUTSIDE')}
              className="p-3 rounded-xl border border-[#FFC067]/40 bg-[#FFC067]/10 hover:bg-[#FFC067]/20 text-[#FFC067] font-bold flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Uji di Luar Radius (&gt;2km)</span>
            </button>
            <button
              onClick={() => handleStaffSelfieGps('FAKE_GPS')}
              className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Uji Deteksi Fake GPS</span>
            </button>
          </div>

          {staffGpsResult && (
            <div
              className={`rounded-xl p-3.5 border text-xs space-y-1 ${
                staffGpsResult.record.isWithinGeofence
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-rose-500/50 bg-rose-950/30 text-rose-200'
              }`}
            >
              <div className="font-bold">{staffGpsResult.verdict}</div>
              <div className="text-slate-300">
                Staf: {staffGpsResult.record.staffName} • Jarak ke Gedung: {staffGpsResult.record.distanceMeters} meter • Mock GPS:{' '}
                {staffGpsResult.record.isMockLocation ? 'YA (Diblokir)' : 'TIDAK'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modul 9 & 5: Shift Kasir, Pengeluaran Petty Cash & Kartu Stok Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kasir Shift & Petty Cash */}
        <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#FFC067]" /> Shift Kasir Harian & Kas Kecil (Petty Cash)
            </h3>
            {shift ? (
              <button
                type="button"
                onClick={handleCloseShift}
                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs"
              >
                Tutup Shift (Closing)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenShift}
                className="px-3 py-1 rounded-lg bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs"
              >
                + Buka Shift Baru
              </button>
            )}
          </div>

          {shift ? (
            <div className="rounded-xl bg-[#09090B] p-4 border border-white/[0.08] space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Kasir Bertugas:</span>
                <strong className="text-slate-100">{shift.cashierName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Modal Awal Laci (Starting Float):</span>
                <span>{formatRp(shift.startingCashFloat)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>+ Total Tunai Masuk (Cash):</span>
                <span>{formatRp(shift.totalCashIn)}</span>
              </div>
              <div className="flex justify-between text-sky-400">
                <span>+ Total EDC & QRIS Masuk:</span>
                <span>{formatRp(shift.totalEdcIn + shift.totalQrisIn)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>- Total Pengeluaran Kas (Petty Cash):</span>
                <span>{formatRp(shift.totalExpenseOut)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#FFC067] pt-2 border-t border-white/[0.08]">
                <span>Saldo Tunai Seharusnya di Laci:</span>
                <span>{formatRp(shift.expectedEndingCash)}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#09090B] p-4 border border-dashed border-white/[0.12] text-center text-xs text-slate-400">
              Shift kasir sedang ditutup (CLOSED). Klik <strong>+ Buka Shift Baru</strong> untuk memulai shift.
            </div>
          )}

          <form onSubmit={handleAddExpense} className="space-y-2.5 pt-2 border-t border-white/[0.08] text-xs">
            <div className="font-semibold text-slate-300">Catat Pengeluaran Operasional (Petty Cash)</div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2"
              >
                <option value="KEBERSIHAN">Kebersihan & Galon</option>
                <option value="MAINTENANCE_ALAT">Maintenance Alat Gym</option>
                <option value="UTILITAS">Listrik / Internet / Air</option>
                <option value="LAUNDRY">Laundry Handuk</option>
              </select>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                className="rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Keterangan pengeluaran (misal: Beli 5 galon & tisu)..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="flex-1 rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold"
              >
                + Catat Kas Keluar
              </button>
            </div>
          </form>
        </div>

        {/* Inventory Produk Retail & Stock Opname */}
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] glass-card p-5 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FFC067]" /> Master Inventory Produk, HPP & Stock Opname
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400">
                  <th className="py-2">SKU & Produk</th>
                  <th className="py-2">HPP (Beli)</th>
                  <th className="py-2">Harga Jual</th>
                  <th className="py-2">Stok</th>
                  <th className="py-2 text-right">Stock Opname</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {financeData?.products?.map((prd: any) => (
                  <tr key={prd.id}>
                    <td className="py-2.5">
                      <div className="font-bold text-slate-100">{prd.name}</div>
                      <div className="text-[11px] text-slate-400">{prd.sku} • {prd.category}</div>
                    </td>
                    <td className="py-2.5 text-slate-400">{formatRp(prd.costPrice)}</td>
                    <td className="py-2.5 font-bold text-[#FFC067]">{formatRp(prd.sellingPrice)}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          prd.stock <= prd.minStockAlert
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {prd.stock} pcs {prd.stock <= prd.minStockAlert ? '(Stok Menipis!)' : ''}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleStockOpname(prd)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[#FFC067] font-semibold"
                      >
                        Opname
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modul 10 & 13: Laporan Analitik Bisnis, Peak Hours Heatmap & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl border border-white/[0.08] glass-card p-5 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#FFC067]" /> Analitik Pendapatan & Heatmap Jam Sibuk Gym
          </h3>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-xl bg-[#09090B] p-3 border border-white/[0.08]">
              <div className="text-slate-400">Omset Membership</div>
              <div className="text-sm font-extrabold text-[#FFC067] mt-1">
                {formatRp(summary?.membershipRevenue)}
              </div>
            </div>
            <div className="rounded-xl bg-[#09090B] p-3 border border-white/[0.08]">
              <div className="text-slate-400">Omset Sesi PT</div>
              <div className="text-sm font-extrabold text-sky-400 mt-1">
                {formatRp(summary?.ptRevenue)}
              </div>
            </div>
            <div className="rounded-xl bg-[#09090B] p-3 border border-white/[0.08]">
              <div className="text-slate-400">Laba Operasional</div>
              <div className="text-sm font-extrabold text-emerald-400 mt-1">
                {formatRp(summary?.netOperatingIncome)}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-300">
              🔥 Peak Hours Heatmap (Kepadatan Kunjungan Member Harian)
            </div>
            {analyticsData?.peakHoursHeatmap?.map((pk: any) => (
              <div key={pk.hour} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-mono text-slate-400">{pk.hour}</span>
                <div className="flex-1 h-4 rounded-full bg-[#09090B] overflow-hidden border border-white/[0.08]">
                  <div
                    className={`h-full rounded-full ${
                      pk.visitors > 40 ? 'bg-[#FFC067]' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (pk.visitors / 65) * 100)}%` }}
                  />
                </div>
                <span className="w-28 text-right text-slate-300 font-semibold">
                  {pk.visitors} org ({pk.label})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail Log */}
        <div className="lg:col-span-6 rounded-2xl border border-white/[0.08] glass-card p-5 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <History className="w-5 h-5 text-[#FFC067]" /> Keamanan & Audit Trail (Before vs After JSON)
          </h3>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
            {analyticsData?.auditLogs?.map((log: any) => (
              <div key={log.id} className="rounded-xl bg-[#09090B] p-3 border border-white/[0.08] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#FFC067]">{log.action}</span>
                  <span className="text-[11px] text-slate-400">{formatDateId(log.createdAt)}</span>
                </div>
                <div className="text-slate-300">
                  User: <strong>{log.userName}</strong> ({log.userRole}) • Entitas: {log.entityName}
                </div>
                {log.afterJson && (
                  <pre className="text-[10px] text-slate-400 bg-[#121217] p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.afterJson, null, 2).slice(0, 220)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


