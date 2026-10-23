'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { apiFetch, formatRp } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Users,
  Award,
  Phone,
  Mail,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  ShieldCheck,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

interface StudioClass {
  id: string;
  name: string;
  category: string;
}

export default function EditTrainerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [trainer, setTrainer] = useState<any>(null);
  const [studioClasses, setStudioClasses] = useState<StudioClass[]>([]);

  // Form State
  const [form, setForm] = useState({
    code: '',
    fullName: '',
    phone: '',
    email: '',
    specialization: 'Pilates & Functional Trainer',
    trainerType: 'PILATES_INSTRUCTOR',
    isActive: true,
    selectedClassIds: [] as string[],
    primaryClassId: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trainerData, classesData] = await Promise.all([
        apiFetch<any>(`/trainers/${params.id}`),
        apiFetch<any>('/classes/classes').catch(() => []),
      ]);

      setTrainer(trainerData);
      setStudioClasses(classesData || []);

      const assignedIds = trainerData.assignedClasses?.map((c: any) => c.id) || [];
      const primaryId =
        trainerData.assignedClasses?.find((c: any) => c.isPrimary)?.id ||
        assignedIds[0] ||
        '';

      setForm({
        code: trainerData.code || '',
        fullName: trainerData.fullName || '',
        phone: trainerData.phone || '',
        email:
          trainerData.email ||
          `${(trainerData.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        specialization: trainerData.specialization || 'Personal Trainer',
        trainerType: trainerData.trainerType || 'PILATES_INSTRUCTOR',
        isActive: trainerData.isActive ?? true,
        selectedClassIds: assignedIds,
        primaryClassId: primaryId,
      });
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data trainer. Pastikan trainer terdaftar di sistem.');
      showError('Gagal memuat trainer', 'Error');
    } finally {
      setLoading(false);
    }
  }, [params.id, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleClassSelection = (clsId: string) => {
    setForm((prev) => {
      const exists = prev.selectedClassIds.includes(clsId);
      const updated = exists
        ? prev.selectedClassIds.filter((id) => id !== clsId)
        : [...prev.selectedClassIds, clsId];

      let newPrimary = prev.primaryClassId;
      if (exists && newPrimary === clsId) {
        newPrimary = updated[0] || '';
      } else if (!newPrimary && updated.length > 0) {
        newPrimary = updated[0];
      }

      return {
        ...prev,
        selectedClassIds: updated,
        primaryClassId: newPrimary,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || isSuccess) return;

    if (!form.fullName.trim() || !form.phone.trim()) {
      setError('Nama Lengkap dan Nomor Telepon wajib diisi!');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch(`/trainers/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          code: form.code,
          fullName: form.fullName,
          phone: form.phone,
          specialization: form.specialization,
          trainerType: form.trainerType,
          isActive: form.isActive,
          classIds: form.selectedClassIds,
        }),
      });

      setIsSuccess(true);
      showSuccess(`Data trainer ${form.code} (${form.fullName}) berhasil diperbarui!`, 'Update Sukses');

      setTimeout(() => {
        router.push('/trainers');
      }, 1500);
    } catch (err: any) {
      const msg = err.message || 'Gagal menyimpan perubahan trainer';
      setError(msg);
      showError(msg, 'Gagal Update');
      setSaving(false);
    }
  };

  return (
    <AppShell loading={loading}>
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/trainers"
              className="p-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white transition shrink-0"
              title="Kembali ke Personal Trainers"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Edit Personal Trainer
                </h1>
                {form.code && (
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs">
                    {form.code}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    form.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}
                >
                  {form.isActive ? '● AKTIF' : '● NON-AKTIF'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Layout lengkap perubahan data instruktur, spesialisasi, penugasan kelas studio, dan kontak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/trainers"
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

        {/* Success Alert Banner */}
        {isSuccess && (
          <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 shadow-xl backdrop-blur-md animate-toast-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    ✓ Data Personal Trainer Berhasil Diperbarui!
                  </h4>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Perubahan profil dan penugasan kelas telah disimpan. Mengalihkan ke tabel trainer...
                  </p>
                </div>
              </div>
              <Link
                href="/trainers"
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
          {/* 1. Profil Utama & Identitas */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Profil Utama &amp; Kontak Trainer
              </h3>
              <span className="text-xs text-slate-400 font-mono">Kode: {form.code}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Kode Trainer */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Kode Trainer</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm font-mono font-bold text-[#FFC067] focus:outline-none focus:border-[#FFC067]"
                  placeholder="PT-031"
                />
              </div>

              {/* Nama Lengkap */}
              <div className="md:col-span-5">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Contoh: MEI"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Status Keaktifan */}
              <div className="md:col-span-4">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Status Trainer</label>
                <select
                  value={form.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'ACTIVE' })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="ACTIVE">Aktif (Bisa Ambil Kelas &amp; Klien PT)</option>
                  <option value="INACTIVE">Non-Aktif</option>
                </select>
              </div>

              {/* Telepon */}
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  No. Telepon / WhatsApp <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08565123"
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Email Trainer</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="mei@gmail.com"
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Spesialisasi & Tipe Trainer */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Award className="w-4 h-4 text-amber-400" /> Keahlian &amp; Tipe Kontrak
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Spesialisasi</label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="Pilates & Functional Trainer, Bodybuilding, dll"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Kategori / Tipe</label>
                <select
                  value={form.trainerType}
                  onChange={(e) => setForm({ ...form, trainerType: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="PILATES_INSTRUCTOR">Pilates Instructor</option>
                  <option value="FULL_TIME">Personal Trainer Full Time</option>
                  <option value="PART_TIME">Personal Trainer Freelance / Part Time</option>
                  <option value="FITNESS_COACH">Fitness &amp; Bodybuilding Coach</option>
                  <option value="AEROBIC_INSTRUCTOR">Aerobic &amp; Zumba Instructor</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Penugasan Kelas Studio (Multi-Select Pills dengan badge Utama) */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-cyan-400" /> Penugasan Kelas Studio
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih kelas yang diampu oleh trainer ini. Tandai satu kelas sebagai kelas utama.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-400">
                {form.selectedClassIds.length} Kelas Dipilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {studioClasses.map((cls) => {
                const isSelected = form.selectedClassIds.includes(cls.id);
                const isPrimary = form.primaryClassId === cls.id;

                return (
                  <div
                    key={cls.id}
                    className={`rounded-xl p-3 border transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#070D1E] border-cyan-500/50 text-white'
                        : 'bg-[#070D1E]/40 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                    onClick={() => toggleClassSelection(cls.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-[#070D1E] border-white/20"
                        />
                        <span className="text-xs font-bold">{cls.name}</span>
                      </div>
                      {isPrimary && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold">
                          Utama
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm((prev) => ({ ...prev, primaryClassId: cls.id }));
                          }}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded transition ${
                            isPrimary
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          {isPrimary ? '✓ Kelas Utama' : 'Jadikan Kelas Utama'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Ringkasan Performa & Skema Komisi */}
          {trainer && (
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Ringkasan Komisi &amp; Klien
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#070D1E] border border-white/10">
                  <div className="text-slate-400 text-[11px]">Klien PT Aktif</div>
                  <div className="text-lg font-black text-white mt-1">
                    {trainer.metrics?.activeClientsCount || 0} Member
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070D1E] border border-white/10">
                  <div className="text-slate-400 text-[11px]">Sesi Selesai Bulan Ini</div>
                  <div className="text-lg font-black text-cyan-400 mt-1">
                    {trainer.metrics?.completedSessionsThisMonth || 0} Sesi
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070D1E] border border-white/10">
                  <div className="text-slate-400 text-[11px]">Skema Bagi Hasil</div>
                  <div className="text-sm font-bold text-emerald-300 mt-1">
                    {trainer.metrics?.currentTier || 'Flat 50:50 PT : Gym'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070D1E] border border-white/10">
                  <div className="text-slate-400 text-[11px]">Estimasi Total Komisi</div>
                  <div className="text-base font-black text-emerald-400 mt-1">
                    {formatRp(trainer.metrics?.totalEstimatedTakeHome || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tombol Simpan & Batal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/trainers"
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
                  <span>✓ Perubahan Berhasil Disimpan!</span>
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Trainer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
