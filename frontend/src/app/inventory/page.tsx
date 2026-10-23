'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  History,
  TrendingDown,
  RefreshCw,
  Search,
  Plus,
} from 'lucide-react';

export default function InventoryPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const finRes = await apiFetch('/finance/overview');
      if (finRes?.products) {
        setProducts(finRes.products);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStockOpname = async (prd: any) => {
    const input = window.prompt(
      `Masukkan jumlah stok fisik aktual untuk "${prd.name}" (Stok sistem saat ini: ${prd.stock}):`,
      String(prd.stock),
    );
    if (input === null) return;
    try {
      await apiFetch(`/finance/products/${prd.id}/opname`, {
        method: 'POST',
        body: JSON.stringify({
          newStock: Number(input),
          notes: 'Penyesuaian Fisik Stock Opname',
          recordedBy: currentUser?.fullName || 'Admin Inventory',
        }),
      });
      showSuccess(`Stok "${prd.name}" berhasil disesuaikan ke ${input} pcs!`, 'Stock Opname Sukses');
      setFeedback(`[OK] Kartu Stok "${prd.name}" berhasil disesuaikan ke ${input} pcs.`);
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Stock Opname');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Master Produk Retail &amp; Stock Opname
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Inventory System
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Katalog suplemen whey protein, minuman berenergi, merchandise serta kartu penyesuaian stok fisik.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="rounded-2xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-xs font-semibold text-[#FFC067] flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback('')} className="underline text-[11px]">
              Tutup
            </button>
          </div>
        )}

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                Peringatan: Terdapat <strong>{lowStockCount} produk</strong> dengan sisa stok di bawah batas aman minimum! Segera lakukan pemesanan ulang (Restock).
              </span>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk, SKU..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070D1E] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFC067]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC067]"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="SUPPLEMENT">Suplemen &amp; Protein</option>
              <option value="BEVERAGE">Minuman Segar</option>
              <option value="MERCHANDISE">Apparel &amp; Gym Gear</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-xl">
          <TableScrollWrapper label="Scroll Stok Inventori">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1E] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">SKU / Kode</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga Beli (Modal)</th>
                  <th className="py-3 px-4 text-right">Harga Jual POS</th>
                  <th className="py-3 px-4 text-center">Stok Sistem</th>
                  <th className="py-3 px-4 text-center">Status Stok</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 font-mono text-[#FFC067] font-semibold">
                        {p.sku || 'SKU-001'}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3 px-4 text-slate-400">{p.category}</td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        {formatRp(p.purchaseCost || p.sellingPrice * 0.7)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#FFC067] font-mono">
                        {formatRp(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm text-white">
                        {p.stock} pcs
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOut ? 'HABIS' : isLow ? 'MENIPIS' : 'AMAN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleStockOpname(p)}
                          className="px-3 py-1.5 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-xs font-semibold text-[#FFC067] flex items-center gap-1.5 ml-auto transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Stock Opname</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScrollWrapper>
        </div>
      </div>
    </AppShell>
  );
}
