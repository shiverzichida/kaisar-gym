'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import TableScrollWrapper from '@/components/TableScrollWrapper';
import { apiFetch } from '@/lib/api';
import { confirmDelete, confirmUpdate, promptInput } from '@/lib/swal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ShieldCheck, UserPlus, KeyRound, RefreshCw, X, Pencil, Trash2 } from 'lucide-react';

export default function StaffPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    role: 'CASHIER',
    email: '',
    phone: '',
    password: '',
    isActive: true,
  });

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/users');
      setUsers(Array.isArray(res) ? res : []);
    } catch (err: any) {
      showError(err.message || 'Gagal memuat akun staff');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openAddModal = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      fullName: '',
      role: 'CASHIER',
      email: '',
      phone: '',
      password: '',
      isActive: true,
    });
    setShowUserModal(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setUserForm({
      username: u.username || '',
      fullName: u.fullName || '',
      role: u.role || 'CASHIER',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      isActive: Boolean(u.isActive),
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiFetch(`/auth/users/${editingUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            fullName: userForm.fullName,
            role: userForm.role,
            email: userForm.email,
            phone: userForm.phone,
            isActive: userForm.isActive,
          }),
        });
        showSuccess(`Akun "${editingUser.username}" berhasil diperbarui!`);
      } else {
        await apiFetch('/auth/users', {
          method: 'POST',
          body: JSON.stringify(userForm),
        });
        showSuccess(`Akun "${userForm.username}" berhasil dibuat!`);
      }
      setShowUserModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (u.id === currentUser?.id) {
      showError('Tidak dapat menghapus akun yang sedang aktif digunakan');
      return;
    }
    const ok = await confirmDelete({
      title: `Hapus Akun @${u.username}?`,
      text: `Akun "${u.fullName}" akan dihapus permanen jika belum memiliki riwayat transaksi/shift.`,
    });
    if (!ok) return;
    try {
      await apiFetch(`/auth/users/${u.id}`, { method: 'DELETE' });
      showSuccess(`Akun @${u.username} berhasil dihapus`);
      loadUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleToggleActive = async (u: any) => {
    const ok = await confirmUpdate({
      title: u.isActive ? 'Nonaktifkan Akun Staff?' : 'Aktifkan Akun Staff?',
      text: `${u.isActive ? 'Nonaktifkan' : 'Aktifkan'} akun "${u.fullName}" (${u.username})?`,
    });
    if (!ok) return;
    try {
      await apiFetch(`/auth/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      showSuccess(`Status akun ${u.username} diperbarui`);
      loadUsers();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleResetPassword = async (u: any) => {
    const newPassword = await promptInput({
      title: `Reset Password: ${u.username}`,
      inputLabel: 'Masukkan password baru (minimal 6 karakter)',
      placeholder: 'Minimal 6 karakter',
      confirmText: 'Reset Password',
      icon: 'warning',
      validator: (val) => (!val || val.length < 6 ? 'Minimal 6 karakter' : null),
    });
    if (!newPassword) return;
    try {
      await apiFetch(`/auth/users/${u.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      showSuccess(`Password untuk ${u.username} berhasil di-reset`);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      showError('Konfirmasi password baru tidak cocok');
      return;
    }
    const ok = await confirmUpdate({
      title: 'Ganti Password Akun?',
      text: `Ubah password untuk akun "${currentUser?.username}"?`,
    });
    if (!ok) return;
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser?.id,
          username: currentUser?.username,
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      });
      showSuccess('Password Anda berhasil diubah!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleLifecycleSync = async () => {
    const ok = await confirmUpdate({
      title: 'Jalankan Auto-Sync Lifecycle Member?',
      text: 'Sistem akan otomatis menandai paket kedaluwarsa menjadi EXPIRED/INACTIVE dan mengaktifkan kembali member yang cutinya telah berakhir.',
      confirmText: 'Jalankan Sync',
    });
    if (!ok) return;
    setSyncLoading(true);
    try {
      const res = await apiFetch('/members/lifecycle-sync', { method: 'POST' });
      showSuccess(
        `Sync selesai: ${res.expiredSubscriptions} paket expired, ${res.inactivatedMembers} member non-aktif, ${res.resumedLeaves} cuti selesai.`,
        'Lifecycle Sync Sukses',
      );
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <AppShell onRefresh={loadUsers} loading={loading}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#FFC067]/15 text-[#FFC067] border border-[#FFC067]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Manajemen Akun Staff &amp; Keamanan</h1>
              <p className="text-xs text-slate-400">Kelola akun kasir/admin, reset password, serta sinkronisasi lifecycle member.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLifecycleSync}
              disabled={syncLoading}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
              Sync Auto-Expiry Member
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#FFB040] text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Tambah Staff
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff Table */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0F172A] overflow-hidden">
            <TableScrollWrapper>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#070D1E] text-slate-300 font-bold uppercase text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Username &amp; Nama</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{u.fullName}</div>
                        <div className="text-[10px] font-mono text-[#FFC067]">@{u.username}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-semibold">{u.role}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {u.isActive ? 'AKTIF' : 'NONAKTIF'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit Staff"
                            className="px-2.5 py-1 rounded-lg bg-[#070D1E] border border-white/10 text-sky-400 hover:bg-white/5 text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleResetPassword(u)}
                            title="Reset Password"
                            className="px-2.5 py-1 rounded-lg bg-[#070D1E] border border-white/10 text-amber-400 hover:bg-white/5 text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3" /> Reset
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === currentUser?.id}
                            title={u.id === currentUser?.id ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Staff'}
                            className="p-1.5 rounded-lg bg-[#070D1E] border border-white/10 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScrollWrapper>
          </div>

          {/* Change Own Password */}
          <form onSubmit={handleChangeOwnPassword} className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 space-y-3 h-fit">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#FFC067]" /> Ganti Password Saya
            </h2>
            <p className="text-[11px] text-slate-400">
              Akun aktif: <strong className="text-white">{currentUser?.username}</strong>
            </p>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Password Lama</label>
                <input
                  type="password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Password Baru (min. 6 karakter)</label>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white"
                />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-[#FFC067] hover:bg-[#FFB040] text-slate-950 font-black text-xs">
              Simpan Password Baru
            </button>
          </form>
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveUser} className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-white/15 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white">
                {editingUser ? `Edit Akun Staff (@${editingUser.username})` : 'Tambah Akun Staff Baru'}
              </h2>
              <button type="button" onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              {!editingUser && (
                <div>
                  <label className="block text-slate-400 mb-1">Username</label>
                  <input required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white font-mono" placeholder="kasir2" />
                </div>
              )}
              <div>
                <label className="block text-slate-400 mb-1">Nama Lengkap</label>
                <input required value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white">
                  <option value="CASHIER">CASHIER (Kasir / Front Desk)</option>
                  <option value="OPS_MANAGER">OPS_MANAGER (Manager Operasional)</option>
                  <option value="STUDIO_MANAGER">STUDIO_MANAGER (Studio Manager)</option>
                  <option value="MARKETING">MARKETING (Marketing &amp; CRM)</option>
                  <option value="TRAINER">TRAINER (Personal Trainer)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Owner / Admin)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email (Opsional)</label>
                  <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" placeholder="staff@kaisargym.id" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">No. HP (Opsional)</label>
                  <input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" placeholder="0812..." />
                </div>
              </div>
              {!editingUser ? (
                <div>
                  <label className="block text-slate-400 mb-1">Password Awal (min. 6 karakter)</label>
                  <input type="password" minLength={6} required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full rounded-lg bg-[#070D1E] border border-white/10 px-3 py-2 text-white" />
                </div>
              ) : (
                <label className="flex items-center gap-2 text-slate-300 pt-1">
                  <input type="checkbox" checked={userForm.isActive} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })} />
                  <span>Akun Aktif</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#FFC067] text-slate-950 font-black text-xs">
                {editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
