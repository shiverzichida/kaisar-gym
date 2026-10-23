'use client';

import React, { useState } from 'react';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Dumbbell,
  Award,
  CheckSquare,
  CalendarPlus,
  Users,
  Wallet,
  Sparkles,
} from 'lucide-react';

export default function TrainersAndClassesView({
  trainers,
  classesData,
  members,
  currentUser,
  onRefresh,
}: {
  trainers: any[];
  classesData: any;
  members: any[];
  currentUser: any;
  onRefresh: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [feedback, setFeedback] = useState('');
  const [signOffModal, setSignOffModal] = useState<any>(null);
  const [signOffForm, setSignOffForm] = useState({
    musclesTrained: 'Chest, Shoulders & Triceps',
    weightLiftedNote: 'Bench Press 75kg x 8, Lateral Raise 12kg x 12',
    evaluationNote: 'Progres kekuatan dan postur sangat baik',
  });
  const [selectedMemberForClass, setSelectedMemberForClass] = useState<string>(members?.[0]?.id || '');

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signOffModal) return;
    try {
      const res = await apiFetch('/trainers/sign-off', {
        method: 'POST',
        body: JSON.stringify({
          contractId: signOffModal.id,
          ...signOffForm,
          signedOffBy: currentUser?.fullName || signOffModal.trainerName,
        }),
      });
      showSuccess(
        `Sesi latihan ${signOffModal.memberName} berhasil di-sign-off! Sisa kuota: ${res.updatedContract.remainingSessions} sesi.`,
        'Sign-off Berhasil'
      );
      setFeedback(
        `✓ Sesi latihan ${signOffModal.memberName} berhasil di-sign-off! Sisa kuota sesi sekarang: ${res.updatedContract.remainingSessions} sesi.`,
      );
      setSignOffModal(null);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Sign-off');
    }
  };

  const handleSalaryRequest = async (trainerId: string) => {
    try {
      await apiFetch('/trainers/salary-requests', {
        method: 'POST',
        body: JSON.stringify({
          trainerId,
          monthYear: '2026-10',
          notes: 'Pengajuan pencairan komisi sesi & closing PT Oktober 2026',
        }),
      });
      showSuccess('Pengajuan klaim komisi (Salary Request) berhasil dikirim!', 'Klaim Terkirim');
      setFeedback('✓ Pengajuan pencairan komisi (Salary Request) berhasil dikirim ke Manager Operasional.');
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Kirim Pengajuan');
    }
  };

  const handleApproveSalary = async (reqId: string, status: string) => {
    try {
      await apiFetch(`/trainers/salary-requests/${reqId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          approvedBy: currentUser?.fullName || 'Manager Operasional',
        }),
      });
      showSuccess(`Status Salary Request diperbarui menjadi: ${status}!`, 'Persetujuan Gaji');
      setFeedback(`✓ Status Salary Request diperbarui menjadi: ${status}`);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Update Status');
    }
  };

  const handleGenerateSchedules = async () => {
    try {
      const res = await apiFetch('/classes/generate-schedules', { method: 'POST' });
      showSuccess(`Berhasil meng-generate ${res.generatedCount} jadwal kelas baru!`, 'Jadwal Diperbarui');
      setFeedback(`🔄 Berhasil meng-generate ${res.generatedCount} jadwal kelas baru dari Template Mingguan!`);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Generate Jadwal');
    }
  };

  const handleBookClass = async (scheduleId: string) => {
    const memberId = selectedMemberForClass || members?.[0]?.id;
    if (!memberId) return;
    try {
      await apiFetch('/classes/book', {
        method: 'POST',
        body: JSON.stringify({ scheduleId, memberId }),
      });
      showSuccess('Slot kelas studio berhasil dibooking!', 'Booking Sukses');
      setFeedback('✓ Slot kelas studio berhasil dibooking!');
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Booking');
    }
  };

  const handleBookingAttendance = async (bookingId: string, status: 'ATTENDED' | 'ABSENT' | 'CANCELLED') => {
    try {
      await apiFetch(`/classes/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showSuccess(`Status kehadiran kelas diperbarui menjadi ${status}!`, 'Presensi Sukses');
      setFeedback(`✓ Status kehadiran kelas diperbarui menjadi ${status}`);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Update Presensi');
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="rounded-xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-sm font-medium text-[#FFC067] flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-xs underline">
            Tutup
          </button>
        </div>
      )}

      {/* Modul 6: Personal Trainer, Sesi Latihan & Engine Komisi Bertingkat */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#FFC067]" /> Modul Personal Trainer (PT), Sign-Off Sesi & Skema Komisi Bertingkat
          </h3>
          <p className="text-xs text-slate-400">
            Perhitungan komisi bertingkat otomatis (Tier 1: 1-20 sesi, Tier 2: 21-40 sesi, Tier 3: &gt;40 sesi) + Komisi Closing Penjualan Paket PT.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {trainers.map((tr) => (
            <div
              key={tr.id}
              className="rounded-2xl border border-white/[0.08] glass-card p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#FFC067]/20 text-[#FFC067]">
                    {tr.code} • {tr.trainerType}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {tr.metrics?.currentTier}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-slate-100">{tr.fullName}</h4>
                  <p className="text-xs text-slate-400">{tr.specialization}</p>
                </div>

                {/* Skema Komisi Box */}
                <div className="rounded-xl bg-[#09090B] p-3 border border-white/[0.08] space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Sesi Selesai Bulan Ini:</span>
                    <strong className="text-slate-100">{tr.metrics?.completedSessionsThisMonth} Sesi</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Komisi Mengajar (Tiered):</span>
                    <span className="text-emerald-400 font-semibold">
                      {formatRp(tr.metrics?.estimatedSessionCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Komisi Closing ({tr.salesCommissionPct}%):</span>
                    <span className="text-sky-400 font-semibold">
                      {formatRp(tr.metrics?.estimatedSalesCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[#FFC067] pt-1 border-t border-white/[0.08]">
                    <span>Total Estimasi Komisi:</span>
                    <span>{formatRp(tr.metrics?.totalEstimatedTakeHome)}</span>
                  </div>
                </div>

                {/* Daftar Klien Aktif & Tombol Sign-Off Sesi */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Klien Bimbingan Aktif ({tr.ptContracts?.length || 0})
                  </div>
                  {tr.ptContracts?.map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-xl bg-[#09090B]/80 border border-white/[0.08] p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{c.member?.fullName}</div>
                        <div className="text-[11px] text-[#FFC067]">
                          Sisa Kuota: <strong>{c.remainingSessions}</strong> / {c.totalSessions} Sesi
                        </div>
                      </div>
                      {c.remainingSessions > 0 && (
                        <button
                          onClick={() =>
                            setSignOffModal({
                              id: c.id,
                              memberName: c.member?.fullName,
                              trainerName: tr.fullName,
                              remaining: c.remainingSessions,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Sign-Off Sesi
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pengajuan & Approval Komisi */}
              <div className="pt-3 border-t border-white/[0.08] space-y-2">
                <button
                  onClick={() => handleSalaryRequest(tr.id)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-[#FFC067] flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" /> Ajukan Klaim Komisi Bulanan (Salary Request)
                </button>
                {tr.salaryRequests?.slice(0, 2).map((sr: any) => (
                  <div
                    key={sr.id}
                    className="rounded-lg bg-[#09090B] px-3 py-2 border border-white/[0.08] flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{sr.monthYear}: {formatRp(sr.totalAmount)}</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-[#FFC067]/20 text-[#FFC067]">{sr.status}</span>
                    </div>
                    <div className="flex gap-1">
                      {sr.status === 'PENDING' && (
                        <button
                          onClick={() => handleApproveSalary(sr.id, 'APPROVED_MANAGER')}
                          className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-bold"
                        >
                          Approve Mgr
                        </button>
                      )}
                      {sr.status === 'APPROVED_MANAGER' && (
                        <button
                          onClick={() => handleApproveSalary(sr.id, 'PAID')}
                          className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold"
                        >
                          Cairkan (Paid)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Sign-Off Sesi PT */}
      {signOffModal && (
        <form
          onSubmit={handleSignOff}
          className="rounded-2xl border border-[#FFC067]/50 bg-[#121217] p-5 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-[#FFC067]">
              Sign-Off Sesi Latihan PT — Klien: {signOffModal.memberName} (Sisa {signOffModal.remaining} Sesi)
            </h4>
            <button type="button" onClick={() => setSignOffModal(null)} className="text-xs text-slate-400">
              Batal
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400">Otot yang Dilatih (Workout Focus) *</label>
              <input
                required
                type="text"
                value={signOffForm.musclesTrained}
                onChange={(e) => setSignOffForm({ ...signOffForm, musclesTrained: e.target.value })}
                className="w-full mt-1 rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2"
              />
            </div>
            <div>
              <label className="text-slate-400">Catatan Beban Angkatan</label>
              <input
                type="text"
                value={signOffForm.weightLiftedNote}
                onChange={(e) => setSignOffForm({ ...signOffForm, weightLiftedNote: e.target.value })}
                className="w-full mt-1 rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2"
              />
            </div>
            <div>
              <label className="text-slate-400">Evaluasi Fisik Pelatih</label>
              <input
                type="text"
                value={signOffForm.evaluationNote}
                onChange={(e) => setSignOffForm({ ...signOffForm, evaluationNote: e.target.value })}
                className="w-full mt-1 rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-5 py-2 rounded-lg bg-[#FFC067] text-slate-950 font-bold text-xs">
              ✓ Selesaikan Sesi & Potong 1 Kuota Sesi
            </button>
          </div>
        </form>
      )}

      {/* Modul 7: Kelas Studio & Pilates (Group Classes) */}
      <div className="rounded-2xl border border-white/[0.08] glass-card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFC067]" /> Modul Kelas Studio & Pilates (Group Classes)
            </h3>
            <p className="text-xs text-slate-400">
              Template jadwal berulang mingguan, booking real-time, dan lembar absensi kehadiran kelas studio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMemberForClass}
              onChange={(e) => setSelectedMemberForClass(e.target.value)}
              className="rounded-lg border border-white/[0.12] bg-[#09090B] px-3 py-2 text-xs"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  Booking utk: {m.fullName} ({m.memberCode})
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateSchedules}
              className="px-4 py-2 rounded-xl bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <CalendarPlus className="w-4 h-4" /> 🔄 Auto-Generate Jadwal dari Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classesData?.schedules?.map((sched: any) => (
            <div
              key={sched.id}
              className="rounded-xl border border-white/[0.08] bg-[#09090B]/90 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  {sched.studioClass?.category} • {sched.studioClass?.roomName}
                </span>
                <span className="text-xs font-bold text-[#FFC067]">
                  Kuota: {sched.bookedCount} / {sched.maxCapacity} Slot
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-100">{sched.studioClass?.name}</h4>
                  <p className="text-xs text-slate-400">
                    Instruktur: {sched.trainer?.fullName} • {formatDateId(sched.scheduleDate)} ({sched.startTime} - {sched.endTime})
                  </p>
                </div>
                <button
                  onClick={() => handleBookClass(sched.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  + Book Slot
                </button>
              </div>

              {/* Lembar Absensi Kelas */}
              <div className="pt-2 border-t border-white/[0.08]/80 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">
                  Daftar Peserta Booking ({sched.bookings?.length || 0}):
                </div>
                {sched.bookings?.map((bk: any) => (
                  <div
                    key={bk.id}
                    className="flex items-center justify-between bg-[#121217] px-2.5 py-1.5 rounded text-xs"
                  >
                    <span>
                      {bk.member?.fullName}{' '}
                      <strong
                        className={
                          bk.status === 'ATTENDED'
                            ? 'text-emerald-400'
                            : bk.status === 'CANCELLED'
                            ? 'text-rose-400'
                            : 'text-[#FFC067]'
                        }
                      >
                        ({bk.status})
                      </strong>
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleBookingAttendance(bk.id, 'ATTENDED')}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] hover:bg-emerald-500/30"
                      >
                        Hadir
                      </button>
                      <button
                        onClick={() => handleBookingAttendance(bk.id, 'ABSENT')}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]"
                      >
                        Absen
                      </button>
                      <button
                        onClick={() => handleBookingAttendance(bk.id, 'CANCELLED')}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


