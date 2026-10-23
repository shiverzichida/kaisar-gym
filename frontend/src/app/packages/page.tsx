'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch, formatRp } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Package,
  CreditCard,
  Dumbbell,
  Tag,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  ShoppingCart,
  Layers,
} from 'lucide-react';

function PackagesContent() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'MEMBERSHIP' | 'PT_PACKAGE' | 'RETAIL_PRODUCT'>('MEMBERSHIP');

  useEffect(() => {
    if (tabParam === 'MEMBERSHIP' || tabParam === 'PT_PACKAGE' || tabParam === 'RETAIL_PRODUCT') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [catalog, setCatalog] = useState<{
    packages: any[];
    ptPackages: any[];
    products: any[];
  }>({
    packages: [],
    ptPackages: [],
    products: [],
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [pkgForm, setPkgForm] = useState({
    name: '',
    category: 'REGULAR',
    durationDays: 30,
    normalPrice: 350000,
    promoPrice: '',
    description: '',
  });

  const [ptForm, setPtForm] = useState({
    name: '',
    sessionCount: 12,
    validityDays: 60,
    price: 1800000,
  });

  const [prodForm, setProdForm] = useState({
    sku: '',
    name: '',
    category: 'SUPPLEMENT',
    costPrice: 20000,
    sellingPrice: 35000,
    stock: 50,
    minStockAlert: 10,
  });

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/pos/catalog');
      setCatalog({
        packages: data?.packages || [],
        ptPackages: data?.ptPackages || [],
        products: data?.products || [],
      });
    } catch (err: any) {
      showError(err.message || 'Gagal memuat katalog');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setModalMode('ADD');
    setEditingItem(null);
    if (activeTab === 'MEMBERSHIP') {
      setPkgForm({
        name: '',
        category: 'REGULAR',
        durationDays: 30,
        normalPrice: 350000,
        promoPrice: '',
        description: '',
      });
    } else if (activeTab === 'PT_PACKAGE') {
      setPtForm({
        name: '',
        sessionCount: 12,
        validityDays: 60,
        price: 1800000,
      });
    } else {
      setProdForm({
        sku: `PRD-${Date.now().toString().slice(-4)}`,
        name: '',
        category: 'SUPPLEMENT',
        costPrice: 20000,
        sellingPrice: 35000,
        stock: 50,
        minStockAlert: 10,
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setModalMode('EDIT');
    setEditingItem(item);
    if (activeTab === 'MEMBERSHIP') {
      setPkgForm({
        name: item.name || '',
        category: item.category || 'REGULAR',
        durationDays: item.durationDays || 30,
        normalPrice: item.normalPrice || 0,
        promoPrice: item.promoPrice ? String(item.promoPrice) : '',
        description: item.description || '',
      });
    } else if (activeTab === 'PT_PACKAGE') {
      setPtForm({
        name: item.name || '',
        sessionCount: item.sessionCount || 10,
        validityDays: item.validityDays || 30,
        price: item.price || 0,
      });
    } else {
      setProdForm({
        sku: item.sku || '',
        name: item.name || '',
        category: item.category || 'SUPPLEMENT',
        costPrice: item.costPrice || 0,
        sellingPrice: item.sellingPrice || 0,
        stock: item.stock || 0,
        minStockAlert: item.minStockAlert || 5,
      });
    }
    setIsModalOpen(true);
  };

  // Delete Item
  const handleDelete = async (item: any) => {
    const itemTypeName =
      activeTab === 'MEMBERSHIP'
        ? 'paket membership'
        : activeTab === 'PT_PACKAGE'
        ? 'paket PT'
        : 'produk/suplemen';

    if (!window.confirm(`Yakin ingin menghapus ${itemTypeName} "${item.name}"?`)) {
      return;
    }

    try {
      let endpoint = '';
      if (activeTab === 'MEMBERSHIP') {
        endpoint = `/pos/packages/${item.id}`;
      } else if (activeTab === 'PT_PACKAGE') {
        endpoint = `/pos/pt-packages/${item.id}`;
      } else {
        endpoint = `/pos/products/${item.id}`;
      }

      await apiFetch(endpoint, { method: 'DELETE' });
      showSuccess(`Berhasil menghapus ${item.name}`, 'Terhapus');
      loadCatalog();
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus item');
    }
  };

  // Submit Form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeTab === 'MEMBERSHIP') {
        const payload = {
          name: pkgForm.name,
          category: pkgForm.category,
          durationDays: Number(pkgForm.durationDays),
          normalPrice: Number(pkgForm.normalPrice),
          promoPrice: pkgForm.promoPrice ? Number(pkgForm.promoPrice) : null,
          description: pkgForm.description,
        };

        if (modalMode === 'ADD') {
          await apiFetch('/pos/packages', { method: 'POST', body: JSON.stringify(payload) });
          showSuccess(`Paket membership "${pkgForm.name}" berhasil ditambahkan!`, 'Sukses');
        } else {
          await apiFetch(`/pos/packages/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
          showSuccess(`Paket membership "${pkgForm.name}" berhasil diperbarui!`, 'Tersimpan');
        }
      } else if (activeTab === 'PT_PACKAGE') {
        const payload = {
          name: ptForm.name,
          sessionCount: Number(ptForm.sessionCount),
          validityDays: Number(ptForm.validityDays),
          price: Number(ptForm.price),
        };

        if (modalMode === 'ADD') {
          await apiFetch('/pos/pt-packages', { method: 'POST', body: JSON.stringify(payload) });
          showSuccess(`Paket PT "${ptForm.name}" berhasil ditambahkan!`, 'Sukses');
        } else {
          await apiFetch(`/pos/pt-packages/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
          showSuccess(`Paket PT "${ptForm.name}" berhasil diperbarui!`, 'Tersimpan');
        }
      } else {
        const payload = {
          sku: prodForm.sku,
          name: prodForm.name,
          category: prodForm.category,
          costPrice: Number(prodForm.costPrice),
          sellingPrice: Number(prodForm.sellingPrice),
          stock: Number(prodForm.stock),
          minStockAlert: Number(prodForm.minStockAlert),
        };

        if (modalMode === 'ADD') {
          await apiFetch('/pos/products', { method: 'POST', body: JSON.stringify(payload) });
          showSuccess(`Produk "${prodForm.name}" berhasil ditambahkan!`, 'Sukses');
        } else {
          await apiFetch(`/pos/products/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
          showSuccess(`Produk "${prodForm.name}" berhasil diperbarui!`, 'Tersimpan');
        }
      }

      setIsModalOpen(false);
      loadCatalog();
    } catch (err: any) {
      showError(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter current items
  const filteredPackages = catalog.packages.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPtPackages = catalog.ptPackages.filter(
    (pt) =>
      pt.name?.toLowerCase().includes(search.toLowerCase()) ||
      pt.code?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = catalog.products.filter(
    (prd) =>
      prd.name?.toLowerCase().includes(search.toLowerCase()) ||
      prd.sku?.toLowerCase().includes(search.toLowerCase()) ||
      prd.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell onRefresh={loadCatalog} loading={loading}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Katalog &amp; Pengaturan Paket
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFC067]/20 text-[#FFC067] border border-[#FFC067]/30">
                    Menu Kelola
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tambah paket membership baru, paket sesi Personal Trainer, suplemen &amp; retail, serta edit harga dan status.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/pos"
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#FFC067]" />
              <span>Buka Kasir POS</span>
            </Link>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-[#FFC067]/20 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>
                {activeTab === 'MEMBERSHIP'
                  ? '+ Tambah Paket Membership'
                  : activeTab === 'PT_PACKAGE'
                  ? '+ Tambah Paket PT'
                  : '+ Tambah Produk / Suplemen'}
              </span>
            </button>
          </div>
        </div>

        {/* ══════════════ 3 KATALOG TABS (Sesuai Screenshot Kasir) ══════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('MEMBERSHIP')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'MEMBERSHIP'
                  ? 'bg-[#FFC067] text-slate-950 shadow-md shadow-[#FFC067]/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Paket Membership ({catalog.packages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PT_PACKAGE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'PT_PACKAGE'
                  ? 'bg-[#FFC067] text-slate-950 shadow-md shadow-[#FFC067]/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Paket Sesi PT ({catalog.ptPackages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('RETAIL_PRODUCT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'RETAIL_PRODUCT'
                  ? 'bg-[#FFC067] text-slate-950 shadow-md shadow-[#FFC067]/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Suplemen, Minuman &amp; Layanan ({catalog.products.length})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kode..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#070D1E] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFC067]"
            />
          </div>
        </div>

        {/* ══════════════ TAB 1: PAKET MEMBERSHIP ══════════════ */}
        {activeTab === 'MEMBERSHIP' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FFC067]" />
                Daftar Paket Membership Kaisar Gym ({filteredPackages.length})
              </h3>
              <span className="text-xs text-slate-400">Dapat dibeli di kasir POS &amp; pendaftaran member</span>
            </div>

            <TableScrollWrapper label="Scroll Paket Membership">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070D1E] text-white font-black border-b border-white/10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Kode</th>
                    <th className="py-3 px-4">Nama Paket &amp; Deskripsi</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-center">Durasi</th>
                    <th className="py-3 px-3 text-right">Harga Normal</th>
                    <th className="py-3 px-3 text-right">Harga Promo</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Belum ada paket membership. Klik tombol <strong>+ Tambah Paket Membership</strong> untuk membuat paket baru.
                      </td>
                    </tr>
                  ) : (
                    filteredPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-3 font-mono font-bold text-[#FFC067] whitespace-nowrap">
                          {pkg.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{pkg.name}</div>
                          {pkg.description && (
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{pkg.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#070D1E] border border-white/10 text-slate-300 font-semibold text-[10px] uppercase">
                            {pkg.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-white">
                          {pkg.durationDays} Hari
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatRp(pkg.normalPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#FFC067] whitespace-nowrap">
                          {pkg.promoPrice ? formatRp(pkg.promoPrice) : '-'}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              pkg.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {pkg.isActive ? 'AKTIF' : 'NON-AKTIF'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/packages/${pkg.id}/edit?type=MEMBERSHIP`}
                              className="px-2.5 py-1.5 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-blue-400 hover:text-blue-300 font-semibold text-[11px] flex items-center gap-1 transition"
                              title="Edit Paket (Buka Layout)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(pkg)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] flex items-center gap-1 transition"
                              title="Hapus Paket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableScrollWrapper>
          </div>
        )}

        {/* ══════════════ TAB 2: PAKET SESI PERSONAL TRAINER (PT) ══════════════ */}
        {activeTab === 'PT_PACKAGE' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#FFC067]" />
                Daftar Paket Sesi PT ({filteredPtPackages.length})
              </h3>
              <span className="text-xs text-slate-400">Otomatis masuk ke modul PT Assignments setelah transaksi di kasir</span>
            </div>

            <TableScrollWrapper label="Scroll Paket PT">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070D1E] text-white font-black border-b border-white/10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Kode</th>
                    <th className="py-3 px-4">Nama Paket Sesi PT</th>
                    <th className="py-3 px-3 text-center">Jumlah Sesi</th>
                    <th className="py-3 px-3 text-center">Masa Berlaku</th>
                    <th className="py-3 px-3 text-right">Harga Paket</th>
                    <th className="py-3 px-3 text-right">Biaya / Sesi</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPtPackages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Belum ada paket sesi PT. Klik tombol <strong>+ Tambah Paket PT</strong> untuk membuat baru.
                      </td>
                    </tr>
                  ) : (
                    filteredPtPackages.map((pt) => {
                      const perSession = pt.sessionCount > 0 ? Math.round(pt.price / pt.sessionCount) : 0;
                      return (
                        <tr key={pt.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-3 font-mono font-bold text-[#FFC067] whitespace-nowrap">
                            {pt.code}
                          </td>
                          <td className="py-3 px-4 font-bold text-white text-sm">
                            {pt.name}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold">
                              {pt.sessionCount} Sesi
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-300">
                            {pt.validityDays} Hari
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-[#FFC067] whitespace-nowrap text-sm">
                            {formatRp(pt.price)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                            ~{formatRp(perSession)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                pt.isActive
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              {pt.isActive ? 'AKTIF' : 'NON-AKTIF'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/packages/${pt.id}/edit?type=PT_PACKAGE`}
                                className="px-2.5 py-1.5 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-blue-400 hover:text-blue-300 font-semibold text-[11px] flex items-center gap-1 transition"
                                title="Edit Paket PT (Buka Layout)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </Link>
                              <button
                                onClick={() => handleDelete(pt)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] flex items-center gap-1 transition"
                                title="Hapus Paket PT"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
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

        {/* ══════════════ TAB 3: SUPLEMEN, MINUMAN & LAYANAN ══════════════ */}
        {activeTab === 'RETAIL_PRODUCT' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#FFC067]" />
                Daftar Suplemen, Minuman &amp; Layanan ({filteredProducts.length})
              </h3>
              <span className="text-xs text-slate-400">Terintegrasi otomatis dengan sistem kasir POS &amp; inventori</span>
            </div>

            <TableScrollWrapper label="Scroll Produk Retail">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070D1E] text-white font-black border-b border-white/10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-4">Nama Produk / Layanan</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-right">Harga Modal</th>
                    <th className="py-3 px-3 text-right">Harga Jual</th>
                    <th className="py-3 px-3 text-center">Stok</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Belum ada data produk/suplemen. Klik <strong>+ Tambah Produk / Suplemen</strong> untuk menambahkan item baru.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prd) => (
                      <tr key={prd.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-3 font-mono font-bold text-[#FFC067] whitespace-nowrap">
                          {prd.sku}
                        </td>
                        <td className="py-3 px-4 font-bold text-white text-sm">
                          {prd.name}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#070D1E] border border-white/10 text-slate-300 font-semibold text-[10px] uppercase">
                            {prd.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                          {formatRp(prd.costPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-[#FFC067] whitespace-nowrap text-sm">
                          {formatRp(prd.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              prd.stock <= prd.minStockAlert
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {prd.stock} unit
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              prd.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {prd.isActive ? 'AKTIF' : 'NON-AKTIF'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/packages/${prd.id}/edit?type=PRODUCT`}
                              className="px-2.5 py-1.5 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-blue-400 hover:text-blue-300 font-semibold text-[11px] flex items-center gap-1 transition"
                              title="Edit Produk (Buka Layout)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(prd)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] flex items-center gap-1 transition"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableScrollWrapper>
          </div>
        )}

        {/* ══════════════ MODAL FORM TAMBAH / EDIT ══════════════ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FFC067]/15 text-[#FFC067]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      {modalMode === 'ADD' ? 'Tambah' : 'Edit'}{' '}
                      {activeTab === 'MEMBERSHIP'
                        ? 'Paket Membership'
                        : activeTab === 'PT_PACKAGE'
                        ? 'Paket Sesi PT'
                        : 'Produk / Suplemen'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Data otomatis terupdate ke sistem Kasir POS &amp; Pendaftaran Member
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Form Paket Membership */}
                {activeTab === 'MEMBERSHIP' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Nama Paket <span className="text-rose-400">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Reguler Gym 1 Bulan, Daily Pass, dll"
                        value={pkgForm.name}
                        onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFC067]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Kategori Paket <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={pkgForm.category}
                          onChange={(e) => setPkgForm({ ...pkgForm, category: e.target.value })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        >
                          <option value="REGULAR">REGULAR</option>
                          <option value="STUDENT">STUDENT (Pelajar/Mhs)</option>
                          <option value="DAY_PASS">DAY PASS (Harian)</option>
                          <option value="CORPORATE">CORPORATE (B2B)</option>
                          <option value="VIP">VIP</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Durasi Hari <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          placeholder="30"
                          value={pkgForm.durationDays}
                          onChange={(e) => setPkgForm({ ...pkgForm, durationDays: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Harga Normal (Rp) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={0}
                          placeholder="350000"
                          value={pkgForm.normalPrice}
                          onChange={(e) => setPkgForm({ ...pkgForm, normalPrice: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Harga Promo (Opsional)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="Kosongkan jika tidak ada promo"
                          value={pkgForm.promoPrice}
                          onChange={(e) => setPkgForm({ ...pkgForm, promoPrice: e.target.value })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Deskripsi / Fasilitas Paket</label>
                      <textarea
                        rows={2}
                        placeholder="Akses gym all-day, free locker & shower, program latihan..."
                        value={pkgForm.description}
                        onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFC067]"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Form Paket PT */}
                {activeTab === 'PT_PACKAGE' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Nama Paket PT <span className="text-rose-400">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Paket PT 12 Sesi (Muscle Building)"
                        value={ptForm.name}
                        onChange={(e) => setPtForm({ ...ptForm, name: e.target.value })}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFC067]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Jumlah Sesi Latihan <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          placeholder="12"
                          value={ptForm.sessionCount}
                          onChange={(e) => setPtForm({ ...ptForm, sessionCount: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Masa Berlaku (Hari) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          placeholder="60"
                          value={ptForm.validityDays}
                          onChange={(e) => setPtForm({ ...ptForm, validityDays: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Total Harga Paket (Rp) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min={0}
                        placeholder="1800000"
                        value={ptForm.price}
                        onChange={(e) => setPtForm({ ...ptForm, price: Number(e.target.value) })}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Rata-rata: ~{formatRp(ptForm.sessionCount > 0 ? Math.round(ptForm.price / ptForm.sessionCount) : 0)} / sesi
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Form Produk Retail / Suplemen */}
                {activeTab === 'RETAIL_PRODUCT' && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          SKU / Barcode <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="SUPP-001"
                          value={prodForm.sku}
                          onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Kategori <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={prodForm.category}
                          onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        >
                          <option value="SUPPLEMENT">SUPPLEMENT (Whey, Creatine)</option>
                          <option value="BEVERAGE">BEVERAGE (Air Mineral, Isotonik)</option>
                          <option value="HEALTH_FOOD">HEALTH FOOD (Protein Bar, Snack)</option>
                          <option value="SERVICE">SERVICE (Locker, Towel, Laundry)</option>
                          <option value="MERCHANDISE">MERCHANDISE (Jersey, Shaker)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Nama Produk / Minuman <span className="text-rose-400">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Whey Protein Sachet, Pocari Sweat 500ml"
                        value={prodForm.name}
                        onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                        className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Harga Modal (Rp) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={0}
                          placeholder="15000"
                          value={prodForm.costPrice}
                          onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Harga Jual Kasir (Rp) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={0}
                          placeholder="25000"
                          value={prodForm.sellingPrice}
                          onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Stok Awal <span className="text-rose-400">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={0}
                          placeholder="50"
                          value={prodForm.stock}
                          onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Batas Peringatan Habis (Min Alert)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="10"
                          value={prodForm.minStockAlert}
                          onChange={(e) => setProdForm({ ...prodForm, minStockAlert: Number(e.target.value) })}
                          className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-white focus:outline-none focus:border-[#FFC067]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? 'Menyimpan...' : modalMode === 'ADD' ? 'Simpan Item Baru' : 'Perbarui Item'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-xs text-slate-300 font-semibold transition"
                  >
                    Batal
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

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Katalog &amp; Paket...</div>}>
      <PackagesContent />
    </Suspense>
  );
}
