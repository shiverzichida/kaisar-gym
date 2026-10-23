'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Dumbbell,
  List,
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  Filter,
  RotateCcw,
  Trash2,
  ClipboardCheck,
  Pencil,
  CheckCircle2,
  X,
  Users,
  Clock,
  MapPin,
  Check,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

interface StudioClass {
  id: string;
  code: string;
  name: string;
  category: string;
  roomName: string;
  maxCapacity: number;
}

interface Trainer {
  id: string;
  fullName: string;
  specialization?: string;
}

interface Booking {
  id: string;
  memberId: string;
  status: 'BOOKED' | 'ATTENDED' | 'CANCELLED' | 'ABSENT';
  attendedAt?: string;
  member?: {
    id: string;
    code: string;
    fullName: string;
    phone?: string;
  };
}

interface Schedule {
  id: string;
  studioClassId: string;
  trainerId: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  status: string;
  studioClass?: StudioClass;
  trainer?: Trainer;
  bookings?: Booking[];
}

// ══════════════ COLOR THEME ENGINE PER CLASS CATEGORY ══════════════
function getClassTheme(sc: Schedule) {
  const name = (sc.studioClass?.name || '').toLowerCase();
  const category = (sc.studioClass?.category || '').toUpperCase();

  // 1. Pilates & Reformer (Rose Gold / Blush Pink)
  if (category.includes('PILATES') || name.includes('pilates') || name.includes('reformer')) {
    return {
      name: 'Pilates',
      tagLabel: 'PILATES',
      badgeBg: 'bg-rose-500/20',
      badgeBorder: 'border-rose-500/35',
      badgeText: 'text-rose-300',
      titleText: 'text-rose-200',
      cardBg: 'bg-[#1C101A] hover:bg-[#251523] border border-rose-500/30 hover:border-rose-500/60',
      accentDot: 'bg-rose-400 shadow-[0_0_6px_#fb7185]',
      accentColor: '#fb7185',
    };
  }

  // 2. Zumba / Dance / Aerobic (Electric Fuchsia / Magenta)
  if (name.includes('zumba') || name.includes('dance') || name.includes('party')) {
    return {
      name: 'Dance',
      tagLabel: 'ZUMBA',
      badgeBg: 'bg-fuchsia-500/20',
      badgeBorder: 'border-fuchsia-500/35',
      badgeText: 'text-fuchsia-300',
      titleText: 'text-fuchsia-200',
      cardBg: 'bg-[#1D0F21] hover:bg-[#28152D] border border-fuchsia-500/30 hover:border-fuchsia-500/60',
      accentDot: 'bg-fuchsia-400 shadow-[0_0_6px_#e879f9]',
      accentColor: '#e879f9',
    };
  }

  // 3. Body Combat / Boxing / Muaythai (Warm Amber / Crimson Flare)
  if (name.includes('combat') || name.includes('boxing') || name.includes('muaythai')) {
    return {
      name: 'Combat',
      tagLabel: 'COMBAT',
      badgeBg: 'bg-amber-500/20',
      badgeBorder: 'border-amber-500/35',
      badgeText: 'text-amber-300',
      titleText: 'text-amber-200',
      cardBg: 'bg-[#20140A] hover:bg-[#2C1C0E] border border-amber-500/30 hover:border-amber-500/60',
      accentDot: 'bg-amber-400 shadow-[0_0_6px_#fbbf24]',
      accentColor: '#fbbf24',
    };
  }

  // 4. TRX / Functional Training / Strength (Kaisar Gold / Orange)
  if (name.includes('trx') || name.includes('functional') || name.includes('strength') || name.includes('bodypump')) {
    return {
      name: 'Strength',
      tagLabel: 'TRX/HIIT',
      badgeBg: 'bg-[#FFC067]/20',
      badgeBorder: 'border-[#FFC067]/40',
      badgeText: 'text-[#FFC067]',
      titleText: 'text-[#FFE2B3]',
      cardBg: 'bg-[#1E170B] hover:bg-[#291F0F] border border-[#FFC067]/30 hover:border-[#FFC067]/65',
      accentDot: 'bg-[#FFC067] shadow-[0_0_6px_#FFC067]',
      accentColor: '#FFC067',
    };
  }

  // 5. Yoga / Mobility / Mind & Core (Mint Emerald)
  if (name.includes('yoga') || name.includes('mobility') || name.includes('stretching')) {
    return {
      name: 'Yoga',
      tagLabel: 'YOGA',
      badgeBg: 'bg-emerald-500/20',
      badgeBorder: 'border-emerald-500/35',
      badgeText: 'text-emerald-300',
      titleText: 'text-emerald-200',
      cardBg: 'bg-[#0E1E17] hover:bg-[#132A20] border border-emerald-500/30 hover:border-emerald-500/60',
      accentDot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]',
      accentColor: '#34d399',
    };
  }

  // 6. RPM / Cycling / Spinning / Studio Default (Sky Cyan)
  return {
    name: 'Cycling',
    tagLabel: 'RPM/SPIN',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/35',
    badgeText: 'text-cyan-300',
    titleText: 'text-cyan-200',
    cardBg: 'bg-[#0B1A24] hover:bg-[#102433] border border-cyan-500/30 hover:border-cyan-500/60',
    accentDot: 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]',
    accentColor: '#22d3ee',
  };
}

