'use client';

import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Squad Formation',
    desc: 'Captain selects target disciplines, registers verified contact credentials, and establishes squad alias. Solo candidates complete enrollment in one step.',
    actionLabel: 'CAPTAIN PROTOCOL',
  },
  {
    number: '02',
    title: 'Roster Code Dispatch',
    desc: 'The registry automatically mints a distinct alphanumeric token (e.g. JRV-9K2M). Share this token or direct roster link to invite teammates.',
    actionLabel: 'ROSTER DISPATCH',
  },
  {
    number: '03',
    title: 'Alliance Seal',
    desc: 'Invited teammates open the link, confirm remaining slots, and register their details. The roster locks with instant confirmation.',
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
    <section id="how-to-join" className="relative w-full py-10 sm:py-14 bg-[#dcecfe]/45 backdrop-blur-sm select-none border-b border-black/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Curatorial Header */}
        <div className="border-b border-black/20 pb-3 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-[#D21319]" />
              <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-600 uppercase">
                METHODUS · ENLISTMENT PROTOCOL
              </span>
            </div>
            <h2 className="font-sans text-2xl sm:text-4xl text-black uppercase font-black tracking-tight leading-none">
              HOW TO ENTER THE ARENA
            </h2>
          </div>
          <p className="font-sans text-xs text-neutral-600">
            Three sequential stages for squad captains and candidates.
          </p>
        </div>

        {/* 3 Steps in a Sleek 3-Column Grid to drastically reduce height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="border-2 border-black bg-white shadow-[4px_4px_0px_#000] p-4 sm:p-5 flex flex-col justify-between hover:shadow-[5px_5px_0px_#D21319] hover:-translate-y-0.5 transition-all"
            >
              <div>
                {/* Top Row: Big Number + Pill Label */}
                <div className="flex items-center justify-between mb-3 border-b border-black/10 pb-2">
                  <span className="font-sans text-3xl sm:text-4xl text-[#D21319] font-black leading-none">
                    {step.number}
                  </span>
                  <span className="font-mono text-[9px] font-bold border border-black px-2 py-0.5 bg-neutral-100 text-black uppercase shadow-[1px_1px_0px_#000]">
                    {step.actionLabel}
                  </span>
                </div>

                <h3 className="font-sans text-base font-bold text-black mb-1.5">
                  {step.title}
                </h3>

                <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>PHASE 0{idx + 1}</span>
                <span className="text-[#D21319]">ACTIVE ➔</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="text-center">
          {hasMaxEvents ? (
            <div className="inline-block px-6 py-2.5 bg-neutral-100 text-neutral-800 font-sans font-black text-xs uppercase tracking-widest border border-black shadow-[3px_3px_0px_#000]">
              <span>EVENT REGISTRATION COMPLETE (2/2 ENROLLED)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRegisterClick}
              className="px-6 py-2.5 bg-[#D21319] hover:bg-[#a80d12] text-white font-sans font-black text-xs uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
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
