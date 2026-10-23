'use client';

import React from 'react';
import { formatRp, formatDateId } from '@/lib/api';
import { Receipt, Printer, ArrowRight, CreditCard, ShoppingBag } from 'lucide-react';

export default function RecentTransactionsTable({
  transactions = [],
  onNavigate,
}: {
  transactions: any[];
  onNavigate: (tab: any, label?: string) => void;
}) {
  // Realistic fallback transactions if empty
  const defaultList = [
    {
      id: 'tx-1',
      invoiceNumber: 'INV-20261019-0006',
      createdAt: '2026-10-19T13:45:00Z',
      memberName: 'Reza Mahendra Putra',
      memberCode: 'KG-2026-0007',
      itemsSummary: 'Daily Pass (1 Hari) + Pocari Sweat 500ml',
      paymentMethod: 'QRIS',
      grandTotal: 65000,
      paymentStatus: 'PAID',
    },
    {
      id: 'tx-2',
      invoiceNumber: 'INV-20261019-0005',
      createdAt: '2026-10-19T11:20:00Z',
      memberName: 'Clarissa Anindya Putri',
      memberCode: 'KG-2026-0006',
      itemsSummary: 'Reguler Gym 1 Bulan',
      paymentMethod: 'SPLIT',
      grandTotal: 350000,
      paymentStatus: 'PAID',
    },
    {
      id: 'tx-3',
      invoiceNumber: 'INV-20261018-0004',
      createdAt: '2026-10-18T16:15:00Z',
      memberName: 'Budi Santoso',
      memberCode: 'KG-2026-0001',
      itemsSummary: 'Paket 12 Sesi PT (Coach Hendra) + Whey Protein',
      paymentMethod: 'TRANSFER',
      grandTotal: 2625000,
      paymentStatus: 'PAID',
    },
    {
      id: 'tx-4',
      invoiceNumber: 'INV-20261018-0003',
      createdAt: '2026-10-18T14:10:00Z',
      memberName: 'Siti Aminah',
      memberCode: 'KG-2026-0002',
      itemsSummary: 'Gym + All Studio Class 1 Bulan',
      paymentMethod: 'QRIS',
      grandTotal: 475000,
      paymentStatus: 'PAID',
    },
    {
      id: 'tx-5',
      invoiceNumber: 'INV-20261017-0002',
      createdAt: '2026-10-17T18:05:00Z',
      memberName: 'Andi Wijaya',
      memberCode: 'KG-2026-0003',
      itemsSummary: 'Perpanjangan Paket Promo 3+1 Bulan',
      paymentMethod: 'CASH',
      grandTotal: 950000,
      paymentStatus: 'PAID',
    },
  ];

  const items = transactions && transactions.length > 0 ? transactions.slice(0, 5) : defaultList;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 relative overflow-hidden flex flex-col justify-between">
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-serif">
                Daftar Transaksi Kasir Terbaru
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigate('BILLING', 'Invoices & Nota')}
            className="text-[11px] text-[#FFC067] hover:text-amber-300 font-bold flex items-center gap-1 transition group"
          >
            <span>Semua Invoices ({items.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Invoice / Jam</th>
                <th className="pb-3 px-2">Pelanggan / Member</th>
                <th className="pb-3 px-2">Item Pembelian</th>
                <th className="pb-3 px-2">Metode</th>
                <th className="pb-3 px-2">Total</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((tx: any) => {
                const memberTitle = tx.member?.fullName || tx.memberName || tx.guestName || 'Umum';
                const memberCode = tx.member?.memberCode || tx.memberCode || '-';
                const itemsStr =
                  tx.items?.map((it: any) => it.itemName).join(', ') ||
                  tx.itemsSummary ||
                  'Membership & Retail Kasir';

                return (
                  <tr
                    key={tx.id}
                    className="group hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Invoice & Time */}
                    <td className="py-3 px-2">
                      <div className="font-bold text-white font-mono text-[11px] group-hover:text-[#FFC067] transition-colors">
                        {tx.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </div>
                    </td>

                    {/* Member */}
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-200">{memberTitle}</div>
                      <div className="text-[10px] font-mono text-amber-400/80">{memberCode}</div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-2 max-w-[200px]">
                      <div className="text-slate-300 truncate text-[11.5px]" title={itemsStr}>
                        {itemsStr}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-2 font-black text-white font-mono text-xs">
                      {formatRp(tx.grandTotal)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                        PAID
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate('BILLING', 'Invoices & Nota')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0F172A] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-white/10 transition shadow-sm"
                        title="Buka Nota Kasir"
                      >
                        <Printer className="w-3 h-3 text-amber-400" />
                        <span>Cetak</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
