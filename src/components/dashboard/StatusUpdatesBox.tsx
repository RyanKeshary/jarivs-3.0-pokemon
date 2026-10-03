'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { StatusUpdate } from '@/lib/database.types';

interface StatusUpdatesBoxProps {
  initialUpdates: StatusUpdate[];
  teamId?: string;
}

export function StatusUpdatesBox({ initialUpdates, teamId }: StatusUpdatesBoxProps) {
  const [updates, setUpdates] = useState<StatusUpdate[]>(initialUpdates);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('status-updates-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'status_updates' },
        (payload) => {
          const newUpdate = payload.new as StatusUpdate;
          if (!teamId || newUpdate.team_id === teamId || !newUpdate.team_id) {
            setUpdates((prev) => [newUpdate, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  return (
    <div className="bg-[#1E232A] text-white rounded-xl border-3 border-[#334155] p-4 flex flex-col h-full shadow-[4px_4px_0px_#1E232A] overflow-hidden">
      {/* Box Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#3B4CCA]" />
          <h3 className="font-pixel text-[11px] text-[#3B4CCA] tracking-wider uppercase">
            BOX 2: STATUS UPDATES
          </h3>
        </div>
        <span className="text-[10px] font-mono text-gray-400">TEAM & ARENA SYNC</span>
      </div>

      {/* Updates List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
        {updates.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 font-mono">
            <Activity size={24} className="mb-2 opacity-50" />
            <p>No squad status logs recorded yet.</p>
            <p className="text-[10px]">Team milestones and submissions appear here.</p>
          </div>
        ) : (
          updates.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-800/60 rounded-lg border border-gray-700 flex items-start gap-2.5"
            >
              <div className="mt-0.5 shrink-0">
                {item.status === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : item.status === 'warning' ? (
                  <AlertCircle size={16} className="text-amber-400" />
                ) : (
                  <ShieldCheck size={16} className="text-[#3B4CCA]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-[10px] text-white truncate">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 shrink-0">
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1 font-sans">{item.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
