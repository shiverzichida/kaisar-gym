'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import OfficialReceiptModal from '@/components/OfficialReceiptModal';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Receipt,
  ShoppingCart,
  Printer,
  Ban,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  Eye,
  RefreshCw,
  Copy,
  ChevronDown,
  Check,
  Building2,
  Phone,
  User,
  ShieldAlert,
} from 'lucide-react';

export default function InvoicesPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [voidModalTrx, setVoidModalTrx] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('Kesalahan input nominal / duplikat transaksi');
  const [voidPin, setVoidPin] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/pos/catalog');
      if (data?.recentTransactions) {
        setTransactions(data.recentTransactions);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCopy = (invoiceNum: string) => {
    navigator.clipboard.writeText(invoiceNum);
    setCopiedInvoice(invoiceNum);
    showSuccess(`Nomor faktur ${invoiceNum} disalin ke clipboard!`, 'Tersalin');
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidModalTrx) return;
    if (voidPin !== '1234' && currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'Super Admin' && currentUser?.role !== 'OPS_MANAGER') {
      showError('PIN Otorisasi Supervisor salah (Default demo PIN: 1234)', 'Otorisasi Gagal');
      return;
    }

    setVoidLoading(true);
    try {
      await apiFetch(`/pos/transactions/${voidModalTrx.id}/void`, {
        method: 'POST',
        body: JSON.stringify({
          reason: voidReason,
          voidedBy: `${currentUser?.fullName || 'Manager'} (${currentUser?.role || 'Admin'})`,
        }),
      });
      showSuccess(`Nota ${voidModalTrx.invoiceNumber} berhasil di-VOID & stok barang dikembalikan!`, 'Void Berhasil');
      setVoidModalTrx(null);
      setVoidPin('');
      loadInvoices();
    } catch (err: any) {
      showError(err.message || 'Gagal membatalkan nota', 'Void Gagal');
    } finally {
      setVoidLoading(false);
    }
  };

  const handleSendWhatsApp = (trx: any) => {
    const phone = trx.member?.phone || '6281299887766';
    const text = encodeURIComponent(
      `Halo ${trx.member?.fullName || trx.guestName},\nTerima kasih telah bertransaksi di *Kaisar Gym*!\n\nNo. Invoice: *${trx.invoiceNumber}*\nTotal Bayar: *${formatRp(trx.grandTotal)}*\nStatus: *LUNAS*\n\nSimpan bukti nota digital ini sebagai referensi membership/layanan Anda.\nSalam sehat,\n*Kaisar Gym Management*`,
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${text}`, '_blank');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((trx) => {
    const matchSearch =
      trx.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      trx.member?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      trx.guestName?.toLowerCase().includes(search.toLowerCase()) ||
      trx.cashierName?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || trx.paymentStatus === statusFilter;
    const matchMethod = methodFilter === 'ALL' || trx.paymentMethod === methodFilter;

    return matchSearch && matchStatus && matchMethod;
  });

  // Calculate KPIs
  const totalOmzetPaid = transactions
    .filter((t) => t.paymentStatus === 'PAID')
    .reduce((sum, t) => sum + Number(t.grandTotal || 0), 0);

  const totalTrxCount = transactions.length;
  const totalPaidCount = transactions.filter((t) => t.paymentStatus === 'PAID').length;
  const totalVoidCount = transactions.filter((t) => t.paymentStatus === 'VOID').length;

  return (
    <AppShell onRefresh={loadInvoices} loading={loading}>
      <div className="space-y-6">
        {/* Top Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Invoices &amp; Riwayat Nota Penjualan
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Real-Time
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar seluruh nota transaksi kasir POS, bukti pembayaran struk resmi format A4 dengan cap Lunas, void nota &amp; split-bill.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadInvoices}
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FFC067]' : ''}`} />
              <span>Segarkan</span>
            </button>
            <Link
              href="/pos"
              className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-[#FFC067]/20 transition"
            >
              <ShoppingCart className="w-4 h-4 fill-black" />
              <span>+ Kasir POS Baru</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="rounded-2xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-xs font-semibold text-[#FFC067] flex items-center justify-between animate-fadeIn">
            <span>{feedback}</span>
            <button onClick={() => setFeedback('')} className="underline text-[11px]">
              Tutup
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs font-semibold text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadInvoices} className="underline text-[11px]">
              Coba Lagi
            </button>
          </div>
        )}

        {/* ══════════════ 4 KPI METRIC CARDS ══════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Total Omzet Lunas</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-white">{formatRp(totalOmzetPaid)}</div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Transaksi Sah Terbayar
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Total Nota Terbit</span>
              <div className="p-2 rounded-xl bg-[#FFC067]/15 text-[#FFC067]">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-white">{totalTrxCount} Nota</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {totalPaidCount} Lunas • {totalVoidCount} Void
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Metode Pembayaran</span>
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>QRIS Dinamis</span>
                <span className="text-slate-500">•</span>
                <span>Tunai</span>
                <span className="text-slate-500">•</span>
                <span>EDC</span>
              </div>
              <div className="text-[11px] text-sky-400 font-semibold mt-1">
                Multi-Channel Settlement Aktif
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Status Pembatalan (Void)</span>
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-rose-400">{totalVoidCount} Nota</div>
              <div className="text-[11px] text-slate-400 mt-1">Dengan Supervisor Security Log</div>
            </div>
          </div>
        </div>

        {/* ══════════════ SEARCH & FILTER BAR ══════════════ */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. invoice, nama member/tamu..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070D1E] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFC067]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC067]"
              >
                <option value="ALL">Semua Status</option>
                <option value="PAID">LUNAS (PAID)</option>
                <option value="VOID">BATAL (VOID)</option>
                <option value="PARTIAL">DP / CICILAN</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 hidden sm:inline">Metode:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC067]"
              >
                <option value="ALL">Semua Metode</option>
                <option value="CASH">Tunai (Cash)</option>
                <option value="QRIS">QRIS Dinamis</option>
                <option value="EDC_BCA">EDC / Kartu Debit BCA</option>
                <option value="EDC_MANDIRI">EDC Mandiri</option>
                <option value="SPLIT">Split Bill (Tunai + Non-Tunai)</option>
                <option value="TRANSFER">Transfer Bank</option>
              </select>
            </div>
          </div>
        </div>

        {/* ══════════════ INVOICES TABLE ══════════════ */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#FFC067]" />
              Daftar Invoices ({filteredTransactions.length} dari {transactions.length})
            </h3>
            <span className="text-xs text-slate-400">Format Resmi Nota Pajak &amp; Kasir</span>
          </div>

          <TableScrollWrapper label="Scroll Kolom Invoice">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1E] text-white font-black border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">No. Invoice</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Waktu</th>
                  <th className="py-2.5 px-2">Pelanggan</th>
                  <th className="py-2.5 px-2">Item Transaksi</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Metode Bayar</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Kasir</th>
                  <th className="py-2.5 px-2 text-right whitespace-nowrap">Total Tagihan</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      Tidak ada data invoice yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx) => {
                    const isPaid = trx.paymentStatus === 'PAID';
                    const isVoid = trx.paymentStatus === 'VOID';

                    return (
                      <tr key={trx.id} className="hover:bg-white/[0.02] transition">
                        {/* No Invoice */}
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#FFC067] text-xs">
                              {trx.invoiceNumber}
                            </span>
                            <button
                              onClick={() => handleCopy(trx.invoiceNumber)}
                              className="text-slate-500 hover:text-white transition p-0.5"
                              title="Salin No. Invoice"
                            >
                              {copiedInvoice === trx.invoiceNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Waktu */}
                        <td className="py-2.5 px-2 whitespace-nowrap text-slate-400 text-[11px]">
                          {formatDateId(trx.createdAt)}
                        </td>

                        {/* Pelanggan */}
                        <td className="py-2.5 px-2 max-w-[130px]">
                          <div className="font-semibold text-white truncate" title={trx.member?.fullName || trx.guestName || 'Tamu Walk-In'}>
                            {trx.member?.fullName || trx.guestName || 'Tamu Walk-In'}
                          </div>
                          {trx.member && (
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {trx.member.code}
                            </div>
                          )}
                        </td>

                        {/* Item Transaksi */}
                        <td className="py-2.5 px-2 max-w-[170px]">
                          <div
                            className="text-slate-300 truncate"
                            title={trx.items?.map((item: any) => `${item.itemName} (x${item.qty})`).join(', ') || '-'}
                          >
                            {trx.items?.map((item: any) => `${item.itemName} (x${item.qty})`).join(', ') || '-'}
                          </div>
                        </td>

                        {/* Metode Bayar */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg bg-[#070D1E] border border-white/10 text-slate-200 font-semibold text-[10px]">
                            {trx.paymentMethod}
                          </span>
                        </td>

                        {/* Kasir */}
                        <td className="py-2.5 px-2 whitespace-nowrap text-slate-400 text-[11px]">
                          {trx.cashierName || 'Kasir 1'}
                        </td>

                        {/* Total Tagihan */}
                        <td className="py-2.5 px-2 whitespace-nowrap text-right font-extrabold text-white text-xs">
                          {formatRp(trx.grandTotal)}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 whitespace-nowrap text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isVoid
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isPaid && <CheckCircle2 className="w-3 h-3" />}
                            {isVoid && <Ban className="w-3 h-3" />}
                            {trx.paymentStatus}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-2.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Tombol Cetak Struk */}
                            <button
                              onClick={() => setSelectedReceipt(trx)}
                              className="px-2 py-1 rounded-lg bg-[#FFC067]/15 hover:bg-[#FFC067]/25 border border-[#FFC067]/40 text-[#FFC067] font-bold text-[11px] flex items-center gap-1 transition"
                              title="Lihat & Cetak Struk Resmi Format A4"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Struk</span>
                            </button>

                            {/* Tombol Detail Nota */}
                            <button
                              onClick={() => setSelectedDetail(trx)}
                              className="px-2 py-1 rounded-lg bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white font-semibold text-[11px] flex items-center gap-1 transition"
                              title="Lihat Detail Item"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Detail</span>
                            </button>

                            {/* Tombol Kirim WA */}
                            <button
                              onClick={() => handleSendWhatsApp(trx)}
                              className="p-1.5 rounded-lg bg-[#070D1E] hover:bg-emerald-950/40 border border-white/10 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 transition"
                              title="Kirim Struk via WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Void */}
                            {!isVoid && (
                              <button
                                onClick={() => setVoidModalTrx(trx)}
                                className="px-1.5 py-1 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-[11px] flex items-center gap-1 transition"
                                title="Void / Batalkan Transaksi"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Void</span>
                              </button>
                            )}
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

        {/* ══════════════ MODAL CETAK STRUK RESMI SETENGAH LEMBAR A4 (DENGAN LOGO & STEMPEL LUNAS) ══════════════ */}
        {selectedReceipt && (
          <OfficialReceiptModal
            receipt={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}

        {/* ══════════════ MODAL DETAIL NOTA LENGKAP ══════════════ */}
        {selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#FFC067]" />
                    Detail Nota: {selectedDetail.invoiceNumber}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Dicatat pada {new Date(selectedDetail.createdAt).toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Rincian Member & Kasir */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#070D1E] p-3.5 rounded-2xl border border-white/10">
                <div>
                  <div className="text-slate-400">Pelanggan:</div>
                  <div className="font-bold text-white mt-0.5">
                    {selectedDetail.member?.fullName || selectedDetail.guestName}
                  </div>
                  {selectedDetail.member && (
                    <div className="text-[10px] text-[#FFC067]">
                      {selectedDetail.member.code} ({selectedDetail.member.phone})
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-slate-400">Kasir Bertugas:</div>
                  <div className="font-bold text-white mt-0.5">{selectedDetail.cashierName}</div>
                  <div className="text-[10px] text-slate-400">Sales: {selectedDetail.salesPerson || '-'}</div>
                </div>
              </div>

              {/* Tabel Item Belanja */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">Rincian Item:</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedDetail.items?.map((it: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#070D1E] border border-white/5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{it.itemName}</div>
                        <div className="text-[10px] text-slate-400">
                          {it.itemType} • {it.qty} x {formatRp(it.unitPrice)}
                        </div>
                      </div>
                      <div className="font-bold text-white">{formatRp(it.qty * it.unitPrice)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Kalkulasi */}
              <div className="p-3.5 rounded-2xl bg-[#070D1E] border border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatRp(selectedDetail.subtotal)}</span>
                </div>
                {Number(selectedDetail.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Diskon Voucher ({selectedDetail.promoCode}):</span>
                    <span>-{formatRp(selectedDetail.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-white pt-1.5 border-t border-white/10">
                  <span>Grand Total:</span>
                  <span className="text-[#FFC067]">{formatRp(selectedDetail.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                  <span>Metode: {selectedDetail.paymentMethod}</span>
                  <span>Status: <strong className="text-emerald-400">{selectedDetail.paymentStatus}</strong></span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedReceipt(selectedDetail);
                    setSelectedDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk Resmi (A4)</span>
                </button>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 rounded-xl bg-[#070D1E] hover:bg-[#1E293B] text-slate-300 font-semibold text-xs border border-white/10 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ MODAL VOID / PEMBATALAN NOTA ══════════════ */}
        {voidModalTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <form
              onSubmit={handleVoidSubmit}
              className="w-full max-w-md bg-[#0F172A] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/20">
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Void / Batalkan Transaksi</h3>
                  <div className="text-xs text-rose-300 font-mono">
                    {voidModalTrx.invoiceNumber} • {formatRp(voidModalTrx.grandTotal)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Tindakan ini akan <strong>membatalkan status pembayaran</strong>, mengembalikan stok produk retail secara otomatis ke sistem inventori, dan mencatat audit trail security log.
              </p>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Alasan Pembatalan (Wajib):
                </label>
                <input
                  required
                  type="text"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Contoh: Salah pilih metode pembayaran..."
                  className="w-full rounded-xl bg-[#070D1E] border border-white/15 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  PIN Otorisasi Supervisor (Demo PIN: 1234):
                </label>
                <input
                  required
                  type="password"
                  value={voidPin}
                  onChange={(e) => setVoidPin(e.target.value)}
                  placeholder="••••"
                  className="w-full rounded-xl bg-[#070D1E] border border-white/15 px-3.5 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={voidLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Ban className="w-4 h-4" />
                  <span>{voidLoading ? 'Memproses Void...' : 'Konfirmasi Void Nota'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVoidModalTrx(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#070D1E] hover:bg-[#1E293B] border border-white/10 text-xs text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
