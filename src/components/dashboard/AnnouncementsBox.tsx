'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Radio, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Announcement } from '@/lib/database.types';

interface AnnouncementsBoxProps {
  initialAnnouncements: Announcement[];
}

export function AnnouncementsBox({ initialAnnouncements }: AnnouncementsBoxProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          setAnnouncements((prev) => [payload.new as Announcement, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-[#1E232A] text-white rounded-xl border-3 border-[#334155] p-4 flex flex-col h-full shadow-[4px_4px_0px_#1E232A] overflow-hidden">
      {/* Box Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-700 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#FFCB05]" />
          <h3 className="font-pixel text-[11px] text-[#FFCB05] tracking-wider uppercase">
            BOX 1: ANNOUNCEMENTS
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 rounded border border-gray-600 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Announcements List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
        {announcements.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 font-mono">
            <Radio size={24} className="mb-2 opacity-50" />
            <p>No broadcasts from the League yet.</p>
            <p className="text-[10px]">Listening for incoming signals...</p>
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-all ${
                item.priority === 'urgent'
                  ? 'bg-red-950/40 border-red-500/80 text-red-100'
                  : 'bg-gray-800/60 border-gray-700 text-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-pixel text-[10px] text-white flex items-center gap-1.5">
                  {item.priority === 'urgent' && (
                    <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[8px] font-bold">
                      URGENT
                    </span>
                  )}
                  {item.title}
                </span>
                <span className="text-[9px] font-mono text-gray-400 shrink-0" suppressHydrationWarning>
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed font-sans">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
