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
    a: 'Competitions including Quiz-tle, Build-asor, and Cad-Mander span both 16 Oct (Day 1) and 17 Oct (Day 2). Enlisting once covers the entire tournament arc. Candidates advancing to Day 2 stages are automatically seeded into the adjudication registry.'
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
    <section id="faq" className="relative w-full py-20 sm:py-28 bg-white/30 backdrop-blur-sm select-none border-b border-black/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Curatorial Header */}
        <div className="border-b border-black/20 pb-5 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-[#D21319]" />
            <span className="font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase">
              QUAESTIONES FREQUENTES · PLATE VI
            </span>
          </div>
          <h2 className="font-sans text-3xl sm:text-5xl text-black uppercase font-black tracking-tight">
            FREQUENTLY ASKED INQUIRIES
          </h2>
        </div>

        {/* Clean Accordion */}
        <div className="border-2 border-black divide-y-2 divide-black/10 bg-white shadow-[6px_6px_0px_#000] mb-16">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx}>
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span className="font-sans text-base sm:text-lg text-black font-bold pr-2">
                    {item.q}
                  </span>
                  <span className="font-mono text-xs text-[#D21319] font-black mt-1">
                    {isOpen ? '[ — ]' : '[ + ]'}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t-2 border-black/10 bg-neutral-50"
                    >
                      <p className="p-5 sm:p-6 text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* CLOSING CONVOCATION FINALE CARD */}
        <div className="border-2 border-black bg-black text-white p-8 sm:p-14 text-center relative shadow-[8px_8px_0px_#D21319]">
          {/* Engraved Phoenix Motif */}
          <div className="flex justify-center mb-6">
            <EngravedPhoenix size={130} className="w-28 sm:w-36 opacity-90" />
          </div>

          <span className="font-mono text-[10px] text-neutral-400 block mb-2 tracking-[0.3em] uppercase">
            CONVOCATION FINALE · CODEX MMXXVI
          </span>

          <h2 className="font-sans text-4xl sm:text-6xl text-[#D21319] uppercase font-black tracking-tight mb-4">
            ENLIST IN THE CODEX
          </h2>

          <p className="font-sans text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto leading-relaxed mb-8">
            The grand convocation of Indigo Tech Fest (Jarvis 3.0) awaits. Mobilize your squad, secure your chosen disciplines, and compete on 16 and 17 October 2026.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {hasMaxEvents ? (
              <div className="w-full sm:w-auto px-10 py-4 bg-neutral-900 text-[#E9E6DA] font-sans font-black text-xs tracking-widest uppercase border-2 border-[#AFAEA2]/40 shadow-[4px_4px_0px_#000]">
                <span>REGISTRATION COMPLETE (2/2 EVENTS ENROLLED)</span>
              </div>
            ) : (
              <button
                onClick={onRegisterClick}
                className="w-full sm:w-auto px-10 py-4 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs tracking-widest uppercase border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>ENROLL YOUR SQUAD NOW</span>
                <span>→</span>
              </button>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-[#AFAEA2]/20 text-xs text-[#AFAEA2] font-mono">
            VENUE: SLRTCE CAMPUS, MIRA ROAD, MUMBAI · OCTOBER 16–17, 2026
          </div>
        </div>

      </div>
    </section>
  );
}
