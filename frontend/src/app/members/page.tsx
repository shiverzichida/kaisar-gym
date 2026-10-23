'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import MembersAndGroupsView from '@/components/MembersAndGroupsView';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function MembersContent() {
  const { currentUser } = useAuth();
  const { showSuccess } = useToast();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const newMemberCode = searchParams.get('newMember');
  const hasNotifiedRef = useRef(false);

  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (newMemberCode && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      showSuccess(
        `Member baru ${newMemberCode} berhasil terdaftar dan masuk ke daftar sistem!`,
        'Pendaftaran Sukses',
        2500
      );
    }
  }, [newMemberCode, showSuccess]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [memRes, grpRes, catRes] = await Promise.all([
        apiFetch('/members'),
        apiFetch('/groups'),
        apiFetch('/pos/catalog'),
      ]);
      setMembers(memRes);
      setGroups(grpRes);
      setPackages(catRes?.packages || []);
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
      <MembersAndGroupsView
        members={members}
        groups={groups}
        packages={packages}
        currentUser={currentUser}
        initialSearch={initialQ}
        onRefresh={loadData}
      />
    </AppShell>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat CRM Member...</div>}>
      <MembersContent />
    </Suspense>
  );
}
