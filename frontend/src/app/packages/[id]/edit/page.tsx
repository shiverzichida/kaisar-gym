'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { apiFetch, formatRp } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Tag,
  Dumbbell,
  ShoppingBag,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Coins,
} from 'lucide-react';

function EditPackageContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') || 'MEMBERSHIP') as
    | 'MEMBERSHIP'
    | 'PT_PACKAGE'
    | 'PRODUCT';

  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [itemType, setItemType] = useState<'MEMBERSHIP' | 'PT_PACKAGE' | 'PRODUCT'>(initialType);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [pkgForm, setPkgForm] = useState({
    code: '',
    name: '',
    category: 'REGULAR',
    durationDays: 30,
    normalPrice: 0,
    promoPrice: '',
    description: '',
    isActive: true,
  });

  const [ptForm, setPtForm] = useState({
    code: '',
    name: '',
    sessionCount: 10,
    validityDays: 30,
    price: 0,
    isActive: true,
  });

  const [prodForm, setProdForm] = useState({
    sku: '',
    name: '',
    category: 'SUPPLEMENT',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStockAlert: 5,
    isActive: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let resolvedType = itemType;
      let data: any = null;

      // Try current resolved type first
      if (resolvedType === 'MEMBERSHIP') {
        try {
          data = await apiFetch(`/pos/packages/${id}`);
        } catch {
          data = null;
        }
      } else if (resolvedType === 'PT_PACKAGE') {
        try {
          data = await apiFetch(`/pos/pt-packages/${id}`);
        } catch {
          data = null;
        }
      } else {
        try {
          data = await apiFetch(`/pos/products/${id}`);
        } catch {
          data = null;
        }
      }

      // If not found, search through catalog
      if (!data) {
        const cat = await apiFetch<any>('/pos/catalog');
        const foundPkg = cat.packages?.find((p: any) => p.id === id);
        if (foundPkg) {
          resolvedType = 'MEMBERSHIP';
          data = foundPkg;
        } else {
          const foundPt = cat.ptPackages?.find((p: any) => p.id === id);
          if (foundPt) {
            resolvedType = 'PT_PACKAGE';
            data = foundPt;
          } else {
            const foundProd = cat.products?.find((p: any) => p.id === id);
            if (foundProd) {
              resolvedType = 'PRODUCT';
              data = foundProd;
            }
          }
        }
      }

      if (!data) {
        throw new Error('Item paket atau produk tidak ditemukan.');
      }

      setItemType(resolvedType);

      if (resolvedType === 'MEMBERSHIP') {
        setPkgForm({
          code: data.code || '',
          name: data.name || '',
          category: data.category || 'REGULAR',
          durationDays: data.durationDays || 30,
          normalPrice: data.normalPrice || 0,
          promoPrice: data.promoPrice ? String(data.promoPrice) : '',
          description: data.description || '',
          isActive: data.isActive ?? true,
        });
      } else if (resolvedType === 'PT_PACKAGE') {
        setPtForm({
          code: data.code || '',
          name: data.name || '',
          sessionCount: data.sessionCount || 10,
          validityDays: data.validityDays || 30,
          price: data.price || 0,
          isActive: data.isActive ?? true,
        });
      } else {
        setProdForm({
          sku: data.sku || '',
          name: data.name || '',
          category: data.category || 'SUPPLEMENT',
          costPrice: data.costPrice || 0,
          sellingPrice: data.sellingPrice || 0,
          stock: data.stock || 0,
          minStockAlert: data.minStockAlert || 5,
          isActive: data.isActive ?? true,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data item.');
      showError(err.message || 'Gagal memuat item', 'Error');
    } finally {
      setLoading(false);
    }
  }, [id, itemType, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || isSuccess) return;

    setSaving(true);
    setError('');
    try {
      if (itemType === 'MEMBERSHIP') {
        if (!pkgForm.name.trim()) throw new Error('Nama paket wajib diisi');
        const payload = {
          name: pkgForm.name,
          category: pkgForm.category,
          durationDays: Number(pkgForm.durationDays),
          normalPrice: Number(pkgForm.normalPrice),
          promoPrice: pkgForm.promoPrice ? Number(pkgForm.promoPrice) : null,
          description: pkgForm.description,
          isActive: pkgForm.isActive,
        };
        await apiFetch(`/pos/packages/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showSuccess(`Paket membership "${pkgForm.name}" berhasil diperbarui!`, 'Update Sukses');
      } else if (itemType === 'PT_PACKAGE') {
        if (!ptForm.name.trim()) throw new Error('Nama paket PT wajib diisi');
        const payload = {
          name: ptForm.name,
          sessionCount: Number(ptForm.sessionCount),
          validityDays: Number(ptForm.validityDays),
          price: Number(ptForm.price),
          isActive: ptForm.isActive,
        };
        await apiFetch(`/pos/pt-packages/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showSuccess(`Paket PT "${ptForm.name}" berhasil diperbarui!`, 'Update Sukses');
      } else {
        if (!prodForm.name.trim()) throw new Error('Nama produk wajib diisi');
        const payload = {
          sku: prodForm.sku,
          name: prodForm.name,
          category: prodForm.category,
          costPrice: Number(prodForm.costPrice),
          sellingPrice: Number(prodForm.sellingPrice),
          stock: Number(prodForm.stock),
          minStockAlert: Number(prodForm.minStockAlert),
          isActive: prodForm.isActive,
        };
        await apiFetch(`/pos/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showSuccess(`Produk retail "${prodForm.name}" berhasil diperbarui!`, 'Update Sukses');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/packages');
      }, 1500);
    } catch (err: any) {
      const msg = err.message || 'Gagal menyimpan perubahan item';
      setError(msg);
      showError(msg, 'Gagal Update');
      setSaving(false);
    }
  };

  const currentItemName =
    itemType === 'MEMBERSHIP'
      ? pkgForm.name
      : itemType === 'PT_PACKAGE'
      ? ptForm.name
      : prodForm.name;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/packages"
            className="p-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white transition shrink-0"
            title="Kembali ke Paket & Layanan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Edit {itemType === 'MEMBERSHIP' ? 'Paket Membership' : itemType === 'PT_PACKAGE' ? 'Paket Personal Trainer' : 'Produk Retail'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs">
                {itemType}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Layout formulir pengelolaan harga, masa berlaku, dan inventori POS Kaisar Gym.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/packages"
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

      {/* Success Alert */}
      {isSuccess && (
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 shadow-xl backdrop-blur-md animate-toast-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  ✓ Perubahan Berhasil Disimpan!
                </h4>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Item {currentItemName} berhasil diperbarui di katalog POS. Mengalihkan ke halaman paket...
                </p>
              </div>
            </div>
            <Link
              href="/packages"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
            >
              Lihat Katalog
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* MEMBERSHIP FORM */}
        {itemType === 'MEMBERSHIP' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" /> Pengaturan Paket Membership
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pkgForm.isActive}
                  onChange={(e) => setPkgForm({ ...pkgForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#070D1E] border-white/20"
                />
                <span className="text-xs font-bold text-slate-300">Aktif di Katalog POS</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Nama Paket <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                  placeholder="Contoh: 1 Month Unlimited Gym"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Kategori Paket</label>
                <select
                  value={pkgForm.category}
                  onChange={(e) => setPkgForm({ ...pkgForm, category: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="REGULAR">REGULAR (Umum)</option>
                  <option value="STUDENT">STUDENT (Pelajar / Mahasiswa)</option>
                  <option value="CORPORATE">CORPORATE (Instansi / Perusahaan)</option>
                  <option value="VIP">VIP (Eksklusif)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Durasi Masa Berlaku (Hari) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    required
                    type="number"
                    min="1"
                    value={pkgForm.durationDays}
                    onChange={(e) =>
                      setPkgForm({ ...pkgForm, durationDays: Number(e.target.value) })
                    }
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Harga Normal (Rp) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="1000"
                  value={pkgForm.normalPrice}
                  onChange={(e) =>
                    setPkgForm({ ...pkgForm, normalPrice: Number(e.target.value) })
                  }
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Harga Promo (Rp) <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={pkgForm.promoPrice}
                  onChange={(e) => setPkgForm({ ...pkgForm, promoPrice: e.target.value })}
                  placeholder="Kosongkan jika tanpa promo"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-[#FFC067] font-mono font-bold focus:outline-none focus:border-[#FFC067]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1.5">
                  Deskripsi &amp; Fasilitas Termasuk
                </label>
                <textarea
                  rows={3}
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  placeholder="Akses seluruh alat gym, ruang loker, sauna, dan free parking..."
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* PT PACKAGE FORM */}
        {itemType === 'PT_PACKAGE' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-purple-400" /> Pengaturan Paket Personal Trainer
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ptForm.isActive}
                  onChange={(e) => setPtForm({ ...ptForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-[#070D1E] border-white/20"
                />
                <span className="text-xs font-bold text-slate-300">Aktif di Katalog POS</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1.5">
                  Nama Paket PT <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={ptForm.name}
                  onChange={(e) => setPtForm({ ...ptForm, name: e.target.value })}
                  placeholder="Contoh: PT 12 Sesi Intensive Transformation"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Jumlah Sesi Latihan <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={ptForm.sessionCount}
                  onChange={(e) =>
                    setPtForm({ ...ptForm, sessionCount: Number(e.target.value) })
                  }
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Masa Berlaku Paket (Hari) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={ptForm.validityDays}
                  onChange={(e) =>
                    setPtForm({ ...ptForm, validityDays: Number(e.target.value) })
                  }
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1.5">
                  Harga Total Paket PT (Rp) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="5000"
                  value={ptForm.price}
                  onChange={(e) => setPtForm({ ...ptForm, price: Number(e.target.value) })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm text-[#FFC067] font-mono font-bold focus:outline-none focus:border-[#FFC067]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Rata-rata: {formatRp(Math.round(ptForm.price / (ptForm.sessionCount || 1)))} / sesi latihan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT FORM */}
        {itemType === 'PRODUCT' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" /> Pengaturan Produk &amp; Suplemen
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isActive}
                  onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-[#070D1E] border-white/20"
                />
                <span className="text-xs font-bold text-slate-300">Aktif di Kasir POS</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">SKU / Kode Barcode</label>
                <input
                  type="text"
                  value={prodForm.sku}
                  onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value.toUpperCase() })}
                  placeholder="PRD-001"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Kategori Produk</label>
                <select
                  value={prodForm.category}
                  onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="SUPPLEMENT">SUPPLEMENT (Whey Protein, Creatine, Pre-Workout)</option>
                  <option value="BEVERAGE">BEVERAGE (Air Mineral, Isotonik, RTD Protein)</option>
                  <option value="MERCHANDISE">MERCHANDISE (T-Shirt, Shaker Bottle, Strap)</option>
                  <option value="ACCESSORY">ACCESSORY (Handuk Gym, Kaos Kaki, Gloves)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1.5">
                  Nama Produk <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Contoh: Optimum Nutrition Gold Standard Whey 5lbs"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Harga Beli / Modal (Rp) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="500"
                  value={prodForm.costPrice}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, costPrice: Number(e.target.value) })
                  }
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Harga Jual Kasir POS (Rp) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="500"
                  value={prodForm.sellingPrice}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })
                  }
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Profit Margin: {formatRp(Math.max(0, prodForm.sellingPrice - prodForm.costPrice))}
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Stok Fisik di Sistem <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={prodForm.stock}
                  onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Peringatan Minimum Stok Alert
                </label>
                <input
                  type="number"
                  min="0"
                  value={prodForm.minStockAlert}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, minStockAlert: Number(e.target.value) })
                  }
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <Link
            href="/packages"
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
      </form>
    </div>
  );
}

export default function EditPackagePage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Formulir Edit Paket...</div>}>
        <EditPackageContent id={params.id} />
      </Suspense>
    </AppShell>
  );
}
