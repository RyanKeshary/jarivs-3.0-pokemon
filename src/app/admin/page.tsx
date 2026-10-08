import React from 'react';
import { getFestAdminData } from '@/app/actions/admin';
import { AdminClient } from '@/components/admin/AdminClient';

export const metadata = {
  title: 'Administrator Console · Indigo Tech Fest (Jarvis 3.0)',
  description: 'Master administrative suite for Indigo Tech Fest.',
};

export default async function AdminPage() {
  let data = null;
  let isAuthenticated = false;

  try {
    data = await getFestAdminData();
    isAuthenticated = true;
  } catch (err: any) {
    // Not authenticated yet
    isAuthenticated = false;
  }

  return <AdminClient initialData={data} isAuthenticated={isAuthenticated} />;
}
