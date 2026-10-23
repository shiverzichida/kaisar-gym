'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatRp } from '@/lib/api';
import {
  Printer,
  X,
  Share2,
  Receipt,
} from 'lucide-react';

interface OfficialReceiptModalProps {
  receipt: any;
  onClose: () => void;
}

// Helper konversi angka ke kalimat terbilang rupiah
function terbilangRupiah(angka: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function convert(n: number): string {
    if (n < 12) return bilangan[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    if (n < 2000) return 'Seribu ' + convert(n - 1000);
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000);
  }

  const num = Math.round(Number(angka || 0));
  if (num === 0) return 'Nol Rupiah';
  const hasil = convert(num).replace(/\s+/g, ' ').trim();
  return hasil + ' Rupiah';
}

export default function OfficialReceiptModal({ receipt, onClose }: OfficialReceiptModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!receipt || !mounted) return null;

  const isVoid = receipt.paymentStatus === 'VOID';
  const memberName = receipt.member?.fullName || receipt.guestName || 'Tamu Walk-In';
  const memberCode = receipt.member?.code || receipt.member?.memberCode || 'NON-MEMBER';
  const memberPhone = receipt.member?.phone || '-';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = receipt.member?.phone || '';
    const text = encodeURIComponent(
      `*KAISAR GYM - BUKTI PEMBAYARAN RESMI*\n` +
      `No. Invoice: *${receipt.invoiceNumber}*\n` +
      `Tanggal: ${new Date(receipt.createdAt).toLocaleString('id-ID')}\n` +
      `Pelanggan: ${memberName} (${memberCode})\n` +
      `Total Tagihan: *${formatRp(receipt.grandTotal)}*\n` +
      `Status: *LUNAS (PAID)*\n` +
      `Metode: ${receipt.paymentMethod}\n\n` +
      `Alamat: Jl. Patimura No.84, Darat Sekip, Kec. Pontianak Kota, Kota Pontianak, Kalimantan Barat 78117\n` +
      `Terima kasih telah bertransaksi di Kaisar Gym.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${text}`, '_blank');
  };

  const modalContent = (
    <div
      id="official-receipt-portal-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
    >
      <div className="w-full max-w-4xl my-auto space-y-4">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between bg-[#0F172A] border border-white/15 px-4 py-3 rounded-2xl shadow-xl text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#FFC067]" />
            <span className="font-bold text-sm">
              Struk Resmi Pembayaran Kaisar Gym (Format A4)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-[#FFC067]/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            KERTAS FISIK NOTA / STRUK FORMAT A4 KAISAR GYM
            ════════════════════════════════════════════════════════════ */}
        <div
          id="official-receipt-print"
          className="relative bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 font-sans border border-slate-300 mx-auto select-text"
        >
          {/* HEADER STRUK RESMI DENGAN LOGO KAISAR GYM & ALAMAT PONTIANAK */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 gap-4">
            {/* Sisi Kiri: Logo & Identitas Resmi Kaisar Gym Pontianak */}
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/img/kaisar-gym-logo-circle.png"
                alt="Logo Kaisar Gym"
                className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-full border border-amber-400/40 p-0.5 bg-slate-950 shrink-0 shadow-sm"
              />
              <div className="space-y-0.5">
                <h1 className="font-black text-xl md:text-2xl text-slate-950 tracking-wider font-serif uppercase">
                  KAISAR GYM
                </h1>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                  Elite Fitness &amp; Performance Center
                </p>
                <p className="text-[11px] text-slate-700 font-medium leading-snug max-w-md">
                  Jl. Patimura No.84, Darat Sekip, Kec. Pontianak Kota, Kota Pontianak, Kalimantan Barat 78117
                </p>
                <p className="text-[10px] text-slate-500">
                  Telp / WhatsApp: 0812-9988-7766 • Pontianak, Kalimantan Barat
                </p>
              </div>
            </div>

            {/* Sisi Kanan: Judul Dokumen & Nomor Nota */}
            <div className="text-right space-y-1 shrink-0">
              <div className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase">
                BUKTI PEMBAYARAN SAH
              </div>
              <div className="font-mono font-black text-base text-slate-950 tracking-tight">
                {receipt.invoiceNumber}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Tanggal: <strong>{new Date(receipt.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Pukul: <strong>{new Date(receipt.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
              </div>
            </div>
          </div>

          {/* INFORMASI PELANGGAN & DETAIL KASIR (2 KOLOM RAPI) */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
            {/* Kolom Pelanggan */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Diterima Dari / Kepada Pelanggan:
              </div>
              <div className="font-extrabold text-sm text-slate-900">{memberName}</div>
              <div className="text-[11px] text-slate-600 flex items-center gap-2">
                <span>Kode: <strong className="font-mono text-slate-900">{memberCode}</strong></span>
                <span>•</span>
                <span>Telp: <strong>{memberPhone}</strong></span>
              </div>
            </div>

            {/* Kolom Kasir & Pembayaran */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Petugas &amp; Metode Pembayaran:
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Kasir Bertugas:</span>
                <strong className="text-slate-900">{receipt.cashierName || 'Kasir Front Desk'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Metode Bayar:</span>
                <strong className="font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-900 text-[11px]">
                  {receipt.paymentMethod}
                </strong>
              </div>
              {receipt.paymentRef && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Ref / Approval:</span>
                  <span className="font-mono text-slate-700">{receipt.paymentRef}</span>
                </div>
              )}
            </div>
          </div>

          {/* TABEL RINCIAN ITEM BELANJA / LAYANAN */}
          <div className="py-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                  <th className="py-2.5 px-2 text-center w-10">NO</th>
                  <th className="py-2.5 px-3">DESKRIPSI ITEM / PAKET LAYANAN</th>
                  <th className="py-2.5 px-2 text-center w-16">QTY</th>
                  <th className="py-2.5 px-3 text-right w-28">HARGA SATUAN</th>
                  <th className="py-2.5 px-3 text-right w-32">TOTAL (RP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{it.itemName}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          Kategori: {it.itemType?.replace('_', ' ') || 'Produk/Layanan'}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatRp(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-950">
                        {formatRp(it.qty * it.unitPrice)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-slate-500">
                      Rincian paket transaksi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* RINGKASAN FINANSIAL & CAP STEMPEL LUNAS (RAPI & BEBAS OVERLAP) */}
          <div className="pt-3 border-t-2 border-slate-900 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Sisi Kiri (Col 7): Terbilang, Stempel Lunas Kompak, & Catatan */}
            <div className="md:col-span-7 space-y-3">
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 text-xs">
                <span className="text-[10px] font-bold text-amber-900 block uppercase tracking-wide">
                  Terbilang:
                </span>
                <span className="font-bold italic text-slate-800">
                  # {terbilangRupiah(receipt.grandTotal)} #
                </span>
              </div>

              {/* Area Cap Stempel Lunas (Kompak, Elegan, Tidak Menutupi Angka / Tulisan) */}
              <div className="flex items-center gap-4 pt-1">
                {!isVoid ? (
                  <div
                    className="inline-block border-2 border-double border-red-600 rounded-lg px-3 py-1 text-center bg-red-50/70 select-none shadow-sm shrink-0"
                    style={{ transform: 'rotate(-4deg)' }}
                  >
                    <div className="text-[8px] font-black tracking-widest text-red-600 uppercase border-b border-red-400 pb-0.5">
                      ★ KAISAR GYM ★
                    </div>
                    <div className="font-black text-lg tracking-[0.2em] text-red-600 uppercase py-0.5 leading-none">
                      L U N A S
                    </div>
                    <div className="text-[7.5px] font-black tracking-wider text-red-600 uppercase border-t border-red-400 pt-0.5">
                      TERBAYAR SAH • {new Date(receipt.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                ) : (
                  <div
                    className="inline-block border-2 border-double border-rose-700 rounded-lg px-3.5 py-1 text-center bg-rose-50 select-none shrink-0"
                    style={{ transform: 'rotate(-4deg)' }}
                  >
                    <div className="font-black text-base tracking-widest text-rose-700 uppercase leading-tight">
                      V O I D
                    </div>
                    <div className="text-[8px] font-bold tracking-wider text-rose-700 uppercase">
                      DIBATALKAN
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 leading-tight">
                  * Bukti transaksi resmi &amp; sah pembayaran Kaisar Gym Pontianak. Harap disimpan untuk keperluan konfirmasi keanggotaan, presensi turnstile, dan penugasan trainer.
                </div>
              </div>
            </div>

            {/* Sisi Kanan (Col 5): Rincian Angka Subtotal, Diskon, Grand Total, Tunai, Kembalian */}
            <div className="md:col-span-5 space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatRp(receipt.subtotal)}</span>
              </div>

              {Number(receipt.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Diskon {receipt.promoCode ? `(${receipt.promoCode})` : ''}:</span>
                  <span className="font-mono">-{formatRp(receipt.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline font-black text-sm text-slate-950 pt-1.5 border-t border-slate-300">
                <span className="uppercase tracking-wider">GRAND TOTAL:</span>
                <span className="text-base text-slate-950 font-mono font-black">
                  {formatRp(receipt.grandTotal)}
                </span>
              </div>

              {receipt.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <span>Tunai Dibayar:</span>
                    <span className="font-mono">{formatRp(receipt.cashAmount || receipt.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Kembalian:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatRp(receipt.changeAmount || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AREA TANDA TANGAN (KASIR & PELANGGAN) */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-5 border-t border-slate-200 text-center text-xs">
            <div className="space-y-12">
              <span className="text-slate-500 font-medium">Tanda Tangan Pelanggan / Member:</span>
              <div className="pt-2 border-t border-slate-400 font-bold text-slate-800 max-w-[200px] mx-auto">
                ( {memberName} )
              </div>
            </div>

            <div className="space-y-12">
              <span className="text-slate-500 font-medium">Petugas Kasir Kaisar Gym:</span>
              <div className="pt-2 border-t border-slate-400 font-bold text-slate-800 max-w-[200px] mx-auto">
                ( {receipt.cashierName || 'Kasir Front Desk'} )
              </div>
            </div>
          </div>
        </div>

        {/* Global Print Styles Injection - Bersih, Pas 1 Lembar A4 Portrait, Tidak Mengulang */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 14mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            /* Sembunyikan elemen utama di luar portal modal saat mencetak */
            body > *:not(#official-receipt-portal-root) {
              display: none !important;
            }
            #official-receipt-portal-root {
              position: static !important;
              display: block !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: transparent !important;
              inset: auto !important;
              overflow: visible !important;
            }
            .no-print {
              display: none !important;
            }
            #official-receipt-print {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: #ffffff !important;
              page-break-after: avoid !important;
            }
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
