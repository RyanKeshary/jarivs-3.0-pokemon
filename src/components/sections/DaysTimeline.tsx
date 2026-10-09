'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_1_SCHEDULE = [
  { time: '09:00 AM', event: 'Inaugural Convocation & Keynote', desc: 'Opening address, ceremonial rules briefing, and jury introduction in Main Hall.', location: 'Auditorium' },
  { time: '10:00 AM', event: 'Poké Expo: Project Exhibition', desc: 'Hardware apparatus demonstrations and software project benches open for examination.', location: 'Exhibition Hall A' },
  { time: '10:00 AM', event: 'Buildasaur: Buildathon Round 1', desc: 'Buildathon architecture kickoff with open connectivity and initial prototyping.', location: 'Lab 4 & Online' },
  { time: '11:30 AM', event: "Team Rocket's Pokéquest: Treasure Hunt", desc: 'Stage 1: On-Day Chaos campus riddle hunt across active checkpoints.', location: 'Campus Grounds' },
  { time: '01:30 PM', event: 'Pidgetto: Line-Follower Race', desc: 'Autonomous wheeled vehicles navigate black stripe tracks with precision control.', location: 'Robotics Arena' },
  { time: '05:00 PM', event: 'Snorreelax: Reel Making Submission', desc: 'Delivery of short-form documentary digital reels captured across the festival grounds.', location: 'Media Studio' },
];

const DAY_2_SCHEDULE = [
  { time: '09:00 AM', event: 'Buildasaur: Buildathon Round 2', desc: 'Round 2 prototype completion, final debugging, and jury defense.', location: 'Lab 4' },
  { time: '10:00 AM', event: 'Quiztle: Technical Quiz Stage Finals', desc: 'Finalist teams compete live on stage in rapid buzzer eliminator rounds.', location: 'Main Stage' },
  { time: '11:00 AM', event: 'Cadmander: 2D AutoCAD Competition', desc: '2D AutoCAD engineering blueprints under geometric dimensioning and tolerancing.', location: 'CAD Lab 2' },
  { time: '02:00 PM', event: 'Jury Deliberation & Evaluation Seal', desc: 'Adjudicator scoreboards locked and final deliberations by senior faculty.', location: 'Council Room' },
  { time: '03:30 PM', event: 'Valedictory & Awards Ceremony', desc: 'Official presentation of commendations, certificates, and festival honors.', location: 'Auditorium' },
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
                className="py-2.5 px-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-[130px] shrink-0">
                  <span className="font-mono text-[11px] font-bold text-neutral-400">
                    [0{idx + 1}]
                  </span>
                  <span className="font-mono font-bold text-xs text-[#D21319] tracking-wider">
                    {item.time}
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
          <span className="text-[#D21319] font-bold">ZERO OVERLAP CONFLICTS PERMITTED</span>
        </div>

      </div>
    </section>
  );
}
