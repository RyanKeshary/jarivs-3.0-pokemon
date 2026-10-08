'use client';

import React, { useState } from 'react';
import { IndigoAdminDashboard } from '@/components/admin/IndigoAdminDashboard';
import { AdminLoginCard } from '@/components/admin/AdminLoginCard';

interface AdminClientProps {
  initialData: any | null;
  isAuthenticated: boolean;
}

export function AdminClient({ initialData, isAuthenticated }: AdminClientProps) {
  const [data, setData] = useState(initialData);
  const [authed, setAuthed] = useState(isAuthenticated);

  const handleLoginSuccess = (newData?: any) => {
    if (newData) {
      setData(newData);
      setAuthed(true);
    } else {
      window.location.reload();
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!authed || !data) {
    return <AdminLoginCard onLoginSuccess={handleLoginSuccess} />;
  }

  return <IndigoAdminDashboard data={data} onRefresh={handleRefresh} />;
}
