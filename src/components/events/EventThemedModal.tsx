'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FestEventItem } from '@/components/sections/EventsLedger';

interface EventThemedModalProps {
  event: FestEventItem | null;
  onClose: () => void;
  onRegister: (eventId: string) => void;
}

// Light theme styling descriptors for each event
interface EventThemeConfig {
  accentColor: string;
  lightBg: string;
  cardBg: string;
  badgeBg: string;
  badgeText: string;
  tagline: string;
  themeGlyph: string;
  judgingCriteria: string[];
}

const THEME_CONFIGS: Record<string, EventThemeConfig> = {
  'project-exhibition': {
    accentColor: '#0284c7',
    lightBg: 'bg-[#f0f9ff]',
    cardBg: 'bg-[#e0f2fe]',
    badgeBg: 'bg-[#0284c7] text-white',
    badgeText: 'CYBER PROTO LAB',
    tagline: 'SYS.STATUS: COMPUTATIONAL PROTOTYPE EXHIBITION ONLINE',
    themeGlyph: '⚡',
    judgingCriteria: [
      'Originality & Technical Complexity of Architecture',
      'Live Operational Bench Prototype / Working Deployment',
      'Rigorous Source Code Quality & Git Commit Provenance',
      'Oral Technical Defense & Adjudicator Q&A Scrutiny'
    ]
  },
  'pid-geotto': {
    accentColor: '#d97706',
    lightBg: 'bg-[#fffbeb]',
    cardBg: 'bg-[#fef3c7]',
    badgeBg: 'bg-[#d97706] text-white',
    badgeText: 'LINE-FOLLOWER RACE',
    tagline: 'BLACK STRIPE ON WHITE SURFACE // AUTONOMOUS RUN',
    themeGlyph: '🏎️',
    judgingCriteria: [
      'Lowest Clean Lap Time Across Verified Trials',
      'Smooth Line Tracking on Black Stripe Surface',
      'Autonomous Operation Without External Remote Control',
      'Original Chassis Fabrication & On-Board Power Delivery'
    ]
  },
  'treasure-hunt': {
    accentColor: '#9333ea',
    lightBg: 'bg-[#faf5ff]',
    cardBg: 'bg-[#f3e8ff]',
    badgeBg: 'bg-[#9333ea] text-white',
    badgeText: 'TOP SECRET CIPHER QUEST',
    tagline: 'STAGE 1: ON-DAY CHAOS // SOLVE RIDDLES & CLUES',
    themeGlyph: '💎',
    judgingCriteria: [
      'Sequential Checkpoint Verification via Official Stamp/Hash',
      'Algorithmic Cipher & Riddle Cryptanalysis Accuracy',
      'Overall Course Completion Speed & Time Penalties',
      'Fair Play & Campus Boundary Compliance'
    ]
  },
  'quiz-tle': {
    accentColor: '#0284c7',
    lightBg: 'bg-[#f0f9ff]',
    cardBg: 'bg-[#e0f2fe]',
    badgeBg: 'bg-[#0284c7] text-white',
    badgeText: 'TECHNICAL QUIZ ARENA',
    tagline: 'DAY 2 TECHNICAL QUIZ: STAGE FINALS & RAPID BUZZER ARENA',
    themeGlyph: '💧',
    judgingCriteria: [
      'Core Systems & Algorithms Knowledge',
      'Rapid-Fire Buzzer Accuracy',
      'Finalist Stage Problem Solving'
    ]
  },
  'build-asor': {
    accentColor: '#059669',
    lightBg: 'bg-[#f0fdf4]',
    cardBg: 'bg-[#dcfce7]',
    badgeBg: 'bg-[#059669] text-white',
    badgeText: 'BUILDATHON ARENA',
    tagline: 'DAY 1 ARCHITECTURE SPRINT ➔ ROUND 2 JURY DEFENSE',
    themeGlyph: '🌿',
    judgingCriteria: [
      'End-to-End Functionality & Architectural Robustness',
      'Round 2 Execution & Prototype Refinement',
      'Clean Git History & Documentation of Dependencies',
      'Live Prototype Defense & Presentation'
    ]
  },
  'snorreelax': {
    accentColor: '#4f46e5',
    lightBg: 'bg-[#eef2ff]',
    cardBg: 'bg-[#e0e7ff]',
    badgeBg: 'bg-[#4f46e5] text-white',
    badgeText: 'CINEMATIC 35mm CHRONICLE',
    tagline: 'ASPECT 9:16 // DURATION: 45s-90s // CAPTURE THE SPIRIT OF JARVIS 3.0',
    themeGlyph: '🎬',
    judgingCriteria: [
      'Cinematic Color Grading & Rhythm of Editorial Cuts',
      'Creative Narrative Capture of Campus Atmosphere & Tension',
      'Audio Waveform Clarity, Voiceover, & Background Scoring',
      'Adherence to 45-90 Second Vertical Time Window'
    ]
  },
  'cad-mander': {
    accentColor: '#ea580c',
    lightBg: 'bg-[#fff7ed]',
    cardBg: 'bg-[#ffedd5]',
    badgeBg: 'bg-[#ea580c] text-white',
    badgeText: '2D AUTOCAD ARENA',
    tagline: '2D AUTOCAD DRAFTING ONLY // DIMENSIONAL TOLERANCE ±0.05mm',
    themeGlyph: '🔥',
    judgingCriteria: [
      'Dimensional Accuracy to 2D Blueprint Specifications',
      'Geometric Dimensioning & Tolerancing (GD&T) Integrity',
      'Drafting Speed & Clean Feature Precision'
    ]
  }
};

