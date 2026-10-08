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

  const handleRefresh = () => {
    window.location.reload();
  };

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

