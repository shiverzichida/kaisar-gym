'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Users,
  Award,
  Plus,
  Phone,
  Mail,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  Wallet,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Percent,
  Sparkles,
  Info,
  Send,
  CreditCard,
  Printer,
  Clock,
  ArrowUpRight,
  FileText,
  Check,
  MessageCircle,
} from 'lucide-react';

interface AssignedClass {
  id: string;
  name: string;
  isPrimary?: boolean;
}

interface ContractBreakdownItem {
  contractId: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  packageName: string;
  totalSessions: number;
  remainingSessions: number;
  completedSessions: number;
  effectivePrice: number;
  unitPricePerSession: number;
  ptSessionFee: number;
  gymSessionFee: number;
  contractEarnedPt: number;
  contractEarnedGym: number;
  status: string;
}

interface Trainer {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email?: string;
  specialization?: string;
  trainerType?: string;
  photoUrl?: string;
  isActive: boolean;
  assignedClasses?: AssignedClass[];
  contractBreakdown?: ContractBreakdownItem[];
  metrics?: {
    activeClientsCount?: number;
    completedSessionsThisMonth?: number;
    currentTier?: string;
    commissionModel?: string;
    commissionModelLabel?: string;
    ptSharePct?: number;
    gymSharePct?: number;
    totalContractValue?: number;
    estimatedSessionCommission?: number;
    gymEarnedRevenue?: number;
    potentialPtCommission?: number;
    potentialGymRevenue?: number;
    estimatedSalesCommission?: number;
    totalEstimatedTakeHome?: number;
  };
  ptContracts?: any[];
  salaryRequests?: any[];
}

interface StudioClass {
  id: string;
  name: string;
  category: string;
}

