'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EngravedPhoenix } from '@/components/illustrations/EngravedPokemon';

const FAQS = [
  {
    q: 'Can a candidate register for multiple festival disciplines?',
    a: 'Yes, provided the scheduled time slots do not overlap on a given day. The registration engine automatically runs a clash detection algorithm to warn you if chosen disciplines conflict.'
  },
  {
    q: 'How does progression work for two-day disciplines?',
    a: 'Competitions including Quiz-tle, Builda-saur, and Cad-Mander span both 16 Oct (Day 1) and 17 Oct (Day 2). Enlisting once covers the entire tournament arc. Candidates advancing to Day 2 stages are automatically seeded into the adjudication registry.'
  },
  {
    q: 'Is there an entry fee or registration tariff?',
    a: 'None. Indigo Tech Fest: Jarvis 3.0 is completely complimentary for all verified collegiate engineering students.'
  },
  {
    q: 'What occurs if our squad has not reached full capacity before the deadline?',
    a: 'Teams must meet the minimum candidate threshold designated for the event (e.g., exactly two members for Quiz-tle). Squads falling below requirements upon deadline lock may be moved to the standby list.'
  },
  {
    q: 'What credentials or materials should participants carry to the venue?',
    a: 'Bring your official college photo identification card, verified squad token (JRV-XXXX), personal laptops with required offline environments, and hardware prototypes for exhibition or robotics trials.'
  }
];

export function FaqAndCta({ onRegisterClick }: { onRegisterClick: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [hasMaxEvents, setHasMaxEvents] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      if (typeof window !== 'undefined') {
        const isLoggedOut = localStorage.getItem('indigo_logged_out') === 'true';
        const isReg = !isLoggedOut && localStorage.getItem('indigo_user_registered') === 'true';
        const eventsCount = parseInt(localStorage.getItem('indigo_user_events_count') || '0', 10);
        setHasMaxEvents(isReg || eventsCount >= 2);
      }
    };

    checkStatus();
    window.addEventListener('storage', checkStatus);
    window.addEventListener('auth_state_change', checkStatus);
    return () => {
      window.removeEventListener('storage', checkStatus);
      window.removeEventListener('auth_state_change', checkStatus);
    };
  }, []);

  const toggle = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="relative w-full py-10 sm:py-14 bg-white/30 backdrop-blur-sm select-none border-b border-black/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Curatorial Header */}
        <div className="border-b border-black/20 pb-3 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-[#D21319]" />
            <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-600 uppercase">
              QUAESTIONES FREQUENTES · PLATE VI
            </span>
          </div>
          <h2 className="font-sans text-2xl sm:text-4xl text-black uppercase font-black tracking-tight leading-none">
            FREQUENTLY ASKED INQUIRIES
          </h2>
        </div>

        {/* Compact Clean Accordion */}
        <div className="border-2 border-black divide-y-2 divide-black/10 bg-white shadow-[4px_4px_0px_#000] mb-8">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left py-3 px-4 sm:px-5 flex items-start justify-between gap-3 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span className="font-sans text-sm sm:text-base text-black font-bold pr-2">
                    {item.q}
                  </span>
                  <span className="font-mono text-xs text-[#D21319] font-black shrink-0 mt-0.5">
                    {isOpen ? '[ — ]' : '[ + ]'}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.16 }}
                      className="overflow-hidden border-t border-black/10 bg-[#FAF8F5]"
                    >
                      <p className="py-3 px-4 sm:px-5 text-xs sm:text-[13px] text-neutral-700 font-sans leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* REDESIGNED ELEGANT LIGHT THEME CONVOCATION FINALE CARD */}
        <div className="border-2 border-black bg-[#FAF8F5] text-black p-6 sm:p-10 text-center relative shadow-[5px_5px_0px_#000]">
          
          {/* Engraved Phoenix Motif */}
          <div className="flex justify-center mb-3">
            <EngravedPhoenix size={95} className="w-20 sm:w-24 opacity-95" />
          </div>

          <span className="font-mono text-[10px] text-[#D21319] block mb-1.5 tracking-[0.25em] font-bold uppercase">
            CONVOCATION FINALE · JARVIS 3.0
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl text-black uppercase font-black tracking-tight mb-2.5">
            ENLIST IN THE ARENA
          </h2>

          <p className="font-sans text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed mb-6">
            The grand convocation of Indigo Tech Fest (Jarvis 3.0) awaits. Mobilize your squad, secure your chosen disciplines, and compete on 16 and 17 October 2026.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {hasMaxEvents ? (
              <div className="w-full sm:w-auto px-8 py-3 bg-neutral-100 text-neutral-800 font-sans font-black text-xs tracking-wider uppercase border border-black shadow-[2px_2px_0px_#000]">
                <span>REGISTRATION COMPLETE (2/2 EVENTS ENROLLED)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onRegisterClick}
                className="w-full sm:w-auto px-8 py-3 bg-[#D21319] hover:bg-black text-white font-sans font-black text-xs tracking-wider uppercase border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#D21319] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>ENLIST UR TEAM NOW</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
