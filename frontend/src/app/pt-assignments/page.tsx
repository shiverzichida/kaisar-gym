'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import PtAssignmentsView from '@/components/PtAssignmentsView';
import { apiFetch } from '@/lib/api';

export default function PtAssignmentsPage() {
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
    } catch (err) {
      console.error('Error loading PT assignments data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
