'use client';

import React, { useState, useEffect } from 'react';
import { IndigoAdminDashboard } from '@/components/admin/IndigoAdminDashboard';
import { AdminLoginCard } from '@/components/admin/AdminLoginCard';
import { getFestAdminData } from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/client';

interface AdminClientProps {
  initialData: any | null;
  isAuthenticated: boolean;
}

export function AdminClient({ initialData, isAuthenticated }: AdminClientProps) {
  const [data, setData] = useState(initialData);
  const [authed, setAuthed] = useState(isAuthenticated);
  const [verifying, setVerifying] = useState(false);

  // If server SSR didn't have authenticated session, check client-side browser session
  useEffect(() => {
    if (authed && data) return;
    let isMounted = true;

    const checkClientSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setVerifying(true);
          const fresh = await getFestAdminData();
          if (fresh && isMounted) {
            setData(fresh);
            setAuthed(true);
          }
        }
      } catch (err) {
        // Not authenticated or lacks admin privileges
      } finally {
        if (isMounted) setVerifying(false);
      }
    };

    checkClientSession();
    return () => {
      isMounted = false;
    };
  }, [authed, data]);

  const handleLoginSuccess = (newData?: any) => {
    if (newData) {
      setData(newData);
      setAuthed(true);
    } else {
      getFestAdminData()
        .then((fresh) => {
          if (fresh) {
            setData(fresh);
            setAuthed(true);
          } else {
            window.location.href = '/admin';
          }
        })
        .catch(() => {
          window.location.href = '/admin';
        });
    }
  };

  const handleRefresh = async () => {
    try {
      const fresh = await getFestAdminData();
      if (fresh) {
        setData(fresh);
      }
    } catch (err) {
      console.error('Failed to background refresh data:', err);
    }
  };

  // Live real-time background sync: Supabase changes + 5s polling fallback + custom event sync
  useEffect(() => {
    if (!authed) return;
    const supabase = createClient();
    const channel = supabase
      .channel('admin-live-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fest_announcements' }, () => {
        handleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        handleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fest_registrations' }, () => {
        handleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fest_teams' }, () => {
        handleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        handleRefresh();
      })
      .subscribe();

    const interval = setInterval(() => {
      handleRefresh();
    }, 5000);

    const handleLocalSync = () => {
      handleRefresh();
    };
    window.addEventListener('fest_announcement_updated', handleLocalSync);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('fest_announcement_updated', handleLocalSync);
    };
  }, [authed]);

  if (verifying && !authed) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="text-center font-mono text-xs tracking-widest uppercase text-neutral-600 animate-pulse">
          [ AUTHENTICATING CONSOLE SESSION... ]
        </div>
      </div>
    );
  }

  if (!authed || !data) {
    return <AdminLoginCard onLoginSuccess={handleLoginSuccess} />;
  }

  return <IndigoAdminDashboard data={data} onRefresh={handleRefresh} />;
}

