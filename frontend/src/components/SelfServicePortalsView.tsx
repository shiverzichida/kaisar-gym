'use client';

import React, { useState } from 'react';
import { apiFetch, formatRp, formatDateId } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Smartphone,
  QrCode,
  Calendar,
  Dumbbell,
  FileText,
  Megaphone,
  CheckCircle,
  Award,
  Clock,
} from 'lucide-react';

export default function SelfServicePortalsView({
  members,
  trainers,
  classesData,
  announcements,
  onRefresh,
}: {
  members: any[];
  trainers: any[];
  classesData: any;
  announcements: any[];
  onRefresh: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members?.[0]?.id || '');
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(trainers?.[0]?.id || '');
  const [leaveReason, setLeaveReason] = useState('Perjalanan Dinas Luar Kota');
  const [leaveStart, setLeaveStart] = useState(new Date().toISOString().slice(0, 10));
  const [leaveEnd, setLeaveEnd] = useState(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
  const [portalMsg, setPortalMsg] = useState('');

  const activeMember = members.find((m) => m.id === selectedMemberId) || members?.[0];
  const activeTrainer = trainers.find((t) => t.id === selectedTrainerId) || trainers?.[0];

  const latestSub = activeMember?.subscriptions?.[0];
  const daysRemaining = latestSub
    ? Math.max(0, Math.ceil((new Date(latestSub.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  const handleMemberBookClass = async (scheduleId: string) => {
    if (!activeMember) return;
    try {
      await apiFetch('/classes/book', {
        method: 'POST',
        body: JSON.stringify({ scheduleId, memberId: activeMember.id }),
      });
      showSuccess(`Berhasil booking kelas untuk ${activeMember.fullName}!`, 'Booking Berhasil');
      setPortalMsg(`✓ Berhasil booking kelas untuk ${activeMember.fullName}!`);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Booking');
    }
  };

  const handleMemberSelfLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;
    try {
      await apiFetch(`/members/${activeMember.id}/leaves`, {
        method: 'POST',
        body: JSON.stringify({
          leaveType: 'SCHEDULED',
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason,
          actorName: `${activeMember.fullName} (Self-Service Portal)`,
        }),
      });
      showSuccess('Permohonan cuti online berhasil diajukan dan memperpanjang masa aktif paket Anda!', 'Pengajuan Cuti Sukses');
      setPortalMsg('✓ Permohonan cuti online berhasil diajukan dan memperpanjang masa aktif paket Anda!');
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Ajukan Cuti');
    }
  };

  const handleTrainerQuickSignOff = async (contractId: string, memberName: string) => {
    try {
      await apiFetch('/trainers/sign-off', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          musclesTrained: 'Full Body Functional & Core Conditioning',
          weightLiftedNote: 'Progressive Overload Session via Portal Trainer',
          evaluationNote: 'Stamina dan eksekusi gerakan sangat baik',
          signedOffBy: activeTrainer?.fullName,
        }),
      });
      showSuccess(`Sesi latihan klien ${memberName} berhasil di-sign-off dari Portal Trainer!`, 'Sign-off Berhasil');
      setPortalMsg(`✓ Sesi latihan klien ${memberName} berhasil di-sign-off dari Portal Trainer!`);
      onRefresh();
    } catch (err: any) {
      showError(err.message, 'Gagal Sign-off');
    }
  };

  return (
    <div className="space-y-6">
      {portalMsg && (
        <div className="rounded-xl border border-[#FFC067]/40 bg-[#FFC067]/10 px-4 py-3 text-sm font-medium text-[#FFC067] flex items-center justify-between">
          <span>{portalMsg}</span>
          <button onClick={() => setPortalMsg('')} className="text-xs underline">
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ================= MODUL 11: PORTAL MEMBER (MOBILE SELF-SERVICE) ================= */}
        <div className="rounded-3xl border-2 border-white/[0.08] bg-[#121217]/95 p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#FFC067]" />
              <div>
                <h3 className="font-extrabold text-base">Portal Member (Self-Service PWA)</h3>
                <p className="text-[11px] text-slate-400">Simulasi tampilan aplikasi di ponsel anggota gym</p>
              </div>
            </div>
            <select
              value={activeMember?.id || ''}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="rounded-lg border border-white/[0.12] bg-[#09090B] px-2.5 py-1.5 text-xs"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberCode} — {m.fullName}
                </option>
              ))}
            </select>
          </div>

          {activeMember && (
            <>
              {/* Kartu Member Digital + QR Code */}
              <div className="rounded-2xl bg-gradient-to-br from-[#FFC067] via-orange-600 to-amber-700 p-5 text-slate-950 shadow-lg flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">
                    KAISAR GYM DIGITAL PASS
                  </div>
                  <div className="text-xl font-black">{activeMember.fullName}</div>
                  <div className="font-mono text-sm font-bold">{activeMember.memberCode}</div>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#09090B] text-[#FFC067] text-xs font-extrabold">
                      {activeMember.status}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1 text-slate-900">
                      <Clock className="w-3.5 h-3.5" /> Sisa {daysRemaining} Hari Aktif
                    </span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-inner flex flex-col items-center">
                  <QrCode className="w-16 h-16 text-slate-950" />
                  <span className="text-[9px] font-mono font-bold text-slate-700 mt-1">
                    SCAN GATE
                  </span>
                </div>
              </div>

              {/* Jadwal & Booking Kelas Studio */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#FFC067]" /> Jadwal Kelas Studio Minggu Ini (1-Click Book)
                </h4>
                <div className="space-y-2">
                  {classesData?.schedules?.slice(0, 3).map((sc: any) => (
                    <div
                      key={sc.id}
                      className="rounded-xl bg-[#09090B] border border-white/[0.08] p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-100">{sc.studioClass?.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {sc.startTime} - {sc.endTime} • {sc.trainer?.fullName} • Sisa{' '}
                          {sc.maxCapacity - sc.bookedCount} slot
                        </div>
                      </div>
                      <button
                        onClick={() => handleMemberBookClass(sc.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#FFC067] hover:bg-[#ffca7d] text-slate-950 font-bold text-xs"
                      >
                        Book Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Sesi PT Member */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#FFC067]" /> Kuota Sesi Personal Trainer Saya
                </h4>
                {activeMember.ptContracts?.length > 0 ? (
                  activeMember.ptContracts.map((c: any) => (
                    <div key={c.id} className="rounded-xl bg-[#09090B] border border-white/[0.08] p-3 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>{c.ptPackage?.name} ({c.trainer?.fullName})</span>
                        <span className="text-[#FFC067]">
                          Sisa {c.remainingSessions} / {c.totalSessions} Sesi
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Belum memiliki paket Personal Trainer aktif.</div>
                )}
              </div>

              {/* Pengajuan Cuti Mandiri */}
              <form
                onSubmit={handleMemberSelfLeave}
                className="rounded-xl bg-[#09090B] border border-white/[0.08] p-3.5 space-y-2.5 text-xs"
              >
                <div className="font-bold text-[#FFC067]">✈️  Pengajuan Cuti Online Mandiri</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="rounded bg-[#121217] border border-white/[0.12] px-2 py-1.5"
                  />
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="rounded bg-[#121217] border border-white/[0.12] px-2 py-1.5"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Alasan cuti..."
                    className="flex-1 rounded bg-[#121217] border border-white/[0.12] px-2.5 py-1.5"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[#FFC067] font-bold"
                  >
                    Ajukan Cuti
                  </button>
                </div>
              </form>

              {/* Pengumuman Gym */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-[#FFC067]" /> Pusat Pengumuman & Promo
                </h4>
                {announcements?.map((an: any) => (
                  <div key={an.id} className="rounded-xl bg-[#FFC067]/10 border border-[#FFC067]/30 p-3 text-xs">
                    <div className="font-bold text-[#FFC067]">{an.title}</div>
                    <div className="text-slate-300 text-[11px] mt-0.5">{an.content}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ================= MODUL 12: PORTAL TRAINER (PT SELF-SERVICE) ================= */}
        <div className="rounded-3xl border-2 border-white/[0.08] bg-[#121217]/95 p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="font-extrabold text-base">Portal Trainer (PT Self-Service)</h3>
                <p className="text-[11px] text-slate-400">Kelola klien, sign-off sesi & pantau komisi dari HP</p>
              </div>
            </div>
            <select
              value={activeTrainer?.id || ''}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="rounded-lg border border-white/[0.12] bg-[#09090B] px-2.5 py-1.5 text-xs"
            >
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {activeTrainer && (
            <>
              {/* Kartu Ringkasan Komisi Trainer */}
              <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-800 p-5 text-white shadow-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold opacity-80">{activeTrainer.trainerType}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#09090B]/60 text-[#FFC067] text-xs font-bold">
                    {activeTrainer.metrics?.currentTier}
                  </span>
                </div>
                <div className="text-xl font-black">{activeTrainer.fullName}</div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20 text-xs">
                  <div>
                    <div className="opacity-75">Total Sesi Bulan Ini</div>
                    <div className="text-lg font-extrabold">
                      {activeTrainer.metrics?.completedSessionsThisMonth} Sesi
                    </div>
                  </div>
                  <div>
                    <div className="opacity-75">Estimasi Komisi Diterima</div>
                    <div className="text-lg font-extrabold text-[#FFC067]">
                      {formatRp(activeTrainer.metrics?.totalEstimatedTakeHome)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Daftar Klien Aktif & Sign-Off Sesi Langsung */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daftar Klien Aktif & 1-Klik Sign-Off Sesi
                </h4>
                {activeTrainer.ptContracts?.map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-[#09090B] border border-white/[0.08] p-3.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{c.member?.fullName}</div>
                      <div className="text-slate-400">
                        Paket: {c.ptPackage?.name} • Sisa Kuota:{' '}
                        <strong className="text-[#FFC067]">{c.remainingSessions} Sesi</strong>
                      </div>
                    </div>
                    {c.remainingSessions > 0 && (
                      <button
                        onClick={() => handleTrainerQuickSignOff(c.id, c.member?.fullName)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Selesaikan Sesi
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Log Latihan Terakhir */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Riwayat Workout Log Klien Terbaru
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeTrainer.ptSessionLogs?.map((log: any) => (
                    <div key={log.id} className="rounded-xl bg-[#09090B] border border-white/[0.08] p-3 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-[#FFC067]">
                        <span>{log.member?.fullName} — {log.musclesTrained}</span>
                        <span className="text-slate-500">{formatDateId(log.sessionDate)}</span>
                      </div>
                      <div className="text-slate-300">{log.weightLiftedNote}</div>
                      <div className="text-[11px] text-slate-400 italic">&ldquo;{log.evaluationNote}&rdquo;</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


