'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import OfficialReceiptModal from '@/components/OfficialReceiptModal';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  ShoppingCart,
  CreditCard,
  Printer,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Ban,
  Tag,
  UserCheck,
  Sparkles,
  Dumbbell,
  Settings,
  Edit3,
} from 'lucide-react';

export default function PosCashierView({
  catalog,
  members,
  currentUser,
  onRefresh,
}: {
  catalog: any;
  members: any[];
  currentUser: any;
  onRefresh: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'MEMBERSHIP' | 'PT_PACKAGE' | 'RETAIL_PRODUCT'>('MEMBERSHIP');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [salesPerson, setSalesPerson] = useState<string>('Kevin Sanjaya (Marketing)');
  const [cart, setCart] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [nonCashAmount, setNonCashAmount] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [message, setMessage] = useState<string>('');

  const addToCart = (item: any, itemType: 'MEMBERSHIP' | 'PT_PACKAGE' | 'RETAIL_PRODUCT') => {
    const unitPrice = itemType === 'MEMBERSHIP' ? item.promoPrice || item.normalPrice : itemType === 'PT_PACKAGE' ? item.price : item.sellingPrice;
    const defaultTrainerId = catalog?.trainers?.[0]?.id || '';

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.itemId === item.id && c.itemType === itemType);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      }
      return [
        ...prev,
        {
          itemType,
          itemId: item.id,
          itemName: item.name,
          qty: 1,
          unitPrice,
          trainerId: itemType === 'PT_PACKAGE' ? defaultTrainerId : undefined,
        },
      ];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c, i) => (i === idx ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  };

  const subtotal = cart.reduce((acc, c) => acc + c.qty * c.unitPrice, 0);

  let voucherDiscount = 0;
  const matchedVoucher = catalog?.vouchers?.find(
    (v: any) => v.code.toUpperCase() === promoCode.trim().toUpperCase(),
  );
  if (matchedVoucher && subtotal >= matchedVoucher.minPurchase) {
    voucherDiscount =
      matchedVoucher.discountType === 'PERCENTAGE'
        ? Math.round((subtotal * matchedVoucher.discountValue) / 100)
        : matchedVoucher.discountValue;
  }

  const totalDiscount = Number(manualDiscount || 0) + voucherDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await apiFetch('/pos/checkout', {
        method: 'POST',
        body: JSON.stringify({
          memberId: selectedMemberId || undefined,
          guestName: selectedMemberId ? undefined : guestName || 'Tamu Walk-In (Daily Pass)',
          cashierName: currentUser?.fullName || 'Rina Marlina (Front Desk)',
          salesPerson,
          items: cart,
          discountAmount: manualDiscount,
          promoCode: promoCode.trim() || undefined,
          paymentMethod,
          cashAmount: paymentMethod === 'CASH' ? cashAmount || grandTotal : cashAmount,
          nonCashAmount: paymentMethod === 'SPLIT' ? nonCashAmount : grandTotal,
          paymentRef,
        }),
      });
      const hadPtPackage = cart.some((c) => c.itemType === 'PT_PACKAGE');
      setLastReceipt(res);
      setCart([]);
      setPromoCode('');
      setManualDiscount(0);
      showSuccess(
        `Transaksi ${res.invoiceNumber} berhasil disimpan! (${formatRp(res.grandTotal)})`,
        hadPtPackage ? 'Paket PT Berhasil Ditugaskan!' : 'Pembayaran Berhasil'
      );
      if (hadPtPackage) {
        setMessage(`✓ Transaksi ${res.invoiceNumber} berhasil! Paket PT otomatis terdaftar di modul PT Assignments.`);
      } else {
        setMessage(`✓ Transaksi ${res.invoiceNumber} berhasil disimpan! Paket/Stok otomatis diperbarui.`);
      }
      onRefresh();
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses transaksi';
      showError(errMsg, 'Transaksi Gagal');
      setMessage(` Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async (trxId: string, invoiceNum: string) => {
    const reason = window.prompt(`Masukkan alasan VOID untuk nota ${invoiceNum}:`, 'Salah input metode pembayaran');
    if (!reason) return;
    try {
      await apiFetch(`/pos/transactions/${trxId}/void`, {
        method: 'POST',
        body: JSON.stringify({
          reason,
          voidedBy: currentUser?.fullName || 'Manager Operasional',
        }),
      });
      showSuccess(`Nota ${invoiceNum} telah di-VOID dan stok dikembalikan!`, 'Void Berhasil');
      setMessage(`⚠️   Nota ${invoiceNum} telah di-VOID dan stok dikembalikan.`);
      onRefresh();
    } catch (err: any) {
      showError(err.message || 'Gagal membatalkan nota', 'Void Gagal');
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-sm font-medium text-[#FFC067] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{message}</span>
            {lastReceipt?.items?.some((i: any) => i.itemType === 'PT_PACKAGE') && (
              <a
                href="/pt-assignments"
                className="px-2.5 py-1 rounded bg-[#FFC067] text-slate-950 font-bold text-xs hover:bg-[#ffca7d] transition"
              >
                Lihat di PT Assignments ➔
              </a>
            )}
          </div>
          <button onClick={() => setMessage('')} className="text-xs underline text-slate-400 hover:text-white">
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Katalog Item POS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 glass-card p-2 rounded-xl border border-white/[0.08]">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('MEMBERSHIP')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'MEMBERSHIP' ? 'bg-[#FFC067] text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Paket Membership ({catalog?.packages?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('PT_PACKAGE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'PT_PACKAGE' ? 'bg-[#FFC067] text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                <span>Paket Sesi PT ({catalog?.ptPackages?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('RETAIL_PRODUCT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'RETAIL_PRODUCT' ? 'bg-[#FFC067] text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Suplemen, Minuman &amp; Layanan ({catalog?.products?.length || 0})</span>
              </button>
            </div>

            <Link
              href={`/packages?tab=${activeTab}`}
              className="px-3 py-1.5 rounded-lg bg-[#FFC067]/15 hover:bg-[#FFC067]/25 text-[#FFC067] border border-[#FFC067]/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm ml-auto"
              title="Menu Kelola Paket: Tambah, Edit, Hapus Paket & Layanan"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Kelola (Tambah / Edit / Hapus)</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTab === 'MEMBERSHIP' &&
              catalog?.packages?.map((pkg: any) => (
                <div
                  key={pkg.id}
                  onClick={() => addToCart(pkg, 'MEMBERSHIP')}
                  className="cursor-pointer rounded-xl border border-white/[0.08] glass-card p-4 hover:border-[#FFC067]/60 hover:bg-[#121217] transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#FFC067]/20 text-[#FFC067]">
                      {pkg.category} • {pkg.durationDays} Hari
                    </span>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#FFC067]" />
                  </div>
                  <h4 className="mt-2 font-bold text-slate-100">{pkg.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-[#FFC067]">
                      {formatRp(pkg.promoPrice || pkg.normalPrice)}
                    </span>
                    {pkg.promoPrice && (
                      <span className="text-xs line-through text-slate-500">{formatRp(pkg.normalPrice)}</span>
                    )}
                  </div>
                </div>
              ))}

            {activeTab === 'PT_PACKAGE' &&
              catalog?.ptPackages?.map((pt: any) => (
                <div
                  key={pt.id}
                  onClick={() => addToCart(pt, 'PT_PACKAGE')}
                  className="cursor-pointer rounded-xl border border-white/[0.08] glass-card p-4 hover:border-[#FFC067]/60 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                      {pt.sessionCount} Sesi • Berlaku {pt.validityDays} Hari
                    </span>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#FFC067]" />
                  </div>
                  <h4 className="mt-2 font-bold text-slate-100">{pt.name}</h4>
                  <p className="mt-3 text-lg font-extrabold text-[#FFC067]">{formatRp(pt.price)}</p>
                </div>
              ))}

            {activeTab === 'RETAIL_PRODUCT' &&
              catalog?.products?.map((prd: any) => (
                <div
                  key={prd.id}
                  onClick={() => addToCart(prd, 'RETAIL_PRODUCT')}
                  className="cursor-pointer rounded-xl border border-white/[0.08] glass-card p-4 hover:border-[#FFC067]/60 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      {prd.category}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        prd.stock <= prd.minStockAlert ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      Stok: {prd.stock}
                    </span>
                  </div>
                  <h4 className="mt-2 font-bold text-slate-100">{prd.name}</h4>
                  <p className="mt-3 text-lg font-extrabold text-[#FFC067]">{formatRp(prd.sellingPrice)}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Keranjang Belanja & Pembayaran POS */}
        <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#FFC067]" />
              <h3 className="font-bold text-lg">Kasir Fast Checkout POS</h3>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">
              Shift Aktif
            </span>
          </div>

          {/* Pilih Member atau Tamu */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[#FFC067]" /> Pilih Member / Tamu Harian
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2 text-sm text-slate-100"
            >
              <option value="">-- Tamu Walk-In / Non-Member (Daily Pass) --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberCode} — {m.fullName} ({m.status})
                </option>
              ))}
            </select>

            {!selectedMemberId && (
              <input
                type="text"
                placeholder="Nama Tamu Walk-In (Opsional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2 text-sm"
              />
            )}
          </div>

          {/* Item Keranjang */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/[0.08] rounded-xl">
                Klik paket atau produk di sebelah kiri untuk memasukkan ke nota kasir
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/[0.08] bg-[#09090B]/70 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-100">{item.itemName}</p>
                      <p className="text-xs text-[#FFC067]">
                        {formatRp(item.unitPrice)} x {item.qty} = {formatRp(item.unitPrice * item.qty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold px-2">{item.qty}</span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.itemType === 'PT_PACKAGE' && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/[0.08]/80">
                      <span className="text-xs text-slate-400">Pelatih PT:</span>
                      <select
                        value={item.trainerId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCart((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, trainerId: val } : c)),
                          );
                        }}
                        className="flex-1 rounded bg-[#121217] border border-white/[0.12] px-2 py-1 text-xs"
                      >
                        {catalog?.trainers?.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} ({t.trainerType})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Promo, Diskon & Sales Attribution */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08]">
            <div>
              <label className="text-xs text-slate-400">Kode Voucher (KAISAR10)</label>
              <input
                type="text"
                placeholder="Ketik KAISAR10 / HEMAT50RB"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full mt-1 rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-1.5 text-xs uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Potongan Diskon (Rp)</label>
              <input
                type="number"
                value={manualDiscount}
                onChange={(e) => setManualDiscount(Number(e.target.value))}
                className="w-full mt-1 rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-400">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['CASH', 'QRIS', 'EDC_BCA', 'EDC_MANDIRI', 'SPLIT', 'PARTIAL'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(m);
                    if (m === 'SPLIT') {
                      const half = Math.round(grandTotal / 2);
                      setCashAmount(half);
                      setNonCashAmount(grandTotal - half);
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                    paymentMethod === m
                      ? 'border-[#FFC067] bg-[#FFC067]/20 text-[#FFC067]'
                      : 'border-white/[0.08] bg-[#09090B] text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>

            {paymentMethod === 'SPLIT' && (
              <div className="grid grid-cols-2 gap-2 bg-[#09090B] p-2.5 rounded-lg border border-white/[0.08]">
                <div>
                  <label className="text-[11px] text-slate-400">Nominal Tunai (Cash)</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCashAmount(v);
                      setNonCashAmount(Math.max(0, grandTotal - v));
                    }}
                    className="w-full mt-1 rounded border border-white/[0.12] bg-[#121217] px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Nominal EDC / QRIS</label>
                  <input
                    type="number"
                    value={nonCashAmount}
                    onChange={(e) => setNonCashAmount(Number(e.target.value))}
                    className="w-full mt-1 rounded border border-white/[0.12] bg-[#121217] px-2 py-1 text-xs"
                  />
                </div>
              </div>
            )}

            {paymentMethod !== 'CASH' && (
              <input
                type="text"
                placeholder="No. Referensi / Approval Code EDC / QRIS"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-1.5 text-xs"
              />
            )}
          </div>

          {/* Ringkasan Total */}
          <div className="rounded-xl bg-[#09090B] p-3.5 space-y-1.5 border border-white/[0.08]">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal</span>
              <span>{formatRp(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Total Diskon {matchedVoucher ? `(${matchedVoucher.code})` : ''}</span>
                <span>- {formatRp(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-[#FFC067] pt-1 border-t border-white/[0.08]">
              <span>GRAND TOTAL</span>
              <span>{formatRp(grandTotal)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0 || loading}
            onClick={handleCheckout}
            className="w-full rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] disabled:opacity-40 text-slate-950 font-extrabold py-3 text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#FFC067]/20"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Memproses Transaksi...' : `Bayar & Cetak Struk (${formatRp(grandTotal)})`}
          </button>
        </div>
      </div>

      {/* Modal Preview Struk Resmi Format A4 (dengan Logo Kaisar Gym & Cap Lunas) */}
      {lastReceipt && (
        <OfficialReceiptModal
          receipt={lastReceipt}
          onClose={() => setLastReceipt(null)}
        />
      )}

      {/* Riwayat Transaksi Kasir Terbaru & Tombol Void Manager */}
      <div className="rounded-2xl border border-white/[0.08] glass-card p-5">
        <h3 className="font-bold text-base mb-3 text-white">Riwayat Nota POS Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-white font-black uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-2">No. Invoice</th>
                <th className="py-2.5 px-2">Waktu</th>
                <th className="py-2.5 px-2">Member / Tamu</th>
                <th className="py-2.5 px-2">Item Dibeli</th>
                <th className="py-2.5 px-2">Metode</th>
                <th className="py-2.5 px-2">Total</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {catalog?.recentTransactions?.map((trx: any) => (
                <tr key={trx.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-mono font-bold text-[#FFC067]">{trx.invoiceNumber}</td>
                  <td className="py-2.5 text-slate-400">{formatDateId(trx.createdAt)}</td>
                  <td className="py-2.5 font-medium">{trx.member?.fullName || trx.guestName}</td>
                  <td className="py-2.5 text-slate-300">
                    {trx.items?.map((i: any) => `${i.itemName} (x${i.qty})`).join(', ')}
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">{trx.paymentMethod}</span>
                  </td>
                  <td className="py-2.5 font-bold">{formatRp(trx.grandTotal)}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        trx.paymentStatus === 'VOID'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {trx.paymentStatus}
                    </span>
                  </td>
                  <td className="py-2.5 text-right space-x-2">
                    <button
                      onClick={() => setLastReceipt(trx)}
                      className="text-sky-400 hover:underline"
                    >
                      Struk
                    </button>
                    {trx.paymentStatus !== 'VOID' && (
                      <button
                        onClick={() => handleVoid(trx.id, trx.invoiceNumber)}
                        className="text-rose-400 hover:underline"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


