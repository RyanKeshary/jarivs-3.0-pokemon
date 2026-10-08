'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventThemedModal } from '@/components/events/EventThemedModal';

export interface FestEventItem {
  id: string;
  index: string;
  title: string;
  name: string;
  subtitle: string;
  description: string;
  dayTag: string;
  isMultiDay: boolean;
  mode: string;
  category: string;
  teamSize: string;
  minSize: number;
  maxSize: number;
  slotTime: string;
  fee: string;
  pokemon: string;
  pokemonGif: string;
  pokemonStatic: string;
  bgGradient: string;
  accentColor: string;
  rules: string[];
  rounds: string[];
  whatsappLink: string;
}

export const FEST_EVENTS: FestEventItem[] = [
  {
    id: 'project-exhibition',
    index: '01',
    title: 'POKÉ EXPO',
    name: 'Poké Expo: Project Exhibition',
    subtitle: 'Technical Hardware & Software Showcase',
    description: 'Display working prototypes, hardware apparatus, and deployed computational systems to academic adjudicators and industry peers.',
    dayTag: 'DAY 1',
    isMultiDay: false,
    mode: 'OFFLINE',
    category: 'TECH',
    teamSize: '1 to 4 Members',
    minSize: 1,
    maxSize: 4,
    slotTime: '10:00 AM - 01:00 PM',
    fee: 'FREE REGISTRATION',
    pokemon: 'porygon',
    pokemonGif: '/assets/events/porygon.gif',
    pokemonStatic: '/assets/events/porygon.png',
    bgGradient: 'from-[#0b2447] via-[#19376d] to-[#04152d]',
    accentColor: '#38bdf8',
    whatsappLink: 'https://chat.whatsapp.com/B5eqtUDwxiWALkV1hH9pbv',
    rules: [
      'Each squad must demonstrate a live physical apparatus or working deployed software demonstration.',
      'Projects must feature documented Git commits, architectural schema, and original engineering.',
      'A ten-minute oral technical defense and jury interrogation follows each bench demonstration.'
    ],
    rounds: [
      'Round 1: Preliminary Bench Review & Technical Inspection',
      'Round 2: Grand Jury Defense & Adjudicator Scrutiny'
    ]
  },
  {
    id: 'pid-geotto',
    index: '02',
    title: 'PID-GEOTTO',
    name: 'PID-geotto: Line Follower Robot Competition',
    subtitle: 'Autonomous High-Curvature Speed Sprint',
    description: 'Autonomous wheeled robotic vehicles navigate high-curvature precision tracks with closed-loop PID microcontroller calibration.',
    dayTag: 'DAY 1',
    isMultiDay: false,
    mode: 'ROBOTICS',
    category: 'ROBOTICS',
    teamSize: '1 to 3 Members',
    minSize: 1,
    maxSize: 3,
    slotTime: '01:30 PM - 04:30 PM',
    fee: 'FREE REGISTRATION',
    pokemon: 'pidgeotto',
    pokemonGif: '/assets/events/pidgeotto.gif',
    pokemonStatic: '/assets/events/pidgeotto.png',
    bgGradient: 'from-[#422006] via-[#78350f] to-[#1c1917]',
    accentColor: '#f59e0b',
    whatsappLink: 'https://chat.whatsapp.com/KJllRsU3JRQ87PoA4D5gX1',
    rules: [
      'Robots must operate fully autonomously with on-board computing, sensors, and power storage.',
      '30mm black line course with right-angle bends, grid intersections, and hairpin turns.',
      'Three official time trials are permitted per automaton; the lowest clean lap time dictates ranking.'
    ],
    rounds: [
      'Round 1: Qualifying Time Trial Lap',
      'Round 2: Championship Fast-Track Eliminator'
    ]
  },
  {
    id: 'treasure-hunt',
    index: '03',
    title: "TEAM ROCKET'S POKÉQUEST",
    name: "Team Rocket's Pokéquest: Treasure Hunt",
    subtitle: 'Cryptic Clues & Campus Exploration Quest',
    description: 'Solve cryptic riddles, algorithmic GPS geo-caches, and technical clues across campus to outwit Team Rocket and retrieve the legendary artifacts.',
    dayTag: 'DAY 1',
    isMultiDay: false,
    mode: 'OFFLINE',
    category: 'ADVENTURE',
    teamSize: '2 to 4 Members',
    minSize: 2,
    maxSize: 4,
    slotTime: '11:30 AM - 02:30 PM',
    fee: 'FREE REGISTRATION',
    pokemon: 'meowth',
    pokemonGif: '/assets/events/meowth.gif',
    pokemonStatic: '/assets/events/meowth.png',
    bgGradient: 'from-[#2e1065] via-[#4c1d95] to-[#0f172a]',
    accentColor: '#c084fc',
    whatsappLink: 'https://chat.whatsapp.com/JYeI7DPqWiR1jfRS4jw1QK',
    rules: [
      'Teams decipher sequential technical ciphers and physical clue checkpoints.',
      'Speed, strategic routing, and puzzle-solving accuracy dictate point totals.',
      'Strict campus boundary adherence; zero interference with rival squads.'
    ],
    rounds: [
      'Stage 1: Cipher Broadcast & Geocache Hunt',
      'Stage 2: Vault Infiltration & Speed Recovery'
    ]
  },
  {
    id: 'quiz-tle',
    index: '04',
    title: 'QUIZ-TLE',
    name: 'Quiz-tle: Technical Quiz',
    subtitle: 'Algorithmic Systems & Tech Knowledge Tournament',
    description: 'A rigorous intellectual tournament examining core computer systems, data structures, algorithms, discrete math, and computing history.',
    dayTag: 'DAY 1 & 2',
    isMultiDay: true,
    mode: 'OFFLINE',
    category: 'TECH',
    teamSize: '2 Members (Pairs)',
    minSize: 2,
    maxSize: 2,
    slotTime: 'Day 1 02:00 PM / Day 2 10:00 AM',
    fee: 'FREE REGISTRATION',
    pokemon: 'squirtle',
    pokemonGif: '/assets/events/squirtle.gif',
    pokemonStatic: '/assets/events/squirtle.png',
    bgGradient: 'from-[#082f49] via-[#0369a1] to-[#0f172a]',
    accentColor: '#38bdf8',
    whatsappLink: 'https://chat.whatsapp.com/Ga4Y8cnDQpQFOBer59TvLG',
    rules: [
      'Squads must strictly comprise exactly two individuals.',
      'Zero external communication devices or reference aids permitted.',
      'The top eight scoring alliances from Day 1 advance to the Day 2 live stage buzzer finals.'
    ],
    rounds: [
      'Day 1 (16 Oct): Written Preliminaries & Speed Buzzer Eliminator',
      'Day 2 (17 Oct): Grand Buzzer Final with Negative Scoring'
    ]
  },
  {
    id: 'build-asor',
    index: '05',
    title: 'BUILDA-SAUR',
    name: 'Builda-saur: Buildathon (Day 1 & Day 2 r2)',
    subtitle: 'Two-Day Hybrid Engineering Endurance Sprint',
    description: 'A grueling multi-phase software development crucible: Day 1 open architecture connected synthesis, followed by Day 2 air-gapped offline compilation.',
    dayTag: 'DAY 1 & 2',
    isMultiDay: true,
    mode: 'HYBRID',
    category: 'HACKATHON',
    teamSize: '2 to 4 Members',
    minSize: 2,
    maxSize: 4,
    slotTime: 'Day 1 10:00 AM / Day 2 09:00 AM',
    fee: 'FREE REGISTRATION',
    pokemon: 'bulbasaur',
    pokemonGif: '/assets/events/bulbasaur.gif',
    pokemonStatic: '/assets/events/bulbasaur.png',
    bgGradient: 'from-[#064e3b] via-[#047857] to-[#022c22]',
    accentColor: '#34d399',
    whatsappLink: 'https://chat.whatsapp.com/J02b7lEni4FAmTd8XxGVwq',
    rules: [
      'Day 1 allows unrestricted online libraries, research publications, and external API gateways.',
      'Day 2 is strictly air-gapped without internet access to evaluate fundamental local compilation and debugging.',
      'Teams deliver verified local binaries, transparent Git commit logs, and architectural defenses.'
    ],
    rounds: [
      'Day 1 (16 Oct): Connected Architecture Sprint (With Internet)',
      'Day 2 (17 Oct): Air-Gapped Code Freeze & Jury Defense (Offline)'
    ]
  },
  {
    id: 'snorreelax',
    index: '06',
    title: 'SNORREELAX',
    name: 'Snorreelax: Reel Making Competition',
    subtitle: 'Short-Form Documentary & Cinematic Chronicle',
    description: 'Capture the kinetic spirit, intellectual tension, and natural-history aesthetic of Jarvis 3.0 in short-form cinematic documentary reels.',
    dayTag: 'DAY 1',
    isMultiDay: false,
    mode: 'OFFLINE',
    category: 'CREATIVE',
    teamSize: '1 to 2 Members',
    minSize: 1,
    maxSize: 2,
    slotTime: '10:00 AM - 05:00 PM',
    fee: 'FREE REGISTRATION',
    pokemon: 'snorlax',
    pokemonGif: '/assets/events/snorlax.gif',
    pokemonStatic: '/assets/events/snorlax.png',
    bgGradient: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
    accentColor: '#818cf8',
    whatsappLink: 'https://chat.whatsapp.com/K6JyDBRX4EO4rzk6jJvgFF',
    rules: [
      'All footage must be recorded on campus grounds during Day 1 of the fest.',
      'Final video running length must strictly fall between 45 and 90 seconds.',
      'Adjudication evaluates visual grading, sound design, rhythm, and editorial cohesion.'
    ],
    rounds: [
      'Round 1: On-Site Cinematography & Assembly Cut',
      'Round 2: Main Auditorium Screening & Grand Award'
    ]
  },
  {
    id: 'cad-mander',
    index: '07',
    title: 'CAD-MANDER',
    name: 'Cad-Mander: AutoCAD Design Competition',
    subtitle: 'Parametric CAD Drafting & 3D Solid Assembly',
    description: 'Rapid drafting under dimensional tolerances spanning 2D foundational blueprints to complex 3D kinematic assemblies under stress load simulation.',
    dayTag: 'DAY 2',
    isMultiDay: false,
    mode: 'OFFLINE',
    category: 'DESIGN',
    teamSize: '1 to 2 Members',
    minSize: 1,
    maxSize: 2,
    slotTime: '11:00 AM - 02:00 PM',
    fee: 'FREE REGISTRATION',
    pokemon: 'charmander',
    pokemonGif: '/assets/events/charmander.gif',
    pokemonStatic: '/assets/events/charmander.png',
    bgGradient: 'from-[#7f1d1d] via-[#b91c1c] to-[#450a0a]',
    accentColor: '#f87171',
    whatsappLink: 'https://chat.whatsapp.com/EUXkeEbWpJ0JlhCqhyVJzs',
    rules: [
      'Official CAD laboratory workstations provided with certified modeling environments.',
      'Absolute adherence to geometric dimensioning, tolerancing (GD&T), and projection conventions.',
      'Day 2 parametric 3D kinematic assembly and stress simulation challenge.'
    ],
    rounds: [
      'Stage 1: Orthographic & Isometric Precision Drafting',
      'Stage 2: Parametric 3D Solid Assembly & Stress Simulation'
    ]
  }
];

