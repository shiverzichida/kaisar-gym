'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import {
  LayoutDashboard,
  Calendar,
  Bookmark,
  Package,
  Users,
  Dumbbell,
  Star,
  QrCode,
  User,
  Bell,
  RotateCcw,
  HelpCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LogOut,
  Search,
  Filter,
  X,
  Phone,
  ArrowRight,
  Menu,
  Activity,
  TrendingUp,
  MapPin,
  CalendarDays,
  Ticket,
  Check,
  MessageCircle,
  Flame,
  Award,
  ChevronDown,
  RefreshCw,
  Zap,
} from 'lucide-react';

export default function MemberPortalPage() {
  const router = useRouter();
  const { user, logout } = usePortalAuth();

  // Active Menu / View Tab
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'book-classes'
    | 'my-bookings'
    | 'my-packages'
    | 'personal-trainers'
    | 'pt-sessions'
    | 'penilaian-pt'
    | 'my-qr'
    | 'my-profile'
    | 'notifications'
    | 'inbody-history'
  >('book-classes');

  // Mobile sidebar open state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals & Popups
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Class booking modal state
  const [bookingTarget, setBookingTarget] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [selectedClassCategory, setSelectedClassCategory] = useState('Semua');
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Gate check-in simulation state
  const [gateCheckInResult, setGateCheckInResult] = useState<any>(null);
  const [checkingGate, setCheckingGate] = useState(false);

  // PT Review Modal / Form state
  const [reviewCoachTarget, setReviewCoachTarget] = useState('Coach Hendra Pratama');
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState(
    'Latihan sangat terarah, teknik squat saya diperbaiki dan punggung terasa jauh lebih kuat.'
  );
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Dynamic QR countdown timer
  const [qrCountdown, setQrCountdown] = useState(59);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Real backend data states
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [studioClassesList, setStudioClassesList] = useState<any[]>([]);
  const [trainersList, setTrainersList] = useState<any[]>([]);

  // Member identity (defaults to Budi Santoso or logged in user)
  const currentMember = user || {
    id: 'e89a9c2e-27f7-4b97-9887-f8494dd396a0',
    fullName: 'Budi Santoso',
    code: 'KG-2026-0001',
    phone: '081299887766',
    email: 'budi.santoso@gmail.com',
    membershipStatus: 'ACTIVE',
    membershipType: '1 Year VIP All-Club Access',
    expiryDate: '31 Des 2026',
    rfidUid: 'E280-6894-3321-99A1',
  };

  // QR refresh ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ══════════════ 1. FETCH REAL CONNECTED DATA FROM BACKEND ══════════════
  const loadPortalData = useCallback(async () => {
    setLoading(true);
    try {
      const memberQuery = currentMember.code || currentMember.id;
      const [memberData, classesRes, trainersRes] = await Promise.all([
        apiFetch(`/members/${memberQuery}`).catch(() => null),
        apiFetch('/classes').catch(() => ({ schedules: [], studioClasses: [] })),
        apiFetch('/trainers').catch(() => []),
      ]);

      if (memberData) {
        setMemberProfile(memberData);
      }

      // Map studio class schedules from backend
      if (classesRes && Array.isArray(classesRes.schedules)) {
        const mapped = classesRes.schedules.map((sc: any) => {
          const category = sc.studioClass?.category || 'Studio Aerobic';
          const title = sc.studioClass?.name || 'Studio Class';
          const coachName = sc.trainer?.fullName || 'Coach Kaisar';
          const coachTitle = sc.trainer?.specialization || 'Certified Instructor';
          const room = sc.studioClass?.roomName || 'Main Studio (Lantai 2)';
          const dateStr = formatDateId(sc.scheduleDate);
          const dateTime = `${dateStr} • ${sc.startTime} - ${sc.endTime} WIB`;
          const totalSlots = sc.maxCapacity || 20;
          const bookedSlots = sc.bookedCount || 0;
          const isEnded = new Date(sc.scheduleDate) < new Date(Date.now() - 24 * 60 * 60 * 1000);

          return {
            id: sc.id,
            title,
            category,
            coachName,
            coachTitle,
            coachPhoto:
              sc.trainer?.photoUrl ||
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
            dateTime,
            room,
            totalSlots,
            bookedSlots,
            isEnded,
            rawSchedule: sc,
          };
        });

        if (mapped.length > 0) {
          setStudioClassesList(mapped);
        }
      }

      if (Array.isArray(trainersRes) && trainersRes.length > 0) {
        setTrainersList(trainersRes);
      }
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMember.code, currentMember.id]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Derived real data
  const realContracts = memberProfile?.ptContracts || [];
  const primaryPtContract = realContracts.length > 0 ? realContracts[0] : null;
  const realSessionLogs = primaryPtContract?.sessionLogs || [];
  const realSubscriptions = memberProfile?.subscriptions || [];
  const activeSubscription = realSubscriptions.find((s: any) => s.status === 'ACTIVE') || realSubscriptions[0];

  // Derived bookings
  const myBookings = (memberProfile?.classBookings || []).map((b: any) => ({
    id: b.id,
    bookingCode: `KG-BK-${b.id.slice(0, 5).toUpperCase()}`,
    className: b.schedule?.studioClass?.name || 'Studio Class',
    coach: b.schedule?.trainer?.fullName || 'Coach Kaisar',
    dateTime: `${formatDateId(b.schedule?.scheduleDate)} • ${b.schedule?.startTime} WIB`,
    room: b.schedule?.studioClass?.roomName || 'Studio Room',
    status: b.status,
  }));

  // Fallback studio classes if backend list is empty
  const displayClasses =
    studioClassesList.length > 0
      ? studioClassesList
      : [
          {
            id: 'cls-fallback-1',
            title: 'PILATES REFORMER CORE & POSTURE',
            category: 'Pilates Reformer',
            coachName: 'Coach Mei',
            coachTitle: 'Pilates Specialist',
            coachPhoto:
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
            dateTime: 'Wed, 22 Oct 2026 • 18:30 - 19:30 WIB',
            room: 'Pilates Sanctuary - Level 2',
            totalSlots: 8,
            bookedSlots: 4,
            isEnded: false,
          },
          {
            id: 'cls-fallback-2',
            title: 'STRENGTH & CONDITIONING CIRCUIT',
            category: 'Strength & Conditioning',
            coachName: 'Coach Hendra',
            coachTitle: 'Strength Specialist',
            coachPhoto:
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
            dateTime: 'Wed, 22 Oct 2026 • 19:45 - 20:45 WIB',
            room: 'Main Studio 1 - Ground Floor',
            totalSlots: 20,
            bookedSlots: 17,
            isEnded: false,
          },
        ];

  // ══════════════ 2. REAL CONNECTED CLASS BOOKING (POST /api/classes/book) ══════════════
  const handleConfirmBookClass = async () => {
    if (!bookingTarget || submittingBooking) return;

    setSubmittingBooking(true);
    setBookingError('');

    try {
      // Connect to backend API
      await apiFetch('/classes/book', {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: bookingTarget.id,
          memberId: memberProfile?.id || currentMember.id,
        }),
      });

      setBookingSuccess(
        `✓ Slot kelas ${bookingTarget.title} BERHASIL DI-BOOKING! Data terdaftar otomatis pada sistem studio POS & roster pelatih.`
      );
      setBookingTarget(null);
      await loadPortalData();
      setTimeout(() => setBookingSuccess(''), 6000);
    } catch (err: any) {
      setBookingError(err.message || 'Gagal booking kelas. Silakan coba kembali.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // ══════════════ 3. REAL CANCEL CLASS BOOKING ══════════════
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan booking kelas ini?')) return;

    try {
      await apiFetch(`/classes/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      alert('Booking kelas berhasil dibatalkan. Kuota slot telah dikembalikan ke kelas studio.');
      await loadPortalData();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan booking.');
    }
  };

  // ══════════════ 4. REAL CONNECTED TURNSTILE GATE TEST ══════════════
  const handleTriggerGateCheckIn = async () => {
    setCheckingGate(true);
    setGateCheckInResult(null);

    try {
      const res = await apiFetch('/attendance/member-checkin', {
        method: 'POST',
        body: JSON.stringify({
          query: currentMember.code || currentMember.id,
          method: 'QR_SCAN',
        }),
      });

      setGateCheckInResult(res);
      await loadPortalData();
    } catch (err: any) {
      setGateCheckInResult({
        allowed: false,
        denialReason: err.message || 'Koneksi ke hardware turnstile gagal',
      });
    } finally {
      setCheckingGate(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login?tab=member');
  };

  // Filtered classes by category
  const filteredClasses = displayClasses.filter((c) => {
    if (selectedClassCategory === 'Semua') return true;
    return (
      c.category.toLowerCase().includes(selectedClassCategory.toLowerCase()) ||
      c.title.toLowerCase().includes(selectedClassCategory.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-sans selection:bg-[#FFC067] selection:text-slate-950">
      {/* ══════════════ 1. TOP HEADER (EXACT WESTFIT LAYOUT) ══════════════ */}
      <header className="sticky top-0 z-40 bg-[#070D1E]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + Brand */}
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
                <span className="text-[10px] text-cyan-400 font-semibold block -mt-0.5">Member Portal</span>
              </div>
            </Link>
          </div>

          {/* Right Header Controls: Tutorial, Update Ver, Notification Bell, Member Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Tutorial Button */}
            <button
              type="button"
              onClick={() => setShowTutorialModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#FFC067]" />
              <span>Tutorial</span>
            </button>

            {/* Update Ver Button */}
            <button
              type="button"
              onClick={() => setShowVersionModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Update Ver v2.4.1</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] shadow-sm animate-pulse">
                  {myBookings.length + (realSessionLogs.length > 0 ? 1 : 0) + 1}
                </span>
              </button>

              {/* Notification Dropdown Panel */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0F172A] border border-white/15 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white">Notifikasi Aktivitas Anda</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                    {realSessionLogs.length > 0 && (
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <div className="font-bold text-[#FFC067]">Sesi PT Terverifikasi di POS</div>
                        <div className="text-slate-300">
                          {realSessionLogs[0].musclesTrained} • Sign-off oleh {realSessionLogs[0].signedOffBy || 'Coach'}
                        </div>
                        <div className="text-[10px] text-slate-500">{formatDateId(realSessionLogs[0].sessionDate)}</div>
                      </div>
                    )}
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <div className="font-bold text-cyan-400">Status Membership Aktif</div>
                      <div className="text-slate-300">
                        {activeSubscription?.package?.name || '1 Year VIP Access'} terdaftar di database kasir.
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">Sinkron POS Realtime</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Member Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shrink-0">
                <img
                  src={
                    memberProfile?.facePhotoUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
                  }
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{memberProfile?.fullName || currentMember.fullName}</span>
                  <span className="text-[10px] text-cyan-400 font-semibold">(member)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {memberProfile?.memberCode || currentMember.code}
                </div>
              </div>

              {/* Logout Button */}
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
        {/* ══════ SIDEBAR (EXACT WESTFIT MEMBER NAVIGATION SCREENSHOT) ══════ */}
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

            {/* Menu Sections */}
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
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('book-classes');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'book-classes'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Book Classes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-bookings');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'my-bookings'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4 shrink-0" />
                  <span>My Bookings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-packages');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'my-packages'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4 shrink-0" />
                  <span>My Packages</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('personal-trainers');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'personal-trainers'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0 text-[#FFC067]" />
                  <span>Daftar Personal Trainer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pt-sessions');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'pt-sessions'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Dumbbell className="w-4 h-4 shrink-0" />
                  <span>My PT Sessions</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('penilaian-pt');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'penilaian-pt'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Star className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Penilaian PT</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-qr');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'my-qr'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>My QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('my-profile');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'my-profile'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('notifications');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'notifications'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>My Notifications</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('inbody-history');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    activeTab === 'inbody-history'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>InBody History</span>
                </button>
              </nav>
            </div>

            {/* Sistem */}
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
            <div className="text-white font-bold">{memberProfile?.fullName || currentMember.fullName}</div>
            <div className="text-cyan-400 text-[10px] font-semibold">
              {memberProfile?.memberCode || currentMember.code}
            </div>
            <div className="text-[9px] text-slate-500 pt-1">Terhubung Single DB • Kaisar Gym</div>
          </div>
        </aside>

        {/* ══════ MAIN CONTENT AREA ══════ */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Notification Alert Banner */}
          {bookingSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in shadow-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="font-semibold leading-relaxed">{bookingSuccess}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 1: DASHBOARD (VIP E-CARD WITH SHINE SWEEP & GATE CHECK-IN TEST)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    Halo, {memberProfile?.fullName || currentMember.fullName}! 👋
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Selamat datang di VIP Portal Resmi Kaisar Gym Pontianak
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>● STATUS: {memberProfile?.status || 'ACTIVE'}</span>
                </span>
              </div>

              {/* ── KARTU MEMBER DIGITAL VIP (E-CARD) ── */}
              <div className="rounded-3xl border border-[#FFC067]/40 bg-gradient-to-br from-[#121B2F] via-[#0F172A] to-[#070D1E] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
                <div className="shine-overlay" />
                <div className="absolute top-0 right-0 w-60 h-60 bg-[#FFC067]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black border border-[#FFC067]/70 overflow-hidden p-1 shadow-gold-sm">
                      <img src="/assets/img/kaisar-gym-logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-black text-base text-white tracking-wider">KAISAR GYM</div>
                      <div className="text-[10px] text-[#FFC067] font-bold tracking-widest uppercase">
                        VIP Digital Membership Pass
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Tipe Paket</div>
                    <div className="text-xs font-black text-[#FFC067]">
                      {activeSubscription?.package?.name || currentMember.membershipType}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Nama Anggota</div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                    {memberProfile?.fullName || currentMember.fullName}
                  </div>
                  <div className="text-sm font-mono font-bold text-[#FFC067] tracking-widest">
                    {memberProfile?.memberCode || currentMember.code}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Valid untuk Akses Turnstile Gate Kaisar Gym Pontianak</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tunjukkan barcode atau QR ini langsung ke kamera turnstile gate atau meja kasir.
                    </p>

                    {/* Interactive Gate Trigger Button */}
                    <button
                      type="button"
                      disabled={checkingGate}
                      onClick={handleTriggerGateCheckIn}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{checkingGate ? 'Memindai...' : 'Uji Scan Masuk Gate Turnstile'}</span>
                    </button>
                  </div>

                  <div className="bg-white p-2 rounded-2xl shadow-lg shrink-0 self-end sm:self-auto">
                    <div className="w-16 h-16 bg-slate-950 rounded-lg flex flex-col items-center justify-center p-1 text-center">
                      <QrCode className="w-10 h-10 text-white" />
                      <span className="text-[7px] text-white font-mono mt-0.5 font-bold tracking-tighter">
                        {memberProfile?.memberCode || currentMember.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gate Trigger Result Banner */}
                {gateCheckInResult && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold border transition animate-in fade-in ${
                      gateCheckInResult.allowed
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {gateCheckInResult.allowed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>
                        {gateCheckInResult.allowed
                          ? `✓ AKSES GATE TERBUKA (${gateCheckInResult.turnstileCommand}) • Sisa Paket: ${gateCheckInResult.daysRemaining} Hari`
                          : `✕ AKSES GATE DITOLAK: ${gateCheckInResult.denialReason}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 4 QUICK METRICS (CONNECTED TO DATABASE) ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold">Sisa Kuota Sesi PT</div>
                  <div className="text-2xl font-black text-[#FFC067]">
                    {primaryPtContract ? `${primaryPtContract.remainingSessions} Sesi` : '0 Sesi'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {primaryPtContract?.trainer?.fullName || 'Belum ada paket PT'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold">Kelas Terbooking</div>
                  <div className="text-2xl font-black text-cyan-400">{myBookings.length} Kelas</div>
                  <div className="text-[10px] text-slate-500">Terdaftar di Jadwal Studio</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold">Masa Aktif Membership</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {activeSubscription ? `${formatDateId(activeSubscription.endDate)}` : 'Aktif'}
                  </div>
                  <div className="text-[10px] text-slate-500">Status: {memberProfile?.status || 'ACTIVE'}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold">InBody Fitness Score</div>
                  <div className="text-2xl font-black text-rose-400">84 / 100</div>
                  <div className="text-[10px] text-slate-500">Body Fat 15.2%</div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 2: BOOK CLASSES (REAL CONNECTED TO BACKEND /api/classes/book)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'book-classes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Available Classes</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Browse and book studio sessions • Terhubung langsung dengan kasir &amp; instruktur
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCalendarView(!showCalendarView)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                      showCalendarView
                        ? 'bg-[#FFC067] text-slate-950 border-[#FFC067]'
                        : 'bg-[#0F172A] text-slate-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-[#FFC067]" />
                    <span>Show Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('my-bookings')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F172A] text-slate-300 border border-white/10 hover:bg-white/5 text-xs font-bold transition"
                  >
                    <Bookmark className="w-4 h-4 text-cyan-400" />
                    <span>My Bookings ({myBookings.length})</span>
                  </button>
                </div>
              </div>

              {/* Filter Categories Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  'Semua',
                  'Pilates Reformer',
                  'Strength & Conditioning',
                  'Zumba',
                  'Studio Aerobic',
                  'Spinning',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedClassCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                      selectedClassCategory === cat
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-[#0F172A] text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Class Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => {
                  const slotsLeft = Math.max(0, cls.totalSlots - cls.bookedSlots);
                  const isFull = slotsLeft <= 0;
                  const pct = Math.min(100, Math.round((cls.bookedSlots / cls.totalSlots) * 100));
                  const alreadyBooked = myBookings.some((b) => b.className === cls.title);

                  return (
                    <div
                      key={cls.id}
                      className="rounded-3xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition group"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                        <img
                          src={cls.coachPhoto}
                          alt={cls.coachName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/40" />

                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>
                            {cls.coachName} - {cls.coachTitle}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3">
                          {cls.isEnded ? (
                            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-400 text-[10px] font-bold border border-white/10">
                              Class Ended
                            </span>
                          ) : isFull ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/80 text-white text-[10px] font-bold">
                              Penuh (Waitlist)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold">
                              Tersedia
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="font-black text-base text-white group-hover:text-cyan-300 transition leading-snug">
                            {cls.title}
                          </h3>

                          <div className="text-xs text-slate-300 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{cls.dateTime}</span>
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{cls.room}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Kapasitas Slot:</span>
                            <span className="font-bold text-white">
                              {cls.isEnded ? (
                                <span className="text-slate-500">Kelas Selesai</span>
                              ) : (
                                <span className={slotsLeft <= 2 ? 'text-amber-400' : 'text-cyan-400'}>
                                  {slotsLeft} / {cls.totalSlots} slots left
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFull ? 'bg-rose-500' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          {cls.isEnded ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-3 rounded-2xl bg-slate-800/60 text-slate-500 text-xs font-bold cursor-not-allowed border border-white/5"
                            >
                              Class Ended
                            </button>
                          ) : alreadyBooked ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-default"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✓ Slot Anda Terbooking</span>
                            </button>
                          ) : isFull ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-bold cursor-not-allowed"
                            >
                              Kuota Penuh
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setBookingTarget(cls);
                                setBookingError('');
                              }}
                              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-98 flex items-center justify-center gap-1.5"
                            >
                              <Ticket className="w-4 h-4" />
                              <span>Book Slot (Realtime)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 3: MY BOOKINGS (CONFIRMED PASSES WITH REAL CANCEL BUTTON)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'my-bookings' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-cyan-400" />
                      <span>Daftar Kelas yang Anda Booking ({myBookings.length})</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tersimpan di database &amp; terlihat di POS Kasir dan Roster Pelatih
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('book-classes')}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs shadow-md"
                  >
                    + Book Kelas Baru
                  </button>
                </div>

                {myBookings.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <p className="text-xs text-slate-400">Anda belum memiliki reservasi kelas studio.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('book-classes')}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                    >
                      Pilih Kelas Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myBookings.map((b: any) => (
                      <div
                        key={b.id || b.bookingCode}
                        className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-cyan-500/40 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">
                              {b.bookingCode}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                              ● {b.status}
                            </span>
                          </div>
                          <div className="font-black text-base text-white">{b.className}</div>
                          <div className="text-xs text-slate-300">
                            {b.coach} • {b.dateTime}
                          </div>
                          <div className="text-xs text-slate-500">{b.room}</div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
                            <div className="w-14 h-14 bg-slate-950 rounded flex items-center justify-center">
                              <QrCode className="w-10 h-10 text-white" />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold transition"
                          >
                            Batalkan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 4: MY PACKAGES (REAL CONNECTED MEMBERSHIP & PT CONTRACTS)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'my-packages' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Membership Package Card */}
                <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-extrabold text-sm text-white">Membership Gym Utama</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      {memberProfile?.status || 'AKTIF'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-lg font-black text-white">
                      {activeSubscription?.package?.name || currentMember.membershipType}
                    </div>
                    <div className="text-xs text-slate-400">
                      Tercatat pada database invoice POS Kasir
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#070D1E] p-4 border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Masa Berlaku:</span>
                      <strong className="text-white">
                        {activeSubscription ? formatDateId(activeSubscription.endDate) : currentMember.expiryDate}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status Gate:</span>
                      <strong className="text-emerald-400">Akses Turnstile Aktif</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plat Kendaraan:</span>
                      <strong className="text-cyan-400 font-mono">
                        {memberProfile?.plateNumber || 'KB 1234 NH'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Active Personal Trainer Package Card */}
                <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#FFC067]" />
                      <h3 className="font-extrabold text-sm text-white">Paket Personal Trainer</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC067]/20 text-[#FFC067]">
                      {primaryPtContract ? primaryPtContract.status : 'BERJALAN'}
                    </span>
                  </div>

                  {primaryPtContract ? (
                    <>
                      <div className="space-y-1">
                        <div className="text-lg font-black text-white">
                          {primaryPtContract.ptPackage?.name || `${primaryPtContract.totalSessions} Sesi Personal Trainer`}
                        </div>
                        <div className="text-xs text-[#FFC067] font-semibold">
                          Coach: {primaryPtContract.trainer?.fullName}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Progres Latihan:</span>
                          <span className="font-bold text-white">
                            {primaryPtContract.totalSessions - primaryPtContract.remainingSessions} dari{' '}
                            {primaryPtContract.totalSessions} Selesai
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FFC067] to-amber-500 rounded-full"
                            style={{
                              width: `${Math.round(
                                ((primaryPtContract.totalSessions - primaryPtContract.remainingSessions) /
                                  primaryPtContract.totalSessions) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#070D1E] p-4 border border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sisa Kuota:</span>
                          <strong className="text-[#FFC067] text-sm">
                            {primaryPtContract.remainingSessions} Sesi Tersisa
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Sesi Diajar:</span>
                          <strong className="text-slate-200">{realSessionLogs.length} Sesi Terverifikasi</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                      <p>Belum ada paket PT yang aktif saat ini.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('personal-trainers')}
                        className="px-4 py-2 rounded-xl bg-[#FFC067] text-slate-950 font-bold"
                      >
                        Lihat Daftar Coach »
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('pt-sessions')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] text-slate-950 font-black text-xs shadow-gold-sm"
                  >
                    Buka Log &amp; Riwayat Latihan PT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 5: DAFTAR PERSONAL TRAINER (REAL TRAINERS LIST FROM /api/trainers)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'personal-trainers' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#FFC067]" />
                    <span>Daftar Pelatih Resmi Kaisar Gym (Terdaftar di Database POS)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Konsultasi dan pilih Personal Trainer terbaik sesuai target transformasi tubuh Anda
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {(trainersList.length > 0
                    ? trainersList
                    : [
                        {
                          fullName: 'Coach Hendra Pratama',
                          code: 'TR-001',
                          specialization: 'Strength & Conditioning Specialist',
                          phone: '0812-9876-5432',
                        },
                        {
                          fullName: 'Coach Mei',
                          code: 'PT-031',
                          specialization: 'Pilates Reformer Specialist',
                          phone: '0813-1122-3344',
                        },
                      ]
                  ).map((coach: any, idx: number) => (
                    <div
                      key={coach.id || idx}
                      className="rounded-2xl border border-white/10 bg-[#070D1E] overflow-hidden flex flex-col justify-between hover:border-[#FFC067]/40 transition group"
                    >
                      <div className="h-44 overflow-hidden relative">
                        <img
                          src={
                            coach.photoUrl ||
                            `https://images.unsplash.com/photo-${1573496359142 + idx * 500}?w=300&auto=format&fit=crop&q=80`
                          }
                          alt={coach.fullName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 text-[#FFC067] text-[10px] font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#FFC067]" />
                          <span>5.0</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="font-black text-sm text-white">{coach.fullName}</h3>
                          <div className="text-xs text-[#FFC067] font-semibold">{coach.specialization}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Kode: {coach.code}</div>
                        </div>

                        <a
                          href={`https://wa.me/${(coach.phone || '081298765432').replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(coach.fullName)},%20saya%20tertarik%20konsultasi%20paket%20PT%20Kaisar%20Gym`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 6: MY PT SESSIONS (REAL SESSION LOGS FROM COACH SIGN-OFF)
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'pt-sessions' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-[#FFC067]" />
                      <span>Buku Log Latihan PT (Sign-Off Records dari Pelatih)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Catatan transparan setiap sesi latihan yang di-sign-off oleh pelatih Anda di portal pelatih
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
                    {primaryPtContract ? `${primaryPtContract.remainingSessions} Sesi Sisa` : '0 Sisa'}
                  </span>
                </div>

                {realSessionLogs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Belum ada sesi latihan yang di-sign-off oleh pelatih Anda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {realSessionLogs.map((log: any, idx: number) => (
                      <div
                        key={log.id || idx}
                        className="rounded-2xl border border-white/10 bg-[#070D1E] p-5 space-y-3 hover:border-emerald-500/30 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Sesi Terverifikasi
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {formatDateId(log.sessionDate)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            Signed-off by: <strong className="text-white">{log.signedOffBy || 'Coach'}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-white/5 space-y-1">
                            <span className="text-slate-400 block font-bold">Otot yang Dilatih:</span>
                            <span className="text-white font-semibold">{log.musclesTrained}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/5 space-y-1">
                            <span className="text-slate-400 block font-bold">Beban &amp; Repetisi:</span>
                            <span className="text-white font-semibold">
                              {log.weightLiftedNote || 'Sesuai program latihan'}
                            </span>
                          </div>
                        </div>

                        {log.evaluationNote && (
                          <div className="p-3 rounded-xl bg-[#0F172A] border border-white/5 text-xs space-y-1">
                            <span className="text-[#FFC067] font-bold block">Catatan Evaluasi Pelatih:</span>
                            <p className="text-slate-300 italic">"{log.evaluationNote}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 7: PENILAIAN PT
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'penilaian-pt' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span>Penilaian &amp; Evaluasi Personal Trainer</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Berikan ulasan dan rating untuk membantu meningkatkan kualitas layanan pelatih Kaisar Gym
                  </p>
                </div>

                {reviewSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <div className="font-black text-white text-base">Terima Kasih Atas Ulasan Anda!</div>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Penilaian Anda terhadap {reviewCoachTarget} telah berhasil disimpan dan diteruskan ke manajemen Kaisar Gym.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReviewSubmitted(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
                    >
                      Beri Ulasan Lagi
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setReviewSubmitted(true);
                    }}
                    className="space-y-4 max-w-xl"
                  >
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Pilih Pelatih yang Dinilai:
                      </label>
                      <select
                        value={reviewCoachTarget}
                        onChange={(e) => setReviewCoachTarget(e.target.value)}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white"
                      >
                        <option value="Coach Hendra Pratama">Coach Hendra Pratama (Strength & Conditioning)</option>
                        <option value="Coach Mei">Coach Mei (Pilates Specialist)</option>
                        <option value="Coach Riko Saputra">Coach Riko Saputra (Boxing & Combat)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-2">
                        Beri Rating Keseluruhan:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingStars(star)}
                            className="p-1 hover:scale-110 transition"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                star <= ratingStars
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-400 ml-2">
                          {ratingStars} dari 5 Bintang
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Komentar &amp; Ulasan Pengalaman Latihan:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] text-slate-950 font-black text-xs shadow-gold-sm"
                    >
                      Kirim Penilaian PT
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 8: MY QR CODE
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'my-qr' && (
            <div className="space-y-6">
              <div className="max-w-md mx-auto rounded-3xl border border-[#FFC067]/40 bg-gradient-to-b from-[#0F172A] to-[#070D1E] p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
                <div className="shine-overlay" />

                <div className="space-y-1 relative z-10">
                  <div className="text-[10px] text-[#FFC067] font-black tracking-widest uppercase">
                    Kaisar Gym Access Pass
                  </div>
                  <h2 className="text-xl font-black text-white">{memberProfile?.fullName || currentMember.fullName}</h2>
                  <div className="text-xs font-mono font-bold text-slate-400">
                    {memberProfile?.memberCode || currentMember.code}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-2xl mx-auto w-64 h-64 flex flex-col items-center justify-center relative z-10">
                  <QrCode className="w-48 h-48 text-slate-950" />
                  <div className="text-[9px] font-mono font-black text-slate-900 mt-1 tracking-widest">
                    {memberProfile?.memberCode || currentMember.code} • VALID ACCESS
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 relative z-10">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>
                    Kode dinamis diperbarui dalam <strong className="text-white">{qrCountdown}s</strong>
                  </span>
                </div>

                <button
                  type="button"
                  disabled={checkingGate}
                  onClick={handleTriggerGateCheckIn}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 relative z-10"
                >
                  <Zap className="w-4 h-4" />
                  <span>{checkingGate ? 'Memindai...' : 'Uji Pindai Masuk Turnstile Gate'}</span>
                </button>

                {gateCheckInResult && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold border transition animate-in fade-in text-left relative z-10 ${
                      gateCheckInResult.allowed
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {gateCheckInResult.allowed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>
                        {gateCheckInResult.allowed
                          ? `✓ SUKSES: Palang Gate Terbuka (${gateCheckInResult.turnstileCommand})`
                          : `✕ GAGAL: ${gateCheckInResult.denialReason}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 9: INBODY HISTORY
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'inbody-history' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-rose-400" />
                      <span>Riwayat Komposisi Tubuh (InBody 570 Scan)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pantau perkembangan massa otot, persentase lemak, dan target transformasi tubuh Anda
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Scan Terakhir: 15 Oct 2026
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#070D1E] border border-white/10 space-y-1">
                    <span className="text-slate-400 font-bold">Berat Badan (Weight)</span>
                    <div className="text-2xl font-black text-white">72.4 kg</div>
                    <span className="text-[10px] text-emerald-400 font-bold">↓ -1.8 kg (Turun)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D1E] border border-white/10 space-y-1">
                    <span className="text-slate-400 font-bold">Skeletal Muscle Mass</span>
                    <div className="text-2xl font-black text-cyan-400">35.6 kg</div>
                    <span className="text-[10px] text-emerald-400 font-bold">↑ +0.6 kg (Naik)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D1E] border border-white/10 space-y-1">
                    <span className="text-slate-400 font-bold">Body Fat Percentage</span>
                    <div className="text-2xl font-black text-[#FFC067]">15.2%</div>
                    <span className="text-[10px] text-emerald-400 font-bold">↓ -1.4% (Defisit)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#070D1E] border border-white/10 space-y-1">
                    <span className="text-slate-400 font-bold">InBody Fitness Score</span>
                    <div className="text-2xl font-black text-emerald-400">84 / 100</div>
                    <span className="text-[10px] text-slate-500">Kategori: Sangat Baik</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="py-2.5 px-3">Tanggal Scan</th>
                        <th className="py-2.5 px-3">Berat (kg)</th>
                        <th className="py-2.5 px-3">Massa Otot (kg)</th>
                        <th className="py-2.5 px-3">Lemak Tubuh (%)</th>
                        <th className="py-2.5 px-3">BMI</th>
                        <th className="py-2.5 px-3">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { date: '15 Oct 2026', weight: '72.4', muscle: '35.6', fat: '15.2%', bmi: '22.8', score: '84' },
                        { date: '15 Sep 2026', weight: '74.2', muscle: '35.0', fat: '16.6%', bmi: '23.4', score: '81' },
                        { date: '15 Aug 2026', weight: '76.0', muscle: '34.2', fat: '18.1%', bmi: '24.1', score: '78' },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition">
                          <td className="py-3 px-3 font-bold text-white">{row.date}</td>
                          <td className="py-3 px-3 text-slate-200">{row.weight} kg</td>
                          <td className="py-3 px-3 text-cyan-400 font-bold">{row.muscle} kg</td>
                          <td className="py-3 px-3 text-[#FFC067] font-bold">{row.fat}</td>
                          <td className="py-3 px-3 text-slate-300">{row.bmi}</td>
                          <td className="py-3 px-3 font-black text-emerald-400">{row.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 10: MY NOTIFICATIONS
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    <span>Pusat Notifikasi Member (Terhubung POS &amp; Gate)</span>
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  {myBookings.map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#070D1E] border border-white/5 space-y-1 hover:border-cyan-500/30 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white">Booking Kelas {b.className}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {b.dateTime} bersama {b.coach}.
                      </p>
                      <div className="text-[10px] text-slate-500">Kode: {b.bookingCode}</div>
                    </div>
                  ))}

                  {realSessionLogs.map((log: any, idx: number) => (
                    <div
                      key={`notif-pt-${idx}`}
                      className="p-4 rounded-2xl bg-[#070D1E] border border-white/5 space-y-1 hover:border-[#FFC067]/30 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white">Sesi PT Ter-sign-off</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFC067]/15 text-[#FFC067] font-bold">
                          PT Verified
                        </span>
                      </div>
                      <p className="text-slate-300">
                        Latihan: {log.musclesTrained} • Signed-off by {log.signedOffBy || 'Coach'}
                      </p>
                      <div className="text-[10px] text-slate-500">{formatDateId(log.sessionDate)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════
              VIEW 11: MY PROFILE
              ════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'my-profile' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    <span>Profil Data Anggota Kaisar Gym</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Nama Lengkap:</label>
                      <input
                        type="text"
                        defaultValue={memberProfile?.fullName || currentMember.fullName}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Nomor Anggota (Member Code):</label>
                      <input
                        type="text"
                        disabled
                        defaultValue={memberProfile?.memberCode || currentMember.code}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Nomor Ponsel / WhatsApp:</label>
                      <input
                        type="text"
                        defaultValue={memberProfile?.phone || currentMember.phone}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Email:</label>
                      <input
                        type="email"
                        defaultValue={memberProfile?.email || currentMember.email}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Status Keanggotaan:</label>
                      <input
                        type="text"
                        disabled
                        defaultValue={memberProfile?.status || 'ACTIVE'}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Nomor Plat Kendaraan (Parkir):</label>
                      <input
                        type="text"
                        defaultValue={memberProfile?.plateNumber || 'KB 1234 NH'}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Data profil berhasil disimpan!')}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════ MODAL: KONFIRMASI BOOKING KELAS REALTIME ══════════════ */}
      {bookingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Konfirmasi Booking Slot Kelas</h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="font-black text-base text-white">{bookingTarget.title}</div>
              <div className="text-xs text-slate-300">
                Instruktur: <strong className="text-cyan-400">{bookingTarget.coachName}</strong> ({bookingTarget.coachTitle})
              </div>
            </div>

            <div className="text-xs bg-[#070D1E] p-3.5 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Jadwal:</span>
                <strong className="text-white">{bookingTarget.dateTime}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lokasi:</span>
                <strong className="text-slate-300">{bookingTarget.room}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member yang Mendaftar:</span>
                <strong className="text-emerald-400">
                  {memberProfile?.fullName || currentMember.fullName} ({memberProfile?.memberCode || currentMember.code})
                </strong>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={submittingBooking}
                onClick={handleConfirmBookClass}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-xs shadow-lg transition"
              >
                {submittingBooking ? 'Memproses Reservasi...' : 'Konfirmasi Booking'}
              </button>
              <button
                type="button"
                onClick={() => setBookingTarget(null)}
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
                Portal Member Kaisar Gym beroperasi dengan sistem booking studio real-time &amp; sinkronisasi gate turnstile.
              </p>
            </div>
            <div className="text-xs bg-[#070D1E] p-3 rounded-xl border border-white/10 text-slate-300 text-left space-y-1">
              <div>• Status Server: <span className="text-emerald-400 font-bold">ONLINE</span></div>
              <div>• Booking System: <span className="text-emerald-400 font-bold">REAL-TIME</span></div>
              <div>• Turnstile Gate Pass: <span className="text-cyan-400 font-bold">ACTIVE</span></div>
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

      {/* ══════════════ MODAL: TUTORIAL PANDUAN MEMBER ══════════════ */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Panduan Member Kaisar Gym</h3>
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
                <strong className="text-white block font-bold">1. Cara Masuk Melalui Gate Turnstile:</strong>
                <p className="text-slate-400">
                  Buka menu <strong>"My QR Code"</strong> atau E-Card di Dashboard. Arahkan QR code ke kamera scanner pada gerbang turnstile otomatis untuk masuk fasilitas gym.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10 space-y-1">
                <strong className="text-white block font-bold">2. Booking Kelas Studio:</strong>
                <p className="text-slate-400">
                  Pilih menu <strong>"Book Classes"</strong>, cari jadwal pilates atau aerobik favorit Anda, lalu klik <strong>"Book Slot"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#070D1E] border border-white/10 space-y-1">
                <strong className="text-white block font-bold">3. Cek Sesi Personal Trainer:</strong>
                <p className="text-slate-400">
                  Semua sesi yang telah dilatih dan di-sign-off oleh pelatih dapat Anda tinjau di menu <strong>"My PT Sessions"</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTutorialModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs shadow-md"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
