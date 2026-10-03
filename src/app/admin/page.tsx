import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminData } from '@/app/actions/admin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Indigo Plateau Command | Kento League 3.0 Admin',
  description: 'Administrator panel for Kento League · Jarvis Hackathon 3.0',
};

export default async function AdminPage() {
  let data;
  try {
    data = await getAdminData();
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    redirect('/dashboard');
  }

  if (!data) {
    redirect('/dashboard');
  }

  return <AdminDashboard data={data} />;
}
