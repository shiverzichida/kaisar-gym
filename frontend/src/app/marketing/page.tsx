'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { confirmDelete, confirmUpdate } from '@/lib/swal';
import { useToast } from '@/context/ToastContext';
import {
  Tag,
  Megaphone,
  MessageCircle,
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function MarketingPage() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'VOUCHERS' | 'ANNOUNCEMENTS' | 'REMINDERS'>('VOUCHERS');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [waTemplate, setWaTemplate] = useState(
    'Halo {name} ({code}), paket "{package}" Anda di Kaisar Gym akan berakhir pada {endDate}. Yuk perpanjang sebelum habis agar akses gate tetap aktif!',
  );

  // Voucher Modal
  const [voucherModal, setVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minPurchase: 0,
    maxQuota: 100,
    validUntil: '',
    isActive: true,
  });

  // Announcement Modal
  const [annModal, setAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<any>(null);
  const [annForm, setAnnForm] = useState({
    title: '',
    category: 'PROMO',
    content: '',
    isActive: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, aRes, rRes] = await Promise.all([
        apiFetch('/marketing/vouchers').catch(() => []),
        apiFetch('/marketing/announcements').catch(() => []),
        apiFetch('/marketing/expiring-reminders?days=7').catch(() => []),
      ]);
      setVouchers(Array.isArray(vRes) ? vRes : []);
      setAnnouncements(Array.isArray(aRes) ? aRes : []);
      setReminders(Array.isArray(rRes) ? rRes : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVoucher) {
      const ok = await confirmUpdate({
        title: 'Simpan Perubahan Voucher?',
        text: `Perbarui voucher "${voucherForm.code.toUpperCase()}"?`,
      });
      if (!ok) return;
    }

    try {
      const payload = {
        ...voucherForm,
        code: voucherForm.code.trim().toUpperCase(),
        discountValue: Number(voucherForm.discountValue),
        minPurchase: Number(voucherForm.minPurchase),
        maxQuota: Number(voucherForm.maxQuota),
        validUntil: voucherForm.validUntil || null,
      };
      if (editingVoucher) {
        await apiFetch(`/marketing/vouchers/${editingVoucher.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showSuccess('Voucher promo berhasil diperbarui!');
      } else {
        await apiFetch('/marketing/vouchers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showSuccess('Voucher promo baru berhasil dibuat!');
      }
      setVoucherModal(false);
      setEditingVoucher(null);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Gagal menyimpan voucher');
    }
  };

  const handleDeleteVoucher = async (v: any) => {
    const ok = await confirmDelete({
      title: 'Hapus Voucher?',
      text: `Hapus voucher "${v.code}" secara permanen?`,
    });
    if (!ok) return;
    try {
      await apiFetch(`/marketing/vouchers/${v.id}`, { method: 'DELETE' });
      showSuccess(`Voucher ${v.code} dihapus`);
      loadData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleSaveAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAnn) {
      const ok = await confirmUpdate({
        title: 'Simpan Perubahan Pengumuman?',
        text: `Perbarui pengumuman "${annForm.title}"?`,
      });
      if (!ok) return;
    }
    try {
      if (editingAnn) {
        await apiFetch(`/marketing/announcements/${editingAnn.id}`, {
          method: 'PUT',
          body: JSON.stringify(annForm),
        });
        showSuccess('Pengumuman berhasil diperbarui!');
      } else {
        await apiFetch('/marketing/announcements', {
          method: 'POST',
          body: JSON.stringify(annForm),
        });
        showSuccess('Pengumuman baru berhasil dipublikasikan!');
      }
      setAnnModal(false);
      setEditingAnn(null);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Gagal menyimpan pengumuman');
    }
  };

  const handleDeleteAnn = async (a: any) => {
    const ok = await confirmDelete({
      title: 'Hapus Pengumuman?',
      text: `Hapus pengumuman "${a.title}"?`,
    });
    if (!ok) return;
    try {
      await apiFetch(`/marketing/announcements/${a.id}`, { method: 'DELETE' });
      showSuccess('Pengumuman dihapus');
      loadData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const sendWhatsAppReminder = (rem: any) => {
    const cleanPhone = String(rem.phone || '').replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const text = waTemplate
      .replace(/\{name\}/g, rem.fullName || '')
      .replace(/\{code\}/g, rem.memberCode || '')
      .replace(/\{package\}/g, rem.packageName || 'Membership')
      .replace(/\{endDate\}/g, formatDateId(rem.endDate));
    const url = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Promo, Pengumuman &amp; Reminder Perpanjangan
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kelola voucher diskon kasir POS, pengumuman Portal Member, serta pengingat perpanjangan H-7 / H-3.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'VOUCHERS' && (
              <button
                onClick={() => {
                  setEditingVoucher(null);
                  setVoucherForm({
                    code: '',
                    description: '',
                    discountType: 'PERCENTAGE',
                    discountValue: 10,
                    minPurchase: 0,
                    maxQuota: 100,
                    validUntil: '',
                    isActive: true,
                  });
                  setVoucherModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#FFB040] text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Voucher
              </button>
            )}
            {activeTab === 'ANNOUNCEMENTS' && (
              <button
                onClick={() => {
                  setEditingAnn(null);
                  setAnnForm({ title: '', category: 'PROMO', content: '', isActive: true });
                  setAnnModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#FFB040] text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Buat Pengumuman
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('VOUCHERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'VOUCHERS' ? 'bg-[#FFC067] text-slate-950' : 'bg-[#0F172A] text-slate-300 hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" /> Voucher Promo ({vouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'ANNOUNCEMENTS' ? 'bg-[#FFC067] text-slate-950' : 'bg-[#0F172A] text-slate-300 hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-4 h-4" /> Pengumuman Portal ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('REMINDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition ${
              activeTab === 'REMINDERS' ? 'bg-[#FFC067] text-slate-950' : 'bg-[#0F172A] text-slate-300 hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Reminder H-7 / H-3 ({reminders.length})
          </button>
        </div>

        {activeTab === 'VOUCHERS' && (
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden">
            <TableScrollWrapper>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#070D1E] text-slate-300 font-bold uppercase text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Diskon</th>
                    <th className="py-3 px-4">Kuota</th>
                    <th className="py-3 px-4">Berlaku s/d</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        Belum ada voucher promo.
                      </td>
                    </tr>
                  ) : (
                    vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono font-bold text-[#FFC067]">{v.code}</td>
                        <td className="py-3 px-4 text-slate-200">{v.description}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatRp(v.discountValue)}
                          {v.minPurchase > 0 && (
                            <div className="text-[10px] text-slate-500 font-normal">Min: {formatRp(v.minPurchase)}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {v.usedCount} / {v.maxQuota}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {v.validUntil ? formatDateId(v.validUntil) : 'Tanpa Batas'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              v.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {v.isActive ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditingVoucher(v);
                                setVoucherForm({
                                  code: v.code,
                                  description: v.description,
                                  discountType: v.discountType,
                                  discountValue: v.discountValue,
                                  minPurchase: v.minPurchase,
                                  maxQuota: v.maxQuota,
                                  validUntil: v.validUntil ? new Date(v.validUntil).toISOString().slice(0, 10) : '',
                                  isActive: v.isActive,
                                });
                                setVoucherModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#070D1E] border border-white/10 text-blue-400 hover:bg-white/5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(v)}
                              className="p-1.5 rounded-lg bg-[#070D1E] border border-rose-500/30 text-rose-400 hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {activeTab === 'ANNOUNCEMENTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#0F172A] p-10 text-center text-xs text-slate-500">
                Belum ada pengumuman portal.
              </div>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC067]/15 text-[#FFC067]">
                        {a.category}
                      </span>
                      <span className={`text-[10px] font-bold ${a.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {a.isActive ? 'AKTIF' : 'ARSIP'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2">{a.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">{a.content}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-500">
                    <span>{formatDateId(a.createdAt)}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingAnn(a);
                          setAnnForm({ title: a.title, category: a.category, content: a.content, isActive: a.isActive });
                          setAnnModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#070D1E] border border-white/10 text-blue-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnn(a)}
                        className="p-1.5 rounded-lg bg-[#070D1E] border border-rose-500/30 text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'REMINDERS' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4 space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Template Pesan WhatsApp (variabel: <code>{'{name}'}</code>, <code>{'{code}'}</code>, <code>{'{package}'}</code>, <code>{'{endDate}'}</code>)
              </label>
              <textarea
                rows={2}
                value={waTemplate}
                onChange={(e) => setWaTemplate(e.target.value)}
                className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden">
              <TableScrollWrapper>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#070D1E] text-slate-300 font-bold uppercase text-[11px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Paket</th>
                      <th className="py-3 px-4">Berakhir</th>
                      <th className="py-3 px-4 text-center">Urgensi</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reminders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                          Tidak ada member yang mendekati jatuh tempo dalam 7 hari ke depan.
                        </td>
                      </tr>
                    ) : (
                      reminders.map((r) => (
                        <tr key={r.memberId} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{r.fullName}</div>
                            <div className="text-[10px] font-mono text-[#FFC067]">{r.memberCode} • {r.phone}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{r.packageName}</td>
                          <td className="py-3 px-4 text-slate-300">{formatDateId(r.endDate)}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                r.urgency === 'EXPIRED'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : r.urgency === 'H3'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {r.daysRemaining < 0 ? `Lewat ${Math.abs(r.daysRemaining)} hari` : `H-${r.daysRemaining}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => sendWhatsAppReminder(r)}
                              className="px-3 py-1.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-[11px] inline-flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Kirim WA
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TableScrollWrapper>
            </div>
          </div>
        )}
      </div>

      {/* Voucher Modal */}
      {voucherModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveVoucher} className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-white/15 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white">{editingVoucher ? 'Edit Voucher Promo' : 'Tambah Voucher Promo'}</h2>
              <button type="button" onClick={() => setVoucherModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Kode Voucher</label>
                <input required value={voucherForm.code} onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-mono" placeholder="KAISAR10" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tipe Diskon</label>
                <select value={voucherForm.discountType} onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white">
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal (Rp)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Deskripsi</label>
                <input required value={voucherForm.description} onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" placeholder="Diskon Akhir Bulan 10%" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nilai Diskon</label>
                <input type="number" min={1} required value={voucherForm.discountValue} onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: Number(e.target.value) })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kuota Maks</label>
                <input type="number" min={1} required value={voucherForm.maxQuota} onChange={(e) => setVoucherForm({ ...voucherForm, maxQuota: Number(e.target.value) })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Min. Belanja (Rp)</label>
                <input type="number" min={0} value={voucherForm.minPurchase} onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: Number(e.target.value) })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Berlaku s/d</label>
                <input type="date" value={voucherForm.validUntil} onChange={(e) => setVoucherForm({ ...voucherForm, validUntil: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={voucherForm.isActive} onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })} />
              Voucher Aktif
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setVoucherModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#FFC067] text-slate-950 font-black text-xs">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* Announcement Modal */}
      {annModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveAnn} className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-white/15 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white">{editingAnn ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</h2>
              <button type="button" onClick={() => setAnnModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Judul</label>
                <input required value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kategori</label>
                <select value={annForm.category} onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white">
                  <option value="PROMO">PROMO</option>
                  <option value="INFO">INFO</option>
                  <option value="HOLIDAY">HOLIDAY</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Isi Pengumuman</label>
                <textarea required rows={4} value={annForm.content} onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
              </div>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={annForm.isActive} onChange={(e) => setAnnForm({ ...annForm, isActive: e.target.checked })} />
                Tampilkan di Portal Member
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAnnModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#FFC067] text-slate-950 font-black text-xs">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
