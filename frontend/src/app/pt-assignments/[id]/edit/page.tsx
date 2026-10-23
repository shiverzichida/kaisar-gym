'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  Save,
  Dumbbell,
  User,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Tag,
  Clock,
  Receipt,
  UserCheck,
} from 'lucide-react';

export default function EditPtAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [trainers, setTrainers] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    trainerId: '',
    totalSessions: 12,
    remainingSessions: 12,
    normalPrice: 0,
    discountPct: 0,
    totalPrice: 0,
    status: 'ACTIVE',
    expiryDate: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [assignRes, trainersRes] = await Promise.all([
        apiFetch(`/trainers/assignments/${id}`),
        apiFetch('/trainers'),
      ]);

      setAssignment(assignRes);
      setTrainers(trainersRes || []);

      setFormData({
        trainerId: assignRes.trainerId || '',
        totalSessions: assignRes.totalSessions || 12,
        remainingSessions: assignRes.remainingSessions ?? assignRes.totalSessions ?? 12,
        normalPrice: assignRes.normalPrice || assignRes.ptPackage?.price || 0,
        discountPct: assignRes.discountPct || 0,
        totalPrice: assignRes.totalPrice || assignRes.normalPrice || 0,
        status: assignRes.status || 'ACTIVE',
        expiryDate: assignRes.expiryDate ? new Date(assignRes.expiryDate).toISOString().slice(0, 10) : '',
        notes: assignRes.notes || '',
      });
    } catch (err: any) {
      showError(err.message || 'Gagal memuat detail penugasan', 'Error');
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate total price when normal price or discount changes
  const handlePriceChange = (normal: number, discount: number) => {
    const calculatedTotal = Math.max(0, Math.round(normal * (1 - (discount || 0) / 100)));
    setFormData((prev) => ({
      ...prev,
      normalPrice: normal,
      discountPct: discount,
      totalPrice: calculatedTotal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/trainers/assignments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          trainerId: formData.trainerId,
          totalSessions: Number(formData.totalSessions),
          remainingSessions: Number(formData.remainingSessions),
          normalPrice: Number(formData.normalPrice),
          discountPct: Number(formData.discountPct),
          totalPrice: Number(formData.totalPrice),
          status: formData.status,
          expiryDate: formData.expiryDate || undefined,
          notes: formData.notes,
        }),
      });

      showSuccess('Penugasan PT berhasil diperbarui!', 'Perubahan Disimpan');
      router.push('/pt-assignments');
    } catch (err: any) {
      showError(err.message || 'Gagal menyimpan perubahan penugasan', 'Gagal Simpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell loading={loading} onRefresh={loadData}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Navigation Breadcrumb & Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/pt-assignments"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
          >
            <ArrowLeft className="w-4 h-4 text-[#FFC067]" />
            <span>Kembali ke PT Assignments</span>
          </Link>
          <span className="text-xs font-mono text-slate-500">ID: {id?.slice(0, 8)}...</span>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Edit PT Assignment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Penyesuaian kuota sesi latihan, pelatih pembimbing, skema finansial, dan status kontrak member.
          </p>
        </div>

        {/* Member & Assignment Summary Header Card */}
        {assignment && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#121217] p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
              {/* Member Info */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FFC067]/10 border border-[#FFC067]/30 flex items-center justify-center text-[#FFC067] flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.08] text-slate-300">
                    {assignment.member?.memberCode}
                  </span>
                  <h3 className="font-bold text-base text-slate-100 mt-1">
                    {assignment.member?.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">{assignment.member?.phone || '-'}</p>
                </div>
              </div>

              {/* Trainer Info */}
              <div className="flex items-start gap-3 md:pl-4 pt-3 md:pt-0">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                    {assignment.trainer?.trainerType || 'FULL_TIME'}
                  </span>
                  <h3 className="font-bold text-base text-slate-100 mt-1">
                    {assignment.trainer?.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">{assignment.trainer?.specialization || 'Personal Trainer'}</p>
                </div>
              </div>

              {/* Package & Invoice Info */}
              <div className="flex items-start gap-3 md:pl-4 pt-3 md:pt-0">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {assignment.ptPackage?.name || 'Paket Sesi PT'}
                  </span>
                  <h3 className="font-bold text-sm text-[#FFC067] mt-1">
                    {assignment.invoiceRef ? `Nota: ${assignment.invoiceRef}` : 'Penugasan Manual'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dibuat: {new Date(assignment.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: Alokasi Kuota Sesi & Status */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121217] p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-white/[0.08] pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFC067]" /> Alokasi Kuota Sesi & Status
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Total Sesi
                  </label>
                  <input
                    type="number"
                    value={formData.totalSessions}
                    onChange={(e) =>
                      setFormData({ ...formData, totalSessions: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-slate-100 font-mono focus:outline-none focus:border-[#FFC067]"
                    min={1}
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Total kuota awal</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sisa Sesi (Remaining)
                  </label>
                  <input
                    type="number"
                    value={formData.remainingSessions}
                    onChange={(e) =>
                      setFormData({ ...formData, remainingSessions: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                    min={0}
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Sisa sesi saat ini</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Status Penugasan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-slate-100 focus:outline-none focus:border-[#FFC067]"
                >
                  <option value="ACTIVE">ACTIVE (Aktif)</option>
                  <option value="COMPLETED">COMPLETED (Selesai)</option>
                  <option value="EXPIRED">EXPIRED (Kadaluarsa)</option>
                  <option value="FROZEN">FROZEN (Dibekukan / Cuti)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Masa Berlaku (Expiry Date)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-slate-100 focus:outline-none focus:border-[#FFC067]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Batas tanggal latihan member bersama trainer
                </span>
              </div>
            </div>

            {/* CARD 2: Trainer Pembimbing & Skema Finansial */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121217] p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-white/[0.08] pb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400" /> Trainer & Skema Biaya
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Trainer Pembimbing
                </label>
                <select
                  value={formData.trainerId}
                  onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-slate-100 focus:outline-none focus:border-[#FFC067]"
                  required
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.trainerType} • {t.specialization})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ganti trainer jika klien dialihkan ke pelatih lain
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Harga Normal (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.normalPrice}
                    onChange={(e) =>
                      handlePriceChange(Number(e.target.value), formData.discountPct)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-slate-100 font-mono focus:outline-none focus:border-[#FFC067]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discountPct}
                    onChange={(e) =>
                      handlePriceChange(formData.normalPrice, Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-slate-100 font-mono focus:outline-none focus:border-[#FFC067]"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09090B] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Total Price Final:</span>
                  <span className="text-[10px] text-slate-500">Harga setelah diskon</span>
                </div>
                <span className="text-lg font-mono font-black text-[#FFC067]">
                  {formatRp(formData.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: Catatan & Instruksi Tambahan */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121217] p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-white/[0.08] pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Catatan Tambahan & Riwayat
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Catatan Penugasan
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Target latihan, histori cedera, kesepakatan jadwal, atau catatan transfer..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-white/[0.12] text-sm text-slate-100 focus:outline-none focus:border-[#FFC067]"
              />
            </div>

            {/* Riwayat Sign-off Sesi jika ada */}
            {assignment?.sessionLogs && assignment.sessionLogs.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Histori Sesi Latihan Terselesaikan ({assignment.sessionLogs.length} Sesi)
                </span>
                <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#09090B] overflow-hidden text-xs">
                  {assignment.sessionLogs.map((log: any) => (
                    <div key={log.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">{log.musclesTrained}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {log.weightLiftedNote || 'Latihan reguler'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Sign-Off
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(log.sessionDate).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Link
              href="/pt-assignments"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
