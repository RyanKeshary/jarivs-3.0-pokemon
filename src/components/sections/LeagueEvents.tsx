'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Flame, Droplet, Wind, Target, Trophy, ArrowRight } from 'lucide-react';
import { playRetroBeep } from '@/lib/sound';

interface EventItem {
  id: number;
  title: string;
  subtitle: string;
  type: string;
  bgImage?: string;
  image: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
}

const EVENTS_DATA: EventItem[] = [
  {
    id: 1,
    title: 'Buildasaur',
    subtitle: 'AI & Rapid Prototyping Hackathon',
    type: 'GRASS / AI',
    bgImage: '/event/1.bg.png',
    image: '/event/1.png',
    description: 'Plant the seeds of innovation! Build full-stack web/mobile apps, AI copilots, and autonomous agents in a 24-hour sprint.',
    highlights: ['24H Sprint', '1-4 Trainers', 'AI & GenAI'],
    icon: <Sparkles size={18} className="text-white" />,
  },
  {
    id: 2,
    title: 'Cadmander',
    subtitle: '3D CAD & Hardware Battle',
    type: 'FIRE / HARDWARE',
    image: '/event/2.png',
    description: 'Ignite your engineering flame! Rapid 3D mechanical modeling, generative CAD structures, and embedded robotics.',
    highlights: ['3D Modeling', 'Hardware Arena', 'Live Renders'],
    icon: <Flame size={18} className="text-white" />,
  },
  {
    id: 3,
    title: 'Quiztle',
    subtitle: 'Tech & Lore Trivia Blitz',
    type: 'WATER / TRIVIA',
    image: '/event/3.png',
    description: 'Splash through algorithmic puzzles and Pokémon trivia! Fast buzzer rounds testing CS fundamentals, DSA, and gaming lore.',
    highlights: ['Buzzer Round', 'Solo / Duo', 'Instant Swag'],
    icon: <Droplet size={18} className="text-white" />,
  },
  {
    id: 4,
    title: 'PID-geotto',
    subtitle: 'Control Systems & Drone Flight',
    type: 'FLYING / IOT',
    image: '/event/4.png',
    description: 'Soar through feedback loops! Tune PID controllers, balance quadcopters, and deploy real-time micro-sensor automation.',
    highlights: ['Drone Flight', 'Edge IoT', 'PID Tuning'],
    icon: <Wind size={18} className="text-white" />,
  },
  {
    id: 5,
    title: 'PokeXpo',
    subtitle: 'Project Showcase & Investor Pitch',
    type: 'ELECTRIC / SHOWCASE',
    image: '/event/5.png',
    description: 'Electrify the audience! Exhibit working prototypes at dedicated arena booths, pitch to industry leaders, and win jury acclaim.',
    highlights: ['Project Expo', 'Jury Demos', 'Live Pitch'],
    icon: <Zap size={18} className="text-white" />,
  },
  {
    id: 6,
    title: 'Team Rockets - PokeQuest',
    subtitle: 'CTF & CyberSec Bug Bounty',
    type: 'DARK / CYBERSEC',
    image: '/event/6.png',
    description: 'Prepare for trouble, make it double! Uncover hidden digital flags, reverse-engineer encrypted payloads, and secure the network.',
    highlights: ['CTF Hunt', 'Cryptography', 'Secret Flags'],
    icon: <Target size={18} className="text-white" />,
  },
];

