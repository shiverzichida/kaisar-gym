'use client';

import React, { useState, useMemo, useRef } from 'react';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  ArrowLeftRight,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  UserCheck,
  Dumbbell,
  Receipt,
  Tag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface PtAssignmentsViewProps {
  assignments: any[];
  trainers: any[];
  members: any[];
  ptPackages: any[];
  onRefresh: () => void;
}

export default function PtAssignmentsView({
  assignments = [],
  trainers = [],
  members = [],
  ptPackages = [],
  onRefresh,
}: PtAssignmentsViewProps) {
  const { showSuccess, showError } = useToast();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [transferModal, setTransferModal] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Form state for New Assignment
  const [newForm, setNewForm] = useState({
    memberId: members[0]?.id || '',
    trainerId: trainers[0]?.id || '',
    ptPackageId: ptPackages[0]?.id || '',
    totalSessions: 12,
    normalPrice: 2000000,
    discountPct: 0,
    validityDays: 60,
    notes: '',
  });

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    newTrainerId: '',
    reason: 'Rotasi jadwal trainer',
  });

  // Synchronize new assignment package defaults
  const handlePackageChange = (pkgId: string) => {
    const pkg = ptPackages.find((p) => p.id === pkgId);
    if (pkg) {
      setNewForm((prev) => ({
        ...prev,
        ptPackageId: pkgId,
        totalSessions: pkg.sessionCount,
        normalPrice: pkg.price,
        validityDays: pkg.validityDays,
      }));
    } else {
      setNewForm((prev) => ({ ...prev, ptPackageId: pkgId }));
    }
  };

  // Filter logic
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Search member or trainer
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = item.member?.fullName?.toLowerCase() || '';
        const mCode = item.member?.memberCode?.toLowerCase() || '';
        const tName = item.trainer?.fullName?.toLowerCase() || '';
        if (!mName.includes(q) && !mCode.includes(q) && !tName.includes(q)) {
          return false;
        }
      }

      // Trainer filter
      if (selectedTrainer !== 'ALL' && item.trainerId !== selectedTrainer) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      // Date filter (matches YYYY-MM or YYYY-MM-DD)
      if (dateFilter) {
        const createdDate = new Date(item.createdAt).toISOString().slice(0, 10);
        if (!createdDate.includes(dateFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, searchTerm, selectedTrainer, selectedStatus, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (filteredAssignments.length === 0) {
      showError('Tidak ada data penugasan untuk diekspor', 'Ekspor Gagal');
      return;
    }

    const headers = [
      'Member',
      'Kode Member',
      'Trainer',
      'Total Sesi',
      'Sisa Sesi',
      'Harga Normal (Rp)',
      'Diskon %',
      'Total Price (Rp)',
      'Status',
      'Tanggal Dibuat',
      'Masa Berlaku',
      'No Nota Transaksi',
      'Catatan',
    ];

    const rows = filteredAssignments.map((a) => [
      `"${a.member?.fullName || '-'}"`,
      `"${a.member?.memberCode || '-'}"`,
      `"${a.trainer?.fullName || '-'}"`,
      a.totalSessions,
      a.remainingSessions,
      a.normalPrice,
      `${a.discountPct}%`,
      a.totalPrice,
      `"${a.status}"`,
      `"${new Date(a.createdAt).toLocaleDateString('id-ID')}"`,
      `"${a.expiryDate ? new Date(a.expiryDate).toLocaleDateString('id-ID') : '-'}"`,
      `"${a.invoiceRef || '-'}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PT_Assignments_KaisarGym_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess('File PT Assignments berhasil diekspor ke Excel (CSV)!', 'Ekspor Berhasil');
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const headers = [
      'Kode/Nama Member',
      'Kode/Nama Trainer',
      'Nama Paket PT (Opsional)',
      'Total Sesi',
      'Harga Normal (Rp)',
      'Diskon %',
      'Total Price (Rp)',
    ];

    const sampleRows = [
      'KG-2026-0001,Coach Hendra Pratama,Paket 12 Sesi PT,12,2000000,0,2000000',
      'KG-2026-0002,Indah,Paket 24 Sesi PT,24,3750000,0,3750000',
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Template_PT_Assignments_KaisarGym.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess('Template import PT Assignments berhasil diunduh', 'Unduh Berhasil');
  };

  // Import CSV
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showError('Pilih file CSV template terlebih dahulu', 'File Kosong');
      return;
    }
    setImportLoading(true);
    try {
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        throw new Error('File CSV kosong atau hanya berisi baris header');
      }

      const items: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2 && cols[0] && cols[1]) {
          items.push({
            memberCodeOrName: cols[0],
            trainerCodeOrName: cols[1],
            packageCodeOrName: cols[2] || '',
            sessions: Number(cols[3] || 12),
            normalPrice: Number(cols[4] || 2000000),
            discountPct: Number(cols[5] || 0),
            totalPrice: Number(cols[6] || 2000000),
          });
        }
      }

      if (items.length === 0) {
        throw new Error('Tidak ada baris data penugasan yang valid ditemukan');
      }

      const res = await apiFetch('/trainers/assignments/import', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });

      showSuccess(`Berhasil mengimpor ${res.count} penugasan PT baru!`, 'Import Berhasil');
      setShowImportModal(false);
      setImportFile(null);
      onRefresh();
    } catch (err: any) {
      showError(err.message || 'Gagal memproses file import', 'Gagal Import');
    } finally {
      setImportLoading(false);
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calculatedTotal = Math.max(
        0,
        Math.round(newForm.normalPrice * (1 - (newForm.discountPct || 0) / 100))
      );

      await apiFetch('/trainers/assignments', {
        method: 'POST',
        body: JSON.stringify({
          memberId: newForm.memberId,
          trainerId: newForm.trainerId,
          ptPackageId: newForm.ptPackageId,
          totalSessions: Number(newForm.totalSessions),
          normalPrice: Number(newForm.normalPrice),
          discountPct: Number(newForm.discountPct),
          totalPrice: calculatedTotal,
          validityDays: Number(newForm.validityDays),
          notes: newForm.notes,
        }),
      });

      showSuccess('Penugasan Personal Trainer (PT) berhasil dibuat!', 'Berhasil Ditugaskan');
      setShowNewModal(false);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Menugaskan');
    }
  };

  // Open Transfer Modal
  const openTransfer = (item: any) => {
    setTransferModal(item);
    const available = trainers.find((t) => t.id !== item.trainerId);
    setTransferForm({
      newTrainerId: available?.id || '',
      reason: 'Permintaan ganti trainer oleh member',
    });
  };

  // Submit Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModal || !transferForm.newTrainerId) return;
    try {
      await apiFetch(`/trainers/assignments/${transferModal.id}/transfer`, {
        method: 'POST',
        body: JSON.stringify(transferForm),
      });

      showSuccess(
        `Penugasan member ${transferModal.member?.fullName} berhasil dialihkan ke trainer baru!`,
        'Transfer Sukses'
      );
      setTransferModal(null);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Transfer Trainer');
    }
  };

  // Delete Assignment
  const handleDeleteSubmit = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/trainers/assignments/${deleteConfirm.id}`, {
        method: 'DELETE',
      });
      showSuccess(`Penugasan PT ${deleteConfirm.member?.fullName} berhasil dihapus`, 'Penugasan Dihapus');
      setDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Menghapus');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb & Actions Row matching Screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            PT Assignments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Penetapan kontrak Personal Trainer dari transaksi POS otomatis maupun penugasan khusus.
          </p>
        </div>

        {/* 4 Action Buttons matching Screenshot */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ekspor Excel (Green) */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#107c41] hover:bg-[#0e6b38] text-white text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          {/* Template (Cyan) */}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00a4ef] hover:bg-[#0092d6] text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Template</span>
          </button>

          {/* Import (White/Green Border) */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#121217] text-emerald-600 dark:text-emerald-400 border border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold transition shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>

          {/* + New Assignment (Blue) */}
          <button
            onClick={() => {
              if (members.length > 0 && !newForm.memberId) {
                setNewForm((prev) => ({ ...prev, memberId: members[0].id }));
              }
              if (trainers.length > 0 && !newForm.trainerId) {
                setNewForm((prev) => ({ ...prev, trainerId: trainers[0].id }));
              }
              setShowNewModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* POS Quick Tip Banner */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 flex items-center justify-between gap-3 text-xs text-sky-200">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>
            <strong>Terintegrasi Otomatis dengan POS:</strong> Setiap transaksi pembelian Paket PT di Kasir POS akan otomatis terdaftar sebagai PT Assignment aktif di tabel ini lengkap dengan histori nomor notanya.
          </span>
        </div>
        <Link
          href="/pos"
          className="flex-shrink-0 flex items-center gap-1 text-sky-300 hover:text-white font-bold underline"
        >
          Buka Kasir POS <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Card Bar matching Screenshot */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#121217]/90 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search box */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Member/Trainer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FFC067]"
            />
          </div>

          {/* Trainer dropdown */}
          <div>
            <select
              value={selectedTrainer}
              onChange={(e) => {
                setSelectedTrainer(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-[#FFC067]"
            >
              <option value="ALL">All Trainers</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Date range picker */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-[#FFC067]"
            />
          </div>

          {/* Status dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-xs text-slate-200 focus:outline-none focus:border-[#FFC067]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Page entries dropdown + Filter button */}
          <div className="flex gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-1/2 px-2 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-xs text-slate-200 focus:outline-none"
            >
              <option value={10}>10 entries</option>
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
            </select>
            <button
              onClick={() => setCurrentPage(1)}
              className="w-1/2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table matching Screenshot */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#121217]/90 overflow-hidden shadow-sm">
        <TableScrollWrapper label="Scroll Kontrak PT">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Trainer</th>
                <th className="py-3.5 px-3 text-center">Sessions</th>
                <th className="py-3.5 px-3 text-center">Remaining</th>
                <th className="py-3.5 px-4">Harga Normal (Rp)</th>
                <th className="py-3.5 px-3 text-center">Diskon %</th>
                <th className="py-3.5 px-4">Total Price (Rp)</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Dumbbell className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Belum ada penugasan PT yang sesuai filter. Lakukan transaksi Paket PT di POS atau klik + New Assignment.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition">
                    {/* Member */}
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      <div>{item.member?.fullName || 'Member Kaisar'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.member?.memberCode} {item.invoiceRef && `• ${item.invoiceRef}`}
                      </div>
                    </td>

                    {/* Trainer */}
                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {item.trainer?.fullName || 'Belum Ditugaskan'}
                    </td>

                    {/* Sessions */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-100">
                      {item.totalSessions}
                    </td>

                    {/* Remaining */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-600 text-white font-black text-xs">
                        {item.remainingSessions}
                      </span>
                    </td>

                    {/* Harga Normal */}
                    <td className="py-3.5 px-4 font-mono">
                      {formatRp(item.normalPrice)}
                    </td>

                    {/* Diskon % */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      {item.discountPct || 0}%
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#FFC067]">
                      {formatRp(item.totalPrice)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-600 text-white'
                            : item.status === 'COMPLETED'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-600 text-slate-200'
                        }`}
                      >
                        {item.status === 'ACTIVE' ? 'Active' : item.status}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </td>

                    {/* Actions: Yellow Switch, Blue Edit, Red Trash */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Transfer / Ganti Trainer (Yellow icon button) */}
                        <button
                          onClick={() => openTransfer(item)}
                          title="Ganti / Transfer Trainer"
                          className="p-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black transition"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Assignment (Navigasi ke Halaman Layout Edit) */}
                        <Link
                          href={`/pt-assignments/${item.id}/edit`}
                          title="Edit Penugasan Sesi"
                          className="p-1.5 rounded-md border border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition inline-flex items-center justify-center"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        {/* Delete Assignment (Red icon button) */}
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          title="Hapus Penugasan"
                          className="p-1.5 rounded-md border border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScrollWrapper>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08] text-xs text-slate-400">
            <div>
              Menampilkan {Math.min(filteredAssignments.length, (currentPage - 1) * pageSize + 1)} -{' '}
              {Math.min(filteredAssignments.length, currentPage * pageSize)} dari {filteredAssignments.length} data
            </div>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-white/[0.1] disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`px-2.5 py-1 rounded font-bold ${
                    currentPage === num
                      ? 'bg-[#FFC067] text-slate-950'
                      : 'border border-white/[0.1] text-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-white/[0.1] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: + New Assignment */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#121217] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" /> Tambah Penugasan PT Baru
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pilih Member</label>
                <select
                  value={newForm.memberId}
                  onChange={(e) => setNewForm({ ...newForm, memberId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs"
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberCode} — {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pilih Trainer</label>
                <select
                  value={newForm.trainerId}
                  onChange={(e) => setNewForm({ ...newForm, trainerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs"
                  required
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.trainerType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Paket PT (Template)</label>
                <select
                  value={newForm.ptPackageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs"
                >
                  {ptPackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sessionCount} Sesi - {formatRp(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Sesi</label>
                  <input
                    type="number"
                    value={newForm.totalSessions}
                    onChange={(e) => setNewForm({ ...newForm, totalSessions: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs font-mono"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Masa Berlaku (Hari)</label>
                  <input
                    type="number"
                    value={newForm.validityDays}
                    onChange={(e) => setNewForm({ ...newForm, validityDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs font-mono"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Harga Normal (Rp)</label>
                  <input
                    type="number"
                    value={newForm.normalPrice}
                    onChange={(e) => setNewForm({ ...newForm, normalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Diskon (%)</label>
                  <input
                    type="number"
                    value={newForm.discountPct}
                    onChange={(e) => setNewForm({ ...newForm, discountPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs font-mono"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#09090B] border border-white/[0.08] flex items-center justify-between font-bold">
                <span className="text-slate-400">Total Price Final:</span>
                <span className="text-[#FFC067] text-sm">
                  {formatRp(Math.round(newForm.normalPrice * (1 - (newForm.discountPct || 0) / 100)))}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Penugasan</label>
                <input
                  type="text"
                  placeholder="Target latihan, riwayat cedera, atau instruksi khusus"
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Transfer / Switch Trainer */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#121217] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" /> Transfer / Ganti Trainer
              </h3>
              <button onClick={() => setTransferModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl bg-[#09090B] p-3.5 border border-white/[0.08] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <strong className="text-slate-100">{transferModal.member?.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trainer Saat Ini:</span>
                <span className="text-amber-300 font-semibold">{transferModal.trainer?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sisa Kuota Sesi:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black">
                  {transferModal.remainingSessions} Sesi
                </span>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pilih Trainer Baru</label>
                <select
                  value={transferForm.newTrainerId}
                  onChange={(e) => setTransferForm({ ...transferForm, newTrainerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs"
                  required
                >
                  <option value="">-- Pilih Trainer Tujuan --</option>
                  {trainers
                    .filter((t) => t.id !== transferModal.trainerId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.trainerType} • {t.specialization})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alasan Transfer / Catatan</label>
                <textarea
                  rows={3}
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-white/[0.12] text-slate-100 text-xs"
                  placeholder="Contoh: Jadwal trainer bentrok, member meminta ganti program"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setTransferModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Konfirmasi Transfer Trainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#121217] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Upload className="w-5 h-5" /> Import Data PT Assignments (CSV)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Unggah file CSV yang telah disesuaikan dengan template resmi. Pastikan kode member dan kode/nama trainer sudah terdaftar di sistem.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-white/[0.15] rounded-xl p-6 text-center hover:border-emerald-500 transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  required
                />
                {importFile && (
                  <p className="mt-2 text-emerald-400 font-bold">
                    File terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Format Template
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs"
                  >
                    {importLoading ? 'Memproses...' : 'Upload & Import'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-[#121217] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Batalkan / Hapus Penugasan?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus kontrak penugasan PT untuk{' '}
                <strong className="text-rose-400">{deleteConfirm.member?.fullName}</strong> bersama pelatih{' '}
                <strong className="text-slate-200">{deleteConfirm.trainer?.fullName}</strong>?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
