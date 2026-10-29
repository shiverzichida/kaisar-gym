'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch, clearApiCache } from '@/lib/api';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Tag,
  Users,
  Building2,
  CalendarClock,
  ScanLine,
  Dumbbell,
  Award,
  CalendarCheck,
  Package,
  Banknote,
  BarChart3,
  MapPin,
  Smartphone,
  ShieldCheck,
  Menu,
  ChevronRight,
  Search,
  Zap,
  ChevronDown,
  Bell,
  RefreshCw,
  AlertCircle,
  ChevronsUpDown,
  Grid,
  Layout,
  CreditCard,
  UserPlus,
  Maximize2,
  Mail,
  Sun,
  Moon,
  X,
  LogIn,
  LogOut,
  Crown,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function AppShell({ children, onRefresh, loading = false }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, demoAccounts, switchRole, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowProfileMenu(false);
      setShowNotifications(false);
    };
    if (showProfileMenu || showNotifications) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu, showNotifications]);

  // Fetch low stock items for notification bell badge
  useEffect(() => {
    apiFetch('/finance/overview')
      .then((data) => {
        if (data?.products) {
          const low = data.products.filter((p: any) => p.stock <= p.minStockAlert);
          setLowStockProducts(low);
        }
      })
      .catch(() => {});
  }, []);

  // Handle role switch
  const handleRoleChange = async (username: string) => {
    const updated = await switchRole(username);
    if (updated) {
      showSuccess(`Beralih ke akun ${updated.fullName} (${updated.role})`, 'Role Diperbarui');
      if (updated.role === 'MEMBER' || updated.role === 'TRAINER') {
        router.push('/portals');
      } else if (updated.role === 'CASHIER') {
        router.push('/pos');
      }
      onRefresh?.();
    } else {
      showError('Gagal beralih akun role demo', 'Gagal Beralih');
    }
  };

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/executive', label: 'Executive HP View', icon: Crown },
        { href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
        {
          href: '/portals',
          label: 'Aplikasi (Portals)',
          icon: Grid,
          hasChevron: true,
        },
        {
          href: '/gate',
          label: 'Layouts & Gate',
          icon: Layout,
          hasChevron: true,
        },
      ],
    },
    {
      group: 'Sales & Transaksi',
      items: [
        { href: '/pos', label: 'Kasir POS', icon: ShoppingCart },
        { href: '/invoices', label: 'Invoices & Nota', icon: Receipt },
        { href: '/packages', label: 'Katalog & Paket', icon: Package },
      ],
    },
    {
      group: 'Members & CRM',
      items: [
        { href: '/members', label: 'Daftar Member', icon: Users },
        { href: '/groups', label: 'Corporate & Group', icon: Building2 },
      ],
    },
    {
      group: 'Fitness & Studio',
      items: [
        { href: '/classes', label: 'Jadwal Kelas', icon: Dumbbell },
        { href: '/trainers', label: 'Trainer & Komisi', icon: Award },
        { href: '/pt-assignments', label: 'PT Assignments', icon: CalendarCheck },
      ],
    },
    {
      group: 'Inventory & Finance',
      items: [
        { href: '/inventory', label: 'Produk & Opname', icon: Package },
        { href: '/shift', label: 'Shift & Petty Cash', icon: Banknote },
        { href: '/reports', label: 'Laporan & Audit', icon: BarChart3 },
        { href: '/gate', label: 'Turnstile & GPS', icon: ScanLine },
      ],
    },
  ];

  // Route breadcrumb helper
  const getBreadcrumbTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard Overview';
      case '/executive':
        return 'Mobile Executive Live Dashboard (Khusus HP Owner)';
      case '/pos':
        return 'Point of Sale (Kasir Cepat)';
      case '/invoices':
        return 'Invoices & Riwayat Nota';
      case '/packages':
        return 'Katalog & Pengaturan Paket (Membership, PT & Suplemen)';
      case '/members':
        return 'Daftar Member (CRM)';
      case '/members/create':
        return 'Tambah Member Baru';
      case '/groups':
        return 'Corporate & B2B Group';
      case '/classes':
        return 'Jadwal Kelas';
      case '/trainers':
        return 'Personal Trainer & Komisi';
      case '/pt-assignments':
        return 'PT Assignments (Penugasan Personal Trainer)';
      default:
        if (path.startsWith('/pt-assignments/') && path.endsWith('/edit')) {
          return 'Edit PT Assignment';
        }
        break;
    }
    switch (path) {
      case '/inventory':
        return 'Master Produk & Stock Opname';
      case '/shift':
        return 'Shift Kasir & Petty Cash';
      case '/gate':
        return 'Turnstile Gate & Presensi GPS';
      case '/reports':
        return 'Laporan Analitik & Audit Trail';
      case '/portals':
        return 'Self-Service Portal Member & PT';
      default:
        return pathname === '/' ? 'Dashboard Overview' : 'Overview';
    }
  };

  const currentTitle = getBreadcrumbTitle(pathname);

  // Close menus when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => {
      setShowQuickMenu(false);
      setShowNotifications(false);
    };
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#0A1128] text-slate-100 font-sans">
      {/* ══════════════ DESKTOP SIDEBAR ══════════════ */}
      {sidebarOpen && (
        <aside className="hidden lg:flex w-[245px] shrink-0 border-r border-white/10 bg-[#070D1E] flex-col justify-between sticky top-0 h-screen z-40 select-none">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-4 h-[64px] border-b border-white/10">
            <Link href="/" className="flex items-center gap-3 overflow-hidden text-left group w-full">
              <img
                src="/assets/img/kaisar-gym-logo-circle.png"
                alt="Kaisar Gym"
                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-md shadow-[#FFC067]/20 group-hover:scale-105 transition ring-1 ring-[#FFC067]/40"
              />
              <span className="flex flex-col flex-1 overflow-hidden">
                <span className="font-extrabold text-white text-[15px] leading-none tracking-tight block">
                  Kaisar<span className="text-[#FFC067]">GYM</span>
                </span>
                <span className="block text-[8px] font-extrabold tracking-[0.16em] mt-1 text-[#FFC067]">
                  ELITE MANAGEMENT
                </span>
              </span>
            </Link>
          </div>

          {/* Grouped Scrollable Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {grp.group}
                </div>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={`${grp.group}-${item.label}`}
                      href={item.href}
                      prefetch={true}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium transition-all ${
                        isActive
                          ? 'bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/40 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#FFC067]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.hasChevron && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
      )}

      {/* ══════════════ MOBILE DRAWER OVERLAY ══════════════ */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-[280px] max-w-full bg-[#070D1E] border-r border-white/10 flex flex-col justify-between h-full z-10">
            <div className="flex items-center justify-between px-4 h-[64px] border-b border-white/10">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <img
                  src="/assets/img/kaisar-gym-logo-circle.png"
                  alt="Kaisar Gym"
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-[#FFC067]/40"
                />
                <span className="font-extrabold text-white text-[15px]">
                  Kaisar<span className="text-[#FFC067]">GYM</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
              {navGroups.map((grp) => (
                <div key={grp.group} className="space-y-1">
                  <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {grp.group}
                  </div>
                  {grp.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={`m-${grp.group}-${item.label}`}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                          isActive
                            ? 'bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/40 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ══════════════ MAIN CONTENT CONTAINER ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header Bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-6 h-[64px] border-b border-white/10 bg-[#0A1128]/95 backdrop-blur-xl">
          {/* Toggle Sidebar Desktop */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 items-center justify-center transition"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Toggle Drawer Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 flex items-center justify-center transition"
            title="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb with Link */}
          <div className="flex items-center gap-2 text-xs pl-1">
            <Link href="/" className="font-semibold text-[#FFC067] hover:underline">
              Kaisar Gym
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-white">{currentTitle}</span>
          </div>

          <div className="flex-1" />

          {/* Global Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearch.trim()) {
                  router.push(`/members?q=${encodeURIComponent(globalSearch.trim())}`);
                }
              }}
              placeholder="Cari member, invoice, paket..."
              className="rounded-xl bg-[#0F172A] border border-white/10 focus:border-[#FFC067] pl-9 pr-12 py-1.5 w-64 text-xs text-white placeholder:text-slate-400 focus:outline-none"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] rounded bg-[#1E293B] text-slate-400 px-1.5 py-0.5 font-mono">
              1
            </kbd>
          </div>

          {/* Quick Actions Dropdown */}
          <div className="relative hidden md:block" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs transition shadow-md shadow-[#FFC067]/15"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Quick Actions</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card p-2 space-y-1 z-50 border border-white/10 bg-[#0F172A] shadow-2xl">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Aksi &amp; Pintasan
                </div>
                <Link
                  href="/executive"
                  onClick={() => setShowQuickMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-[#FFC067]/20 text-xs font-bold text-[#FFC067]"
                >
                  <Crown className="w-3.5 h-3.5 text-[#FFC067]" /> 📱 Mobile Executive HP View
                </Link>
                <Link
                  href="/pos"
                  onClick={() => setShowQuickMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFC067]/15 text-xs font-semibold text-slate-200 hover:text-[#FFC067]"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-[#FFC067]" /> Transaksi POS Baru
                </Link>
                <Link
                  href="/invoices"
                  onClick={() => setShowQuickMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFC067]/15 text-xs font-semibold text-slate-200 hover:text-[#FFC067]"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Lihat Invoices &amp; Nota
                </Link>
                <Link
                  href="/members/create"
                  onClick={() => setShowQuickMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFC067]/15 text-xs font-semibold text-slate-200 hover:text-[#FFC067]"
                >
                  <Users className="w-3.5 h-3.5 text-[#FFC067]" /> Tambah Member Baru
                </Link>
                <Link
                  href="/gate"
                  onClick={() => setShowQuickMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFC067]/15 text-xs font-semibold text-slate-200 hover:text-[#FFC067]"
                >
                  <ScanLine className="w-3.5 h-3.5 text-[#FFC067]" /> Turnstile Gate Check-In
                </Link>
                <Link
                  href="/classes"
                  onClick={() => setShowQuickMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#FFC067]/15 text-xs font-semibold text-slate-200 hover:text-[#FFC067]"
                >
                  <Dumbbell className="w-3.5 h-3.5 text-[#FFC067]" /> Jadwal Studio &amp; PT
                </Link>
              </div>
            )}
          </div>

          {/* Executive HP View Pill */}
          <Link
            href="/executive"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-[#FFC067]/10 hover:from-amber-500/30 hover:to-[#FFC067]/20 border border-[#FFC067]/40 text-[#FFC067] text-xs font-bold transition shadow-sm"
            title="Buka Mobile Executive Live Dashboard (Khusus Layar HP Owner)"
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Executive HP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </Link>

          {/* Branch Chip */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-semibold text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-[#FFC067]" />
            <span>Pontianak (Patimura)</span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="hidden lg:flex w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 items-center justify-center transition"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Direct Link to Portals */}
          <Link
            href="/portals"
            className="hidden sm:flex w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 items-center justify-center relative transition"
            title="Self-Service Portal"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Link>

          {/* Refresh Live Data */}
          <button
            type="button"
            onClick={() => {
              clearApiCache();
              onRefresh?.();
            }}
            className="w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 flex items-center justify-center transition"
            title="Segarkan Data"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFC067]" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 flex items-center justify-center transition"
            title={theme === 'dark' ? 'Ganti ke Mode Terang (Light)' : 'Ganti ke Mode Gelap (Dark)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FFC067] transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-200 flex items-center justify-center relative transition"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                9
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-card p-4 space-y-2.5 z-50 border border-white/10 bg-[#0F172A] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-extrabold text-white">Notifikasi Sistem</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-[#FFC067] hover:underline"
                  >
                    Tutup
                  </button>
                </div>
                {lowStockProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="text-xs p-2.5 rounded-xl bg-[#FFC067]/10 border border-[#FFC067]/25 text-[#FFC067]"
                  >
                    Stok Menipis: <strong>{p.name}</strong> (Sisa {p.stock} pcs)
                  </div>
                ))}
                <div className="text-xs p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  Member <strong>Budi Santoso (KG-2026-0001)</strong> status aktif (VIP + PT 12x)
                </div>
                <div className="text-xs p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300">
                  Shift Kasir Harian aktif atas nama <strong>{currentUser?.fullName}</strong>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Interactive Dropdown (Kanan Atas) */}
          <div className="relative pl-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 transition shadow-sm group"
              title="Klik untuk detail akun & ganti role"
            >
              <div className="relative">
                <img
                  src="https://dreamsgym.dreamstechnologies.com/tailwind/assets/img/avatars/avatar-19.jpg"
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#FFC067]/60 shadow-[0_0_8px_rgba(255,192,103,0.3)] group-hover:scale-105 transition"
                />
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0F172A] absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-[11px] font-bold text-white group-hover:text-[#FFC067] transition truncate max-w-[120px]">
                  {currentUser?.fullName || 'Kaisar Putra'}
                </span>
                <span className="text-[9px] font-semibold text-[#FFC067]">
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180 text-[#FFC067]' : ''
                }`}
              />
            </button>

            {/* Profile Detail Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0F172A] p-4 space-y-3 z-50 shadow-2xl animate-in fade-in zoom-in-95">
                {/* Header Profile Info */}
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="relative shrink-0">
                    <img
                      src="https://dreamsgym.dreamstechnologies.com/tailwind/assets/img/avatars/avatar-19.jpg"
                      alt="Profile"
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0F172A] absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-white truncate">
                      {currentUser?.fullName || 'Kaisar Putra'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      @{currentUser?.username || 'admin'} • Pontianak
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFC067]/15 border border-[#FFC067]/30 text-[#FFC067] text-[9.5px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{currentUser?.role || 'Super Admin'}</span>
                    </div>
                  </div>
                </div>

                {/* Account Context Details */}
                <div className="text-[11px] space-y-1.5 p-2.5 rounded-xl bg-[#070D1E] border border-white/5 text-slate-300">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cabang:</span>
                    <span className="font-semibold text-white">Pontianak (Patimura)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Turnstile Gate:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      Online (Face ID)
                    </span>
                  </div>
                </div>

                {/* Quick 7-Role Switcher */}
                {demoAccounts.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Ganti Akun Role:
                    </label>
                    <select
                      value={currentUser?.username || 'owner'}
                      onChange={(e) => {
                        handleRoleChange(e.target.value);
                        setShowProfileMenu(false);
                      }}
                      className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#FFC067]"
                    >
                      {demoAccounts.map((acc) => (
                        <option key={acc.id} value={acc.username} className="bg-[#070D1E] text-white">
                          [{acc.role}] {acc.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Actions: Login Page & Logout */}
                <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                  <Link
                    href="/login"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <LogIn className="w-4 h-4 text-[#FFC067]" />
                    <span>Halaman Login / Ganti Akun</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-5 space-y-5 min-w-0">{children}</main>
      </div>
    </div>
  );
}
