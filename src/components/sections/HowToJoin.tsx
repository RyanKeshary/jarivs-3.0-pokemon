'use client';

import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Squad Formation & Event Scoping',
    desc: 'The squad captain selects the target disciplines, registers verified contact credentials, and establishes the squad alias. Solo participants in individual events complete enrollment in a single friction-free step.',
    actionLabel: 'CAPTAIN PROTOCOL',
  },
  {
    number: '02',
    title: 'Unique Roster Code Dispatch',
    desc: 'The registry automatically mints a distinct alphanumeric squad token formatted as JRV-XXXX (for example, JRV-9K2M). Share this token or your direct roster link with squad teammates to invite them.',
    actionLabel: 'ROSTER DISPATCH',
  },
  {
    number: '03',
    title: 'Teammates Verify & Roster Seals',
    desc: 'Invited teammates open the link, confirm remaining discipline slots, and register their details. Once the maximum team threshold is reached, the roster locks with instant confirmation.',
    actionLabel: 'ALLIANCE SEAL',
  },
];

export function HowToJoin({ onRegisterClick }: { onRegisterClick: () => void }) {
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
  return (
    <section id="join" className="relative w-full py-20 sm:py-28 bg-white/30 backdrop-blur-sm select-none border-b border-black/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Curatorial Header */}
        <div className="border-b border-black/20 pb-5 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-[#D21319]" />
            <span className="font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase">
              METHODUS · PLATE V
            </span>
          </div>
          <h2 className="font-sans text-3xl sm:text-5xl text-black uppercase font-black tracking-tight">
            HOW TO ENTER THE ARENA
          </h2>
          <p className="font-sans text-xs sm:text-sm text-neutral-700 mt-1">
            Three disciplined protocols for squad captains and incoming candidates.
          </p>
        </div>

        {/* Vertical Numbered Sequence */}
        <div className="space-y-4">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="border-2 border-black bg-white shadow-[6px_6px_0px_#000] p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6 hover:shadow-[8px_8px_0px_#D21319] hover:-translate-y-0.5 transition-all"
            >
              {/* Number in Large Serif */}
              <div className="min-w-[70px]">
                <span className="font-sans text-4xl sm:text-6xl text-[#D21319] font-black block leading-none">
                  {step.number}
                </span>
                <span className="font-mono text-[9px] font-bold text-neutral-500 mt-1 block">
                  PHASE 0{idx + 1}
                </span>
              </div>

              {/* Vertical Hairline Divider */}
              <div className="hidden sm:block w-[2px] self-stretch bg-black/10" />

              {/* Step Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <h3 className="font-sans text-xl sm:text-2xl text-black font-bold">
                    {step.title}
                  </h3>
                  <span className="font-mono text-[10px] font-bold border-2 border-black px-2 py-0.5 bg-neutral-100 text-black uppercase shadow-[2px_2px_0px_#000]">
                    {step.actionLabel}
                  </span>
                </div>
                <p className="font-sans text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="mt-10 text-center">
          {hasMaxEvents ? (
            <div className="inline-block px-8 py-3.5 bg-neutral-100 text-neutral-800 font-sans font-black text-xs uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_#000]">
              <span>EVENT REGISTRATION COMPLETE (2/2 ENROLLED)</span>
            </div>
          ) : (
            <button
              onClick={onRegisterClick}
              className="px-8 py-3.5 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>COMMENCE SQUAD ENLISTMENT</span>
              <span>→</span>
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
