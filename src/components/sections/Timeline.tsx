'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Flag, CheckCircle2, Clock } from 'lucide-react';
import type { LandingContent } from '@/lib/database.types';

interface TimelineProps {
  timeline: LandingContent['timeline'];
}

export function Timeline({ timeline }: TimelineProps) {
  const [activePhase, setActivePhase] = useState<'all' | 'day1' | 'day2'>('all');

  const filteredTimeline = timeline.filter((item) => {
    if (activePhase === 'all') return true;
    return item.phase === activePhase;
  });

  return (
    <section id="timeline" className="py-20 sm:py-28 bg-transparent relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/60 border border-[#3B4CCA]/60 text-cyan-300 font-pixel text-xs rounded-full mb-4 shadow-lg backdrop-blur-md">
            <Map size={14} />
            <span>KANTO EXPEDITION ROUTE</span>
          </div>
          <h2 className="font-pixel text-3xl sm:text-5xl text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            EVENT TIMELINE & ROUTE MAP
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-200 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Follow the checkpoints from Pallet Town kickoff to the Indigo Plateau Champion crowning ceremony.
          </p>

          {/* Phase Filter Tabs */}
          <div className="mt-7 inline-flex p-1.5 bg-black/60 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-xl">
            <button
              onClick={() => setActivePhase('all')}
              className={`px-5 py-2 font-pixel text-xs rounded-xl transition-all cursor-pointer ${
                activePhase === 'all'
                  ? 'bg-[#EE1515] text-white shadow-[0_0_15px_rgba(238,21,21,0.6)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              FULL ROUTE
            </button>
            <button
              onClick={() => setActivePhase('day1')}
              className={`px-5 py-2 font-pixel text-xs rounded-xl transition-all cursor-pointer ${
                activePhase === 'day1'
                  ? 'bg-[#EE1515] text-white shadow-[0_0_15px_rgba(238,21,21,0.6)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              DAY 1 (OCT 18)
            </button>
            <button
              onClick={() => setActivePhase('day2')}
              className={`px-5 py-2 font-pixel text-xs rounded-xl transition-all cursor-pointer ${
                activePhase === 'day2'
                  ? 'bg-[#EE1515] text-white shadow-[0_0_15px_rgba(238,21,21,0.6)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              DAY 2 (OCT 19)
            </button>
          </div>
        </div>

        {/* Route Map Timeline */}
        <div className="relative mt-12">
          {/* Vertical central dotted path */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,#FFFFFF_0,#FFFFFF_10px,transparent_10px,transparent_20px)] opacity-40 z-0" />

          <div className="space-y-8 relative z-10">
            {filteredTimeline.map((item, index) => {
              const isEven = index % 2 === 0;

              return (
                <div
                  key={`${item.time}-${item.title}`}
                  className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0"
                >
                  {/* Left Column (Desktop) */}
                  <div
                    className={`w-full md:w-5/12 ${
                      isEven ? 'md:text-right' : 'md:order-last md:text-left'
                    }`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="bg-white/95 backdrop-blur-md border-4 border-[#1E232A] rounded-2xl p-5 sm:p-6 shadow-[6px_6px_0px_#1E232A] hover:shadow-[10px_10px_0px_#EE1515] transition-all"
                    >
                      <div
                        className={`flex items-center gap-2 mb-2 ${
                          isEven ? 'md:justify-end' : 'md:justify-start'
                        }`}
                      >
                        <Clock size={15} className="text-[#EE1515]" />
                        <span className="font-pixel text-xs sm:text-sm text-[#EE1515] font-bold">
                          {item.time}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 text-[10px] font-mono font-bold text-gray-700 uppercase">
                          {item.phase}
                        </span>
                      </div>
                      <h4 className="font-pixel text-base sm:text-lg text-[#1E232A]">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-700 mt-2 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </motion.div>
                  </div>

                  {/* Center Node (Pokéball Checkpoint) */}
                  <div className="w-11 h-11 rounded-full border-4 border-[#1E232A] bg-white flex items-center justify-center shadow-[4px_4px_0px_#1E232A] z-20 shrink-0">
                    <div className="w-5 h-5 rounded-full bg-[#EE1515] border-2 border-[#1E232A] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    </div>
                  </div>

                  {/* Empty Spacer Column for Alignment */}
                  <div className="hidden md:block w-5/12" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
