'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch, formatDateId } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { scanKtpWithOcr } from '@/lib/ktpOcr';
import {
  Camera,
  UserPlus,
  CalendarClock,
  Building2,
  Zap,
  Car,
  Play,
  Trash2,
  Search,
  Edit3,
  Download,
  Upload,
  RotateCcw,
  MessageCircle,
  Eye,
  EyeOff,
  CreditCard,
  QrCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Phone,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';

export default function MembersAndGroupsView({
  members = [],
  groups = [],
  packages = [],
  currentUser,
  initialSearch = '',
  onRefresh,
}: {
  members: any[];
  groups: any[];
  packages: any[];
  currentUser: any;
  initialSearch?: string;
  onRefresh: () => void;
}) {
  const { showSuccess, showError } = useToast();

  // Filters & Search
  const [search, setSearch] = useState(initialSearch);
  React.useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialSearch]);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterPernahCuti, setFilterPernahCuti] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Hidden members state (stored in localStorage or state)
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Record<string, boolean>>({});

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [cardModalMember, setCardModalMember] = useState<any>(null);
  const [leaveModalMember, setLeaveModalMember] = useState<any>(null);
  const [activationModalMember, setActivationModalMember] = useState<any>(null);
  const [activationDate, setActivationDate] = useState(new Date().toISOString().slice(0, 10));
  const [activationLoading, setActivationLoading] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Feedbacks
  const [feedback, setFeedback] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Tambah Member Baru (Scan e-KTP OCR)
  const [form, setForm] = useState({
    nik: '',
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: 'L',
    address: '',
    rtRw: '',
    kecamatan: '',
    plateNumber: '',
    packageId: packages?.[1]?.id || '',
  });

  // Form Cuti Member (Hanya Terjadwal)
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    reason: 'Dinas Luar Kota / Pemulihan Kesehatan',
  });

  // e-KTP Real OCR Scan Handler
  const handleOcrScan = async (file: File) => {
    if (!file) return;
    setOcrLoading(true);
    try {
      const ext = await scanKtpWithOcr(file);
      setForm((prev) => ({
        ...prev,
        nik: ext.nik || prev.nik,
        fullName: ext.fullName || prev.fullName,
        birthDate: ext.birthDate || prev.birthDate,
        gender: ext.gender || prev.gender,
        address: ext.address || prev.address,
        rtRw: ext.rtRw || prev.rtRw,
        kecamatan: ext.kecamatan || prev.kecamatan,
      }));
      const recognized = [ext.nik, ext.fullName].filter(Boolean).join(' • ');
      showSuccess(
        `OCR e-KTP Berhasil (${ext.confidence}%): ${recognized || 'Data identitas berhasil diekstrak!'}`,
        'OCR Sukses'
      );
    } catch (err: any) {
      showError('Gagal membaca OCR KTP. Silakan periksa atau isi secara manual.', 'Gagal Scan e-KTP');
    } finally {
      setOcrLoading(false);
    }
  };

  // Create Member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiFetch('/members', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          actorName: currentUser?.fullName,
          actorRole: currentUser?.role,
        }),
      });
      showSuccess(
        `Member baru ${created.memberCode} (${created.fullName}) berhasil didaftarkan!`,
        'Pendaftaran Sukses'
      );
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Simpan Member');
    }
  };


  // Single Delete Member
  const handleDeleteMember = async (member: any) => {
    if (!window.confirm(`Yakin ingin menghapus member ${member.memberCode} (${member.fullName}) dari sistem?`)) {
      return;
    }
    try {
      await apiFetch(`/members/${member.id}`, { method: 'DELETE' });
      showSuccess(`Member ${member.memberCode} berhasil dihapus dari sistem.`, 'Hapus Member');
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Hapus Member');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedIds.length} member yang dipilih secara permanen?`)) return;
    setActionLoading(true);
    try {
      const res = await apiFetch('/members/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds }),
      });
      showSuccess(`Berhasil menghapus ${res.deletedCount} member terpilih.`, 'Hapus Massal');
      setSelectedIds([]);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Hapus Massal');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (members.length === 0) return;
    const headers = [
      'Kode Member',
      'Nama Lengkap',
      'NIK',
      'No Telepon',
      'Email',
      'Gender',
      'Status',
      'Paket',
      'Tgl Mulai',
      'Tgl Berakhir',
      'Plat STNK',
    ];
    const rows = members.map((m) => {
      const sub = m.subscriptions?.[0];
      return [
        m.memberCode,
        `"${m.fullName.replace(/"/g, '""')}"`,
        m.nik || '',
        m.phone,
        m.email || '',
        m.gender,
        m.status,
        `"${sub?.package?.name || 'Tanpa Paket'}"`,
        sub?.startDate ? new Date(sub.startDate).toLocaleDateString('id-ID') : '',
        sub?.endDate ? new Date(sub.endDate).toLocaleDateString('id-ID') : '',
        m.plateNumber || '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Member_KaisarGym_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Hide Member
  const toggleHideMember = (id: string) => {
    setHiddenMemberIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // WhatsApp Chat Handler
  const handleWhatsApp = (member: any) => {
    const phone = (member.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const sub = member.subscriptions?.[0];
    const text = encodeURIComponent(
      `Halo *${member.fullName}*!\n\nBerikut kartu akses keanggotaan *Kaisar Gym* Anda:\n` +
        `• Kode Member: *${member.memberCode}*\n` +
        `• Status: *${member.status}*\n` +
        `• Paket Aktif: *${sub?.package?.name || 'Member Aktif'}*\n` +
        (sub?.endDate ? `• Berlaku s/d: *${formatDateId(sub.endDate)}*\n\n` : '\n') +
        `Tunjukkan pesan ini atau login ke Portal Member di: http://localhost:3000/portals\n` +
        `Username: *${member.memberCode}*\nPassword: *kaisar123*\n\nSalam Sehat,\n*Kaisar Gym Management*`,
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  // Leave Handlers (Hanya Cuti Terjadwal)
  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveModalMember) return;
    if (!leaveForm.startDate || !leaveForm.endDate) {
      showError('Tanggal mulai dan tanggal selesai cuti wajib diisi!', 'Validasi Gagal');
      return;
    }
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      showError('Tanggal selesai cuti tidak boleh mendahului tanggal mulai!', 'Validasi Gagal');
      return;
    }

    try {
      await apiFetch(`/members/${leaveModalMember.id}/leaves`, {
        method: 'POST',
        body: JSON.stringify({
          ...leaveForm,
          leaveType: 'SCHEDULED',
          actorName: currentUser?.fullName || 'Manager Operasional',
        }),
      });
      showSuccess(
        `Cuti untuk ${leaveModalMember.fullName} berhasil diterapkan dan masa aktif paket diperpanjang!`,
        'Cuti Disetujui'
      );
      setLeaveModalMember(null);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Ajukan Cuti');
    }
  };

  // Aktivasi & Jadwal Paket Member
  const handleActivateMember = async (e?: React.FormEvent, customDate?: string) => {
    if (e) e.preventDefault();
    if (!activationModalMember) return;
    const targetDate = customDate || activationDate;
    setActivationLoading(true);

    try {
      await apiFetch(`/members/${activationModalMember.id}/activate`, {
        method: 'POST',
        body: JSON.stringify({
          startDate: targetDate,
          actorName: currentUser?.fullName || 'Kasir Front Desk',
        }),
      });
      showSuccess(
        `Pengaturan aktivasi paket untuk ${activationModalMember.fullName} berhasil disimpan (Mulai: ${formatDateId(targetDate)})!`,
        'Aktivasi Paket Sukses'
      );
      setActivationModalMember(null);
      onRefresh();
    } catch (err: any) {
      showError(err.message || 'Gagal mengaktifkan paket', 'Gagal Aktivasi');
    } finally {
      setActivationLoading(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setShowHiddenOnly(false);
    setFilterPernahCuti(false);
    setCurrentPage(1);
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Hidden filter
      const isHidden = !!hiddenMemberIds[m.id];
      if (showHiddenOnly && !isHidden) return false;
      if (!showHiddenOnly && isHidden) return false;

      // Status filter
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;

      // Cuti filter
      if (filterPernahCuti && (!m.leaves || m.leaves.length === 0)) return false;

      // Search query
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const matchCode = m.memberCode?.toLowerCase().includes(q);
      const matchName = m.fullName?.toLowerCase().includes(q);
      const matchPhone = m.phone?.includes(q);
      const matchNik = m.nik?.includes(q);

      return matchCode || matchName || matchPhone || matchNik;
    });
  }, [members, search, statusFilter, showHiddenOnly, filterPernahCuti, hiddenMemberIds]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / perPage) || 1;
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Statistics
  const totalActive = members.filter((m) => m.status === 'ACTIVE').length;
  const totalPending = members.filter((m) => m.status === 'PENDING_ACTIVATION').length;
  const totalCuti = members.filter((m) => m.status === 'CUTI').length;
  const totalInactive = members.filter((m) => m.status === 'INACTIVE').length;
  const totalKtpOcr = members.filter((m) => !!m.nik && m.nik.length >= 10).length;
  const totalMale = members.filter((m) => m.gender === 'L').length;
  const totalFemale = members.filter((m) => m.gender === 'P').length;

  // Toggle Select All
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMembers.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-5">
      {/* Feedback Banner */}
      {feedback && (
        <div className="rounded-2xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-xs font-semibold text-[#FFC067] flex items-center justify-between shadow-md">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="underline text-[11px]">
            Tutup
          </button>
        </div>
      )}

      {/* ══════════════ 1. ACCORDION RINGKASAN STATISTIK (Kayak di POS Westfit) ══════════════ */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setShowStats(!showStats)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFC067] animate-pulse" />
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Ringkasan Statistik Member</span>
            </h3>
          </div>
          <span className="text-xs text-[#FFC067] font-semibold flex items-center gap-1">
            {showStats ? 'Sembunyikan' : '+ Tampilkan'}
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showStats && (
          <div className="p-5 pt-1 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#070D1E] border border-white/5">
              <div className="text-slate-400 text-[11px]">Total Member</div>
              <div className="text-xl font-black text-white mt-1">{members.length} Orang</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Database Lengkap</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070D1E] border border-white/5">
              <div className="text-slate-400 text-[11px]">Member Aktif</div>
              <div className="text-xl font-black text-emerald-400 mt-1">{totalActive} Orang</div>
              <div className="text-[10px] text-emerald-500/80 mt-0.5">Boleh Masuk Gate</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070D1E] border border-amber-500/20">
              <div className="text-amber-400 text-[11px] font-bold">Menunggu Aktivasi</div>
              <div className="text-xl font-black text-amber-300 mt-1">{totalPending} Orang</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Lunas / Siap Diaktifkan</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070D1E] border border-white/5">
              <div className="text-slate-400 text-[11px]">Member Cuti</div>
              <div className="text-xl font-black text-[#FFC067] mt-1">{totalCuti} Orang</div>
              <div className="text-[10px] text-[#FFC067]/80 mt-0.5">Paket Dibekukan</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070D1E] border border-white/5">
              <div className="text-slate-400 text-[11px]">Non-Aktif / Expired</div>
              <div className="text-xl font-black text-rose-400 mt-1">{totalInactive} Orang</div>
              <div className="text-[10px] text-rose-500/80 mt-0.5">Perlu Perpanjangan</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070D1E] border border-white/5">
              <div className="text-slate-400 text-[11px]">e-KTP Terverifikasi</div>
              <div className="text-xl font-black text-sky-400 mt-1">{totalKtpOcr} Member</div>
              <div className="text-[10px] text-sky-500/80 mt-0.5">Auto-Fill OCR</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070D1E] border border-white/5">
              <div className="text-slate-400 text-[11px]">Gender (L / P)</div>
              <div className="text-xl font-black text-white mt-1">
                {totalMale} <span className="text-xs font-normal text-slate-400">L</span> / {totalFemale}{' '}
                <span className="text-xs font-normal text-slate-400">P</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Demografi Gym</div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ 2. TOOLBAR DAFTAR MEMBER (Persis POS Westfit) ══════════════ */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>Daftar Member</span>
            <span className="text-[11px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-[#070D1E] border border-white/10">
              {filteredMembers.length} Data
            </span>
          </h2>
        </div>

        {/* Action Button Strip: + Tambah, Export, Import, Hapus Terpilih, Fix DB, Sync Users, Reset Passwords, Generate Creds */}
        <div className="flex flex-wrap items-center gap-2">
          {/* + Tambah Member (Dedicated Page Layout seperti di POS Westfit) */}
          <Link
            href="/members/create"
            className="px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Member</span>
          </Link>

          {/* Export CSV / Excel */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            title="Download Data Member ke Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Import CSV */}
          <button
            onClick={() => setImportModal(true)}
            className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            title="Upload Data Member CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Hapus Terpilih (Bulk Delete) */}
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              selectedIds.length > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                : 'bg-rose-950/20 text-rose-500/40 border border-rose-900/30 cursor-not-allowed'
            }`}
            title="Hapus Member yang Dicentang"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Terpilih ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* ══════════════ 3. SEARCH & FILTER BAR (Persis POS Westfit) ══════════════ */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, atau telepon..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070D1E] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFC067]"
          />
        </div>

        {/* Dropdown Filters & Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-[#FFC067]"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Active (Aktif)</option>
            <option value="PENDING_ACTIVATION">Menunggu Aktivasi</option>
            <option value="CUTI">Cuti (Terjadwal)</option>
            <option value="INACTIVE">Non-Aktif / Expired</option>
          </select>

          {/* Show Hidden Only Checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer px-2">
            <input
              type="checkbox"
              checked={showHiddenOnly}
              onChange={(e) => setShowHiddenOnly(e.target.checked)}
              className="rounded bg-[#070D1E] border-white/20 text-[#FFC067] focus:ring-0 w-3.5 h-3.5"
            />
            <span>Show Hidden Only</span>
          </label>

          {/* Per Page Dropdown */}
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-[#FFC067]"
          >
            <option value={10}>10 Data</option>
            <option value={25}>25 Data</option>
            <option value={50}>50 Data</option>
            <option value={100}>100 Data</option>
          </select>

          {/* Filter Pernah Cuti (Amber Pill) */}
          <button
            onClick={() => setFilterPernahCuti(!filterPernahCuti)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              filterPernahCuti
                ? 'bg-[#FFC067] text-slate-950 font-black'
                : 'bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30 hover:bg-[#FFC067]/25'
            }`}
          >
            <span>🛏️ Member Pernah Cuti</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-xl bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-slate-300 font-bold text-xs flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ══════════════ 4. TABEL DAFTAR MEMBER (Sesuai Screenshot POS Westfit) ══════════════ */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-xl">
        <TableScrollWrapper label="Scroll Kolom Member">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#070D1E] text-white font-black border-b border-white/10 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedMembers.length > 0 &&
                      paginatedMembers.every((m) => selectedIds.includes(m.id))
                    }
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded bg-[#070D1E] border-white/20 text-[#FFC067] w-3.5 h-3.5"
                  />
                </th>
                <th className="py-3 px-4">Kode &amp; Nama Paket</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Telepon / WhatsApp</th>
                <th className="py-3 px-3">Mulai</th>
                <th className="py-3 px-3">Berakhir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada member yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => {
                  const sub = m.subscriptions?.[0];
                  const isChecked = selectedIds.includes(m.id);
                  const isHidden = !!hiddenMemberIds[m.id];
                  const hasKtp = !!m.nik && m.nik.length >= 10;
                  const isActive = m.status === 'ACTIVE';
                  const isPendingActivation = m.status === 'PENDING_ACTIVATION';
                  const isCuti = m.status === 'CUTI';

                  // Dynamic Avatar
                  const avatarUrl =
                    m.gender === 'P'
                      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-white/[0.02] transition ${
                        isChecked ? 'bg-[#FFC067]/5' : ''
                      } ${isHidden ? 'opacity-50' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(m.id)}
                          className="rounded bg-[#070D1E] border-white/20 text-[#FFC067] w-3.5 h-3.5"
                        />
                      </td>

                      {/* Kode & Nama Paket (1 Kolom) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt={m.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/15 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[#FFC067] text-xs">
                                {m.memberCode}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="font-bold text-white text-xs">{m.fullName}</span>
                              {hasKtp && (
                                <span
                                  onClick={() => setCardModalMember(m)}
                                  className="cursor-pointer px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-black flex items-center gap-0.5 hover:bg-sky-500/30"
                                  title="Lihat Data KTP Terverifikasi"
                                >
                                  🪪 KTP
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {sub?.package?.name || (isActive ? 'Paket Aktif' : isPendingActivation ? 'Paket Terdaftar (Belum Aktif)' : 'Non-Aktif')}
                              {m.plateNumber && ` • Plat: ${m.plateNumber}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                            isActive
                              ? 'bg-[#15803d] text-white shadow-sm'
                              : isPendingActivation
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : isCuti
                              ? 'bg-[#d97706] text-white shadow-sm'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isPendingActivation ? '⏳ Menunggu Aktivasi' : m.status}
                        </span>
                      </td>

                      {/* Telepon & WhatsApp (1 Kolom) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-200 text-xs">
                            {m.phone || '-'}
                          </span>
                          {m.phone && (
                            <button
                              onClick={() => handleWhatsApp(m)}
                              className="px-2.5 py-1 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-sm transition shrink-0"
                              title="Buka Chat WhatsApp Akses Member"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Chat (Akses)</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Mulai */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                        {sub?.startDate ? formatDateId(sub.startDate) : '-'}
                      </td>

                      {/* Berakhir */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                        {sub?.endDate ? formatDateId(sub.endDate) : '-'}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Shortcut Utama: Aktifkan Paket untuk Member Menunggu Aktivasi */}
                          {isPendingActivation && (
                            <button
                              onClick={() => {
                                setActivationModalMember(m);
                                setActivationDate(new Date().toISOString().slice(0, 10));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] inline-flex items-center gap-1 shadow-sm transition shrink-0 animate-pulse"
                              title="Atur Tanggal & Aktifkan Paket"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              <span>Aktifkan</span>
                            </button>
                          )}

                          {/* Tombol Setting / Jadwalkan Aktivasi untuk Member yang punya Paket */}
                          {sub && !isPendingActivation && (
                            <button
                              onClick={() => {
                                setActivationModalMember(m);
                                setActivationDate(sub.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
                              }}
                              className="p-1.5 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-amber-400 hover:text-amber-300 transition"
                              title="Atur / Jadwalkan Ulang Aktivasi Paket"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 1. Kartu Digital Member & KTP */}
                          <button
                            onClick={() => setCardModalMember(m)}
                            className="p-1.5 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-sky-400 hover:text-sky-300 transition"
                            title="Lihat Kartu Member Digital & e-KTP"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Hide / Show Member */}
                          <button
                            onClick={() => toggleHideMember(m.id)}
                            className={`p-1.5 rounded-lg border transition ${
                              isHidden
                                ? 'bg-[#FFC067]/20 border-[#FFC067]/40 text-[#FFC067]'
                                : 'bg-[#070D1E] hover:bg-[#1E293B] border-white/10 text-slate-400'
                            }`}
                            title={isHidden ? 'Tampilkan Member' : 'Sembunyikan Member (Hide)'}
                          >
                            {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          {/* 3. Edit Member (Navigasi ke Layout Halaman Edit) */}
                          <Link
                            href={`/members/${m.id}/edit`}
                            className="p-1.5 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-blue-400 hover:text-blue-300 transition inline-flex items-center justify-center"
                            title="Edit Data Member (Buka Layout Lengkap)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          {/* 4. Delete Member */}
                          <button
                            onClick={() => handleDeleteMember(m)}
                            className="p-1.5 rounded-lg bg-[#070D1E] hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition"
                            title="Hapus Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* + Cuti Shortcut */}
                          <button
                            onClick={() => setLeaveModalMember(m)}
                            className="px-2 py-1 rounded-lg bg-[#FFC067]/15 hover:bg-[#FFC067]/25 text-[#FFC067] font-bold text-[10px] border border-[#FFC067]/30 transition ml-1"
                            title="Ajukan Cuti Terjadwal"
                          >
                            + Cuti
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Menampilkan{' '}
            <strong className="text-white">
              {filteredMembers.length > 0 ? (currentPage - 1) * perPage + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-white">
              {Math.min(currentPage * perPage, filteredMembers.length)}
            </strong>{' '}
            dari <strong className="text-white">{filteredMembers.length}</strong> data member
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                currentPage > 1
                  ? 'bg-[#070D1E] text-slate-200 border-white/10 hover:bg-[#1E293B]'
                  : 'bg-slate-900 text-slate-600 border-white/5 cursor-not-allowed'
              }`}
            >
              Sebelumnya
            </button>
            <span className="px-2 py-1 text-slate-300 font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                currentPage < totalPages
                  ? 'bg-[#070D1E] text-slate-200 border-white/10 hover:bg-[#1E293B]'
                  : 'bg-slate-900 text-slate-600 border-white/5 cursor-not-allowed'
              }`}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ MODAL 1: KARTU DIGITAL MEMBER & E-KTP DETAIL ══════════════ */}
      {cardModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FFC067]" /> Kartu Akses Member Digital
              </h3>
              <button
                onClick={() => setCardModalMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Kartu Fisik Member Style */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#070D1E] to-[#121B35] border border-[#FFC067]/40 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/img/kaisar-gym-logo-circle.png"
                    alt="Kaisar Gym"
                    className="w-9 h-9 rounded-full ring-1 ring-[#FFC067]"
                  />
                  <div>
                    <div className="font-black text-white text-sm tracking-wide">KAISAR GYM</div>
                    <div className="text-[9px] text-[#FFC067] tracking-widest font-bold uppercase">
                      Official Membership Card
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  {cardModalMember.status}
                </span>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="p-2 bg-white rounded-xl shrink-0 shadow-md">
                  {/* QR Code generator mock */}
                  <div className="w-20 h-20 bg-slate-900 rounded flex flex-col items-center justify-center text-white text-[9px] font-mono">
                    <QrCode className="w-12 h-12 text-[#FFC067]" />
                    <span className="text-[8px] mt-0.5">{cardModalMember.memberCode}</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-white truncate">
                    {cardModalMember.fullName}
                  </div>
                  <div className="text-xs font-mono font-bold text-[#FFC067]">
                    {cardModalMember.memberCode}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Telp: {cardModalMember.phone}
                  </div>
                  {cardModalMember.plateNumber && (
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      🚗 STNK Bebas Parkir: {cardModalMember.plateNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian KTP OCR */}
              <div className="pt-3 border-t border-white/10 text-[10px] text-slate-300 space-y-1">
                <div>NIK: <strong className="text-white font-mono">{cardModalMember.nik || '-'}</strong></div>
                <div>Alamat: <span className="text-slate-300">{cardModalMember.address || '-'}</span></div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleWhatsApp(cardModalMember)}
                className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Kartu via WhatsApp</span>
              </button>
              <button
                onClick={() => setCardModalMember(null)}
                className="px-4 py-2.5 rounded-xl bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-xs text-slate-300 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ══════════════ MODAL 3: TAMBAH MEMBER + SCAN OCR E-KTP ══════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateMember}
            className="w-full max-w-2xl bg-[#0F172A] border border-[#FFC067]/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#FFC067]">
                  Pendaftaran Member Baru + Auto-Fill Scan e-KTP OCR
                </h3>
                <p className="text-xs text-slate-400">
                  Foto e-KTP member via kamera atau unggah gambar untuk otomatisasi pengisian data.
                </p>
              </div>
              <label
                className={`px-4 py-2 rounded-xl text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer transition ${
                  ocrLoading ? 'bg-sky-600/50 cursor-wait' : 'bg-sky-500 hover:bg-sky-400'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{ocrLoading ? 'Membaca e-KTP...' : '📸 Upload & Scan e-KTP'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={ocrLoading}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleOcrScan(file);
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">NIK e-KTP</label>
                <input
                  type="text"
                  placeholder="3174..."
                  value={form.nik}
                  onChange={(e) => setForm({ ...form, nik: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-1">Nama Lengkap *</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">No. WhatsApp / HP *</label>
                <input
                  required
                  type="text"
                  placeholder="081299887766"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Jenis Kelamin</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-semibold"
                >
                  <option value="L">Laki-Laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">No. Plat STNK (Parkir)</label>
                <input
                  type="text"
                  placeholder="B 1234 KSR"
                  value={form.plateNumber}
                  onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white uppercase font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-1">Paket Membership Awal</label>
                <select
                  value={form.packageId}
                  onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-bold"
                >
                  <option value="">-- Tanpa Paket Awal (Inactive) --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.durationDays} Hari)
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="text-slate-400 block mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Jl. Sudirman No. 88, RT 01/RW 02..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-black text-xs shadow-md shadow-[#FFC067]/20"
              >
                Simpan &amp; Terbitkan Member
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#070D1E] text-slate-300 font-semibold text-xs border border-white/10"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}



      {/* ══════════════ MODAL 5: CUTI TERJADWAL MEMBER (Hanya Scheduled Leave) ══════════════ */}
      {leaveModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleAddLeave}
            className="w-full max-w-md bg-[#0F172A] border border-[#FFC067]/40 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#FFC067]" />
                Ajukan Cuti Terjadwal
              </h3>
              <button
                type="button"
                onClick={() => setLeaveModalMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs bg-[#070D1E] p-3 rounded-xl border border-white/10 text-slate-300">
              Member: <strong className="text-white">{leaveModalMember.fullName}</strong> (
              <span className="text-[#FFC067] font-mono">{leaveModalMember.memberCode}</span>) • Status:{' '}
              <strong className="text-emerald-400">{leaveModalMember.status}</strong>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Mulai Cuti</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FFC067]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Selesai Cuti</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-medium focus:outline-none focus:border-[#FFC067]"
                  />
                </div>
              </div>

              {leaveForm.startDate && leaveForm.endDate && (
                <div className="text-[11px] text-[#FFC067] bg-[#FFC067]/10 p-2.5 rounded-xl border border-[#FFC067]/20 flex items-center justify-between">
                  <span>Perpanjangan Masa Aktif:</span>
                  <strong className="font-bold">
                    +{Math.max(1, Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Hari Otomatis
                  </strong>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Alasan Cuti</label>
                <input
                  type="text"
                  required
                  placeholder="Dinas ke luar kota / pemulihan cedera..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-black text-xs shadow-md transition"
              >
                Terapkan Cuti &amp; Perpanjang Paket
              </button>
              <button
                type="button"
                onClick={() => setLeaveModalMember(null)}
                className="px-4 py-2.5 rounded-xl bg-[#070D1E] text-slate-300 font-semibold text-xs border border-white/10"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════ MODAL 5B: ATUR & JADWALKAN AKTIVASI PAKET ══════════════ */}
      {activationModalMember && (() => {
        const targetSub = activationModalMember.subscriptions?.[0];
        const pkgName = targetSub?.package?.name || 'Paket Membership';
        const durationDays = targetSub?.package?.durationDays || 30;

        // Hitung estimasi tanggal selesai berdasarkan activationDate
        const startSelected = new Date(activationDate);
        const endCalc = new Date(startSelected.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const todayStr = new Date().toISOString().slice(0, 10);
        const isToday = activationDate === todayStr;

        // Hitung 1 bulan depan untuk quick button
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        nextMonthDate.setDate(1);
        const nextMonthStr = nextMonthDate.toISOString().slice(0, 10);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-[#0F172A] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-amber-400" />
                  Atur Tanggal Mulai Aktivasi
                </h3>
                <button
                  type="button"
                  onClick={() => setActivationModalMember(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Info Member & Paket */}
              <div className="rounded-2xl bg-[#070D1E] p-3.5 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nama Member:</span>
                  <span className="font-bold text-white">{activationModalMember.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Kode Member:</span>
                  <span className="font-mono font-bold text-[#FFC067]">{activationModalMember.memberCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Paket Terdaftar:</span>
                  <span className="font-bold text-sky-400">{pkgName} ({durationDays} Hari)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status Saat Ini:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    activationModalMember.status === 'PENDING_ACTIVATION'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {activationModalMember.status === 'PENDING_ACTIVATION' ? 'Menunggu Aktivasi' : activationModalMember.status}
                  </span>
                </div>
              </div>

              {/* Form Input Tanggal Mulai */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">
                    Pilih Tanggal Mulai Aktivasi Paket:
                  </label>
                  <input
                    type="date"
                    value={activationDate}
                    onChange={(e) => setActivationDate(e.target.value)}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/20 px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActivationDate(todayStr)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                      isToday
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                        : 'bg-[#070D1E] text-slate-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    ⚡ Mulai Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivationDate(nextMonthStr)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                      activationDate === nextMonthStr
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                        : 'bg-[#070D1E] text-slate-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    📅 Awal Bulan Depan
                  </button>
                </div>

                {/* Live Preview Masa Aktif */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-amber-200/90 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Masa Aktif Berlaku:</span>
                    <strong className="font-bold text-white">{formatDateId(activationDate)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Berakhir Pada:</span>
                    <strong className="font-bold text-amber-400">{formatDateId(endCalc)}</strong>
                  </div>
                  <div className="text-[10px] text-amber-300/80 pt-1 border-t border-amber-500/20">
                    {isToday
                      ? '✓ Paket langsung aktif sekarang. Member dapat langsung scan di turnstile/gate Kaisar Gym.'
                      : 'ℹ Paket berstatus dijadwalkan dan otomatis aktif saat tanggal aktivasi tiba.'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={activationLoading}
                  onClick={(e) => handleActivateMember(e)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {activationLoading ? 'Menyimpan...' : isToday ? '⚡ Aktifkan Sekarang' : '💾 Simpan Jadwal Aktivasi'}
                </button>
                <button
                  type="button"
                  disabled={activationLoading}
                  onClick={() => setActivationModalMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#070D1E] text-slate-300 font-semibold text-xs border border-white/10"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════ MODAL 6: IMPORT DATA MEMBER CSV ══════════════ */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                Import Data Member
              </h3>
              <button
                onClick={() => setImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Tempelkan data teks CSV (Format: <code>Nama,NoHP,NIK,PlatSTNK</code> per baris) atau pilih file CSV:
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Vincen Ng Zhi Gen,081299887766,3174011234560001,B 1234 KSR&#10;Phiter Frans,081388776655,3174029876540002,B 5678 GYM"
              className="w-full rounded-xl bg-[#070D1E] border border-white/10 p-3 text-xs text-white font-mono"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={async () => {
                  if (!importText.trim()) return;
                  const lines = importText.trim().split('\n');
                  let count = 0;
                  for (const line of lines) {
                    const [fullName, phone, nik, plateNumber] = line.split(',');
                    if (fullName && phone) {
                      try {
                        await apiFetch('/members', {
                          method: 'POST',
                          body: JSON.stringify({
                            fullName: fullName.trim(),
                            phone: phone.trim(),
                            nik: nik ? nik.trim() : undefined,
                            plateNumber: plateNumber ? plateNumber.trim() : undefined,
                            gender: 'L',
                          }),
                        });
                        count++;
                      } catch {}
                    }
                  }
                  setFeedback(`📥 Berhasil mengimpor ${count} member baru!`);
                  setImportModal(false);
                  setImportText('');
                  onRefresh();
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
              >
                Proses Import Data
              </button>
              <button
                onClick={() => setImportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#070D1E] text-slate-300 font-semibold text-xs border border-white/10"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