export function EventThemedModal({ event, onClose, onRegister }: EventThemedModalProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'rounds' | 'judging'>('rules');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!event || !mounted || typeof document === 'undefined') return null;

  const config = THEME_CONFIGS[event.id] || {
    accentColor: '#D21319',
    lightBg: 'bg-[#fff5f5]',
    cardBg: 'bg-[#fee2e2]',
    badgeBg: 'bg-[#D21319] text-white',
    badgeText: 'FESTIVAL COMPETITION DISCIPLINE',
    tagline: 'OFFICIAL TECHNICAL SPECIFICATION',
    themeGlyph: '⚔️',
    judgingCriteria: ['Technical Execution', 'Innovation', 'Oral Defense']
  };

  const hasRounds = Boolean(event.rounds && event.rounds.length > 0);
  const availableTabs: { id: 'rules' | 'rounds' | 'judging'; label: string; icon: string }[] = [
    { id: 'rules', label: 'Rules & Protocol', icon: '📜' },
    ...(hasRounds ? [{ id: 'rounds' as const, label: 'Rounds & Stages', icon: '⚡' }] : []),
    { id: 'judging', label: 'Adjudication', icon: '⚖️' },
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-[#FAF9F5] text-black border-2 border-black shadow-[8px_8px_0px_#000] rounded-none overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
      >
        {/* Top Strip */}
        <div
          className="h-2 w-full border-b border-black flex-shrink-0"
          style={{ backgroundColor: config.accentColor }}
        />

        {/* HERO BANNER SECTION (LIGHT THEME) */}
        <div className={`relative p-4 sm:p-5 ${config.lightBg} border-b-2 border-black flex-shrink-0`}>
          {/* Subtle Halftone Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '12px 12px'
            }}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 bg-black text-white hover:bg-[#D21319] transition-colors border border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-mono font-bold text-sm cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="relative z-10 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-3 pr-8 sm:pr-0">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase border border-black shadow-[1.5px_1.5px_0px_#000] ${config.badgeBg}`}>
                  {config.themeGlyph} {config.badgeText}
                </span>
                <span className="px-2 py-0.5 bg-white text-black border border-black font-mono text-[10px] font-bold shadow-[1.5px_1.5px_0px_#000]">
                  {event.dayTag}
                </span>
                <span className="px-2 py-0.5 bg-black text-white border border-black font-mono text-[10px] font-bold shadow-[1.5px_1.5px_0px_#000]">
                  {event.category}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-black leading-snug">
                {event.name}
              </h2>

              <p className="font-mono text-xs text-neutral-700 font-medium">
                {config.tagline}
              </p>
            </div>

            {/* Event Sprite with Clean Light Drop Shadow */}
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]"
                style={{ backgroundColor: `${config.accentColor}25` }}
              >
                <img
                  src={event.pokemonGif}
                  alt={event.pokemon}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = event.pokemonStatic;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Specs Strip - 3 columns, clean, no scheduled time */}
          <div className="relative z-10 mt-3 pt-2.5 border-t border-black/20 grid grid-cols-3 gap-1.5 text-xs font-mono">
            <div className="bg-white p-1.5 border border-black shadow-[1.5px_1.5px_0px_#000]">
              <span className="text-[9px] text-neutral-600 block uppercase font-bold">Team Size</span>
              <span className="font-bold text-black text-[11px] truncate block">{event.teamSize}</span>
            </div>
            <div className="bg-white p-1.5 border border-black shadow-[1.5px_1.5px_0px_#000]">
              <span className="text-[9px] text-neutral-600 block uppercase font-bold">Format / Mode</span>
              <span className="font-bold text-black text-[11px] truncate block">{event.mode}</span>
            </div>
            <div className="bg-white p-1.5 border border-black shadow-[1.5px_1.5px_0px_#000]">
              <span className="text-[9px] text-neutral-600 block uppercase font-bold">Entry Fee</span>
              <span className="font-bold text-green-700 text-[11px] block">100% Free</span>
            </div>
          </div>
        </div>

        {/* RESPONSIVE NAVIGATION TABS (SEGMENTED GRID - NO HORIZONTAL SCROLL) */}
        <div className={`grid ${availableTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 p-2 sm:p-2.5 border-b-2 border-black bg-[#EFECE6] flex-shrink-0 font-mono text-xs`}>
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-2 rounded-xs border font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center text-[11px] sm:text-xs select-none active:scale-[0.98] ${
                  isActive
                    ? 'bg-white text-black border-black shadow-[2px_2px_0px_#000] -translate-x-[0.5px] -translate-y-[0.5px]'
                    : 'bg-[#FAF8F5] text-neutral-600 border-neutral-300 hover:text-black hover:border-black/50 hover:bg-white'
                }`}
              >
                <span className="text-sm shrink-0">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT (LIGHT THEME) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-[#FAF9F5]">
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3 bg-white border border-black shadow-[2px_2px_0px_#000] text-xs text-neutral-800 leading-relaxed font-sans">
                <span className="font-bold text-black font-mono block mb-1">Executive Summary:</span>
                {event.description}
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                  Mandatory Regulations:
                </h4>
                <ul className="space-y-2 text-xs text-neutral-900 font-sans">
                  {event.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2.5 bg-white border border-neutral-300">
                      <span
                        className="font-mono font-bold text-xs flex-shrink-0 px-1.5 py-0.5 border border-black"
                        style={{ backgroundColor: `${config.accentColor}20`, color: '#000' }}
                      >
                        §{idx + 1}
                      </span>
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 p-2.5 bg-red-50 border-2 border-[#D21319] text-[#991b1b]">
                    <span className="font-mono font-bold text-xs flex-shrink-0 text-[#D21319]">
                      ⚠️ STRICT RULE
                    </span>
                    <span className="leading-relaxed text-xs">
                      Disqualification Warning: A student may only register for a maximum of <strong>2 events</strong> across the festival. Enrolling in more than 2 events will result in immediate disqualification.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'rounds' && hasRounds && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                Tournament Progression Matrix:
              </h4>
              {event.rounds.map((round, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-black shadow-[2px_2px_0px_#000] flex items-start gap-3"
                >
                  <div
                    className="w-7 h-7 border border-black flex items-center justify-center font-mono font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: `${config.accentColor}25`, color: '#000' }}
                  >
                    0{idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black block font-sans">
                      Stage {idx + 1} Assessment
                    </span>
                    <p className="text-xs text-neutral-700 mt-0.5 leading-relaxed font-sans">
                      {round}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'judging' && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                Adjudication & Evaluation Criteria:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {config.judgingCriteria.map((c, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-black shadow-[2px_2px_0px_#000] flex items-start gap-2">
                    <span className="text-xs font-bold text-black font-mono">✦</span>
                    <span className="text-xs text-neutral-800 leading-relaxed font-sans">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ACTION FOOTER (LIGHT THEME - NO CUTOFFS) */}
        <div className="p-3 sm:p-3.5 bg-[#EFECE6] border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse border border-black" />
            <span>Registration: <strong className="text-green-700">OPEN (MAX 2 EVENTS)</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {event.whatsappLink && (
              <a
                href={event.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold transition cursor-pointer active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1 shrink-0"
                title="Join Event WhatsApp Group"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold text-black transition cursor-pointer active:translate-x-[1px] active:translate-y-[1px] shrink-0"
            >
              Close
            </button>
            <button
              onClick={() => {
                const id = event.id;
                onClose();
                onRegister(id);
              }}
              className="px-4 py-1.5 bg-[#D21319] hover:bg-[#b00f14] text-white border-2 border-black shadow-[2px_2px_0px_#000] font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>ENLIST NOW</span>
              <span>[ ↗ ]</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
