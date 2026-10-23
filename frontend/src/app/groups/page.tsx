'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch, formatDateId } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Building2,
  Users,
  Zap,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Award,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

export default function GroupsPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [groupForm, setGroupForm] = useState({
    name: '',
    groupType: 'CORPORATE',
    maxSlots: 10,
    packageId: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, catRes] = await Promise.all([
        apiFetch('/groups'),
        apiFetch('/pos/catalog'),
      ]);
      setGroups(grpRes);
      setPackages(catRes?.packages || []);
      if (catRes?.packages?.length > 0 && !groupForm.packageId) {
        setGroupForm((prev) => ({ ...prev, packageId: catRes.packages[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupForm.packageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name) return;
    try {
      await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify(groupForm),
      });
      showSuccess(`Grup Corporate "${groupForm.name}" berhasil didaftarkan!`, 'Grup Dibuat');
      setFeedback(`[OK] Grup Corporate "${groupForm.name}" berhasil didaftarkan!`);
      setGroupForm({ name: '', groupType: 'CORPORATE', maxSlots: 10, packageId: packages[0]?.id || '' });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Buat Grup');
    }
  };

  const handleActivateAll = async (groupId: string, groupName: string) => {
    try {
      const res = await apiFetch(`/groups/${groupId}/activate-all`, { method: 'POST', body: JSON.stringify({}) });
      showSuccess(`Seluruh anggota ${groupName} (${res.activatedCount} member) telah aktif serentak!`, 'Aktivasi Massal');
      setFeedback(`⚡ [1-CLICK AKTIVASI BERHASIL] Seluruh anggota ${groupName} (${res.activatedCount} member) telah diaktifkan serentak!`);
      loadData();
    } catch (err: any) {
      showError(err.message, 'Gagal Aktivasi Massal');
    }
  };

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Corporate &amp; B2B Group Memberships
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFC067]/20 text-[#FFC067] border border-[#FFC067]/30">
                  1-Click Activation
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola kemitraan korporasi, komunitas atletik &amp; paket keluarga dengan aktivasi serentak 1-klik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-[#FFC067]/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Grup B2B Baru</span>
            </button>
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

        {/* Modal Buat Grup Baru */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <form
              onSubmit={handleCreateGroup}
              className="w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#FFC067]" /> Buat Grup Corporate / Komunitas
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Nama Perusahaan / Komunitas:
                </label>
                <input
                  required
                  type="text"
                  placeholder="PT Bank Central Asia Tbk"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Tipe Grup:</label>
                  <select
                    value={groupForm.groupType}
                    onChange={(e) => setGroupForm({ ...groupForm, groupType: e.target.value })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    <option value="CORPORATE">Corporate (B2B)</option>
                    <option value="COMMUNITY">Komunitas Olahraga</option>
                    <option value="FAMILY_DUO">Family / Duo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Kuota Slot:</label>
                  <input
                    type="number"
                    value={groupForm.maxSlots}
                    onChange={(e) => setGroupForm({ ...groupForm, maxSlots: Number(e.target.value) })}
                    className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Paket Membership Default:</label>
                <select
                  value={groupForm.packageId}
                  onChange={(e) => setGroupForm({ ...groupForm, packageId: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.durationDays} hari)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FFC067] text-slate-950 font-bold text-xs"
                >
                  Simpan &amp; Terbitkan Kontrak
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#070D1E] text-slate-300 font-semibold text-xs border border-white/10"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Groups Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((grp) => {
            const filledCount = grp.members?.length || 0;
            const progress = Math.min(100, Math.round((filledCount / grp.maxSlots) * 100));

            return (
              <div
                key={grp.id}
                className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 flex flex-col justify-between gap-4 shadow-lg hover:border-[#FFC067]/40 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#FFC067]">
                      {grp.code} • {grp.groupType}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        grp.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {grp.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      {grp.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Paket Kemitraan: <strong className="text-slate-200">{grp.package?.name || 'Paket Corporate Standard'}</strong>
                    </p>
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="space-y-1.5 bg-[#070D1E] p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Kapasitas Slot Anggota:</span>
                      <span className="font-bold text-white">
                        {filledCount} / {grp.maxSlots} Orang ({progress}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FFC067] to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Daftar Karyawan / Member Terdaftar */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Anggota Terdaftar:
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {grp.members?.map((m: any) => (
                        <span
                          key={m.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[#070D1E] border border-white/10 text-slate-200 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{m.fullName}</span>
                          {m.isGroupPic && <span className="text-[#FFC067] font-bold text-[10px]">⭐ PIC</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1-Click Activate Button */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Kemitraan B2B Aktif
                  </div>
                  <button
                    onClick={() => handleActivateAll(grp.id, grp.name)}
                    className="px-3.5 py-2 rounded-xl bg-[#FFC067]/15 hover:bg-[#FFC067]/25 text-[#FFC067] border border-[#FFC067]/40 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Zap className="w-3.5 h-3.5 fill-[#FFC067]" />
                    <span>⚡ 1-Click Aktifkan Semua</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
