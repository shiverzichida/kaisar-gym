'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import SelfServicePortalsView from '@/components/SelfServicePortalsView';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PortalsPage() {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [memRes, trRes, clsRes, anRes] = await Promise.all([
        apiFetch('/members'),
        apiFetch('/trainers'),
        apiFetch('/classes'),
        apiFetch('/finance/analytics'),
      ]);
      setMembers(memRes);
      setTrainers(trRes);
      setClassesData(clsRes);
      setAnnouncements(anRes?.announcements || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      {/* Banner Link to Independent Portal App */}
      <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#FFC067]/15 via-[#0F172A] to-cyan-950/40 border border-[#FFC067]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFC067]/20 border border-[#FFC067]/40 flex items-center justify-center text-[#FFC067] font-black shrink-0">
            KG
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Web Portal Resmi (kaisargym.com)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                PORT 3001 • ONLINE
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Web app terpisah untuk Member &amp; Coach PT dengan Landing Page mewah, E-Card digital, booking studio, dan 1-klik sign-off.
            </p>
          </div>
        </div>

        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFC067] to-[#E5A850] text-slate-950 font-black text-xs shadow-gold shrink-0 flex items-center gap-1.5 transition hover:scale-105"
        >
          <span>Buka kaisargym.com (Port 3001)</span>
          <span>↗</span>
        </a>
      </div>

      <SelfServicePortalsView
        members={members}
        trainers={trainers}
        classesData={classesData}
        announcements={announcements}
        onRefresh={loadData}
      />
    </AppShell>
  );
}
