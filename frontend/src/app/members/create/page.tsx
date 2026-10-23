'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/api';
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
  Lock,
  MapPin,
  Car,
  ShieldCheck,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function CreateMemberPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [nextCode, setNextCode] = useState('KG-2026-0001');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [rawOcrText, setRawOcrText] = useState('');
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Form State matching POS Westfit fields
  const [formData, setFormData] = useState({
    memberCode: '',
    nik: '',
    fullName: '',
    gender: 'L',
    birthDate: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    rtRw: '',
    kecamatan: '',
    plateNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    facePhotoPreview: '',
    ktpPhotoPreview: '',
  });

  // Load next member code
  useEffect(() => {
    apiFetch<{ code: string }>('/members/next-code')
      .then((res) => {
        if (res?.code) {
          setNextCode(res.code);
          setFormData((prev) => ({ ...prev, memberCode: res.code }));
        }
      })
      .catch(() => {});
  }, []);

  // Real e-KTP OCR Scanner (Tesseract.js OCR)
  const handleFileOcr = async (file: File) => {
    if (!file) return;
    setOcrLoading(true);
    setError('');
    setFeedback('');
    setOcrProgress('Menyiapkan gambar KTP...');

    // 1. Tampilkan foto asli yang diupload user
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, ktpPhotoPreview: previewUrl }));

    try {
      // 2. Jalankan OCR Tesseract sungguhan pada file gambar
      const ext = await scanKtpWithOcr(file, (pct, status) => {
        const statusLabel = status === 'recognizing text' ? 'Mengenali teks KTP' : 'Memproses gambar';
        setOcrProgress(`${statusLabel}: ${pct}%`);
      });

      setRawOcrText(ext.rawText);

      // 3. Terapkan data identitas yang berhasil diekstrak ke form
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
      setFeedback(`📸 OCR e-KTP Selesai: Data identitas berhasil diekstrak langsung dari foto KTP yang diunggah. Silakan cek dan koreksi jika ada huruf/angka yang kurang jelas.`);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError('Gagal membaca teks otomatis dari foto KTP. Silakan ketik data secara manual atau gunakan foto yang lebih terang/jelas.');
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
      facePhotoPreview:
        prev.gender === 'P'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
    }));
    setFeedback('📷 Foto wajah selfie berhasil diambil untuk Face Recognition Turnstile Gate!');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSuccess) return;

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError('Nama Lengkap dan Nomor Telepon wajib diisi!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const created = await apiFetch('/members', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          actorName: currentUser?.fullName || 'Kasir Front Desk',
          actorRole: currentUser?.role || 'CASHIER',
        }),
      });

      const successTxt = `Member baru ${created.memberCode} (${created.fullName}) berhasil didaftarkan!`;
      setIsSuccess(true);
      setSuccessMessage(successTxt);
      showSuccess(successTxt, 'Pendaftaran Sukses', 2500);

      // Jeda 2 detik agar pengguna melihat notifikasi alert & progress bar countdown sebelum redirect
      setTimeout(() => {
        router.push(`/members?newMember=${encodeURIComponent(created.memberCode)}`);
      }, 2000);
    } catch (err: any) {
      const errMsg = err.message || 'Gagal menyimpan member baru';
      setError(errMsg);
      showError(errMsg, 'Pendaftaran Gagal');
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Top Breadcrumb & Return Button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/members"
              className="p-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-slate-300 hover:text-white transition"
              title="Kembali ke Daftar Member"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Tambah Member Baru
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Layout pendaftaran keanggotaan lengkap, scan e-KTP OCR, foto selfie gate, dan akun portal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/members"
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-white/10 text-xs font-semibold text-slate-300"
            >
              Batal
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading || isSuccess}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition ${
                isSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 shadow-[#FFC067]/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>Berhasil Didaftarkan!</span>
                </>
              ) : loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Member</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert Banner with Countdown */}
        {isSuccess && (
          <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 shadow-xl backdrop-blur-md animate-toast-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    ✓ Pendaftaran Member Berhasil!
                  </h4>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {successMessage || 'Member baru telah tersimpan.'} Mengalihkan ke tabel member dalam 2 detik...
                  </p>
                </div>
              </div>
              <Link
                href="/members"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
              >
                Lihat Sekarang
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

        {/* ══════════════ FORM UTAMA (Persis Screenshot POS Westfit) ══════════════ */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Baris Kode Member, NIK & Nama Lengkap */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Kode Member */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Kode Member</label>
                <input
                  type="text"
                  readOnly
                  value={formData.memberCode || nextCode}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm font-mono font-bold text-[#FFC067] cursor-not-allowed select-none"
                />
              </div>

              {/* NIK e-KTP (Auto-Fill dari OCR atau ketik manual) */}
              <div className="md:col-span-4">
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>NIK e-KTP (16 Digit)</span>
                  {formData.nik && (
                    <span className="text-[10px] text-teal-400 font-semibold">✓ Terbaca</span>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Contoh: 6171011502960007"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm font-mono text-white font-semibold focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Nama Lengkap */}
              <div className="md:col-span-5">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: NAHEL AL-FATH ICHIDA"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-[#FFC067]"
                />
              </div>
            </div>

            {/* 2. Media Upload: Foto Profil / Selfie Wajah & Foto KTP Member (Dual Box Persis Westfit) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Box Kiri: Foto Profil / Selfie Wajah */}
              <div className="rounded-xl border border-white/10 bg-[#070D1E] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-400" /> Foto Profil / Selfie Wajah
                  </span>
                  <span className="text-[11px] text-slate-400">(Maks 2 MB)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureSelfie}
                    className="py-2.5 rounded-lg border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kamera HP / Webcam</span>
                  </button>

                  <label className="py-2.5 rounded-lg border border-white/10 bg-[#0F172A] hover:bg-white/5 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>File / Galeri</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setFormData((prev) => ({ ...prev, facePhotoPreview: url }));
                        }
                      }}
                    />
                  </label>
                </div>

                <p className="text-[11px] text-slate-400">
                  Untuk avatar akun &amp; face recognition gate turnstile.
                </p>

                {formData.facePhotoPreview && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={formData.facePhotoPreview}
                      alt="Selfie"
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-[#FFC067]"
                    />
                    <span className="text-xs text-emerald-400 font-semibold">
                      ✓ Foto selfie siap digunakan
                    </span>
                  </div>
                )}
              </div>

              {/* Box Kanan: Foto KTP Member (Jepret KTP & Real Tesseract OCR) */}
              <div className="rounded-xl border border-white/10 bg-[#070D1E] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-teal-400" /> Foto KTP Member
                  </span>
                  <span className="text-[11px] text-teal-400 font-semibold">Scan OCR Otomatis</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Kamera HP (Langsung buka kamera belakang smartphone) */}
                  <label
                    className={`py-2.5 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer ${
                      ocrLoading ? 'bg-teal-700/50 cursor-wait' : 'bg-teal-600 hover:bg-teal-500'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kamera HP (Jepret KTP)</span>
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

                  {/* Ambil File dari Galeri / Dokumen */}
                  <label
                    className={`py-2.5 rounded-lg border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      ocrLoading ? 'bg-[#070D1E] cursor-wait' : 'bg-[#0F172A] hover:bg-white/5'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>File / Galeri</span>
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

                {/* Progress Bar OCR */}
                {ocrLoading && (
                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="font-semibold">{ocrProgress || 'Memproses OCR foto KTP...'}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Pilih foto e-KTP asli dari galeri atau foto langsung. Sistem akan membaca NIK, Nama, dan Alamat secara otomatis.
                </p>

                {formData.ktpPhotoPreview && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.ktpPhotoPreview}
                        alt="Foto KTP Asli"
                        className="w-24 h-16 rounded-lg object-contain bg-black/40 ring-1 ring-teal-500/40 p-0.5"
                      />
                      <div>
                        <span className="text-xs text-teal-300 font-bold block">
                          ✓ Foto KTP Asli Terunggah
                        </span>
                        {rawOcrText && (
                          <button
                            type="button"
                            onClick={() => setShowRawOcr(!showRawOcr)}
                            className="text-[11px] text-slate-400 hover:text-white underline mt-0.5 flex items-center gap-1"
                          >
                            {showRawOcr ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showRawOcr ? 'Sembunyikan' : 'Lihat'} Teks Mentah Hasil Scan</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {showRawOcr && rawOcrText && (
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {rawOcrText}
                      </div>
                    )}
                  </div>
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
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white font-medium"
                >
                  <option value="L">Pria (L)</option>
                  <option value="P">Wanita (P)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Telepon (WhatsApp) <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="081299887766"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="member@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* ══════════════ 4. AKUN LOGIN MEMBER (Persis Screenshot Westfit) ══════════════ */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <UserCheck className="w-4 h-4 text-sky-400" /> Akun Login Member
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Username</label>
                <input
                  type="text"
                  readOnly
                  value={formData.memberCode || nextCode}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-300 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Username otomatis disamakan dengan Kode Member.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Password</label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kosongkan untuk auto-generate (default login: <code>kaisar123</code>).
                </p>
              </div>
            </div>
          </div>

          {/* ══════════════ 5. INFORMASI KONTAK & KENDARAAN ══════════════ */}
          <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <MapPin className="w-4 h-4 text-[#FFC067]" /> Informasi Kontak &amp; Bebas Parkir STNK
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="text-slate-300 font-bold block mb-1.5">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Jl. Sudirman No. 88, Gedung Kaisar Lt. 2..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white"
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

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  No. Polisi STNK (Bebas Parkir Gym)
                </label>
                <input
                  type="text"
                  placeholder="B 1234 KSR"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Kontak Darurat (Nama)</label>
                <input
                  type="text"
                  placeholder="Nama kerabat/keluarga..."
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">No. HP Kontak Darurat</label>
                <input
                  type="tel"
                  placeholder="081399887766"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full rounded-xl bg-[#070D1E] border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

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
              disabled={loading || isSuccess}
              className={`px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition ${
                isSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 shadow-[#FFC067]/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>✓ Member Berhasil Didaftarkan! Mengalihkan (2d)...</span>
                </>
              ) : loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Member Baru...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Member Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
