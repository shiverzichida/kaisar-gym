'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { apiFetch, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Calendar,
  Clock,
  Users,
  Dumbbell,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  UserCheck,
} from 'lucide-react';

export default function EditClassSchedulePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const [schedule, setSchedule] = useState<any>(null);
  const [studioClasses, setStudioClasses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState({
    studioClassId: '',
    trainerId: '',
    scheduleDate: '',
    startTime: '09:00',
    endTime: '10:00',
    maxCapacity: 12,
    status: 'OPEN',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedData, overviewData] = await Promise.all([
        apiFetch<any>(`/classes/schedules/${params.id}`),
        apiFetch<any>('/classes'),
      ]);

      setSchedule(schedData);
      setStudioClasses(overviewData?.classes || []);
      setTrainers(overviewData?.trainers || []);

      let dateStr = '';
      if (schedData.scheduleDate) {
        dateStr = new Date(schedData.scheduleDate).toISOString().split('T')[0];
      }

      setForm({
        studioClassId: schedData.studioClassId || '',
        trainerId: schedData.trainerId || '',
        scheduleDate: dateStr,
        startTime: schedData.startTime || '09:00',
        endTime: schedData.endTime || '10:00',
        maxCapacity: schedData.maxCapacity || 12,
        status: schedData.status || 'OPEN',
      });
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat jadwal kelas. Pastikan data jadwal tersedia.');
      showError('Gagal memuat jadwal', 'Error');
    } finally {
      setLoading(false);
    }
  }, [params.id, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || isSuccess) return;

    if (!form.studioClassId) {
      setError('Pilih kelas studio!');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch(`/classes/schedules/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });

      setIsSuccess(true);
      showSuccess('Jadwal kelas studio berhasil diperbarui!', 'Update Sukses');

      setTimeout(() => {
        router.push('/classes');
      }, 1500);
    } catch (err: any) {
      const msg = err.message || 'Gagal menyimpan perubahan jadwal';
      setError(msg);
      showError(msg, 'Gagal Update');
      setSaving(false);
    }
  };

  const selectedClass = studioClasses.find((c) => c.id === form.studioClassId);

  return (
    <AppShell loading={loading}>
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/classes"
              className="p-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white transition shrink-0"
              title="Kembali ke Jadwal Kelas"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Edit Jadwal Kelas
                </h1>
                {schedule?.studioClass && (
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs">
                    {schedule.studioClass.name}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    form.status === 'OPEN'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : form.status === 'FULL'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {form.status === 'OPEN'
                    ? '● DIBUKA (OPEN)'
                    : form.status === 'FULL'
                    ? '● PENUH (FULL)'
                    : '● DIBATALKAN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Layout pengelolaan jadwal sesi kelas, instruktur pengampu, kuota kapasitas, dan daftar booking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/classes"
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs font-semibold text-slate-300 transition"
            >
              Batal
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving || isSuccess}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition ${
                isSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>Tersimpan! Mengalihkan...</span>
                </>
              ) : saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {isSuccess && (
          <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 shadow-xl backdrop-blur-md animate-toast-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    ✓ Jadwal Kelas Berhasil Diperbarui!
                  </h4>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Perubahan jadwal telah tersimpan ke sistem. Mengalihkan ke halaman jadwal kelas...
                  </p>
                </div>
              </div>
              <Link
                href="/classes"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
              >
                Kembali Sekarang
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs font-semibold text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="underline text-[11px]">
              Tutup
            </button>
          </div>
        )}

        {/* Form Utama */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Pemilihan Kelas & Instruktur */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Dumbbell className="w-4 h-4 text-cyan-400" /> Kelas &amp; Instruktur Pengampu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Jenis Kelas Studio <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={form.studioClassId}
                  onChange={(e) => {
                    const clsId = e.target.value;
                    const c = studioClasses.find((x) => x.id === clsId);
                    setForm({
                      ...form,
                      studioClassId: clsId,
                      maxCapacity: c?.maxCapacity || form.maxCapacity,
                    });
                  }}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Pilih Kelas Studio --</option>
                  {studioClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.roomName || 'Studio'})
                    </option>
                  ))}
                </select>
                {selectedClass && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ruangan: <span className="text-slate-200">{selectedClass.roomName}</span> • Tarif:{' '}
                    <span className="text-amber-300 font-bold">
                      {selectedClass.isPaid ? 'Kelas Berbayar' : 'Gratis untuk Member'}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Instruktur / Trainer Pengampu
                </label>
                <select
                  value={form.trainerId}
                  onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Belum Ditentukan (TBA) --</option>
                  {trainers.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.code ? `[${tr.code}] ` : ''}
                      {tr.fullName} ({tr.specialization || 'Trainer'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Waktu, Tanggal & Jam Sesi */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Calendar className="w-4 h-4 text-amber-400" /> Tanggal &amp; Jam Pelaksanaan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Tanggal Sesi <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.scheduleDate}
                  onChange={(e) => setForm({ ...form, scheduleDate: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Jam Mulai <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Jam Selesai <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    required
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Kapasitas & Status Kelas */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Users className="w-4 h-4 text-purple-400" /> Kuota Kapasitas &amp; Status Kelas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Maksimal Kuota Peserta (Orang) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={form.maxCapacity}
                  onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Saat ini terdaftar: <span className="text-white font-bold">{schedule?.bookedCount || 0}</span> / {form.maxCapacity} Peserta.
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Status Ketersediaan</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="OPEN">OPEN (Pendaftaran Dibuka)</option>
                  <option value="FULL">FULL (Penuh / Ditutup Sementara)</option>
                  <option value="CANCELLED">CANCELLED (Sesi Dibatalkan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Daftar Peserta Booking (Jika ada) */}
          {schedule?.bookings && schedule.bookings.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" /> Peserta Terdaftar ({schedule.bookings.length})
                </h3>
              </div>

              <div className="divide-y divide-white/5">
                {schedule.bookings.map((b: any) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">
                        {b.member?.fullName || 'Member Kaisar'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {b.member?.memberCode || '-'} • HP: {b.member?.phone || '-'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'ATTENDED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : b.status === 'CANCELLED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/classes"
              className="px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs font-bold text-slate-300 transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving || isSuccess}
              className={`px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition ${
                isSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>✓ Jadwal Berhasil Diperbarui!</span>
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Jadwal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