export default function TrainersPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [studioClasses, setStudioClasses] = useState<StudioClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MASTER' | 'COMMISSION'>('MASTER');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [trainerForm, setTrainerForm] = useState({
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

  // Salary Requests / Payroll states
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);
  const [salaryStatusFilter, setSalaryStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'REJECTED'>('ALL');
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [selectedSalarySlip, setSelectedSalarySlip] = useState<any | null>(null);
  const [isManualRequestModalOpen, setIsManualRequestModalOpen] = useState(false);
  const [manualRequestForm, setManualRequestForm] = useState({
    trainerId: '',
    monthYear: '2026-10',
    amount: 0,
    notes: 'Pencairan komisi 50% Flat langsung via Kasir POS',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trRes, clsRes, salRes] = await Promise.all([
        apiFetch('/trainers'),
        apiFetch('/classes').catch(() => ({ studioClasses: [] })),
        apiFetch('/trainers/salary-requests').catch(() => []),
      ]);
      setTrainers(trRes || []);
      setStudioClasses(clsRes?.studioClasses || []);
      setSalaryRequests(salRes || []);
    } catch (err: any) {
      console.error(err);
      showError(err.message, 'Gagal Memuat Data Trainer');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper: Open WhatsApp for Trainer payment notification
  const openTrainerWhatsApp = (req: any) => {
    const trMatch = req.trainer || trainers.find((t) => t.id === req.trainerId);
    const trainerName = req.trainer?.fullName || trMatch?.fullName || 'Personal Trainer';
    const paymentId = req.id ? req.id.slice(0, 8).toUpperCase() : 'PAY-REF';
    const amountFormatted = formatRp(req.totalAmount || 0);
    const rawPhone = req.trainer?.phone || trMatch?.phone || '';

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone && !cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const waText = `Berikut terlampir bukti pembayaran ${trainerName} dengan nomor id pembayaran #${paymentId} sejumlah ${amountFormatted}`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

    window.open(waUrl, '_blank');
  };

  // Payout handlers
  const handleApproveSalaryRequest = async (
    req: any,
    status: 'PAID' | 'REJECTED' | 'APPROVED_MANAGER'
  ) => {
    const reqId = typeof req === 'string' ? req : req.id;
    setProcessingPayoutId(reqId);

    // Optimistic UI update so badge flips immediately to PAID (LUNAS / SUDAH DITRANSFER)
    setSalaryRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status,
              approvedBy: currentUser?.fullName ? `${currentUser.fullName} (POS)` : 'Admin Kasir POS',
            }
          : r
      )
    );

    try {
      await apiFetch(`/trainers/salary-requests/${reqId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          approvedBy: currentUser?.fullName ? `${currentUser.fullName} (POS)` : 'Admin Kasir POS',
        }),
      });

      showSuccess(
        status === 'PAID'
          ? 'Transfer komisi PT berhasil disetujui & ditandai LUNAS!'
          : status === 'REJECTED'
          ? 'Pengajuan klaim gaji PT ditolak.'
          : 'Pengajuan gaji disetujui Manager.',
        'Status Payroll Diperbarui'
      );

      // If status is PAID, redirect to WhatsApp of the trainer
      if (status === 'PAID') {
        const fullReq = typeof req === 'object' ? req : salaryRequests.find((r) => r.id === reqId);
        openTrainerWhatsApp(fullReq || { id: reqId, totalAmount: 0 });
      }

      await loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Memproses Transfer Gaji');
      await loadData();
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const handleCreateManualSalaryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRequestForm.trainerId) {
      showError('Pilih pelatih terlebih dahulu', 'Validasi Gagal');
      return;
    }

    try {
      await apiFetch('/trainers/salary-requests', {
        method: 'POST',
        body: JSON.stringify({
          trainerId: manualRequestForm.trainerId,
          monthYear: manualRequestForm.monthYear || '2026-10',
          amount: Number(manualRequestForm.amount) || undefined,
          notes: manualRequestForm.notes,
        }),
      });

      showSuccess('Pengajuan transfer gaji berhasil dibuat oleh Kasir POS!', 'Berhasil');
      setIsManualRequestModalOpen(false);
      await loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Membuat Pengajuan');
    }
  };

  // Filtered trainers
  const filteredTrainers = useMemo(() => {
    if (!searchTerm.trim()) return trainers;
    const term = searchTerm.toLowerCase();
    return trainers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(term) ||
        t.code.toLowerCase().includes(term) ||
        t.phone.toLowerCase().includes(term) ||
        (t.email && t.email.toLowerCase().includes(term))
    );
  }, [trainers, searchTerm]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const nextNum = trainers.length + 31;
    setTrainerForm({
      code: `PT-${String(nextNum).padStart(3, '0')}`,
      fullName: '',
      phone: '',
      email: '',
      specialization: 'Pilates & Functional Trainer',
      trainerType: 'PILATES_INSTRUCTOR',
      isActive: true,
      selectedClassIds: [],
      primaryClassId: '',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Trainer
  const handleSubmitAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/trainers', {
        method: 'POST',
        body: JSON.stringify({
          code: trainerForm.code,
          fullName: trainerForm.fullName,
          phone: trainerForm.phone,
          specialization: trainerForm.specialization,
          trainerType: trainerForm.trainerType,
          isActive: trainerForm.isActive,
          classIds: trainerForm.selectedClassIds,
        }),
      });
      showSuccess('Personal Trainer baru berhasil ditambahkan!', 'Sukses Menambah');
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Menambah Trainer');
    }
  };


  // Delete Trainer
  const handleDeleteTrainer = async (tr: Trainer) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus trainer ${tr.fullName} (${tr.code})?`)) return;
    try {
      await apiFetch(`/trainers/${tr.id}`, { method: 'DELETE' });
      showSuccess(`Trainer ${tr.fullName} berhasil dihapus!`, 'Terhapus');
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Menghapus Trainer');
    }
  };

  // Toggle class selection in form
  const handleToggleClass = (classId: string) => {
    setTrainerForm((prev) => {
      const exists = prev.selectedClassIds.includes(classId);
      const nextSelected = exists
        ? prev.selectedClassIds.filter((id) => id !== classId)
        : [...prev.selectedClassIds, classId];
      const nextPrimary =
        prev.primaryClassId === classId && exists
          ? nextSelected[0] || ''
          : prev.primaryClassId || nextSelected[0] || '';
      return {
        ...prev,
        selectedClassIds: nextSelected,
        primaryClassId: nextPrimary,
      };
    });
  };

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-5 text-slate-100">
        {/* ══════════════ TAB SWITCHER (MASTER VS COMMISSION) ══════════════ */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0F172A] border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('MASTER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'MASTER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Master Personal Trainers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMMISSION')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'COMMISSION'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Skema Komisi &amp; Bagi Hasil 50:50</span>
            </button>
          </div>

          {activeTab === 'MASTER' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, kode, atau kontak..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0F172A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* ══════════════ TAB 1: MASTER PERSONAL TRAINERS TABLE (Persis Screenshot) ══════════════ */}
        {activeTab === 'MASTER' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] shadow-xl overflow-hidden">
            {/* Table Header Row with + Tambah Trainer */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Personal Trainers
              </h2>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Trainer</span>
              </button>
            </div>

            {/* Table Content with Top Horizontal Scroll */}
            <TableScrollWrapper label="Scroll Tabel Trainer">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070D1E] text-slate-300 font-bold border-b border-white/10">
                  <tr>
                    <th className="p-4">Nama</th>
                    <th className="p-4">Kode</th>
                    <th className="p-4">Kontak</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {filteredTrainers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data personal trainer yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredTrainers.map((tr) => {
                      const emailFormatted =
                        tr.email ||
                        `${tr.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
                      const assignedList = tr.assignedClasses || [];

                      return (
                        <tr key={tr.id} className="hover:bg-white/[0.02] transition">
                          {/* 1. Nama with Avatar */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {/* Avatar Card Badge or Photo */}
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#070D1E] border border-white/10 flex items-center justify-center shadow-sm">
                                {tr.photoUrl ? (
                                  <img
                                    src={tr.photoUrl}
                                    alt={tr.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#1A2634] text-slate-200 font-black text-xs flex items-center justify-center">
                                    PT
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-sm text-white">
                                {tr.fullName}
                              </span>
                            </div>
                          </td>

                          {/* 2. Kode */}
                          <td className="p-4 font-mono font-semibold text-xs text-slate-300 whitespace-nowrap">
                            {tr.code}
                          </td>

                          {/* 3. Kontak (Phone & Email) */}
                          <td className="p-4 whitespace-nowrap space-y-1">
                            <div className="flex items-center gap-2 text-slate-200 font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{tr.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{emailFormatted}</span>
                            </div>
                          </td>

                          {/* 4. Status */}
                          <td className="p-4 whitespace-nowrap">
                            {tr.isActive ? (
                              <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-sm">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-slate-700 text-slate-200 shadow-sm">
                                Non-Aktif
                              </span>
                            )}
                          </td>

                          {/* 5. Kelas Assigned List */}
                          <td className="p-4">
                            {assignedList.length === 0 ? (
                              <span className="text-slate-500 italic text-xs">
                                Belum ada kelas
                              </span>
                            ) : (
                              <ul className="space-y-1 text-xs text-slate-300">
                                {assignedList.map((cls, idx) => (
                                  <li
                                    key={cls.id || idx}
                                    className="flex items-center gap-2 whitespace-nowrap"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                    <span className="font-semibold text-slate-200">
                                      {cls.name}
                                    </span>
                                    {cls.isPrimary && (
                                      <span className="px-1.5 py-0.2 rounded bg-cyan-600 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                                        Utama
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>

                          {/* 6. Aksi */}
                          <td className="p-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Button (Navigasi ke Layout Halaman Edit) */}
                              <Link
                                href={`/trainers/${tr.id}/edit`}
                                className="p-2 rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 shadow-sm transition inline-flex items-center justify-center"
                                title="Edit Trainer (Buka Layout Lengkap)"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>

                              {/* Delete Button (Red outline) */}
                              <button
                                type="button"
                                onClick={() => handleDeleteTrainer(tr)}
                                className="p-2 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 shadow-sm transition"
                                title="Hapus Trainer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TableScrollWrapper>
          </div>
        )}

        {/* ══════════════ TAB 2: SKEMA BAGI HASIL FLAT 50:50 PT & KAISAR GYM ══════════════ */}
        {activeTab === 'COMMISSION' && (
          <div className="space-y-5">
            {/* Kebijakan Komisi Banner */}
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-[#0F172A] to-blue-950/30 p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>Skema Bagi Hasil Flat: 50% Kaisar Gym : 50% Personal Trainer</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                        Tanpa Tiering
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Nilai per sesi dihitung adil: <strong className="text-white">Harga Paket ÷ Total Sesi</strong>. Setiap sesi yang tuntas diajar langsung otomatis membagi <span className="text-emerald-400 font-bold">50% untuk Coach</span> dan <span className="text-cyan-400 font-bold">50% untuk Kaisar Gym</span> tanpa potongan closing penjualan.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#070D1E]/80 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-slate-400 shrink-0">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Presensi &amp; booking sesi latihan dijalankan melalui Portal Khusus PT &amp; Member.</span>
                </div>
              </div>
            </div>

            {/* ══════════════ ANTREAN & RIWAYAT PENGAJUAN TRANSFER GAJI PT ══════════════ */}
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>Daftar Pengajuan Klaim Transfer Gaji &amp; Komisi PT</span>
                      {salaryRequests.filter((r) => r.status === 'PENDING').length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30 animate-pulse">
                          {salaryRequests.filter((r) => r.status === 'PENDING').length} Menunggu Transfer
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Verifikasi sesi latihan, persetujuan payroll, dan eksekusi transfer hak komisi 50% bagi Personal Trainer.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (trainers.length > 0) {
                        setManualRequestForm({
                          trainerId: trainers[0].id,
                          monthYear: '2026-10',
                          amount: trainers[0].metrics?.estimatedSessionCommission || 2650000,
                          notes: 'Pencairan komisi 50% Flat langsung via Kasir POS',
                        });
                      }
                      setIsManualRequestModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Pengajuan Kasir</span>
                  </button>
                </div>
              </div>

              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#070D1E] border border-white/10 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Total Pengajuan</span>
                  <div className="text-xl font-black text-white">{salaryRequests.length} Transaksi</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                  <span className="text-amber-400 text-[11px] font-bold block">Menunggu Transfer</span>
                  <div className="text-xl font-black text-amber-300">
                    {salaryRequests.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED_MANAGER').length} Antrean
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <span className="text-emerald-400 text-[11px] font-bold block">Total Perlu Ditransfer</span>
                  <div className="text-lg font-black text-emerald-300">
                    {formatRp(
                      salaryRequests
                        .filter((r) => r.status === 'PENDING' || r.status === 'APPROVED_MANAGER')
                        .reduce((acc, r) => acc + (r.totalAmount || 0), 0)
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                  <span className="text-cyan-400 text-[11px] font-bold block">Komisi Lunas Ditransfer</span>
                  <div className="text-lg font-black text-cyan-300">
                    {formatRp(
                      salaryRequests
                        .filter((r) => r.status === 'PAID')
                        .reduce((acc, r) => acc + (r.totalAmount || 0), 0)
                    )}
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#070D1E] border border-white/10 w-fit">
                <button
                  type="button"
                  onClick={() => setSalaryStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    salaryStatusFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({salaryRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSalaryStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    salaryStatusFilter === 'PENDING'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Perlu Ditransfer ({salaryRequests.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED_MANAGER').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSalaryStatusFilter('PAID')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    salaryStatusFilter === 'PAID'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sudah Ditransfer ({salaryRequests.filter((r) => r.status === 'PAID').length})
                </button>
              </div>

              {/* Table of Requests */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2.5 px-3">Waktu Pengajuan</th>
                      <th className="py-2.5 px-3">Pelatih (PT)</th>
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">Sesi Terlaksana</th>
                      <th className="py-2.5 px-3">Nominal Transfer (50%)</th>
                      <th className="py-2.5 px-3">Rekening &amp; Catatan</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Aksi Kasir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {salaryRequests
                      .filter((r) => {
                        if (salaryStatusFilter === 'PENDING') return r.status === 'PENDING' || r.status === 'APPROVED_MANAGER';
                        if (salaryStatusFilter === 'PAID') return r.status === 'PAID';
                        if (salaryStatusFilter === 'REJECTED') return r.status === 'REJECTED';
                        return true;
                      })
                      .map((req: any) => {
                        const trMatch = req.trainer || trainers.find((t) => t.id === req.trainerId);
                        const isPending = req.status === 'PENDING' || req.status === 'APPROVED_MANAGER';
                        const isPaid = req.status === 'PAID';

                        return (
                          <tr key={req.id} className="hover:bg-white/5 transition">
                            <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                              {formatDateId(req.createdAt)}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{trMatch?.fullName || 'Personal Trainer'}</span>
                                <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                  {trMatch?.code || 'PT'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">{trMatch?.phone || '-'}</div>
                            </td>
                            <td className="py-3 px-3 font-bold text-white">{req.monthYear}</td>
                            <td className="py-3 px-3 text-slate-200">{req.completedSessions} Sesi Diajar</td>
                            <td className="py-3 px-3 font-black text-emerald-400 text-sm">
                              {formatRp(req.totalAmount)}
                            </td>
                            <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={req.notes}>
                              {req.notes || '-'}
                            </td>
                            <td className="py-3 px-3">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>LUNAS DITRANSFER</span>
                                </span>
                              ) : req.status === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  <X className="w-3 h-3" />
                                  <span>DITOLAK</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>MENUNGGU TRANSFER</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={processingPayoutId === req.id}
                                      onClick={() => handleApproveSalaryRequest(req, 'PAID')}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                                      title="Setujui, tandai LUNAS dan buka WhatsApp pelatih"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Setujui &amp; Transfer</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={processingPayoutId === req.id}
                                      onClick={() => handleApproveSalaryRequest(req, 'REJECTED')}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold text-[11px] border border-rose-500/30 cursor-pointer transition disabled:opacity-50"
                                      title="Tolak pengajuan klaim"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openTrainerWhatsApp(req)}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                      title="Kirim ulang bukti transfer ke WhatsApp Trainer"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WA</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSalarySlip(req)}
                                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Printer className="w-3 h-3 text-emerald-400" />
                                      <span>Bukti Transfer</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grid Kartu Trainer & Komisi */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {trainers.map((tr) => {
                const breakdown = tr.contractBreakdown || (tr.ptContracts || []).map((c: any) => {
                  const norm = c.normalPrice > 0 ? c.normalPrice : (c.ptPackage?.price || 0);
                  const effPrice = c.totalPrice > 0 ? c.totalPrice : Math.round(norm * (1 - (c.discountPct || 0) / 100));
                  const totSessions = c.totalSessions > 0 ? c.totalSessions : (c.ptPackage?.sessionCount || 1);
                  const remSessions = c.remainingSessions !== undefined ? c.remainingSessions : totSessions;
                  const compSessions = Math.max(0, totSessions - remSessions);
                  const unitPrice = totSessions > 0 ? Math.round(effPrice / totSessions) : 0;
                  const ptFee = Math.round(unitPrice * 0.5);
                  const gymFee = unitPrice - ptFee;
                  return {
                    contractId: c.id,
                    memberName: c.member?.fullName || 'Member',
                    memberCode: c.member?.memberCode || '-',
                    packageName: c.ptPackage?.name || 'Paket PT',
                    totalSessions: totSessions,
                    remainingSessions: remSessions,
                    completedSessions: compSessions,
                    effectivePrice: effPrice,
                    unitPricePerSession: unitPrice,
                    ptSessionFee: ptFee,
                    gymSessionFee: gymFee,
                    contractEarnedPt: compSessions * ptFee,
                    status: c.status,
                  };
                });

                const completedSessions = tr.metrics?.completedSessionsThisMonth || 0;
                const totalContractVal = tr.metrics?.totalContractValue || 0;
                const ptEarned = tr.metrics?.estimatedSessionCommission || 0;
                const gymEarned = tr.metrics?.gymEarnedRevenue || ptEarned;
                const potentialPt = tr.metrics?.potentialPtCommission || Math.round(totalContractVal * 0.5);

                return (
                  <div
                    key={tr.id}
                    className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-emerald-500/40 transition"
                  >
                    <div className="space-y-3.5">
                      {/* Top Header Card */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30">
                          {tr.code}
                        </span>
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Bagi Hasil Flat 50:50
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-base text-white">{tr.fullName}</h3>
                        <p className="text-xs text-slate-400">{tr.specialization}</p>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{tr.phone || '-'}</span>
                        </div>
                      </div>

                      {/* 4 Stat Metric Boxes */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10">
                          <div className="text-slate-400 text-[10px]">Sesi Selesai Diajar</div>
                          <div className="text-base font-black text-white mt-0.5">
                            {completedSessions} Sesi
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10">
                          <div className="text-slate-400 text-[10px]">Total Kontrak Klien</div>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">
                            {formatRp(totalContractVal)}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                          <div className="text-emerald-400 text-[10px] font-semibold">Hak Komisi PT (50%)</div>
                          <div className="text-base font-black text-emerald-300 mt-0.5">
                            {formatRp(ptEarned)}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                          <div className="text-cyan-400 text-[10px] font-semibold">Bagian Gym (50%)</div>
                          <div className="text-base font-black text-cyan-300 mt-0.5">
                            {formatRp(gymEarned)}
                          </div>
                        </div>
                      </div>

                      {/* Revenue Split Ratio Bar & Potensi */}
                      <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Rasio Bagi Hasil:</span>
                          <span className="text-white font-bold">50% PT : 50% Kaisar Gym</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800">
                          <div className="bg-emerald-500 h-full w-1/2" title="50% Komisi PT" />
                          <div className="bg-cyan-500 h-full w-1/2" title="50% Kaisar Gym" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                          <span>Proyeksi Total Kontrak (100% Selesai):</span>
                          <span className="text-emerald-400 font-bold">{formatRp(potentialPt)}</span>
                        </div>
                      </div>

                      {/* Klien Bimbingan & Kontrak PT Aktif */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Klien Bimbingan ({breakdown.length}):</span>
                          <span className="text-[10px] text-slate-500 lowercase">tanpa komisi sales closing</span>
                        </div>

                        {breakdown.length === 0 ? (
                          <div className="text-xs text-slate-500 italic p-3 bg-[#070D1E] rounded-xl text-center">
                            Belum ada kontrak klien aktif.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {breakdown.map((c: any) => (
                              <div
                                key={c.contractId}
                                className="rounded-xl bg-[#070D1E] border border-white/5 p-3 space-y-1.5 text-xs hover:border-white/20 transition"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{c.memberName}</span>
                                      {c.memberCode && (
                                        <span className="text-[10px] font-mono text-slate-400">
                                          ({c.memberCode})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400">{c.packageName}</div>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      c.status === 'ACTIVE'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-700 text-slate-300'
                                    }`}
                                  >
                                    {c.status === 'ACTIVE' ? 'Aktif' : 'Selesai'}
                                  </span>
                                </div>

                                {/* Session Progress */}
                                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                  <div>
                                    <span className="text-slate-400">Progres Sesi: </span>
                                    <strong className="text-white">
                                      {c.completedSessions} Selesai
                                    </strong>
                                    <span className="text-slate-500"> (Sisa {c.remainingSessions}/{c.totalSessions})</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-slate-400">Tarif/Sesi: </span>
                                    <strong className="text-slate-200">{formatRp(c.unitPricePerSession)}</strong>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                                  <span className="text-slate-400">Hak Komisi Terakumulasi (50%):</span>
                                  <span className="text-emerald-400 font-black">
                                    {formatRp(c.contractEarnedPt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ MODAL TAMBAH TRAINER ══════════════ */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <form onSubmit={handleSubmitAddTrainer}>
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Tambah Personal Trainer Baru</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Kode Trainer</label>
                      <input
                        type="text"
                        value={trainerForm.code}
                        onChange={(e) => setTrainerForm({ ...trainerForm, code: e.target.value })}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Status Keaktifan</label>
                      <select
                        value={trainerForm.isActive ? '1' : '0'}
                        onChange={(e) =>
                          setTrainerForm({ ...trainerForm, isActive: e.target.value === '1' })
                        }
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="1">Aktif</option>
                        <option value="0">Non-Aktif</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Contoh: Herry Chandra"
                      value={trainerForm.fullName}
                      onChange={(e) => setTrainerForm({ ...trainerForm, fullName: e.target.value })}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Nomor Telepon / WA</label>
                      <input
                        type="text"
                        placeholder="0812xxxxxxx"
                        value={trainerForm.phone}
                        onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Alamat Email</label>
                      <input
                        type="email"
                        placeholder="trainer@gmail.com"
                        value={trainerForm.email}
                        onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Checklist Kelas Studio yang Diajar */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">
                      Pilih Kelas yang Diampu:
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-[#070D1E] border border-white/10">
                      {studioClasses.map((cls) => {
                        const checked = trainerForm.selectedClassIds.includes(cls.id);
                        return (
                          <label
                            key={cls.id}
                            className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleClass(cls.id)}
                              className="rounded border-white/20 bg-[#0F172A] text-blue-600 focus:ring-0 w-4 h-4"
                            />
                            <span className="text-xs">{cls.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                  >
                    Simpan Trainer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════ MODAL: BUAT PENGAJUAN GAJI MANUAL OLEH KASIR ══════════════ */}
        {isManualRequestModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <form onSubmit={handleCreateManualSalaryRequest}>
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Buat Pengajuan Transfer Komisi PT (Kasir POS)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsManualRequestModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Pilih Personal Trainer</label>
                    <select
                      value={manualRequestForm.trainerId}
                      onChange={(e) => {
                        const tr = trainers.find((t) => t.id === e.target.value);
                        setManualRequestForm({
                          ...manualRequestForm,
                          trainerId: e.target.value,
                          amount: tr?.metrics?.estimatedSessionCommission || 2650000,
                        });
                      }}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.code}) - Komisi Berjalan: {formatRp(t.metrics?.estimatedSessionCommission || 0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Periode</label>
                      <input
                        type="text"
                        value={manualRequestForm.monthYear}
                        onChange={(e) => setManualRequestForm({ ...manualRequestForm, monthYear: e.target.value })}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Nominal Komisi (Rp)</label>
                      <input
                        type="number"
                        value={manualRequestForm.amount}
                        onChange={(e) => setManualRequestForm({ ...manualRequestForm, amount: Number(e.target.value) })}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Catatan Kasir / Nomor Rekening Tujuan</label>
                    <textarea
                      rows={2}
                      value={manualRequestForm.notes}
                      onChange={(e) => setManualRequestForm({ ...manualRequestForm, notes: e.target.value })}
                      placeholder="Contoh: Transfer via BCA 029-8877-665 a.n. Hendra Pratama"
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsManualRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                  >
                    Simpan &amp; Masukkan Antrean Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════ MODAL: BUKTI CETAK TRANSFER KOMISI PT (LUNAS) ══════════════ */}
        {selectedSalarySlip && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0F172A] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Voucher Transfer &amp; Payout Komisi PT</h3>
                    <p className="text-[11px] text-slate-400">Kaisar Gym Pontianak • Sistem Payroll Resmi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSalarySlip(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs bg-[#0B1120]">
                {/* Header Voucher */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-sm font-black text-white tracking-wider">KAISAR GYM PONTIANAK</div>
                    <div className="text-[10px] text-slate-400">Jl. Patimura No. 84, Pontianak</div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Bukti Pengeluaran Kas (Disbursement)</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ STATUS: LUNAS DITRANSFER
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      ID: {selectedSalarySlip.id?.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Info Pelatih */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Penerima Komisi:</span>
                    <strong className="text-white text-xs">
                      {selectedSalarySlip.trainer?.fullName || 'Personal Trainer'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Kode Trainer:</span>
                    <strong className="text-white font-mono text-xs">
                      {selectedSalarySlip.trainer?.code || 'PT'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Periode Gaji:</span>
                    <strong className="text-slate-200 text-xs">{selectedSalarySlip.monthYear}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Sesi Terlaksana:</span>
                    <strong className="text-white text-xs">{selectedSalarySlip.completedSessions} Sesi</strong>
                  </div>
                </div>

                {/* Catatan / Rekening */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Keterangan Transfer &amp; Rekening Tujuan:</span>
                  <div className="text-slate-200 font-mono text-[11px]">{selectedSalarySlip.notes || '-'}</div>
                </div>

                {/* Breakdown Nominal */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      Total Nominal Ditransfer (50% Flat)
                    </span>
                    <div className="text-xl font-black text-emerald-300">
                      {formatRp(selectedSalarySlip.totalAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Diverifikasi Oleh:</span>
                    <span className="text-xs font-bold text-white">
                      {selectedSalarySlip.approvedBy || 'Admin Kasir POS'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-[#070D1E] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openTrainerWhatsApp(selectedSalarySlip)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim ke WhatsApp Pelatih</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 border border-white/10 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Bukti</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSalarySlip(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
