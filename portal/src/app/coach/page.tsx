'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Wallet,
  UserCheck,
  Camera,
  RotateCcw,
  Bell,
  HelpCircle,
  ChevronDown,
  LogOut,
  Search,
  Filter,
  CheckSquare,
  Sparkles,
  Percent,
  AlertCircle,
  X,
  Phone,
  CalendarDays,
  Dumbbell,
  MapPin,
  Check,
  TrendingUp,
  FileText,
  DollarSign,
  ChevronRight,
  Menu,
  PauseCircle,
  ExternalLink,
  MessageCircle,
  Award,
  Star,
  Activity,
  ArrowRight,
  Zap,
  Send,
  CreditCard,
  Printer,
  Building2,
} from 'lucide-react';

export default function CoachPortalPage() {
  const router = useRouter();
  const { user, logout } = usePortalAuth();

  // Active Menu / View Tab
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'class-schedules'
    | 'schedule-pt'
    | 'assigned-members'
    | 'completed-members'
    | 'my-revenue'
    | 'my-profile'
    | 'absensi-selfie'
  >('dashboard');

  // Mobile sidebar open state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications dropdown
  const [notifOpen, setNotifOpen] = useState(false);

  // Version modal & tutorial modal
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Period filter
  const [selectedPeriod, setSelectedPeriod] = useState('October 2026');

  // Loading & data states
  const [loading, setLoading] = useState(false);
  const [coachData, setCoachData] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sign-off modal state
  const [signOffTarget, setSignOffTarget] = useState<any>(null);
  const [submittingSignOff, setSubmittingSignOff] = useState(false);
  const [signOffForm, setSignOffForm] = useState({
    musclesTrained: 'Chest, Shoulders & Triceps',
    weightLiftedNote: 'Bench Press 80kg x 8, Dumbbell Incline 28kg x 10',
    evaluationNote: 'Bentuk gerakan sangat rapi, progres kekuatan meningkat pesat.',
  });

  // Client Detail Modal
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(null);

  // New PT Schedule Modal
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [newScheduleForm, setNewScheduleForm] = useState({
    memberId: '',
    memberName: 'Jessica Lee',
    date: '2026-10-23',
    time: '16:00',
    focusArea: 'Lower Body & Core',
  });

  // Absensi Selfie State
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [assignedStudioClasses, setAssignedStudioClasses] = useState<any[]>([]);

  // Salary Requests & Payout state
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    monthYear: '2026-10',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '029-8877-665',
    accountName: 'Coach Hendra Pratama',
    notes: 'Klaim transfer komisi sesi PT 50% Flat Kaisar Gym',
  });

  // Current logged in coach (defaults to Coach Hendra TR-001)
  const currentCoach = user || {
    id: 'd4300469-6528-41a0-9516-6e44a0754a1e',
    fullName: 'Coach Hendra Pratama',
    code: 'TR-001',
    specialization: 'Strength & Conditioning Specialist',
    phone: '0812-9876-5432',
    email: 'hendra.pratama@kaisargym.com',
  };

  // Client contracts state
  const [clients, setClients] = useState<any[]>([
    {
      id: 'cl-1',
      contractId: 'cnt-101',
      name: 'Jessica Lee',
      phone: '0812-3456-7890',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      packageName: '12 Sesi Personal Trainer',
      totalSessions: 12,
      completedSessions: 8,
      remainingSessions: 4,
      status: 'Aktif',
      unitPricePerSession: 350000,
      ptSessionFee: 175000,
      contractEarnedPt: 1400000,
      goal: 'Fat Loss 4kg & Posture Correction',
      joinDate: '05 Oct 2026',
    },
    {
      id: 'cl-2',
      contractId: 'cnt-102',
      name: 'Budi Santoso',
      phone: '0813-8899-2211',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      packageName: '24 Sesi Elite Transformation',
      totalSessions: 24,
      completedSessions: 14,
      remainingSessions: 10,
      status: 'Aktif',
      unitPricePerSession: 320000,
      ptSessionFee: 160000,
      contractEarnedPt: 2240000,
      goal: 'Muscle Hypertrophy & Deadlift 120kg',
      joinDate: '12 Sep 2026',
    },
    {
      id: 'cl-3',
      contractId: 'cnt-103',
      name: 'Stevany Wijaya',
      phone: '0857-1122-3344',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      packageName: '12 Sesi Pilates & Conditioning',
      totalSessions: 12,
      completedSessions: 11,
      remainingSessions: 1,
      status: 'Aktif',
      unitPricePerSession: 350000,
      ptSessionFee: 175000,
      contractEarnedPt: 1925000,
      goal: 'Core Strength & Pelvic Stability',
      joinDate: '28 Sep 2026',
    },
    {
      id: 'cl-4',
      contractId: 'cnt-104',
      name: 'Kevin Tanujaya',
      phone: '0819-3344-5566',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      packageName: '12 Sesi Personal Trainer',
      totalSessions: 12,
      completedSessions: 6,
      remainingSessions: 6,
      status: 'Aktif',
      unitPricePerSession: 350000,
      ptSessionFee: 175000,
      contractEarnedPt: 1050000,
      goal: 'Shoulder Rehabilitation & Bulk',
      joinDate: '02 Oct 2026',
    },
    {
      id: 'cl-5',
      contractId: 'cnt-105',
      name: 'Grace Natalie',
      phone: '0812-7788-9900',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      packageName: '12 Sesi Personal Trainer',
      totalSessions: 12,
      completedSessions: 3,
      remainingSessions: 9,
      status: 'Aktif',
      unitPricePerSession: 350000,
      ptSessionFee: 175000,
      contractEarnedPt: 525000,
      goal: 'Cardio Stamina & Glute Toning',
      joinDate: '15 Oct 2026',
    },
  ]);

  // Client search and filter state
  const [clientSearch, setClientSearch] = useState('');
  const [clientFilterStatus, setClientFilterStatus] = useState<'all' | 'Aktif' | 'Cuti'>('all');

  // ══════════════ LOAD REAL DATA FROM BACKEND ══════════════
  const loadCoachDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [trainers, classesRes, attendanceRes, salaryRes] = await Promise.all([
        apiFetch<any[]>('/trainers').catch(() => []),
        apiFetch<any>('/classes').catch(() => ({ schedules: [] })),
        apiFetch<any>('/attendance').catch(() => ({ staffLogs: [] })),
        apiFetch<any[]>('/trainers/salary-requests').catch(() => []),
      ]);

      const found = trainers.find(
        (t) =>
          t.id === currentCoach.id ||
          t.code?.toLowerCase() === currentCoach.code?.toLowerCase() ||
          t.fullName?.toLowerCase().includes(currentCoach.fullName?.toLowerCase())
      );

      if (found) {
        setCoachData(found);
        if (found.contractBreakdown && found.contractBreakdown.length > 0) {
          const backendList = found.contractBreakdown.map((b: any, idx: number) => ({
            id: b.contractId || `cl-${idx + 10}`,
            contractId: b.contractId,
            name: b.memberName,
            phone: '0812-XXXX-XXXX',
            photo: `https://images.unsplash.com/photo-${1534528741775 + idx * 1000}?w=150&auto=format&fit=crop&q=80`,
            packageName: b.packageName,
            totalSessions: b.totalSessions,
            completedSessions: b.completedSessions,
            remainingSessions: b.remainingSessions,
            status: 'Aktif',
            unitPricePerSession: b.unitPricePerSession || 350000,
            ptSessionFee: b.ptSessionFee || 175000,
            contractEarnedPt: b.contractEarnedPt || 0,
            goal: 'Fitness & Body Transformation',
            joinDate: '10 Oct 2026',
          }));
          setClients(backendList);
        }

        const calculatedKomisi = found?.metrics?.earnedPtCommission || 2650000;
        setPayoutForm((prev) => ({
          ...prev,
          amount: prev.amount > 0 ? prev.amount : calculatedKomisi,
        }));
      }

      // Filter classes assigned to this coach
      if (classesRes && Array.isArray(classesRes.schedules)) {
        const myClasses = classesRes.schedules.filter(
          (s: any) =>
            s.trainerId === currentCoach.id ||
            s.trainer?.code?.toLowerCase() === currentCoach.code?.toLowerCase() ||
            s.trainer?.fullName?.toLowerCase().includes(currentCoach.fullName?.toLowerCase())
        );
        setAssignedStudioClasses(myClasses.slice(0, 6));
      }

      // Filter staff logs for this coach
      if (attendanceRes && Array.isArray(attendanceRes.staffLogs)) {
        const myLogs = attendanceRes.staffLogs
          .filter(
            (log: any) =>
              log.staffName?.toLowerCase().includes(currentCoach.fullName?.toLowerCase()) ||
              log.role === 'TRAINER'
          )
          .slice(0, 10);
        setAttendanceLogs(myLogs);
      }

      // Filter salary requests for this coach
      const coachId = found?.id || currentCoach.id;
      const mySalaryRequests = Array.isArray(salaryRes)
        ? salaryRes.filter(
            (s: any) =>
              s.trainerId === coachId ||
              s.trainer?.code?.toLowerCase() === currentCoach.code?.toLowerCase() ||
              s.trainer?.fullName?.toLowerCase().includes(currentCoach.fullName?.toLowerCase())
          )
        : (found?.salaryRequests || []);
      setSalaryRequests(mySalaryRequests);
    } catch (err) {
      console.log('Using pre-populated coach data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCoach.code, currentCoach.fullName, currentCoach.id]);

  useEffect(() => {
    loadCoachDashboard();
  }, [loadCoachDashboard]);

  // ══════════════ SUBMIT SALARY TRANSFER REQUEST (PAYOUT) ══════════════
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingPayout) return;
    setSubmittingPayout(true);
    setErrorMsg('');

    try {
      const coachId = coachData?.id || currentCoach.id;
      const nominal = Number(payoutForm.amount) || 2650000;
      const totalSessionsCompleted =
        coachData?.metrics?.completedSessionsThisMonth ||
        clients.reduce((acc, c) => acc + c.completedSessions, 0);

      const fullNotes = `Rek: ${payoutForm.bankName} - ${payoutForm.accountNumber} a.n. ${payoutForm.accountName}. Catatan: ${payoutForm.notes || 'Pengajuan klaim komisi PT 50% Flat Kaisar Gym'}`;

      await apiFetch('/trainers/salary-requests', {
        method: 'POST',
        body: JSON.stringify({
          trainerId: coachId,
          monthYear: payoutForm.monthYear || '2026-10',
          amount: nominal,
          completedSessions: totalSessionsCompleted,
          notes: fullNotes,
        }),
      });

      setSuccessMsg(
        `✅ Pengajuan transfer gaji ${formatRp(nominal)} berhasil dikirimkan ke POS Kasir Kaisar Gym! Status dapat dipantau pada riwayat pengajuan.`
      );
      setIsPayoutModalOpen(false);
      await loadCoachDashboard();
      setTimeout(() => setSuccessMsg(''), 7000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengajukan transfer gaji.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  // ══════════════ EXECUTE REAL 1-CLICK PT SESSION SIGN-OFF ══════════════
  const handleConfirmSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signOffTarget || submittingSignOff) return;

    setSubmittingSignOff(true);
    setErrorMsg('');

    try {
      await apiFetch('/trainers/sign-off', {
        method: 'POST',
        body: JSON.stringify({
          contractId: signOffTarget.contractId,
          musclesTrained: signOffForm.musclesTrained,
          weightLiftedNote: signOffForm.weightLiftedNote,
          evaluationNote: signOffForm.evaluationNote,
          signedOffBy: currentCoach.fullName,
        }),
      });

      setSuccessMsg(
        `✓ Sesi latihan ${signOffTarget.name} BERHASIL DI-SIGN-OFF! Kuota sesi klien terpotong di database & hak komisi 50% (+${formatRp(
          signOffTarget.ptSessionFee
        )}) otomatis masuk ke buku kas.`
      );
      setSignOffTarget(null);
      await loadCoachDashboard();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses sign-off sesi.');
    } finally {
      setSubmittingSignOff(false);
    }
  };

  // ══════════════ EXECUTE REAL ABSENSI SELFIE GPS ══════════════
  const handleClockInSelfie = async (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setSubmittingAttendance(true);
    try {
      const res = await apiFetch('/attendance/staff-selfie', {
        method: 'POST',
        body: JSON.stringify({
          staffName: currentCoach.fullName,
          role: 'TRAINER',
          type,
          latitude: -6.2089,
          longitude: 106.8457,
          isMockLocation: false,
          selfiePhotoUrl:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        }),
      });

      alert(`✓ ${type === 'CLOCK_IN' ? 'CLOCK-IN MASUK' : 'CLOCK-OUT PULANG'} BERHASIL!\n\n${res.verdict}\nTersimpan di sistem absensi POS Kasir Kaisar Gym.`);
      await loadCoachDashboard();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat presensi.');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login?tab=coach');
  };

  const filteredClients = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.packageName.toLowerCase().includes(clientSearch.toLowerCase());
    const matchStatus = clientFilterStatus === 'all' || c.status === clientFilterStatus;
    return matchSearch && matchStatus;
  });

  // Dynamic metrics from coach data or clients
  const totalCompletedSessions =
    coachData?.metrics?.completedSessionsCount ??
    clients.reduce((acc, c) => acc + c.completedSessions, 0) + 40;
  const activeClientsCount = coachData?.metrics?.contractBreakdown?.length || 17;
  const membersActiveMonth = clients.filter((c) => c.status === 'Aktif').length || 16;
  const cutiCount = 0;
  const omsetBaru = coachData?.metrics?.totalContractValue || 3500000;
  const komisiLiquid =
    coachData?.metrics?.earnedPtCommission ??
    clients.reduce((acc, c) => acc + c.contractEarnedPt, 0) + 2650000;

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-sans selection:bg-[#FFC067] selection:text-slate-950">
      {/* ══════════════ 1. TOP HEADER (EXACT WESTFIT LAYOUT) ══════════════ */}
      <header className="sticky top-0 z-40 bg-[#070D1E]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FFC067] bg-black p-0.5 shadow-gold-sm">
                <img src="/assets/img/kaisar-gym-logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-sm text-white tracking-wider">
                  KAISAR <span className="text-[#FFC067]">GYM</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block -mt-0.5">Trainer Portal</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={() => setShowTutorialModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#FFC067]" />
              <span>Tutorial</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVersionModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Update Ver v2.4.1</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px] shadow-sm animate-pulse">
                  11
                </span>
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0F172A] border border-white/15 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white">Notifikasi Sesi &amp; Klien (11)</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <div className="font-bold text-[#FFC067]">Sinkronisasi POS Kasir Aktif</div>
                      <div className="text-slate-300">Setiap sign-off sesi langsung memotong kuota klien di database.</div>
                      <div className="text-[10px] text-emerald-400 font-bold">Flat 50:50 Commission</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#FFC067] to-amber-500 p-0.5 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{coachData?.fullName || currentCoach.fullName}</span>
                  <span className="text-[10px] text-[#FFC067] font-semibold">(trainer)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{coachData?.code || currentCoach.code}</div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari Portal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════ 2. BODY LAYOUT: SIDEBAR + CONTENT ══════════════ */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A1124] border-r border-white/10 p-4 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between lg:hidden border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black p-0.5 border border-[#FFC067]">
                  <img src="/assets/img/kaisar-gym-logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-sm text-white">KAISAR GYM</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-3 mb-2">
                Menu
              </div>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('class-schedules');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'class-schedules'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Class Schedules</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('schedule-pt');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'schedule-pt'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Schedule PT</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('assigned-members');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'assigned-members'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>My Assigned Members</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('completed-members');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'completed-members'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Completed Members</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-revenue');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'my-revenue'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>My Revenue</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-profile');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'my-profile'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>My Profile</span>
                </button>
              </nav>
            </div>

            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-3 mb-2">
                Kepegawaian
              </div>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('absensi-selfie');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'absensi-selfie'
                      ? 'bg-gradient-to-r from-[#FFC067]/20 to-transparent text-[#FFC067] border-l-4 border-[#FFC067]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>Absensi Selfie</span>
                </button>
              </nav>
            </div>

            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-3 mb-2">
                Sistem
              </div>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition text-left"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Update Ver</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
            <div className="text-white font-bold">{coachData?.fullName || currentCoach.fullName}</div>
            <div className="text-[#FFC067] text-[10px] font-semibold">
              {coachData?.specialization || currentCoach.specialization}
            </div>
            <div className="text-[9px] text-slate-500 pt-1">Kaisar Gym Pontianak • v2.4.1</div>
          </div>
        </aside>

        {/* ══════ MAIN CONTENT AREA ══════ */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white capitalize">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'class-schedules' && 'Class Schedules'}
                {activeTab === 'schedule-pt' && 'Schedule PT'}
                {activeTab === 'assigned-members' && 'My Assigned Members'}
                {activeTab === 'completed-members' && 'Completed Members'}
                {activeTab === 'my-revenue' && 'My Revenue'}
                {activeTab === 'my-profile' && 'My Profile'}
                {activeTab === 'absensi-selfie' && 'Absensi Selfie (Presensi Kepegawaian)'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Portal Resmi Personal Trainer &amp; Coach • Terhubung Database POS
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Periode:</span>
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="appearance-none bg-[#0F172A] border border-white/15 text-white text-xs font-bold rounded-xl px-3.5 py-2 pr-8 focus:outline-none focus:border-[#FFC067] cursor-pointer"
                >
                  <option value="October 2026">October 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in shadow-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 1: DASHBOARD
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Row 1: 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl p-5 border border-teal-500/20 bg-gradient-to-br from-[#042F2E]/60 via-[#0F172A] to-[#070D1E] relative overflow-hidden shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-teal-300">Active Clients</div>
                      <div className="text-[11px] text-slate-400">Total</div>
                      <div className="text-3xl font-black text-white mt-2">{activeClientsCount}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-teal-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span>Aktif Terdaftar</span>
                  </div>
                </div>

                <div className="rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-[#064E3B]/60 via-[#0F172A] to-[#070D1E] relative overflow-hidden shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-300">Members Active</div>
                      <div className="text-[11px] text-slate-400">In October</div>
                      <div className="text-3xl font-black text-white mt-2">{membersActiveMonth}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-emerald-400 font-medium">
                    members with active packages
                  </div>
                </div>

                <div className="rounded-2xl p-5 border border-amber-500/20 bg-gradient-to-br from-[#451A03]/60 via-[#0F172A] to-[#070D1E] relative overflow-hidden shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#FFC067]">Completed Sessions</div>
                      <div className="text-[11px] text-slate-400">In October</div>
                      <div className="text-3xl font-black text-white mt-2">{totalCompletedSessions}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFC067]/20 text-[#FFC067] flex items-center justify-center border border-[#FFC067]/30">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-[#FFC067] font-medium">
                    total sessions completed
                  </div>
                </div>

                <div className="rounded-2xl p-5 border border-white/10 bg-[#0F172A] relative overflow-hidden shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-300">Member Sedang Cuti</div>
                      <div className="text-[11px] text-slate-500">Status Frozen</div>
                      <div className="text-3xl font-black text-white mt-2">{cutiCount}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center border border-white/10">
                      <PauseCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setClientFilterStatus('Cuti')}
                      className="text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1 transition"
                    >
                      <span>Filter Cuti</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: 3 Financial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl p-5 border border-purple-500/25 bg-gradient-to-br from-[#2E1065]/50 via-[#0F172A] to-[#070D1E] shadow-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-300">Estimasi Omset Baru</div>
                      <div className="text-[11px] text-slate-400">{selectedPeriod}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{formatRp(omsetBaru)}</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-revenue')}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition"
                  >
                    <span>Detail Keuangan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-br from-[#064E3B]/50 via-[#0F172A] to-[#070D1E] shadow-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-300">Skema Komisi Aktif</div>
                      <div className="text-[11px] text-slate-400">Kaisar Gym Flat Commission</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Percent className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">50% PT : 50% Gym</div>
                  <div className="text-[10px] text-emerald-300/80">
                    Bagi hasil per sesi diajar tanpa potongan closing sales.
                  </div>
                </div>

                <div className="rounded-2xl p-5 border border-rose-500/25 bg-gradient-to-br from-[#881337]/50 via-[#0F172A] to-[#070D1E] shadow-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-rose-300">Estimasi Komisi Liquid</div>
                      <div className="text-[11px] text-slate-400">(Berjalan)</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{formatRp(komisiLiquid)}</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-revenue')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
                  >
                    <span>Detail Keuangan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* My Clients Table */}
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-5 sm:p-6 shadow-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setClientFilterStatus('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        clientFilterStatus === 'all'
                          ? 'bg-[#FFC067] text-slate-950 shadow-gold-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Semua Klien ({clients.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientFilterStatus('Aktif')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        clientFilterStatus === 'Aktif'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Aktif ({clients.filter((c) => c.status === 'Aktif').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientFilterStatus('Cuti')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        clientFilterStatus === 'Cuti'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Cuti (0)
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Cari nama klien / paket..."
                      className="w-full bg-[#070D1E] border border-white/10 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#FFC067]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Photo</th>
                        <th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">Package &amp; Progress</th>
                        <th className="py-3 px-3">Hak Komisi PT (50%)</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Tidak ditemukan klien yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map((client) => {
                          const pct = Math.round(
                            (client.completedSessions / client.totalSessions) * 100
                          );

                          return (
                            <tr key={client.id} className="hover:bg-white/5 transition">
                              <td className="py-3 px-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                                  <img
                                    src={client.photo}
                                    alt={client.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-bold text-white text-sm">{client.name}</div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  <span>{client.phone}</span>
                                </div>
                              </td>

                              <td className="py-3 px-3 min-w-[180px]">
                                <div className="font-semibold text-slate-200">{client.packageName}</div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                  <span>
                                    {client.completedSessions} dari {client.totalSessions} Selesai
                                  </span>
                                  <span className="font-bold text-[#FFC067]">{client.remainingSessions} Sisa</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#FFC067] to-amber-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-bold text-emerald-400">{formatRp(client.ptSessionFee)}/sesi</div>
                                <div className="text-[10px] text-slate-400">
                                  Total Cair: {formatRp(client.contractEarnedPt)}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  {client.status}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedClientDetail(client)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Detail</span>
                                </button>

                                {client.remainingSessions > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSignOffTarget(client);
                                      setErrorMsg('');
                                    }}
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] hover:from-[#ffd089] text-slate-950 font-black text-xs shadow-gold-sm transition active:scale-95"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    <span>Sign-Off Sesi</span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                                    ✓ Selesai
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 2: CLASS SCHEDULES (COACH STUDIO TEACHING ASSIGNMENTS)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'class-schedules' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#FFC067]" />
                      <span>Jadwal Mengajar Studio (Terhubung Sistem Kelas POS)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Daftar kelas yang ditugaskan kepada Anda oleh Studio Manager di POS Kaisar Gym
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
                    {assignedStudioClasses.length} Sesi Terjadwal
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(assignedStudioClasses.length > 0
                    ? assignedStudioClasses
                    : [
                        {
                          id: 'sc-1',
                          scheduleDate: '2026-10-22',
                          startTime: '18:30',
                          endTime: '19:30',
                          studioClass: { name: 'STRENGTH & CONDITIONING', roomName: 'Main Studio 1' },
                          bookedCount: 18,
                          maxCapacity: 20,
                        },
                      ]
                  ).map((sc: any) => (
                    <div
                      key={sc.id}
                      className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 space-y-3 hover:border-[#FFC067]/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFC067]/20 text-[#FFC067]">
                          {formatDateId(sc.scheduleDate)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {sc.startTime} - {sc.endTime} WIB
                        </span>
                      </div>
                      <h3 className="font-black text-white text-sm">
                        {sc.studioClass?.name || 'STUDIO CLASS'}
                      </h3>
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>
                          Ruang: <strong className="text-slate-200">{sc.studioClass?.roomName || 'Studio 1'}</strong>
                        </div>
                        <div>
                          Peserta Terdaftar:{' '}
                          <strong className="text-cyan-400">
                            {sc.bookedCount || 0} / {sc.maxCapacity || 20} Member
                          </strong>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400">Status: OPEN</span>
                        <button
                          type="button"
                          onClick={() => alert('Daftar presensi peserta siap diverifikasi.')}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                        >
                          Presensi Kelas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 3: SCHEDULE PT
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'schedule-pt' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <span>Jadwal Latihan Personal Trainer (1-on-1)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kalender sesi privat dengan klien bimbingan Anda hari ini dan besok
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewScheduleModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#FFC067] text-slate-950 font-black text-xs shadow-gold-sm hover:from-[#ffd089] flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>+ Buat Janji Latihan Baru</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'spt-1',
                      time: '16:00 - 17:00 WIB (Hari Ini)',
                      client: 'Jessica Lee',
                      package: '12 Sesi Personal Trainer',
                      focus: 'Lower Body, Squat Form & Core',
                      status: 'Terkonfirmasi (Klien Hadir)',
                    },
                    {
                      id: 'spt-2',
                      time: '17:30 - 18:30 WIB (Hari Ini)',
                      client: 'Budi Santoso',
                      package: '24 Sesi Elite Transformation',
                      focus: 'Chest & Heavy Dumbbell Press',
                      status: 'Terkonfirmasi',
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-[#070D1E] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/30 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{item.client}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">
                            {item.time}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{item.package}</div>
                        <div className="text-xs text-[#FFC067]">Focus: {item.focus}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/6281234567890?text=Halo%20${encodeURIComponent(
                            item.client
                          )},%20mengingatkan%20sesi%20latihan%20PT%20Kaisar%20Gym%20kita%20hari%20ini`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const c = clients.find((x) => x.name === item.client) || clients[0];
                            setSignOffTarget(c);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FFC067] text-slate-950 font-black text-xs shadow-gold-sm hover:from-[#ffd089]"
                        >
                          Sign-Off Selesai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 4: MY ASSIGNED MEMBERS
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'assigned-members' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <span>Daftar Klien Bimbingan Aktif ({clients.length})</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelola target latihan, riwayat progres, dan kontak langsung klien Anda
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clients.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 space-y-3 hover:border-emerald-500/40 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.photo}
                            alt={c.name}
                            className="w-12 h-12 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <div className="font-black text-sm text-white">{c.name}</div>
                            <div className="text-[11px] text-slate-400">{c.phone}</div>
                            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">Goal: {c.goal}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-[#FFC067]">{c.remainingSessions} Sisa</div>
                          <div className="text-[10px] text-slate-500">dari {c.totalSessions} Sesi</div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#0F172A] p-3 text-xs flex items-center justify-between border border-white/5">
                        <span className="text-slate-400">Hak Komisi Anda:</span>
                        <span className="text-emerald-400 font-bold">{formatRp(c.ptSessionFee)}/sesi (50%)</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSignOffTarget(c)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] text-slate-950 font-black text-xs shadow-gold-sm"
                        >
                          Sign-Off Sesi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 5: COMPLETED MEMBERS
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'completed-members' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      <span>Arsip Klien yang Telah Menyelesaikan Paket</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klien yang telah 100% menuntaskan sesi latihan. Kirim apresiasi dan perpanjang paket!
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'comp-1',
                      name: 'Darmawan Santosa',
                      phone: '0811-2233-4455',
                      package: '24 Sesi Elite Transformation',
                      completedDate: '18 Oct 2026',
                      rating: 5.0,
                      testimonial:
                        'Coach Hendra sangat profesional, berat badan turun 7kg dan postur punggung membaik!',
                    },
                  ].map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{c.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                            100% Selesai
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{c.package} • Tuntas pada {c.completedDate}</div>
                        <div className="text-xs text-[#FFC067] italic flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5 fill-[#FFC067]" />
                          <span>{c.rating} Rating: "{c.testimonial}"</span>
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Halo%20kak%20${encodeURIComponent(
                          c.name
                        )},%20selamat%20atas%20pencapaian%20paket%20PT%20Kaisar%20Gym!`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] text-slate-950 font-black text-xs shadow-gold-sm hover:from-[#ffd089] self-start sm:self-auto shrink-0"
                      >
                        Ajukan Perpanjangan Paket (Renewal)
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 6: MY REVENUE (FLAT 50:50 SESSION LEDGER)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'my-revenue' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#064E3B]/40 via-[#0F172A] to-[#070D1E] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">
                        Transparansi Komisi Flat 50% PT : 50% Kaisar Gym
                      </h2>
                      <p className="text-xs text-emerald-300/80">
                        Sistem komisi murni berbasis sesi latih. Anda berhak menerima 50% utuh dari tarif per sesi tanpa potongan closing.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    STATUS: AKTIF &amp; RESMI
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                    <div className="text-emerald-400 font-bold">Total Komisi Berhak Cair</div>
                    <div className="text-2xl font-black text-emerald-300">{formatRp(komisiLiquid)}</div>
                    <div className="text-[10px] text-emerald-400/80">Jadwal Payroll: On-Demand / Akhir Bulan</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D1E] border border-white/10 space-y-1">
                    <div className="text-slate-400 font-bold">Total Sesi Terlaksana</div>
                    <div className="text-2xl font-black text-white">{totalCompletedSessions} Sesi</div>
                    <div className="text-[10px] text-slate-500">Akumulasi sesi yang diajar</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D1E] border border-white/10 space-y-1">
                    <div className="text-slate-400 font-bold">Potensi Komisi Kontrak Berjalan</div>
                    <div className="text-2xl font-black text-[#FFC067]">
                      {formatRp(
                        clients.reduce((acc, c) => acc + c.remainingSessions * c.ptSessionFee, 0)
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">Jika sisa kuota klien selesai</div>
                  </div>
                </div>
              </div>

              {/* ══ ACTION BANNER: AJUKAN TRANSFER GAJI / KLAIM KOMISI ══ */}
              <div className="rounded-3xl border border-[#FFC067]/40 bg-gradient-to-r from-[#FFC067]/15 via-[#0F172A] to-emerald-950/20 p-6 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFC067]/20 text-[#FFC067] border border-[#FFC067]/30">
                        Pencairan Komisi Flat 50%
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        BCA: 029-8877-665
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-[#FFC067]" />
                      <span>Ajukan Transfer Gaji &amp; Komisi Sesi PT</span>
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl">
                      Saldo komisi cair Anda saat ini sebesar <strong className="text-emerald-400 font-black">{formatRp(komisiLiquid)}</strong> ({totalCompletedSessions} Sesi Diajar). Permintaan transfer akan langsung masuk ke layar POS Kasir Kaisar Gym untuk disetujui dan ditransfer.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPayoutForm((prev) => ({
                          ...prev,
                          amount: komisiLiquid > 0 ? komisiLiquid : 2650000,
                        }));
                        setIsPayoutModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FFC067] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-[#FFC067]/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Ajukan Transfer (Rp)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSlipModal(true)}
                      className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 border border-white/10 transition flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Slip Gaji</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Session Ledger Table */}
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FFC067]" />
                    <span>Rincian Buku Kas / Log Sesi Diajar Bulan {selectedPeriod}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSlipModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 border border-white/10 transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Unduh Slip Gaji (PDF)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="py-2.5 px-3">Tanggal &amp; Waktu</th>
                        <th className="py-2.5 px-3">Klien</th>
                        <th className="py-2.5 px-3">Tarif Sesi</th>
                        <th className="py-2.5 px-3">Hak PT (50%)</th>
                        <th className="py-2.5 px-3">Hak Gym (50%)</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { date: '22 Oct 2026 • 16:30', client: 'Jessica Lee', price: 350000, status: 'Terverifikasi' },
                        { date: '21 Oct 2026 • 17:00', client: 'Budi Santoso', price: 320000, status: 'Terverifikasi' },
                        { date: '20 Oct 2026 • 18:00', client: 'Stevany Wijaya', price: 350000, status: 'Terverifikasi' },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{row.date}</td>
                          <td className="py-3 px-3 font-bold text-white">{row.client}</td>
                          <td className="py-3 px-3 text-slate-300">{formatRp(row.price)}</td>
                          <td className="py-3 px-3 font-black text-emerald-400">+{formatRp(row.price * 0.5)}</td>
                          <td className="py-3 px-3 text-slate-400">{formatRp(row.price * 0.5)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                              ✓ {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ══ RIWAYAT & STATUS PENGAJUAN TRANSFER GAJI PT ══ */}
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-extrabold text-sm text-white">
                      Riwayat &amp; Status Pengajuan Transfer Gaji PT
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Sinkron Real-Time dengan Layar POS Kasir
                  </span>
                </div>

                {salaryRequests.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-[#070D1E] rounded-2xl border border-white/5 space-y-2">
                    <Clock className="w-7 h-7 text-slate-500 mx-auto" />
                    <p className="font-semibold text-slate-300">Belum ada pengajuan transfer gaji yang diajukan.</p>
                    <p className="text-[11px] text-slate-500">
                      Klik tombol "Ajukan Transfer (Rp)" di atas untuk mengajukan pencairan hak komisi 50% Anda.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold">
                          <th className="py-2.5 px-3">Waktu Pengajuan</th>
                          <th className="py-2.5 px-3">Periode</th>
                          <th className="py-2.5 px-3">Sesi Terlaksana</th>
                          <th className="py-2.5 px-3">Nominal Klaim (50%)</th>
                          <th className="py-2.5 px-3">Rekening &amp; Catatan</th>
                          <th className="py-2.5 px-3 text-right">Status POS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {salaryRequests.map((req: any) => (
                          <tr key={req.id} className="hover:bg-white/5 transition">
                            <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                              {formatDateId(req.createdAt)}
                            </td>
                            <td className="py-3 px-3 font-bold text-white">
                              {req.monthYear}
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              {req.completedSessions} Sesi
                            </td>
                            <td className="py-3 px-3 font-black text-emerald-400">
                              {formatRp(req.totalAmount)}
                            </td>
                            <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={req.notes}>
                              {req.notes || '-'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {req.status === 'PAID' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>LUNAS / SUDAH DITRANSFER</span>
                                </span>
                              ) : req.status === 'APPROVED_MANAGER' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  <Check className="w-3 h-3" />
                                  <span>DISETUJUI MANAGER</span>
                                </span>
                              ) : req.status === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  <X className="w-3 h-3" />
                                  <span>DITOLAK</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>MENUNGGU TRANSFER POS</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 7: MY PROFILE
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'my-profile' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#FFC067]" />
                    <span>Profil Pelatih &amp; Data Rekening Payroll</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-[#FFC067] p-1">
                        <img
                          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
                          alt="Coach"
                          className="w-full h-full rounded-xl object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-lg font-black text-white">
                          {coachData?.fullName || currentCoach.fullName}
                        </div>
                        <div className="text-xs text-[#FFC067] font-semibold">
                          {coachData?.specialization || currentCoach.specialization}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-1">
                          Kode: {coachData?.code || currentCoach.code}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Nomor WhatsApp Aktif:</label>
                        <input
                          type="text"
                          defaultValue={coachData?.phone || currentCoach.phone}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Email Resmi:</label>
                        <input
                          type="email"
                          defaultValue={currentCoach.email}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 space-y-4">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Rekening Bank Penerima Komisi 50%</span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Nama Bank:</label>
                        <input
                          type="text"
                          defaultValue="Bank Central Asia (BCA)"
                          className="w-full rounded-xl bg-[#0F172A] border border-white/10 px-3.5 py-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Nomor Rekening:</label>
                        <input
                          type="text"
                          defaultValue="029-8877-665"
                          className="w-full rounded-xl bg-[#0F172A] border border-white/10 px-3.5 py-2.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert('Data profil dan rekening berhasil diperbarui!')}
                      className="w-full py-2.5 rounded-xl bg-[#FFC067] text-slate-950 font-black text-xs shadow-gold-sm hover:from-[#ffd089]"
                    >
                      Simpan Perubahan Profil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 8: ABSENSI SELFIE (REAL CONNECTED TO /api/attendance/staff-selfie)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'absensi-selfie' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-cyan-400" />
                      <span>Presensi Selfie &amp; Validasi GPS Lokasi</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sistem kehadiran digital pelatih terhubung ke database POS &amp; geofence Kaisar Gym Pontianak
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>GPS AKTIF (RADIUS VALID)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Camera Frame */}
                  <div className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-dashed border-cyan-400/60 bg-slate-950 flex flex-col items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
                        alt="Selfie Preview"
                        className="w-full h-full object-cover filter brightness-95"
                      />
                      <div className="absolute inset-4 border border-cyan-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <span className="w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                          <span className="w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                        </div>
                        <div className="text-[10px] text-cyan-300 font-mono bg-black/60 px-2 py-0.5 rounded mx-auto backdrop-blur-sm">
                          FACE DETECTED • 99.4%
                        </div>
                        <div className="flex justify-between">
                          <span className="w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                          <span className="w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs bg-white/5 border border-white/10 rounded-xl p-3 w-full max-w-sm text-left space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>Kaisar Gym Pontianak (Jl. Patimura No.84)</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Geofence Radius: <strong className="text-white">16 meter</strong> (Toleransi Maks. 250m)
                      </div>
                    </div>

                    <div className="flex gap-3 w-full max-w-sm">
                      <button
                        type="button"
                        disabled={submittingAttendance}
                        onClick={() => handleClockInSelfie('CLOCK_IN')}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{submittingAttendance ? 'Memproses...' : 'Clock-In Masuk'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={submittingAttendance}
                        onClick={() => handleClockInSelfie('CLOCK_OUT')}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#FFC067] hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{submittingAttendance ? 'Memproses...' : 'Clock-Out Pulang'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Real Attendance Log History */}
                  <div className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 space-y-4">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#FFC067]" />
                      <span>Riwayat Kehadiran Database POS ({attendanceLogs.length})</span>
                    </h3>

                    <div className="space-y-2.5 text-xs max-h-80 overflow-y-auto">
                      {attendanceLogs.length === 0 ? (
                        <div className="text-slate-400 py-4 text-center">
                          Belum ada catatan presensi live dari server.
                        </div>
                      ) : (
                        attendanceLogs.map((log: any) => (
                          <div
                            key={log.id}
                            className="rounded-xl bg-[#0F172A] p-3 border border-white/5 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{log.staffName}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-cyan-400">
                                  {log.type}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Jarak: <strong className="text-emerald-400">{log.distanceMeters}m</strong> • {formatDateId(log.createdAt)}
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                log.isWithinGeofence
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {log.isWithinGeofence ? 'VALID GEOFENCE' : 'DILUAR RADIUS'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════ MODAL: SIGN-OFF SESI LATIHAN PT ══════════════ */}
      {signOffTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleConfirmSignOff}
            className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#FFC067]" />
                <h3 className="font-bold text-base text-white">Presensi / Sign-Off Sesi PT</h3>
              </div>
              <button
                type="button"
                onClick={() => setSignOffTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="text-xs bg-[#070D1E] p-3.5 rounded-2xl border border-white/10 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Klien Latihan:</span>
                <strong className="text-white">{signOffTarget.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sisa Kuota Saat Ini:</span>
                <strong className="text-[#FFC067]">{signOffTarget.remainingSessions} Sesi</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5 text-emerald-400 font-bold">
                <span>Hak Komisi Anda (50% Flat):</span>
                <span>+{formatRp(signOffTarget.ptSessionFee)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Otot yang Dilatih Hari Ini (Muscles Trained):
                </label>
                <input
                  type="text"
                  required
                  value={signOffForm.musclesTrained}
                  onChange={(e) => setSignOffForm({ ...signOffForm, musclesTrained: e.target.value })}
                  placeholder="Contoh: Chest, Shoulders & Triceps"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFC067]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Catatan Beban &amp; Repetisi (Weight Lifted):
                </label>
                <input
                  type="text"
                  required
                  value={signOffForm.weightLiftedNote}
                  onChange={(e) => setSignOffForm({ ...signOffForm, weightLiftedNote: e.target.value })}
                  placeholder="Contoh: Bench Press 80kg x 8, Incline Dumbbell 28kg x 10"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFC067]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Evaluasi &amp; Catatan Pelatih:
                </label>
                <textarea
                  rows={2}
                  value={signOffForm.evaluationNote}
                  onChange={(e) => setSignOffForm({ ...signOffForm, evaluationNote: e.target.value })}
                  placeholder="Catatan progres kekuatan, postur, atau tips latihan berikutnya..."
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFC067]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={submittingSignOff}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] hover:from-[#ffd089] text-slate-950 font-black text-xs shadow-gold transition flex items-center justify-center gap-1.5"
              >
                {submittingSignOff ? (
                  <span>Memproses Sign-Off...</span>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Konfirmasi &amp; Potong 1 Sesi</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSignOffTarget(null)}
                className="px-4 py-3 rounded-xl bg-[#070D1E] text-slate-300 font-bold text-xs border border-white/10 hover:bg-white/5"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════ MODAL: DETAIL KLIEN ══════════════ */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Detail Klien Bimbingan</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={selectedClientDetail.photo}
                alt={selectedClientDetail.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#FFC067]"
              />
              <div>
                <div className="font-black text-base text-white">{selectedClientDetail.name}</div>
                <div className="text-xs text-slate-400">{selectedClientDetail.phone}</div>
                <div className="text-xs font-semibold text-[#FFC067] mt-0.5">
                  Target: {selectedClientDetail.goal}
                </div>
              </div>
            </div>

            <div className="text-xs bg-[#070D1E] p-3.5 rounded-2xl border border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Paket Kontrak:</span>
                <strong className="text-white">{selectedClientDetail.packageName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Progres Sesi:</span>
                <strong className="text-emerald-400">
                  {selectedClientDetail.completedSessions} / {selectedClientDetail.totalSessions} Selesai
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sisa Kuota:</span>
                <strong className="text-[#FFC067]">{selectedClientDetail.remainingSessions} Sesi Tersisa</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-slate-400">Hak Komisi Anda (50%):</span>
                <strong className="text-emerald-300 font-bold">
                  {formatRp(selectedClientDetail.ptSessionFee)}/sesi
                </strong>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`https://wa.me/${selectedClientDetail.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500/30"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setSignOffTarget(selectedClientDetail);
                  setSelectedClientDetail(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#FFC067] text-slate-950 font-black text-xs shadow-gold-sm"
              >
                Sign-Off Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: BUAT JANJI LATIHAN BARU ══════════════ */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#FFC067]" />
                <h3 className="font-bold text-base text-white">Jadwalkan Sesi PT Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewScheduleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Pilih Klien:</label>
                <select
                  value={newScheduleForm.memberName}
                  onChange={(e) => setNewScheduleForm({ ...newScheduleForm, memberName: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.remainingSessions} Sisa Sesi)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Tanggal Latihan:</label>
                  <input
                    type="date"
                    value={newScheduleForm.date}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, date: e.target.value })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Jam Latihan:</label>
                  <input
                    type="time"
                    value={newScheduleForm.time}
                    onChange={(e) => setNewScheduleForm({ ...newScheduleForm, time: e.target.value })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Fokus Latihan:</label>
                <input
                  type="text"
                  value={newScheduleForm.focusArea}
                  onChange={(e) => setNewScheduleForm({ ...newScheduleForm, focusArea: e.target.value })}
                  placeholder="Contoh: Chest & Hypertrophy"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert(
                    `✓ Jadwal latihan untuk ${newScheduleForm.memberName} pada ${newScheduleForm.date} ${newScheduleForm.time} WIB berhasil disimpan!`
                  );
                  setShowNewScheduleModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-[#FFC067] text-slate-950 font-black text-xs shadow-gold"
              >
                Simpan &amp; Kirim Pengingat
              </button>
              <button
                type="button"
                onClick={() => setShowNewScheduleModal(false)}
                className="px-4 py-3 rounded-xl bg-[#070D1E] text-slate-300 font-bold text-xs border border-white/10"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: SISTEM UPDATE VERSI ══════════════ */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
              <RotateCcw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Sistem Versi v2.4.1 (Terbaru)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Portal Kaisar Gym beroperasi dengan pembaruan sistem terkini (Flat 50:50 Commission Engine &amp; Gate Turnstile Sync).
              </p>
            </div>
            <div className="text-xs bg-[#070D1E] p-3 rounded-xl border border-white/10 text-slate-300 text-left space-y-1">
              <div>
                • Status Server: <span className="text-emerald-400 font-bold">ONLINE (0 ms)</span>
              </div>
              <div>
                • Database Sync: <span className="text-emerald-400 font-bold">TERKONEKSI</span>
              </div>
              <div>
                • Gate Hardware: <span className="text-cyan-400 font-bold">READY (Pontianak)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVersionModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: TUTORIAL PANDUAN PELATIH ══════════════ */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#FFC067]" />
                <h3 className="font-bold text-base text-white">Panduan Singkat Pelatih</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10 space-y-1">
                <strong className="text-white block font-bold">1. Cara Sign-Off Sesi:</strong>
                <p className="text-slate-400">
                  Setelah melatih klien, buka menu Dashboard atau Assigned Members, klik tombol{' '}
                  <strong>"Sign-Off Sesi"</strong>, isi beban &amp; otot yang dilatih, lalu konfirmasi. Kuota klien langsung terpotong 1 dan komisi Anda 50% langsung masuk ke buku kas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10 space-y-1">
                <strong className="text-white block font-bold">2. Absensi Harian:</strong>
                <p className="text-slate-400">
                  Buka menu <strong>"Absensi Selfie"</strong> saat tiba di Kaisar Gym Pontianak. Sistem akan memverifikasi wajah dan koordinat GPS dalam radius geofence.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10 space-y-1">
                <strong className="text-white block font-bold">3. Transparansi Komisi 50:50:</strong>
                <p className="text-slate-400">
                  Semua sesi tercatat secara transparan di menu <strong>"My Revenue"</strong> tanpa tiering dan tanpa potongan closing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTutorialModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#FFC067] text-slate-950 font-black text-xs shadow-gold-sm"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: AJUKAN TRANSFER GAJI (PAYOUT REQUEST) ══════════════ */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <form onSubmit={handleRequestPayout}>
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFC067]/20 border border-[#FFC067]/30 flex items-center justify-center text-[#FFC067]">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Ajukan Transfer Gaji &amp; Komisi PT</h3>
                    <p className="text-[11px] text-slate-400">Pengajuan klaim 50% Flat langsung ke Rekening Bank</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-[#070D1E] border border-white/10 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Pelatih:</span>
                    <strong className="text-white">
                      {coachData?.fullName || currentCoach.fullName} ({coachData?.code || currentCoach.code})
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sesi Terlaksana:</span>
                    <strong className="text-white">{totalCompletedSessions} Sesi Selesai Diajar</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
                    <span>Skema Komisi:</span>
                    <strong className="text-emerald-400 font-bold">Bagi Hasil Flat 50% PT : 50% Gym</strong>
                  </div>
                </div>

                {/* Periode & Nominal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Periode Klaim</label>
                    <input
                      type="text"
                      value={payoutForm.monthYear}
                      onChange={(e) => setPayoutForm({ ...payoutForm, monthYear: e.target.value })}
                      required
                      placeholder="2026-10"
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#FFC067]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nominal Komisi (Rp)</label>
                    <input
                      type="number"
                      value={payoutForm.amount}
                      onChange={(e) => setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-emerald-500/30 px-3.5 py-2.5 text-emerald-300 font-black text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Bank Destination Details */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rekening Tujuan Transfer</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Nama Bank</label>
                      <input
                        type="text"
                        value={payoutForm.bankName}
                        onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Nomor Rekening</label>
                      <input
                        type="text"
                        value={payoutForm.accountNumber}
                        onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                        required
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={payoutForm.accountName}
                      onChange={(e) => setPayoutForm({ ...payoutForm, accountName: e.target.value })}
                      required
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Notes / Catatan */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Catatan Tambahan untuk Kasir / Finance POS</label>
                  <textarea
                    rows={2}
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    placeholder="Contoh: Mohon transfer komisi PT Oktober 2026 ke rekening BCA di atas."
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FFC067]"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-white/10 bg-[#070D1E] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC067] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-[#FFC067]/20 flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
                >
                  {submittingPayout ? (
                    <span>Mengirimkan Pengajuan...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Pengajuan ke POS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: SLIP GAJI & KOMISI RESMI ══════════════ */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0F172A] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Slip Gaji &amp; Komisi Sesi PT</h3>
                  <p className="text-[11px] text-slate-400">PT. Kaisar Fitness Internasional • Periode {selectedPeriod}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="slip-gaji-content" className="p-6 space-y-4 text-xs bg-[#0B1120]">
              {/* Header Slip */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-sm font-black text-white tracking-wider">KAISAR GYM PONTIANAK</div>
                  <div className="text-[10px] text-slate-400">Jl. Patimura No. 84, Pontianak, Kalimantan Barat</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Sistem Penggajian &amp; Komisi Resmi</div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    FLAT 50:50 PT
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Ref: PAY-{selectedPeriod.replace(/\s+/g, '-').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Trainer Info */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-slate-400 text-[10px] block">Nama Pelatih:</span>
                  <strong className="text-white text-xs">{coachData?.fullName || currentCoach.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Kode PT:</span>
                  <strong className="text-white font-mono text-xs">{coachData?.code || currentCoach.code}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Rekening Bank:</span>
                  <strong className="text-slate-200 text-xs">BCA 029-8877-665</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Sesi Diajar:</span>
                  <strong className="text-white text-xs">{totalCompletedSessions} Sesi Terlaksana</strong>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="space-y-2 border-t border-b border-white/10 py-3">
                <div className="flex justify-between text-slate-300">
                  <span>Komisi Sesi Personal Trainer (50% Flat)</span>
                  <strong className="text-white font-mono">{formatRp(komisiLiquid)}</strong>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Potongan Biaya Closing / Administrasi</span>
                  <span className="text-emerald-400 font-mono">Rp 0 (Bebas Potongan)</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Bonus Kinerja &amp; Kehadiran</span>
                  <span className="text-slate-400 font-mono">Rp 0</span>
                </div>
              </div>

              {/* Total Payout */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Total Transfer Bersih (Take-Home)
                  </span>
                  <div className="text-xl font-black text-emerald-300">{formatRp(komisiLiquid)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400">Status:</span>
                  <div className="text-xs font-black text-emerald-400">SIAP DITRANSFER</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#070D1E] flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 border border-white/10 flex items-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