interface EventsLedgerProps {
  onSelectEventForRegistration: (eventId: string) => void;
}

export function EventsLedger({ onSelectEventForRegistration }: EventsLedgerProps) {
  const [activeModalEvent, setActiveModalEvent] = useState<FestEventItem | null>(null);

  return (
    <section id="events" className="relative w-full py-20 sm:py-28 bg-white/30 backdrop-blur-sm select-none border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Curatorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black/20 pb-5 mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#D21319]" />
              <span className="font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase">
                INDEX RERUM · FESTIVAL DISCIPLINES
              </span>
            </div>
            <h2 className="font-sans text-3xl sm:text-5xl text-black uppercase font-black tracking-tight">
              EVENTS & COMPETITIONS
            </h2>
          </div>

          <div className="text-left sm:text-right">
            <span className="font-mono text-xs font-bold text-neutral-800 block">
              INDIGO TECH FEST · JARVIS 3.0
            </span>
            <span className="font-mono text-[10px] font-bold text-[#D21319] tracking-wider uppercase">
              SEVEN REGISTERED DISCIPLINES · ZERO ENTRY TARIFF
            </span>
          </div>
        </div>

        {/* 3-COLUMN CARD GRID MATCHING REFERENCE FORMAT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEST_EVENTS.map((event) => (
            <div
              key={event.id}
              className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] hover:shadow-[10px_10px_0px_#D21319] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              
              {/* TOP HALF: PIXELATED POKEMON ART BANNER WITH BADGES */}
              <div
                className={`relative w-full h-56 sm:h-64 bg-gradient-to-br ${event.bgGradient} flex items-center justify-center overflow-hidden border-b-2 border-black`}
              >
                {/* Retro Scanline Texture */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0.5) 1px, transparent 1px, transparent 2px)',
                    backgroundSize: '100% 2px'
                  }}
                />

                {/* Pixel Grid Pattern */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-15"
                  style={{
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* Overlaid Badges Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  {event.isMultiDay ? (
                    <span className="bg-[#D21319] text-white font-mono font-bold text-[10px] tracking-wider px-2 py-0.5 border border-black shadow-[2px_2px_0px_#000]">
                      DAY 1 & 2
                    </span>
                  ) : (
                    <span className="bg-white text-black font-mono font-bold text-[10px] tracking-wider px-2 py-0.5 border border-black shadow-[2px_2px_0px_#000]">
                      {event.dayTag}
                    </span>
                  )}
                </div>

                {/* Overlaid Badges Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <span className="bg-white text-black font-mono font-bold text-[10px] tracking-wider px-2 py-0.5 border border-black shadow-[2px_2px_0px_#000]">
                    {event.mode}
                  </span>
                  <span className="bg-black text-white font-mono font-bold text-[10px] tracking-wider px-2 py-0.5 border border-black shadow-[2px_2px_0px_#000]">
                    {event.category}
                  </span>
                </div>

                {/* PIXELATED POKEMON IMAGE / ANIMATED SPRITE */}
                <div className="relative z-0 flex items-center justify-center transform group-hover:scale-115 transition-transform duration-300">
                  {/* Subtle Glow Aura */}
                  <div
                    className="absolute w-40 h-40 rounded-full blur-2xl opacity-50 pointer-events-none"
                    style={{ backgroundColor: event.accentColor }}
                  />

                  {/* Pixelated Sprite (Zoomed In) */}
                  <img
                    src={event.pokemonGif}
                    alt={event.pokemon}
                    className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] scale-110 group-hover:scale-125 transition-transform duration-300"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = event.pokemonStatic;
                    }}
                  />
                </div>

                {/* Pokemon Name Tag Watermark */}
                <div className="absolute bottom-2 right-3 font-mono text-[10px] tracking-widest text-white/40 uppercase">
                  #{event.pokemon}
                </div>

              </div>

              {/* BOTTOM HALF: SOLID WHITE CONTENT BODY */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-white text-black">
                
                <div>
                  {/* Event Title */}
                  <h3 className="font-sans text-xl sm:text-2xl font-black text-black uppercase tracking-tight leading-snug">
                    {event.title}
                  </h3>

                  {/* Subtitle / Discipline Tag */}
                  <div className="text-[11px] font-mono text-neutral-500 font-semibold tracking-wider uppercase mt-0.5">
                    {event.subtitle}
                  </div>

                  {/* Description */}
                  <p className="font-sans text-xs sm:text-sm text-neutral-700 leading-relaxed mt-2.5 line-clamp-3">
                    {event.description}
                  </p>
                </div>

                {/* Divider Line & Action Row */}
                <div>
                  <hr className="border-t border-black/20 my-4" />

                  {/* Bottom Action Area: Clean 2-Tier Contained Grid */}
                  <div className="space-y-2.5">
                    {/* Status Pill & WhatsApp Group Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="border border-black bg-black text-white px-2 py-0.5 text-[11px] font-bold font-mono tracking-wider">
                        {event.fee}
                      </span>

                      {event.whatsappLink && (
                        <a
                          href={event.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-0.5 border border-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-[1.5px_1.5px_0px_#065f46] flex items-center gap-1"
                          title="Join Official WhatsApp Group"
                        >
                          <span>💬</span>
                          <span>WA GROUP</span>
                        </a>
                      )}
                    </div>

                    {/* Action Buttons: 2-Column Full Width Grid */}
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        onClick={() => setActiveModalEvent(event)}
                        className="w-full py-2 border-2 border-black bg-white hover:bg-neutral-100 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1"
                        title="View Rules and Format"
                      >
                        <span>📜</span>
                        <span>RULES</span>
                      </button>

                      <button
                        onClick={() => onSelectEventForRegistration(event.id)}
                        className="w-full py-2 bg-black hover:bg-[#D21319] text-white font-sans font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                      >
                        <span>REGISTER</span>
                        <span className="w-4 h-4 bg-white text-black flex items-center justify-center font-bold text-xs shrink-0">
                          ↗
                        </span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>

      </div>

      {/* UNIQUE THEMED EVENT LIGHTBOX MODAL */}
      <AnimatePresence>
        {activeModalEvent && (
          <EventThemedModal
            event={activeModalEvent}
            onClose={() => setActiveModalEvent(null)}
            onRegister={(id) => {
              setActiveModalEvent(null);
              onSelectEventForRegistration(id);
            }}
          />
        )}
      </AnimatePresence>

    </section>
  );
}
