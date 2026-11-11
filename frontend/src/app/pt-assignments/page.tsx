'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import PtAssignmentsView from '@/components/PtAssignmentsView';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function PtAssignmentsPage() {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [ptPackages, setPtPackages] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsRes, trainersRes, membersRes, catalogRes] = await Promise.all([
        apiFetch('/trainers/assignments'),
        apiFetch('/trainers'),
        apiFetch('/members'),
        apiFetch('/pos/catalog'),
      ]);

      setAssignments(assignmentsRes || []);
      setTrainers(trainersRes || []);
      setMembers(membersRes?.members || (Array.isArray(membersRes) ? membersRes : []));
      setPtPackages(catalogRes?.ptPackages || []);
    } catch (err: any) {
      console.error('Error loading PT assignments data:', err);
      showError(err?.message || 'Gagal memuat data PT Assignments', 'Gagal Memuat Data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <PtAssignmentsView
        assignments={assignments}
        trainers={trainers}
        members={members}
        ptPackages={ptPackages}
        onRefresh={loadData}
      />
    </AppShell>
  );
}
