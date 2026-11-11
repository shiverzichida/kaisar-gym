'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import PosCashierView from '@/components/PosCashierView';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function PosPage() {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const [catalog, setCatalog] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, memRes] = await Promise.all([
        apiFetch('/pos/catalog'),
        apiFetch('/members'),
      ]);
      setCatalog(catRes);
      setMembers(memRes);
    } catch (err: any) {
      console.error(err);
      showError(err?.message || 'Gagal memuat katalog POS', 'Gagal Memuat Data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppShell onRefresh={loadData} loading={loading}>
      <PosCashierView
        catalog={catalog}
        members={members}
        currentUser={currentUser}
        onRefresh={loadData}
      />
    </AppShell>
  );
}
