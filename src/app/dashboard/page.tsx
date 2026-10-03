import React from 'react';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/app/actions/dashboard';
import { VideoPhoneDashboard } from '@/components/dashboard/VideoPhoneDashboard';

export const metadata = {
  title: 'Pokémon Center Terminal | Kento League 3.0',
  description: 'Trainer Video-Phone Command Terminal and Pokédex',
};

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardData();
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    redirect('/auth?mode=login');
  }

  if (!data || !data.profile) {
    redirect('/auth?mode=login');
  }

  return (
    <VideoPhoneDashboard
      profile={data.profile}
      team={data.team}
      teamMembers={data.teamMembers}
      socialLinks={data.socialLinks}
      announcements={data.announcements}
      statusUpdates={data.statusUpdates}
      problemStatements={data.problemStatements}
      submissions={data.submissions}
      eventSettings={data.eventSettings}
    />
  );
}
