'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_1_SCHEDULE = [
  {
    event: 'Poké Expo',
    desc: 'Hardware apparatus demonstrations and software project benches open for examination.',
    location: 'Exhibition Hall A',
  },
  {
    event: 'PID-Geotto — Line Follower Race',
    desc: 'Autonomous wheeled vehicles navigate black stripe tracks with precision control.',
    location: 'Robotics Arena',
  },
  {
    event: 'PokéQuest — Treasure Hunt',
    desc: 'Campus riddle challenge and clue-tracking across active campus checkpoints.',
    location: 'Campus Grounds',
  },
  {
    event: 'Quiz-tle — Tech Knowledge Tournament',
    desc: 'Technical quiz preliminary rounds, written qualifiers, and buzzer stages.',
    location: 'Auditorium',
  },
  {
    event: 'Builda-Saur — Hackathon',
    desc: '24-hour innovation hackathon architecture kickoff and initial prototyping.',
    location: 'Lab 4 & Online',
  },
  {
    event: 'Snorreelax — Reel Making Competition',
    desc: 'Delivery of short-form documentary digital reels captured across festival grounds.',
    location: 'Media Studio',
  },
];

const DAY_2_SCHEDULE = [
  {
    event: 'Quiz-tle — Tech Knowledge Tournament',
    desc: 'Top qualifying finalist duos battle live on stage in rapid buzzer elimination rounds.',
    location: 'Main Stage',
  },
  {
    event: 'Builda-Saur — Hackathon',
    desc: 'Round 2 prototype completion, final debugging, and jury defense.',
    location: 'Lab 4',
  },
  {
    event: 'CAD-Mander — Parametric CAD Drafting & 2D Solid Assembly',
    desc: '2D AutoCAD engineering blueprints under geometric dimensioning and tolerancing.',
    location: 'CAD Lab 2',
  },
];

export function DaysTimeline() {
  const [selectedDay, setSelectedDay] = useState<'day1' | 'day2'>('day1');

  return (
    <section id="schedule" className="relative w-full py-10 sm:py-14 bg-[#dcecfe]/45 backdrop-blur-sm select-none border-b border-black/10 scroll-mt-16 sm:scroll-mt-20">
      <span id="timeline" className="sr-only" aria-hidden="true" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Curatorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black/20 pb-3 mb-5 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-[#D21319]" />
              <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-600 uppercase">
                CHRONICA · TWO-DAY ITINERARY
              </span>
            </div>
            <h2 className="font-sans text-2xl sm:text-4xl text-black uppercase font-black tracking-tight leading-none">
              FESTIVAL TIMELINE
            </h2>
          </div>

          {/* Minimalist Day Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay('day1')}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedDay === 'day1'
                  ? 'bg-black text-white border-2 border-black shadow-[2px_2px_0px_#D21319]'
                  : 'bg-white text-black border-2 border-black hover:bg-neutral-100'
              }`}
            >
              DAY 1 · 16 OCT
            </button>

            <button
              onClick={() => setSelectedDay('day2')}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedDay === 'day2'
                  ? 'bg-black text-white border-2 border-black shadow-[2px_2px_0px_#D21319]'
                  : 'bg-white text-black border-2 border-black hover:bg-neutral-100'
              }`}
            >
              DAY 2 · 17 OCT
            </button>
          </div>
        </div>

        {/* Timeline Entries Ledger - Streamlined Height */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="border-2 border-black bg-white divide-y border-collapse divide-black/10 shadow-[4px_4px_0px_#000]"
          >
            {(selectedDay === 'day1' ? DAY_1_SCHEDULE : DAY_2_SCHEDULE).map((item, idx) => (
              <div
                key={idx}
                className="py-3 px-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-[#D21319] bg-[#D21319]/10 border border-[#D21319]/30 px-2 py-0.5 tracking-wider">
                    EVENT 0{idx + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h3 className="font-sans text-sm sm:text-base text-black font-bold truncate">
                      {item.event}
                    </h3>
                  </div>
                  <p className="font-sans text-[11px] sm:text-xs text-neutral-600 truncate sm:whitespace-normal line-clamp-1">
                    {item.desc}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="font-mono text-[9px] font-bold border border-black px-2 py-0.5 inline-block text-black bg-neutral-100 uppercase shadow-[1px_1px_0px_#000]">
                    {item.location}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] font-mono text-neutral-600 gap-1">
          <span>* MULTI-DAY DISCIPLINES (BUILDA-SAUR, QUIZ-TLE) PROCEED ACROSS BOTH DATES.</span>
          <span className="text-[#D21319] font-bold">MAX 2 EVENT REGISTRATIONS PER PARTICIPANT</span>
        </div>

      </div>
    </section>
  );
}
