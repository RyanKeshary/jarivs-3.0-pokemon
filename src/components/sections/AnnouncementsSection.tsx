'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Radio, Megaphone, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_active?: boolean;
  priority?: string;
}

interface AnnouncementsSectionProps {
  initialNotices?: NoticeItem[];
}

export function AnnouncementsSection({ initialNotices = [] }: AnnouncementsSectionProps) {
  const [notices, setNotices] = useState<NoticeItem[]>(initialNotices);
  const [loading, setLoading] = useState(initialNotices.length === 0);

  // Initial fetch and Realtime sync from Supabase
  useEffect(() => {
    const supabase = createClient();

    const fetchNotices = async () => {
      try {
        // Query fest_announcements first
        const { data: festData, error: festError } = await supabase
          .from('fest_announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!festError && festData && festData.length > 0) {
          setNotices(festData);
        } else {
          // Fallback to announcements table
          const { data: altData } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });
          if (altData && altData.length > 0) {
            setNotices(altData);
          }
        }
      } catch (e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();

    // Subscribe to fest_announcements realtime
    const channel1 = supabase
      .channel('fest_announcements_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fest_announcements' },
        () => {
          fetchNotices();
        }
      )
      .subscribe();

    // Subscribe to announcements realtime
    const channel2 = supabase
      .channel('announcements_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchNotices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, []);

  return (
    <section
      id="announcements"
      className="relative z-10 py-16 px-4 sm:px-6 bg-[#FAF9F5] text-black border-t-2 border-black scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-black">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] animate-pulse border border-black" />
              <span className="font-mono text-xs text-neutral-600 uppercase tracking-widest font-bold">
                BROADCAST PROTOCOL · REALTIME DISPATCH
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-sans uppercase tracking-tight text-black">
              Official Notices & Bulletins
            </h2>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-black text-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold tracking-wider">LIVE FREQUENCY</span>
          </div>
        </div>

        {/* Notices Board Container */}
        <div className="mt-8 bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-4 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-black/20 mb-4 text-xs font-mono">
            <div className="flex items-center gap-2 font-bold uppercase text-neutral-800">
              <Megaphone size={15} className="text-[#D21319]" />
              <span>Indigo Tech Fest Central Bulletin</span>
            </div>
            <span className="text-[11px] text-neutral-500">
              {notices.length} Notice{notices.length === 1 ? '' : 's'} Published
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Establishing connection with central broadcast...</span>
            </div>
          ) : notices.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500 space-y-2">
              <Radio size={28} className="mx-auto opacity-40 text-black" />
              <p className="font-bold uppercase tracking-wider text-black">No Active Announcements</p>
              <p className="text-[11px] text-neutral-600">
                Listening for incoming broadcasts from the Convocation Committee...
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {notices.map((notice, idx) => (
                <motion.div
                  key={notice.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="p-4 bg-[#FAF9F5] border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D21319]" />
                      <h3 className="font-sans font-black text-sm sm:text-base text-black uppercase">
                        {notice.title}
                      </h3>
                      {notice.priority === 'urgent' && (
                        <span className="px-1.5 py-0.5 bg-[#D21319] text-white text-[9px] font-mono font-bold uppercase border border-black">
                          URGENT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-600 shrink-0">
                      <Clock size={12} />
                      <span suppressHydrationWarning>
                        {new Date(notice.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-sans whitespace-pre-line pl-4 border-l-2 border-[#D21319]">
                    {notice.content}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
