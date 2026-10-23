'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import DashboardOverview from '@/components/DashboardOverview';
import { apiFetch } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

export default function KaisarGymDashboard() {
  const router = useRouter();

  const [posCatalog, setPosCatalog] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>('');

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const [
        catalogRes,
        membersRes,
        groupsRes,
        trainersRes,
        classesRes,
        attendanceRes,
        financeRes,
        analyticsRes,
      ] = await Promise.all([
        apiFetch('/pos/catalog'),
        apiFetch('/members'),
        apiFetch('/groups'),
        apiFetch('/trainers'),
        apiFetch('/classes'),
        apiFetch('/attendance'),
        apiFetch('/finance/overview'),
        apiFetch('/finance/analytics'),
      ]);

      setPosCatalog(catalogRes);
      setMembers(membersRes);
      setGroups(groupsRes);
      setTrainers(trainersRes);
      setClassesData(classesRes);
      setAttendanceLogs(attendanceRes);
      setFinanceData(financeRes);
      setAnalyticsData(analyticsRes);
    } catch (err: any) {
      setApiError(err.message || 'Gagal terhubung ke Backend API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleNavigate = (tab: string, label?: string) => {
    if (label?.toLowerCase().includes('invoice') || label?.toLowerCase().includes('nota')) {
      router.push('/invoices');
      return;
    }
    switch (tab) {
      case 'BILLING':
        router.push('/pos');
        break;
      case 'MEMBERS':
        router.push('/members');
        break;
      case 'CLASSES':
        router.push('/classes');
        break;
      case 'PRODUCTS':
        router.push('/inventory');
        break;
      case 'SETTINGS':
        router.push('/gate');
        break;
      case 'PORTALS':
        router.push('/portals');
        break;
      default:
        router.push('/');
        break;
    }
  };

  return (
    <AppShell onRefresh={loadAllData} loading={loading}>
      {apiError && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button onClick={loadAllData} className="underline text-[11px]">
            Coba Lagi
          </button>
        </div>
      )}

      <DashboardOverview
        members={members}
        groups={groups}
        trainers={trainers}
        posCatalog={posCatalog}
        classesData={classesData}
        attendanceLogs={attendanceLogs}
        financeData={financeData}
        analyticsData={analyticsData}
        onNavigate={handleNavigate}
        onRefresh={loadAllData}
      />
    </AppShell>
  );
}
