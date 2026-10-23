'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch, formatDateId, playGateBeep } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Volume2,
  Camera,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ScanLine,
} from 'lucide-react';

export default function GatePage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [attendanceLogs, setAttendanceLogs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState('KG-2026-0001');
  const [gateResult, setGateResult] = useState<any>(null);
  const [staffGpsResult, setStaffGpsResult] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/attendance');
      setAttendanceLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      loadData();
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
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Presensi');
    }
  };

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Kontrol Gate Turnstile &amp; Presensi Selfie GPS
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Access &amp; Security
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulasi palang pintu turnstile (TCP/IP), buzzer audio otorisasi, dan deteksi Fake GPS karyawan.
              </p>
            </div>
          </div>
        </div>

        {/* 2 Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Check-in Member & Turnstile Gate */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#FFC067]" /> Kontrol Akses Palang Gate Turnstile
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
                className="flex-1 rounded-xl border border-white/10 bg-[#070D1E] px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FFC067]"
              />
              <button
                onClick={() => handleGateCheckIn()}
                className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs"
              >
                Scan Check-In
              </button>
            </div>

            {/* Quick Test Presets */}
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

            {/* Gate Result Banner */}
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
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {gateResult.turnstileRelayStatus}
                  </span>
                </div>
                <p className="text-xs mt-2 text-slate-200 leading-relaxed">{gateResult.message}</p>
                {gateResult.member && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs flex justify-between text-slate-300">
                    <span>
                      {gateResult.member.fullName} ({gateResult.member.code})
                    </span>
                    <span>Paket: {gateResult.member.package?.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Absensi Selfie & Fake GPS Staff */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-4 shadow-xl">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FFC067]" /> Presensi GPS &amp; Deteksi Fake GPS Staff
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Radius Geofencing Gym 50 meter + sensor deteksi Mock Location sistem Android.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-300 font-semibold">Simulasikan Koordinat Perangkat Staf:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleStaffSelfieGps('INSIDE')}
                  className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-left hover:bg-emerald-500/25 transition"
                >
                  <div className="font-bold">1. Di Dalam Gym</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Jarak 15m (Sah)</div>
                </button>
                <button
                  onClick={() => handleStaffSelfieGps('OUTSIDE')}
                  className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-left hover:bg-amber-500/25 transition"
                >
                  <div className="font-bold">2. Di Luar Gym</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Jarak 1.8km (Ditolak)</div>
                </button>
                <button
                  onClick={() => handleStaffSelfieGps('FAKE_GPS')}
                  className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-left hover:bg-rose-500/25 transition"
                >
                  <div className="font-bold">3. Fake GPS</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Mock Location (Flagged)</div>
                </button>
              </div>
            </div>

            {staffGpsResult && (
              <div
                className={`rounded-2xl p-4 border-2 transition ${
                  staffGpsResult.success
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : 'border-rose-500 bg-rose-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    {staffGpsResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    {staffGpsResult.success ? 'PRESENSI DITERIMA' : 'PRESENSI TIDAK SAH'}
                  </span>
                  <span className="text-xs font-mono font-bold">
                    Jarak: {staffGpsResult.attendance?.distanceMeters || 0} meter
                  </span>
                </div>
                <p className="text-xs mt-2 text-slate-200">{staffGpsResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabel Log Akses Member Terkini */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Riwayat Log Check-In Turnstile Hari Ini
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1E] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3">Status Akses</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendanceLogs?.memberLogs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(log.checkInTime).toLocaleTimeString('id-ID')} WIB
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {log.member?.fullName} ({log.member?.code})
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{log.method}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.isAllowed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {log.isAllowed ? 'DIIZINKAN' : 'DITOLAK'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{log.denialReason || 'Pintu Terbuka'}</td>
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
