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
    <section id="timeline" className="py-16 sm:py-24 bg-white border-b-4 border-[#1E232A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3B4CCA] text-white font-pixel text-[10px] rounded mb-3 shadow-[2px_2px_0px_#1E232A]">
            <Map size={14} />
            <span>KANTO EXPEDITION ROUTE</span>
          </div>
          <h2 className="font-pixel text-xl sm:text-3xl text-[#1E232A] tracking-tight">
            EVENT TIMELINE & ROUTE MAP
          </h2>
          <p className="mt-3 text-gray-600 font-medium">
            Follow the checkpoints from Pallet Town kickoff to the Indigo Plateau Champion crowning ceremony.
          </p>

          {/* Phase Filter Tabs */}
          <div className="mt-6 inline-flex p-1 bg-gray-100 border-2 border-[#1E232A] rounded-xl shadow-[3px_3px_0px_#1E232A]">
            <button
              onClick={() => setActivePhase('all')}
              className={`px-4 py-2 font-pixel text-xs rounded-lg transition-all ${
                activePhase === 'all'
                  ? 'bg-[#EE1515] text-white shadow-sm'
                  : 'text-gray-700 hover:text-black'
              }`}
            >
              FULL ROUTE
            </button>
            <button
              onClick={() => setActivePhase('day1')}
              className={`px-4 py-2 font-pixel text-xs rounded-lg transition-all ${
                activePhase === 'day1'
                  ? 'bg-[#EE1515] text-white shadow-sm'
                  : 'text-gray-700 hover:text-black'
              }`}
            >
              DAY 1 (OCT 18)
            </button>
            <button
              onClick={() => setActivePhase('day2')}
              className={`px-4 py-2 font-pixel text-xs rounded-lg transition-all ${
                activePhase === 'day2'
                  ? 'bg-[#EE1515] text-white shadow-sm'
                  : 'text-gray-700 hover:text-black'
              }`}
            >
              DAY 2 (OCT 19)
            </button>
          </div>
        </div>

        {/* Route Map Timeline */}
        <div className="relative mt-12">
          {/* Vertical central dotted path */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,#1E232A_0,#1E232A_10px,transparent_10px,transparent_20px)] z-0" />

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
                      className="bg-white border-3 border-[#1E232A] rounded-xl p-5 shadow-[4px_4px_0px_#1E232A] hover:shadow-[6px_6px_0px_#EE1515] transition-all"
                    >
                      <div
                        className={`flex items-center gap-2 mb-2 ${
                          isEven ? 'md:justify-end' : 'md:justify-start'
                        }`}
                      >
                        <Clock size={14} className="text-[#EE1515]" />
                        <span className="font-pixel text-[11px] text-[#EE1515]">
                          {item.time}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono font-bold text-gray-600 uppercase">
                          {item.phase}
                        </span>
                      </div>
                      <h4 className="font-pixel text-sm text-[#1E232A]">{item.title}</h4>
                      <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </motion.div>
                  </div>

                  {/* Center Node (Pokéball Checkpoint) */}
                  <div className="w-10 h-10 rounded-full border-3 border-[#1E232A] bg-white flex items-center justify-center shadow-[3px_3px_0px_#1E232A] z-20 shrink-0">
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