export default function ClassesPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [classesData, setClassesData] = useState<{
    studioClasses: StudioClass[];
    templates: any[];
    schedules: Schedule[];
  } | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'LIST' or 'CALENDAR'
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');

  // Google Calendar View state
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 9, 21)); // Defaults to October 2026 as in screenshot
  const [calendarSubView, setCalendarSubView] = useState<'MONTH' | 'WEEK' | 'DAY' | 'LIST'>('MONTH');

  // Filter State
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [toDateFilter, setToDateFilter] = useState('');

  // Applied Filter State (triggers active filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    classId: '',
    trainerId: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: '',
  });

  // Table selection for batch delete
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  // Modals
  const [attendanceModalSchedule, setAttendanceModalSchedule] = useState<Schedule | null>(null);
  const [quickAddMemberId, setQuickAddMemberId] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form state for Add/Edit
  const [scheduleForm, setScheduleForm] = useState({
    studioClassId: '',
    trainerId: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endTime: '08:30',
    roomName: 'Westfit Studio',
    maxCapacity: 20,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clsRes, memRes, trnRes] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/members'),
        apiFetch('/trainers').catch(() => []),
      ]);
      setClassesData(clsRes);
      setMembers(memRes || []);
      setTrainers(trnRes || []);

      if (clsRes?.studioClasses?.length > 0 && !scheduleForm.studioClassId) {
        setScheduleForm((prev) => ({
          ...prev,
          studioClassId: clsRes.studioClasses[0].id,
          roomName: clsRes.studioClasses[0].roomName || 'Westfit Studio',
        }));
      }
      if (trnRes?.length > 0 && !scheduleForm.trainerId) {
        setScheduleForm((prev) => ({ ...prev, trainerId: trnRes[0].id }));
      }
    } catch (err: any) {
      console.error(err);
      showError(err.message, 'Gagal Memuat Data');
    } finally {
      setLoading(false);
    }
  }, [scheduleForm.studioClassId, scheduleForm.trainerId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply Filters
  const handleApplyFilters = () => {
    setAppliedFilters({
      classId: selectedClassFilter,
      trainerId: selectedTrainerFilter,
      fromDate: fromDateFilter,
      toDate: toDateFilter,
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedClassFilter('');
    setSelectedTrainerFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setAppliedFilters({
      classId: '',
      trainerId: '',
      fromDate: '',
      toDate: '',
    });
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (!classesData?.schedules) return [];
    return classesData.schedules.filter((sc) => {
      if (appliedFilters.classId && sc.studioClassId !== appliedFilters.classId) {
        return false;
      }
      if (appliedFilters.trainerId && sc.trainerId !== appliedFilters.trainerId) {
        return false;
      }
      if (appliedFilters.fromDate) {
        const scDate = new Date(sc.scheduleDate).toISOString().split('T')[0];
        if (scDate < appliedFilters.fromDate) return false;
      }
      if (appliedFilters.toDate) {
        const scDate = new Date(sc.scheduleDate).toISOString().split('T')[0];
        if (scDate > appliedFilters.toDate) return false;
      }
      return true;
    });
  }, [classesData?.schedules, appliedFilters]);

  // Selection toggle
  const handleToggleSelectAll = () => {
    if (selectedScheduleIds.length === filteredSchedules.length) {
      setSelectedScheduleIds([]);
    } else {
      setSelectedScheduleIds(filteredSchedules.map((s) => s.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Google Calendar navigation & matrix calculations
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth(); // 0 = Jan, 9 = Oct

  const formattedMonthTitle = useMemo(() => {
    const raw = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(calendarDate);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [calendarDate]);

  // Group schedules by YYYY-MM-DD
  const schedulesByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    if (!classesData?.schedules) return map;

    classesData.schedules.forEach((sc) => {
      if (appliedFilters.classId && sc.studioClassId !== appliedFilters.classId) return;
      if (appliedFilters.trainerId && sc.trainerId !== appliedFilters.trainerId) return;

      try {
        const d = new Date(sc.scheduleDate);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(sc);
      } catch {}
    });

    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [classesData?.schedules, appliedFilters.classId, appliedFilters.trainerId]);

  // Month grid matrix
  const monthGridDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Minggu, 6 = Sabtu
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const days: {
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isToday: boolean;
    }[] = [];

    // Trailing days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const date = new Date(calYear, calMonth - 1, d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date,
        dayNumber: d,
        isCurrentMonth: false,
        dateStr,
        isToday: false,
      });
    }

    // Days of current month
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date,
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        isToday: dateStr === todayStr,
      });
    }

    // Next month leading days
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(calYear, calMonth + 1, d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date,
        dayNumber: d,
        isCurrentMonth: false,
        dateStr,
        isToday: false,
      });
    }

    return days;
  }, [calYear, calMonth]);

  // Calendar navigation handlers
  const handleCalPrev = () => {
    if (calendarSubView === 'MONTH' || calendarSubView === 'LIST') {
      setCalendarDate(new Date(calYear, calMonth - 1, 1));
    } else if (calendarSubView === 'WEEK') {
      const prev = new Date(calendarDate);
      prev.setDate(prev.getDate() - 7);
      setCalendarDate(prev);
    } else {
      const prev = new Date(calendarDate);
      prev.setDate(prev.getDate() - 1);
      setCalendarDate(prev);
    }
  };

  const handleCalNext = () => {
    if (calendarSubView === 'MONTH' || calendarSubView === 'LIST') {
      setCalendarDate(new Date(calYear, calMonth + 1, 1));
    } else if (calendarSubView === 'WEEK') {
      const next = new Date(calendarDate);
      next.setDate(next.getDate() + 7);
      setCalendarDate(next);
    } else {
      const next = new Date(calendarDate);
      next.setDate(next.getDate() + 1);
      setCalendarDate(next);
    }
  };

  const handleCalToday = () => {
    setCalendarDate(new Date(2026, 9, 21)); // October 21, 2026 as per application calendar
  };

  // Generate Weekly Schedules
  const handleGenerateSchedules = async () => {
    try {
      const res = await apiFetch('/classes/generate-schedules', { method: 'POST' });
      showSuccess(`Berhasil meng-generate ${res.generatedCount} jadwal kelas baru!`, 'Jadwal Diperbarui');
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Generate Jadwal');
    }
  };

  // Delete Single Schedule
  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal kelas ini?')) return;
    try {
      await apiFetch(`/classes/schedules/${id}`, { method: 'DELETE' });
      showSuccess('Jadwal kelas berhasil dihapus!', 'Terhapus');
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Menghapus Jadwal');
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedScheduleIds.length === 0) return;
    if (!confirm(`Hapus ${selectedScheduleIds.length} jadwal terpilih?`)) return;
    try {
      await apiFetch('/classes/schedules/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedScheduleIds }),
      });
      showSuccess(`${selectedScheduleIds.length} jadwal berhasil dihapus!`, 'Terhapus');
      setSelectedScheduleIds([]);
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Batch Delete');
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setScheduleForm({
      studioClassId: classesData?.studioClasses?.[0]?.id || '',
      trainerId: trainers?.[0]?.id || '',
      scheduleDate: new Date().toISOString().split('T')[0],
      startTime: '07:30',
      endTime: '08:30',
      roomName: classesData?.studioClasses?.[0]?.roomName || 'Westfit Studio',
      maxCapacity: classesData?.studioClasses?.[0]?.maxCapacity || 20,
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sc: Schedule) => {
    setEditingSchedule(sc);
    setScheduleForm({
      studioClassId: sc.studioClassId,
      trainerId: sc.trainerId,
      scheduleDate: new Date(sc.scheduleDate).toISOString().split('T')[0],
      startTime: sc.startTime,
      endTime: sc.endTime,
      roomName: sc.studioClass?.roomName || 'Westfit Studio',
      maxCapacity: sc.maxCapacity || 20,
    });
  };

  // Submit Add Schedule
  const handleSubmitAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/classes/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleForm),
      });
      showSuccess('Jadwal kelas baru berhasil ditambahkan!', 'Sukses');
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Menambah Jadwal');
    }
  };

  // Submit Edit Schedule
  const handleSubmitEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      await apiFetch(`/classes/schedules/${editingSchedule.id}`, {
        method: 'PUT',
        body: JSON.stringify(scheduleForm),
      });
      showSuccess('Jadwal kelas berhasil diperbarui!', 'Sukses');
      setEditingSchedule(null);
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Update Jadwal');
    }
  };

  // Open Attendance Modal
  const handleOpenAttendanceModal = (sc: Schedule) => {
    setAttendanceModalSchedule(sc);
    if (members.length > 0) setQuickAddMemberId(members[0].id);
  };

  // Update single attendee status
  const handleUpdateAttendeeStatus = async (bookingId: string, status: 'ATTENDED' | 'CANCELLED' | 'ABSENT') => {
    try {
      await apiFetch(`/classes/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showSuccess(`Status kehadiran diperbarui menjadi ${status}!`, 'Presensi Sukses');
      loadData();
      // Update local modal data
      if (attendanceModalSchedule) {
        setAttendanceModalSchedule((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            bookings: prev.bookings?.map((b) =>
              b.id === bookingId ? { ...b, status, attendedAt: status === 'ATTENDED' ? new Date().toISOString() : undefined } : b
            ),
          };
        });
      }
    } catch (err: any) {
      showError(err.message, 'Gagal Update Presensi');
    }
  };

  // Mark all bookings attended
  const handleMarkAllAttended = async () => {
    if (!attendanceModalSchedule?.bookings?.length) return;
    try {
      const activeBookings = attendanceModalSchedule.bookings.filter((b) => b.status === 'BOOKED');
      for (const b of activeBookings) {
        await apiFetch(`/classes/bookings/${b.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'ATTENDED' }),
        });
      }
      showSuccess('Semua peserta berhasil ditandai hadir!', 'Presensi Massal');
      loadData();
      if (attendanceModalSchedule) {
        setAttendanceModalSchedule((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            bookings: prev.bookings?.map((b) => ({ ...b, status: 'ATTENDED', attendedAt: new Date().toISOString() })),
          };
        });
      }
    } catch (err: any) {
      showError(err.message, 'Gagal Absen Semua');
    }
  };

  // Quick book member into schedule
  const handleQuickBook = async () => {
    if (!attendanceModalSchedule || !quickAddMemberId) return;
    try {
      await apiFetch('/classes/book', {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: attendanceModalSchedule.id,
          memberId: quickAddMemberId,
        }),
      });
      showSuccess('Member berhasil ditambahkan ke jadwal kelas!', 'Booking Sukses');
      loadData();
      // Re-fetch overview to refresh modal
      const refreshed = await apiFetch('/classes');
      const updatedSchedule = refreshed.schedules.find((s: any) => s.id === attendanceModalSchedule.id);
      if (updatedSchedule) setAttendanceModalSchedule(updatedSchedule);
    } catch (err: any) {
      showError(err.message, 'Gagal Menambah Member');
    }
  };

  // Helper date formatter DD/MM/YYYY
  const formatDateSlash = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-5 text-slate-100">
        {/* ══════════════ 1. TOP SWITCHER & ACTION BAR ══════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: View Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0F172A] border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'LIST'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CALENDAR')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'CALENDAR'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar View</span>
            </button>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateSchedules}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Jadwal Berulang</span>
            </button>
          </div>
        </div>

        {/* ══════════════ 2. FILTER CARD (Persis Seperti Screenshot) ══════════════ */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 sm:p-5 shadow-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filter: Kelas */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kelas
              </label>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Semua --</option>
                {classesData?.studioClasses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Trainer */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Trainer
              </label>
              <select
                value={selectedTrainerFilter}
                onChange={(e) => setSelectedTrainerFilter(e.target.value)}
                className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Semua --</option>
                {trainers?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Dari Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
                className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter: Sampai Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={toDateFilter}
                onChange={(e) => setToDateFilter(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Action Buttons (Aligned Right) */}
          <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Terapkan Filter</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ══════════════ 3. TABEL JADWAL KELAS (LIST VIEW) ══════════════ */}
        {viewMode === 'LIST' ? (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] shadow-lg overflow-hidden">
            {/* Table Card Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Jadwal Kelas
              </h2>

              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={selectedScheduleIds.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  selectedScheduleIds.length > 0
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 shadow-sm cursor-pointer'
                    : 'border-white/10 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih ({selectedScheduleIds.length})</span>
              </button>
            </div>

            {/* Table Content with Top Horizontal Scroll */}
            <TableScrollWrapper label="Scroll Kolom Jadwal">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070D1E] text-slate-400 font-bold border-b border-white/5">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredSchedules.length > 0 &&
                          selectedScheduleIds.length === filteredSchedules.length
                        }
                        onChange={handleToggleSelectAll}
                        className="rounded border-white/20 bg-[#0F172A] text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                      />
                    </th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Trainer</th>
                    <th className="p-3.5">Mulai</th>
                    <th className="p-3.5">Selesai</th>
                    <th className="p-3.5">Lokasi</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Hadir</th>
                    <th className="p-3.5">Catatan</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Tidak ada jadwal kelas yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((sc) => {
                      const isSelected = selectedScheduleIds.includes(sc.id);
                      const bookingsCount = sc.bookings?.length || sc.bookedCount || 0;
                      const attendedCount =
                        sc.bookings?.filter((b) => b.status === 'ATTENDED').length || 0;

                      // Badge status calculation
                      let statusBadge = (
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                          Tidak Ada Booking
                        </span>
                      );

                      if (attendedCount > 0) {
                        statusBadge = (
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Sudah Di Absen
                          </span>
                        );
                      } else if (bookingsCount > 0) {
                        statusBadge = (
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Belum Di Absen
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={sc.id}
                          className={`hover:bg-white/[0.02] transition ${
                            isSelected ? 'bg-blue-950/20' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(sc.id)}
                              className="rounded border-white/20 bg-[#0F172A] text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                            />
                          </td>
                          <td className="p-3.5 font-bold text-white whitespace-nowrap">
                            {sc.studioClass?.name || 'Kelas Studio'}
                          </td>
                          <td className="p-3.5 text-slate-300 whitespace-nowrap">
                            {sc.trainer?.fullName || 'Instruktur'}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-200">
                              {formatDateSlash(sc.scheduleDate)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {sc.startTime}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-200">
                              {formatDateSlash(sc.scheduleDate)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {sc.endTime}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300 whitespace-nowrap">
                            {sc.studioClass?.roomName || 'Westfit Studio'}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">{statusBadge}</td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-emerald-600 text-white font-black text-xs shadow-sm">
                              {attendedCount}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 whitespace-nowrap">
                            -
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1. Presensi / Absen button (Cyan/Teal) */}
                              <button
                                type="button"
                                onClick={() => handleOpenAttendanceModal(sc)}
                                className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition"
                                title="Presensi & Absen Peserta"
                              >
                                <ClipboardCheck className="w-4 h-4" />
                              </button>

                              {/* 2. Edit button (Navigasi ke Layout Halaman Edit) */}
                              <Link
                                href={`/classes/schedules/${sc.id}/edit`}
                                className="p-1.5 rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 shadow-sm transition inline-flex items-center justify-center"
                                title="Edit Jadwal (Buka Layout)"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>

                              {/* 3. Delete button (Red outline) */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSchedule(sc.id)}
                                className="p-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 shadow-sm transition"
                                title="Hapus Jadwal"
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
        ) : (
          /* ══════════════ 4. GOOGLE CALENDAR VIEW MODE ══════════════ */
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 sm:p-6 shadow-xl space-y-4">
            {/* Calendar Navigation & View Bar (Persis Seperti Screenshot) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
              {/* Left: Previous / Next & Hari Ini */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center rounded-xl bg-[#070D1E] border border-white/10 overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={handleCalPrev}
                    className="p-2 px-3 hover:bg-white/10 text-slate-300 hover:text-white transition border-r border-white/10"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCalNext}
                    className="p-2 px-3 hover:bg-white/10 text-slate-300 hover:text-white transition"
                    title="Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCalToday}
                  className="px-4 py-2 rounded-xl bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-xs font-bold text-slate-300 hover:text-white shadow-sm transition"
                >
                  Hari Ini
                </button>
              </div>

              {/* Center: Large Month and Year Title */}
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight text-center">
                {formattedMonthTitle}
              </h2>

              {/* Right: Sub-View Switcher Pills */}
              <div className="flex items-center rounded-xl bg-[#070D1E] border border-white/10 p-1 text-xs font-bold shadow-inner">
                {(['MONTH', 'WEEK', 'DAY', 'LIST'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setCalendarSubView(view)}
                    className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                      calendarSubView === view
                        ? 'bg-slate-800 text-white font-black shadow-md border border-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {view === 'MONTH'
                      ? 'Bulan'
                      : view === 'WEEK'
                      ? 'Minggu'
                      : view === 'DAY'
                      ? 'Hari'
                      : 'List'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-View 1: MONTH MATRIX (Bulan) - Persis Seperti Screenshot */}
            {calendarSubView === 'MONTH' && (
              <div className="rounded-xl border border-white/10 overflow-hidden bg-[#070D1E]">
                {/* 7 Columns Header with Blue Text */}
                <div className="grid grid-cols-7 bg-[#070D1E] text-blue-400 font-extrabold text-center text-xs sm:text-sm py-2.5 border-b border-white/10">
                  <div>Minggu</div>
                  <div>Senin</div>
                  <div>Selasa</div>
                  <div>Rabu</div>
                  <div>Kamis</div>
                  <div>Jumat</div>
                  <div>Sabtu</div>
                </div>

                {/* Days Grid Cells */}
                <div className="grid grid-cols-7 border-t border-l border-white/10">
                  {monthGridDays.map((cell, idx) => {
                    const dayEvents = schedulesByDate[cell.dateStr] || [];

                    return (
                      <div
                        key={`${cell.dateStr}-${idx}`}
                        className={`border-r border-b border-white/10 p-1 sm:p-2 min-h-[125px] sm:min-h-[145px] flex flex-col justify-start transition ${
                          !cell.isCurrentMonth
                            ? 'bg-[#050A17]/60'
                            : 'bg-[#0A1128]/40 hover:bg-[#0A1128]/80'
                        }`}
                      >
                        {/* Day Number Header (Top Right) */}
                        <div className="flex items-center justify-end pb-1 pr-0.5">
                          {cell.isToday ? (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shadow-md">
                              {cell.dayNumber}
                            </span>
                          ) : (
                            <span
                              className={`text-xs ${
                                cell.isCurrentMonth
                                  ? 'font-bold text-slate-300'
                                  : 'font-semibold text-slate-600'
                              }`}
                            >
                              {cell.dayNumber}
                            </span>
                          )}
                        </div>

                        {/* Events List Inside Day Cell */}
                        <div className="space-y-1 overflow-y-auto max-h-[110px] pr-0.5 scrollbar-thin">
                          {dayEvents.map((sc) => {
                            const theme = getClassTheme(sc);
                            const timeFormatted = sc.startTime.replace(':', '.');

                            return (
                              <button
                                key={sc.id}
                                type="button"
                                onClick={() => handleOpenAttendanceModal(sc)}
                                className="w-full text-left flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-white/10 transition group text-[11px] leading-tight"
                                title={`${sc.studioClass?.name} (${sc.startTime} - ${sc.endTime}) • Trainer: ${sc.trainer?.fullName} • Ruangan: ${sc.studioClass?.roomName}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${theme.accentDot} shrink-0`} />
                                <span className="font-mono text-[10px] text-slate-300 font-semibold shrink-0">
                                  {timeFormatted}
                                </span>
                                <span className={`font-bold ${theme.titleText} group-hover:underline truncate`}>
                                  {sc.studioClass?.name} ({sc.trainer?.fullName?.split(' ')[0] || 'Coach'})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-View 2: WEEK VIEW (Minggu) - Kategori Warna Tematik */}
            {calendarSubView === 'WEEK' && (
              <div className="rounded-xl border border-white/10 overflow-hidden bg-[#070D1E] p-4">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                    const baseDate = new Date(calendarDate);
                    const currentDayOfWeek = baseDate.getDay();
                    baseDate.setDate(baseDate.getDate() - currentDayOfWeek + dayOffset);
                    const dateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;
                    const dayEvents = schedulesByDate[dateStr] || [];
                    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;

                    return (
                      <div
                        key={dateStr}
                        className={`rounded-xl border p-3 flex flex-col min-h-[360px] transition-all duration-200 ${
                          isToday
                            ? 'bg-[#0F172A] border-[#FFC067]/50 ring-1 ring-[#FFC067]/30 shadow-lg shadow-[#FFC067]/5'
                            : 'bg-[#0A1128] border-white/10'
                        }`}
                      >
                        {/* Day Header */}
                        <div className={`text-center pb-2.5 border-b ${isToday ? 'border-[#FFC067]/30' : 'border-white/5'}`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`text-xs font-extrabold uppercase tracking-wider ${isToday ? 'text-[#FFC067]' : 'text-slate-400'}`}>
                              {dayNames[dayOffset]}
                            </span>
                            {isToday && (
                              <span className="text-[8.5px] font-black bg-[#FFC067] text-slate-950 px-1.5 py-0.2 rounded-full">
                                HARI INI
                              </span>
                            )}
                          </div>
                          <div className={`text-base font-black mt-0.5 ${isToday ? 'text-[#FFC067]' : 'text-white'}`}>
                            {baseDate.getDate()} {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(baseDate)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {dayEvents.length} Sesi Terjadwal
                          </div>
                        </div>

                        {/* Events List in Column */}
                        <div className="mt-2.5 space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                          {dayEvents.length === 0 ? (
                            <div className="text-center text-[11px] text-slate-500 py-8 italic">
                              Tidak ada kelas
                            </div>
                          ) : (
                            dayEvents.map((sc) => {
                              const theme = getClassTheme(sc);

                              return (
                                <div
                                  key={sc.id}
                                  onClick={() => handleOpenAttendanceModal(sc)}
                                  className={`p-2.5 rounded-xl ${theme.cardBg} cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] flex flex-col justify-between gap-1.5 group`}
                                >
                                  <div>
                                    {/* Top Pill & Capacity */}
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                                        {theme.tagLabel}
                                      </span>
                                      <span className="text-[9.5px] font-bold text-slate-400">
                                        {sc.bookings?.length || 0} / {sc.maxCapacity}
                                      </span>
                                    </div>

                                    {/* Class Title */}
                                    <div className={`font-extrabold ${theme.titleText} truncate text-[11.5px] group-hover:underline`}>
                                      {sc.studioClass?.name}
                                    </div>
                                  </div>

                                  {/* Time & Trainer Info */}
                                  <div className="pt-1.5 border-t border-white/5 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-200 font-mono font-semibold">
                                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{sc.startTime} - {sc.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 truncate">
                                      <span className={`w-1.5 h-1.5 rounded-full ${theme.accentDot} shrink-0`} />
                                      <span className="truncate text-slate-200 font-medium">{sc.trainer?.fullName}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-View 3: DAY VIEW (Hari) */}
            {calendarSubView === 'DAY' && (
              <div className="rounded-xl border border-white/10 overflow-hidden bg-[#070D1E] p-5 space-y-4">
                <div className="text-center pb-3 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white">
                    Agenda Kelas: {formatDateSlash(calendarDate.toISOString())}
                  </h3>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(calendarDate.getDate()).padStart(2, '0')}`;
                    const events = schedulesByDate[dateStr] || [];

                    if (events.length === 0) {
                      return (
                        <div className="text-center text-xs text-slate-400 py-8">
                          Tidak ada jadwal kelas pada tanggal ini.
                        </div>
                      );
                    }

                    return events.map((sc) => {
                      const theme = getClassTheme(sc);

                      return (
                        <div
                          key={sc.id}
                          onClick={() => handleOpenAttendanceModal(sc)}
                          className={`p-4 rounded-xl ${theme.cardBg} cursor-pointer flex items-center justify-between gap-4 transition shadow-sm hover:shadow-md`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-sm font-bold text-white px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
                              {sc.startTime} - {sc.endTime}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                                  {theme.tagLabel}
                                </span>
                                <h4 className={`text-sm font-extrabold ${theme.titleText}`}>
                                  {sc.studioClass?.name}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                Instruktur: <strong className="text-slate-200">{sc.trainer?.fullName}</strong> • Ruang: {sc.studioClass?.roomName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                              {sc.bookings?.length || 0} / {sc.maxCapacity} Peserta
                            </span>
                            <button
                              type="button"
                              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition"
                            >
                              Presensi
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Sub-View 4: LIST AGENDA VIEW (List) */}
            {calendarSubView === 'LIST' && (
              <div className="rounded-xl border border-white/10 overflow-hidden bg-[#070D1E]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A1128] text-slate-400 font-bold border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Tanggal</th>
                      <th className="p-3.5">Jam</th>
                      <th className="p-3.5">Kelas</th>
                      <th className="p-3.5">Trainer</th>
                      <th className="p-3.5">Ruang</th>
                      <th className="p-3.5 text-center">Peserta</th>
                      <th className="p-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {filteredSchedules.slice(0, 30).map((sc) => {
                      const theme = getClassTheme(sc);

                      return (
                        <tr key={sc.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-3.5 font-bold text-white whitespace-nowrap">
                            {formatDateSlash(sc.scheduleDate)}
                          </td>
                          <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                            {sc.startTime} - {sc.endTime}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`font-bold ${theme.titleText}`}>
                              {sc.studioClass?.name}
                            </span>
                            <span className={`ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                              {theme.tagLabel}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300 whitespace-nowrap">
                            {sc.trainer?.fullName}
                          </td>
                          <td className="p-3.5 text-slate-400 whitespace-nowrap">
                            {sc.studioClass?.roomName}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded ${theme.badgeBg} ${theme.badgeText} font-bold text-[11px]`}>
                              {sc.bookings?.length || 0} / {sc.maxCapacity}
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenAttendanceModal(sc)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow-sm transition"
                            >
                              Presensi
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ MODAL PRESENSI & ABSEN PESERTA ══════════════ */}
        {attendanceModalSchedule && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                      <ClipboardCheck className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Presensi Kehadiran Kelas
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    <strong className="text-white">{attendanceModalSchedule.studioClass?.name}</strong> •{' '}
                    {formatDateSlash(attendanceModalSchedule.scheduleDate)} ({attendanceModalSchedule.startTime} - {attendanceModalSchedule.endTime}) • Trainer:{' '}
                    {attendanceModalSchedule.trainer?.fullName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttendanceModalSchedule(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                {/* Stats & Quick Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#070D1E] border border-white/5">
                  <div className="text-xs">
                    <span className="text-slate-400">Status Kuota: </span>
                    <strong className="text-white">
                      {attendanceModalSchedule.bookings?.length || 0} / {attendanceModalSchedule.maxCapacity} Terisi
                    </strong>
                    <span className="text-slate-500 mx-2">•</span>
                    <strong className="text-emerald-400">
                      {attendanceModalSchedule.bookings?.filter((b) => b.status === 'ATTENDED').length || 0} Hadir
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkAllAttended}
                    disabled={!attendanceModalSchedule.bookings?.length}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition self-start sm:self-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Absen Semua Hadir</span>
                  </button>
                </div>

                {/* Quick Add Member to Class */}
                <div className="p-3 rounded-xl bg-[#070D1E] border border-white/5 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    + Tambah Peserta Manual ke Kelas:
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={quickAddMemberId}
                      onChange={(e) => setQuickAddMemberId(e.target.value)}
                      className="flex-1 rounded-xl bg-[#0F172A] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleQuickBook}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow transition whitespace-nowrap"
                    >
                      Daftarkan
                    </button>
                  </div>
                </div>

                {/* Attendees List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Daftar Peserta Terdaftar ({attendanceModalSchedule.bookings?.length || 0})
                  </span>

                  {!attendanceModalSchedule.bookings || attendanceModalSchedule.bookings.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-xl">
                      Belum ada member yang memesan tiket/jadwal kelas ini.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-[#070D1E]">
                      {attendanceModalSchedule.bookings.map((b, idx) => (
                        <div
                          key={b.id}
                          className="p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-center text-slate-500 font-mono text-[11px]">
                              {idx + 1}.
                            </span>
                            <div>
                              <div className="font-bold text-white">
                                {b.member?.fullName || 'Member Kaisar'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {b.member?.code} • {b.member?.phone || 'No WhatsApp'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {b.status === 'ATTENDED' ? (
                              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Hadir
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateAttendeeStatus(b.id, 'ATTENDED')}
                                className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition"
                              >
                                Tandai Hadir
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleUpdateAttendeeStatus(b.id, 'CANCELLED')}
                              className="px-2 py-1 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs transition"
                              title="Batalkan Booking"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAttendanceModalSchedule(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
                >
                  Tutup Presensi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ MODAL + TAMBAH JADWAL ══════════════ */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <form onSubmit={handleSubmitAddSchedule}>
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Tambah Jadwal Kelas Baru</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Pilih Kelas</label>
                    <select
                      value={scheduleForm.studioClassId}
                      onChange={(e) => {
                        const cl = classesData?.studioClasses.find((x) => x.id === e.target.value);
                        setScheduleForm((prev) => ({
                          ...prev,
                          studioClassId: e.target.value,
                          roomName: cl?.roomName || prev.roomName,
                          maxCapacity: cl?.maxCapacity || prev.maxCapacity,
                        }));
                      }}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {classesData?.studioClasses?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.roomName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Pilih Trainer / Instruktur</label>
                    <select
                      value={scheduleForm.trainerId}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, trainerId: e.target.value }))}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {trainers?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Tanggal Sesi</label>
                      <input
                        type="date"
                        value={scheduleForm.scheduleDate}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Kapasitas Maksimal</label>
                      <input
                        type="number"
                        min="1"
                        value={scheduleForm.maxCapacity}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, maxCapacity: Number(e.target.value) }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Jam Mulai</label>
                      <input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Jam Selesai</label>
                      <input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Lokasi Studio / Ruangan</label>
                    <input
                      type="text"
                      value={scheduleForm.roomName}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, roomName: e.target.value }))}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
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
                    Simpan Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════ MODAL EDIT JADWAL ══════════════ */}
        {editingSchedule && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <form onSubmit={handleSubmitEditSchedule}>
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-blue-400" />
                    <span>Edit Jadwal Kelas</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingSchedule(null)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Kelas</label>
                    <select
                      value={scheduleForm.studioClassId}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, studioClassId: e.target.value }))}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {classesData?.studioClasses?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">Trainer / Instruktur</label>
                    <select
                      value={scheduleForm.trainerId}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, trainerId: e.target.value }))}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {trainers?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Tanggal Sesi</label>
                      <input
                        type="date"
                        value={scheduleForm.scheduleDate}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Kapasitas Maksimal</label>
                      <input
                        type="number"
                        min="1"
                        value={scheduleForm.maxCapacity}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, maxCapacity: Number(e.target.value) }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Jam Mulai</label>
                      <input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Jam Selesai</label>
                      <input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingSchedule(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                  >
                    Perbarui Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