export function LeagueEvents() {
  return (
    <section id="events" className="py-20 sm:py-28 bg-transparent text-[#1E232A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-[#FFCB05]/70 text-[#FFCB05] font-pixel text-xs mb-4 shadow-[0_0_20px_rgba(255,203,5,0.3)] backdrop-blur-md"
          >
            <Trophy size={14} className="text-[#FFCB05]" />
            <span>OFFICIAL LEAGUE ARENAS</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-pixel text-3xl sm:text-5xl text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
          >
            EVENTS DIRECTORY
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-gray-200 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            Explore all 6 featured hackathons, hardware battles, trivia arenas, and cybersecurity bounties.
          </motion.p>
        </div>

        {/* 6 Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
          {EVENTS_DATA.map((event, index) => {
            const hasTopBg = !!event.bgImage;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                whileHover={{ y: -10, transition: { duration: 0.25 } }}
                onMouseEnter={() => playRetroBeep(480 + index * 50, 'sine', 0.04)}
                className="group relative bg-white/95 backdrop-blur-md border-4 border-[#1E232A] rounded-2xl shadow-[8px_8px_0px_#1E232A] hover:shadow-[12px_12px_0px_#EE1515] transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* EDGE-TO-EDGE FULL-WIDTH TOP BANNER / STAGE COVER */}
                <div className="relative w-full h-52 sm:h-56 overflow-hidden border-b-4 border-[#1E232A] flex items-center justify-center select-none bg-slate-950">
                  {/* Full Top Background (e.g. 1.bg.png for Event 1) */}
                  {hasTopBg ? (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <Image
                        src={event.bgImage!}
                        alt={`${event.title} Banner Cover`}
                        fill
                        priority
                        className="object-cover object-center filter brightness-[0.92] contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-115"
                      />
                      {/* Subtle Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                    </div>
                  ) : (
                    /* Default Retro Grid Stage for other events */
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200">
                      <div className="absolute inset-0 bg-[radial-gradient(#1E232A_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,transparent_70%)]" />
                    </div>
                  )}

                  {/* Top Floating Badges (Inside top banner) */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                    <div className="w-10 h-10 bg-[#1E232A] rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#EE1515] group-hover:scale-105 group-hover:bg-[#EE1515] transition-all">
                      {event.icon}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-pixel text-xs font-bold border-2 ${
                        hasTopBg
                          ? 'bg-black/70 border-emerald-400 text-[#FFCB05] backdrop-blur-md shadow-md'
                          : 'bg-white border-[#1E232A] text-[#1E232A] shadow-sm'
                      }`}
                    >
                      #0{event.id}
                    </span>
                  </div>

                  {/* Background Radial Glow Aura */}
                  <div
                    className={`absolute w-36 h-36 rounded-full border-2 transition-all duration-500 z-10 ${
                      hasTopBg
                        ? 'bg-emerald-500/20 border-emerald-400/50 group-hover:border-emerald-300 group-hover:scale-125 group-hover:bg-emerald-400/30'
                        : 'bg-white/50 border-dashed border-gray-400 group-hover:border-[#EE1515] group-hover:scale-115'
                    }`}
                  />

                  {/* Character PNG with Hover Scale & Pop Animation */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 3 + (index % 3) * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center z-20 mt-3"
                  >
                    <Image
                      src={event.image}
                      alt={event.title}
                      width={160}
                      height={160}
                      className={`object-contain transition-all duration-300 ${
                        hasTopBg
                          ? 'drop-shadow-[0_10px_24px_rgba(0,0,0,0.85)] group-hover:scale-120 group-hover:-translate-y-2 group-hover:rotate-3 group-hover:drop-shadow-[0_16px_35px_rgba(16,185,129,0.9)]'
                          : 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] group-hover:scale-120 group-hover:rotate-3 group-hover:drop-shadow-[0_12px_24px_rgba(238,21,21,0.35)]'
                      }`}
                    />
                  </motion.div>
                </div>

                {/* BOTTOM CONTENT AREA */}
                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#EE1515] uppercase tracking-wider block">
                      {event.type}
                    </span>
                    <h3 className="font-pixel text-xl sm:text-2xl text-[#1E232A] tracking-tight mt-1 group-hover:text-[#EE1515] transition-colors">
                      {event.title}
                    </h3>
                    <h4 className="font-mono text-xs text-gray-500 font-bold mt-1">
                      {event.subtitle}
                    </h4>
                    <p className="mt-3 text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                      {event.description}
                    </p>
                  </div>

                  {/* Highlights & Action Button */}
                  <div className="mt-6 pt-4 border-t-2 border-gray-200 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {event.highlights.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px] text-gray-700 font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href="/auth?mode=register"
                      className="mt-1 flex items-center justify-between text-xs font-pixel text-[#1E232A] group-hover:text-[#EE1515] font-bold uppercase tracking-wider pt-1 transition-colors"
                    >
                      <span>REGISTER EVENT</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform text-[#EE1515]" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
