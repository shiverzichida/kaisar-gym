'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { apiFetch, formatDateId, formatRp } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { scanKtpWithOcr } from '@/lib/ktpOcr';
import {
  Camera,
  Upload,
  User,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Car,
  ShieldCheck,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Eye,
  EyeOff,
  Dumbbell,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function EditMemberPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [member, setMember] = useState<any>(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    memberCode: '',
    nik: '',
    fullName: '',
    gender: 'L',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    rtRw: '',
    kecamatan: '',
    plateNumber: '',
    parkingActive: false,
    status: 'ACTIVE',
    facePhotoUrl: '',
    ktpPhotoUrl: '',
  });

  // Load member data
  const loadMember = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/members/${params.id}`);
      setMember(data);

      let bDate = '';
      if (data.birthDate) {
        bDate = new Date(data.birthDate).toISOString().split('T')[0];
      }

      setFormData({
        memberCode: data.memberCode || '',
        nik: data.nik || '',
        fullName: data.fullName || '',
        gender: data.gender || 'L',
        birthDate: bDate,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        rtRw: data.rtRw || '',
        kecamatan: data.kecamatan || '',
        plateNumber: data.plateNumber || '',
        parkingActive: !!data.parkingActive,
        status: data.status || 'ACTIVE',
        facePhotoUrl: data.facePhotoUrl || '',
        ktpPhotoUrl: data.ktpPhotoUrl || '',
      });
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data member. Silakan periksa koneksi atau coba lagi.');
      showError('Gagal memuat data member', 'Error');
    } finally {
      setLoading(false);
    }
  }, [params.id, showError]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  // Real e-KTP OCR Scanner (Tesseract.js)
  const handleFileOcr = async (file: File) => {
    if (!file) return;
    setOcrLoading(true);
    setError('');
    setFeedback('');
    setOcrProgress('Menyiapkan gambar KTP...');

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, ktpPhotoUrl: previewUrl }));

    try {
      const ext = await scanKtpWithOcr(file, (pct, status) => {
        const statusLabel = status === 'recognizing text' ? 'Mengenali teks KTP' : 'Memproses gambar';
        setOcrProgress(`${statusLabel}: ${pct}%`);
      });

      setRawOcrText(ext.rawText);

      setFormData((prev) => ({
        ...prev,
        nik: ext.nik || prev.nik,
        fullName: ext.fullName || prev.fullName,
        birthDate: ext.birthDate || prev.birthDate,
        gender: ext.gender || prev.gender,
        address: ext.address || prev.address,
        rtRw: ext.rtRw || prev.rtRw,
        kecamatan: ext.kecamatan || prev.kecamatan,
      }));

      const recognizedFields = [];
      if (ext.nik) recognizedFields.push(`NIK: ${ext.nik}`);
      if (ext.fullName) recognizedFields.push(`Nama: ${ext.fullName}`);
      if (ext.birthDate) recognizedFields.push(`Tgl Lahir: ${ext.birthDate}`);

      const msg = recognizedFields.length > 0
        ? `OCR Sukses! Terdeteksi ${recognizedFields.join(' • ')}`
        : 'Pemindaian selesai. Silakan periksa formulir dan sesuaikan isian.';

      showSuccess(msg, 'OCR KTP Selesai');
      setFeedback(`📸 OCR e-KTP Berhasil: Data identitas berhasil diperbarui dari foto KTP.`);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError('Gagal membaca teks otomatis dari foto KTP. Anda dapat mengedit teks formulir secara manual.');
      showError('Gagal membaca OCR KTP', 'OCR Gagal');
    } finally {
      setOcrLoading(false);
      setOcrProgress('');
    }
  };

  // Mock Camera Selfie
  const handleCaptureSelfie = () => {
    setFormData((prev) => ({
      ...prev,
      facePhotoUrl:
        prev.gender === 'P'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
    }));
    setFeedback('📷 Foto selfie wajah diperbarui untuk Face Recognition Turnstile Gate!');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || isSuccess) return;

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError('Nama Lengkap dan Nomor Telepon wajib diisi!');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch(`/members/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      const successTxt = `Perubahan data member ${formData.memberCode} (${formData.fullName}) berhasil disimpan!`;
      setIsSuccess(true);
      setSuccessMessage(successTxt);
      showSuccess(successTxt, 'Update Berhasil', 2500);

      setTimeout(() => {
        router.push('/members');
      }, 1500);
    } catch (err: any) {
      const errMsg = err.message || 'Gagal menyimpan perubahan member';
      setError(errMsg);
      showError(errMsg, 'Update Gagal');
      setSaving(false);
    }
  };

  const activeSubscription = member?.subscriptions?.find(
    (s: any) => s.status === 'ACTIVE'
  );

  return (
    <AppShell loading={loading}>
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/members"
              className="p-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white transition shrink-0"
              title="Kembali ke Daftar Member"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Edit Data Member
                </h1>
                {formData.memberCode && (
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs">
                    {formData.memberCode}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    formData.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : formData.status === 'CUTI'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {formData.status === 'ACTIVE'
                    ? '● AKTIF'
                    : formData.status === 'CUTI'
                    ? '● CUTI'
                    : '● NON-AKTIF'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Layout lengkap perubahan data member, e-KTP OCR, foto selfie gate, dan informasi parkir STNK.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/members"
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

        {/* Success Alert Banner */}
        {isSuccess && (
          <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 shadow-xl backdrop-blur-md animate-toast-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    ✓ Data Member Berhasil Diperbarui!
                  </h4>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {successMessage || 'Perubahan telah disimpan ke server.'} Mengalihkan kembali ke tabel member...
                  </p>
                </div>
              </div>
              <Link
                href="/members"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
              >
                Kembali Sekarang
              </Link>
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 text-xs font-semibold text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback('')} className="underline text-[11px]">
              Tutup
            </button>
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

        {/* ══════════════ FORM UTAMA EDIT MEMBER ══════════════ */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Baris Kode Member, Status, NIK & Nama Lengkap */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" /> Identitas Utama &amp; Status
              </h3>
              <span className="text-xs text-slate-400 font-mono">ID: {params.id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Kode Member */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Kode Member</label>
                <input
                  type="text"
                  readOnly
                  value={formData.memberCode}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm font-mono font-bold text-[#FFC067] cursor-not-allowed select-none"
                />
              </div>

              {/* Status Keanggotaan */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Status Keanggotaan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="ACTIVE">ACTIVE (Aktif)</option>
                  <option value="CUTI">CUTI (Dibekukan)</option>
                  <option value="INACTIVE">INACTIVE (Non-Aktif)</option>
                  <option value="BLACKLIST">BLACKLIST (Blokir Gate)</option>
                </select>
              </div>

              {/* NIK e-KTP */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>NIK e-KTP (16 Digit)</span>
                  {formData.nik && (
                    <span className="text-[10px] text-teal-400 font-semibold">✓ Ada</span>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="6171..."
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm font-mono text-white font-semibold focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Nama Lengkap */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Nama Lengkap..."
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* 2. Media Upload: Foto Profil / Selfie Wajah & Foto KTP Member (Dual Box Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Box Kiri: Foto Profil / Selfie Wajah */}
              <div className="rounded-xl border border-white/10 bg-[#070D1E] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-400" /> Foto Profil / Selfie Wajah
                  </span>
                  <span className="text-[11px] text-slate-400">(Face ID Gate)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureSelfie}
                    className="py-2.5 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Jepret Ulang</span>
                  </button>

                  <label className="py-2.5 rounded-lg border border-white/10 bg-[#0F172A] hover:bg-white/5 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setFormData((prev) => ({ ...prev, facePhotoUrl: url }));
                        }
                      }}
                    />
                  </label>
                </div>

                <p className="text-[11px] text-slate-400">
                  Digunakan untuk otentikasi wajah saat melewati swing barrier turnstile gate.
                </p>

                {formData.facePhotoUrl ? (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={formData.facePhotoUrl}
                      alt="Selfie"
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-400"
                    />
                    <div>
                      <span className="text-xs text-emerald-400 font-semibold block">
                        ✓ Foto Wajah Tersedia
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, facePhotoUrl: '' }))}
                        className="text-[11px] text-rose-400 hover:underline mt-0.5"
                      >
                        Hapus Foto Wajah
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Belum ada foto wajah member.</div>
                )}
              </div>

              {/* Box Kanan: Foto KTP Member (Jepret KTP & OCR Scanner) */}
              <div className="rounded-xl border border-white/10 bg-[#070D1E] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-teal-400" /> Foto KTP Member
                  </span>
                  <span className="text-[11px] text-teal-400 font-semibold">Scan OCR Otomatis</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`py-2.5 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer ${
                      ocrLoading ? 'bg-teal-700/50 cursor-wait' : 'bg-teal-600 hover:bg-teal-500'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Jepret KTP</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={ocrLoading}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileOcr(file);
                      }}
                    />
                  </label>

                  <label
                    className={`py-2.5 rounded-lg border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      ocrLoading ? 'bg-[#070D1E] cursor-wait' : 'bg-[#0F172A] hover:bg-white/5'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Dokumen</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={ocrLoading}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileOcr(file);
                      }}
                    />
                  </label>
                </div>

                {ocrLoading && (
                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="font-semibold">{ocrProgress || 'Memproses OCR foto KTP...'}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Unggah foto KTP baru jika ingin sinkronisasi ulang data identitas secara otomatis.
                </p>

                {formData.ktpPhotoUrl ? (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.ktpPhotoUrl}
                        alt="Foto KTP Asli"
                        className="w-24 h-16 rounded-lg object-contain bg-black/40 ring-1 ring-teal-500/40 p-0.5"
                      />
                      <div>
                        <span className="text-xs text-teal-300 font-bold block">
                          ✓ Foto KTP Tersedia
                        </span>
                        {rawOcrText && (
                          <button
                            type="button"
                            onClick={() => setShowRawOcr(!showRawOcr)}
                            className="text-[11px] text-slate-400 hover:text-white underline mt-0.5 flex items-center gap-1"
                          >
                            {showRawOcr ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showRawOcr ? 'Sembunyikan' : 'Lihat'} Teks Scan</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, ktpPhotoUrl: '' }))}
                          className="text-[11px] text-rose-400 hover:underline mt-0.5 block"
                        >
                          Hapus Foto KTP
                        </button>
                      </div>
                    </div>

                    {showRawOcr && rawOcrText && (
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {rawOcrText}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Belum ada foto e-KTP member.</div>
                )}
              </div>
            </div>

            {/* 3. Baris Biodata: Jenis Kelamin, Tanggal Lahir, Telepon, Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Jenis Kelamin</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-400"
                >
                  <option value="L">Pria (Laki-Laki)</option>
                  <option value="P">Wanita (Perempuan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Telepon (WhatsApp) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="0812..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Email Member</label>
                <input
                  type="email"
                  placeholder="member@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* ══════════════ 4. INFORMASI ALAMAT & DOMISILI ══════════════ */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <MapPin className="w-4 h-4 text-emerald-400" /> Informasi Alamat Domisili
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1.5">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Jl. Gajah Mada No..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">RT / RW &amp; Kecamatan</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="001/002"
                    value={formData.rtRw}
                    onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })}
                    className="w-24 rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Kecamatan..."
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                    className="flex-1 rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ 5. KENDARAAN & FASILITAS BEBAS PARKIR STNK ══════════════ */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-[#FFC067]" /> Bebas Parkir STNK &amp; Kendaraan
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.parkingActive}
                  onChange={(e) => setFormData({ ...formData, parkingActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#070D1E] border-white/20"
                />
                <span className="text-xs font-bold text-amber-300">
                  Akses Bebas Parkir Aktif
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  No. Plat STNK Kendaraan (Mobil / Motor)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KB 1234 XX"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono uppercase font-bold focus:outline-none focus:border-[#FFC067]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Plat nomor akan diverifikasi oleh petugas pos parkir Kaisar Gym.
                </p>
              </div>

              <div className="rounded-xl bg-[#070D1E] border border-white/10 p-4 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[#FFC067] shrink-0" />
                <div>
                  <div className="font-bold text-xs text-white">Integrasi Gate Parkir Kaisar</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formData.parkingActive
                      ? 'Member ini berhak atas parkir gratis selama jam kunjungan gym.'
                      : 'Status parkir gratis non-aktif. Member membayar tarif parkir reguler.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ 6. RINGKASAN LANGGANAN & KONTRAK PT AKTIF ══════════════ */}
          {member && (
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Dumbbell className="w-4 h-4 text-purple-400" /> Ringkasan Langganan &amp; Sesi PT
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Paket Membership */}
                <div className="rounded-xl bg-[#070D1E] border border-white/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Paket Gym Utama:</span>
                    <span className="font-bold text-white">
                      {activeSubscription?.membershipPackage?.name ||
                        member.subscriptions?.[0]?.membershipPackage?.name ||
                        'Belum Ada Paket Aktif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Masa Berlaku:</span>
                    <span className="text-slate-200 font-mono">
                      {activeSubscription?.endDate
                        ? formatDateId(activeSubscription.endDate)
                        : member.subscriptions?.[0]?.endDate
                        ? formatDateId(member.subscriptions[0].endDate)
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                    <span className="text-slate-400">Total Kunjungan Gate:</span>
                    <span className="text-emerald-400 font-bold">
                      {member.attendances?.length || 0} Kali Check-in
                    </span>
                  </div>
                </div>

                {/* Sesi Personal Trainer */}
                <div className="rounded-xl bg-[#070D1E] border border-white/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Kontrak Personal Trainer:</span>
                    <span className="font-bold text-white">
                      {member.ptContracts && member.ptContracts.length > 0
                        ? `${member.ptContracts.length} Paket PT Terdaftar`
                        : 'Tidak Ada Kontrak PT'}
                    </span>
                  </div>
                  {member.ptContracts && member.ptContracts.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {member.ptContracts.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-[11px] text-slate-300"
                        >
                          <span>{c.trainer?.fullName || 'PT Gym'}</span>
                          <span className="font-mono text-purple-300">
                            {c.usedSessions || 0} / {c.totalSessions || 0} Sesi
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TOMBOL SIMPAN / BATAL ══════════════ */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/members"
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
                  <span>✓ Perubahan Berhasil Disimpan! Mengalihkan...</span>
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
