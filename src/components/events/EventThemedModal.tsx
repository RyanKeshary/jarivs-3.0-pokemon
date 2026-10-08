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
  prizes: { place: string; reward: string; icon: string }[];
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
    prizes: [
      { place: '1st Laurels', reward: '₹15,000 + Distinction Trophy + Certificate of Merit', icon: '🏆' },
      { place: 'Runner Up', reward: '₹8,000 + Certificate of Excellence', icon: '🥈' },
      { place: 'Special Innovation', reward: '₹4,000 + Incubation Fast-Track Recommendation', icon: '💡' }
    ],
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
    badgeText: 'AERODYNAMIC SPEED SPRINT',
    tagline: 'CLOSED-LOOP SENSOR TELEMETRY: HIGH-CURVATURE CIRCUIT',
    themeGlyph: '🏎️',
    prizes: [
      { place: 'Apex Velocity Cup', reward: '₹12,000 + Speed Lap Trophy + Gold Crest', icon: '🏆' },
      { place: 'Precision Runner Up', reward: '₹6,000 + Silver Crest Certificate', icon: '🥈' },
      { place: 'Optimal Tuning Award', reward: '₹3,000 + Best Hardware Craftsmanship', icon: '⚙️' }
    ],
    judgingCriteria: [
      'Lowest Clean Lap Time Across Three Verified Trials',
      'Smooth Line Tracking Without Track Derailment / Disconnect',
      'Original Chassis Fabrication & On-Board Power Delivery',
      'Zero Wireless Interference or Off-Board Guidance'
    ]
  },
  'treasure-hunt': {
    accentColor: '#9333ea',
    lightBg: 'bg-[#faf5ff]',
    cardBg: 'bg-[#f3e8ff]',
    badgeBg: 'bg-[#9333ea] text-white',
    badgeText: 'TOP SECRET CIPHER QUEST',
    tagline: 'SECURITY CLEARANCE: DOSSIER DECLASSIFIED // RETRIEVE COINS',
    themeGlyph: '💎',
    prizes: [
      { place: 'Grand Syndicate Bounty', reward: '₹10,000 + Champion Seal + Gold Vault Trophy', icon: '💰' },
      { place: 'Cipher Runner Up', reward: '₹5,000 + Tactical Commendation', icon: '🥈' },
      { place: 'Speed Cryptographer', reward: '₹2,500 + Fast Solver Distinction', icon: '🧩' }
    ],
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
    badgeText: 'HYDRO BUZZER ARENA',
    tagline: 'TWO-STAGE ELIMINATOR: RAPID BUZZER & ALGORITHMIC PROOF',
    themeGlyph: '💧',
    prizes: [
      { place: 'Polymath Grand Cup', reward: '₹10,000 + Sovereign Quiz Shield + Laurels', icon: '🏆' },
      { place: 'Second Podium', reward: '₹5,000 + Certificate of Intellectual Distinction', icon: '🥈' },
      { place: 'Third Podium', reward: '₹2,500 + Certificate of Merit', icon: '🥉' }
    ],
    judgingCriteria: [
      'Round 1: 50-Question Written Systems & Algorithms Exam',
      'Round 2: Rapid-Fire Negative-Marking Buzzer Elimination',
      'Round 3: Live Auditorium Stage Finals (Top 8 Pairs)',
      'Accuracy on High-Stakes Tie-Breaker Problem Statements'
    ]
  },
  'build-asor': {
    accentColor: '#059669',
    lightBg: 'bg-[#f0fdf4]',
    cardBg: 'bg-[#dcfce7]',
    badgeBg: 'bg-[#059669] text-white',
    badgeText: '48-HR HYBRID CRUCIBLE',
    tagline: 'DAY 1 CONNECTED ARCHITECTURE ➔ DAY 2 AIR-GAPPED OFFLINE BINARIES',
    themeGlyph: '🌿',
    prizes: [
      { place: 'Grand Buildathon Laurels', reward: '₹25,000 + Golden Bulb Trophy + Direct Pitch Invite', icon: '👑' },
      { place: 'Engineering Runner Up', reward: '₹12,000 + Certificate of Architectural Distinction', icon: '🥈' },
      { place: 'Best Air-Gapped Binary', reward: '₹5,000 + Offline Code Craftsmanship Award', icon: '💾' }
    ],
    judgingCriteria: [
      'End-to-End Functionality & Architectural Robustness',
      'Day 2 Offline Air-Gapped Code Freeze & Compilation Check',
      'Clean Git History & Documentation of Native Dependencies',
      'Live Prototype Defense & Stress Test Interrogation'
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
    prizes: [
      { place: 'Grand Cinema Laurel', reward: '₹8,000 + Director Clapper Trophy + Screening Award', icon: '🎥' },
      { place: 'Best Visual Grading', reward: '₹4,000 + Certificate of Creative Excellence', icon: '🥈' },
      { place: 'Best Sound Design', reward: '₹2,000 + Acoustic Narrative Distinction', icon: '🎵' }
    ],
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
    badgeText: 'THERMAL DRAFTING FORGE',
    tagline: 'DIMENSIONAL TOLERANCE ±0.05mm // 3D SOLID KINEMATICS & ASSEMBLY',
    themeGlyph: '🔥',
    prizes: [
      { place: 'Forge Master Trophy', reward: '₹12,000 + Precision Caliper Crest + Laurels', icon: '🏆' },
      { place: 'CAD Runner Up', reward: '₹6,000 + Certificate of Drafting Precision', icon: '🥈' },
      { place: 'Complex Kinematics Award', reward: '₹3,000 + Solid Assembly Distinction', icon: '📐' }
    ],
    judgingCriteria: [
      'Dimensional Accuracy to Blueprint Isometric Specifications',
      'Constraint Integrity & Parametric Model Adaptability',
      'Drafting Speed & Clean Feature Tree Hierarchy',
      'Mechanical Assembly Exploded View & Motion Feasibility'
    ]
  }
};

export function EventThemedModal({ event, onClose, onRegister }: EventThemedModalProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'rounds' | 'prizes' | 'judging'>('rules');
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
    prizes: [{ place: '1st Prize', reward: 'Grand Trophy + Certificate of Merit', icon: '🏆' }],
    judgingCriteria: ['Technical Execution', 'Innovation', 'Oral Defense']
  };

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

          {/* Quick Specs Strip */}
          <div className="relative z-10 mt-3 pt-2.5 border-t border-black/20 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
            <div className="bg-white p-1.5 border border-black shadow-[1.5px_1.5px_0px_#000]">
              <span className="text-[9px] text-neutral-600 block uppercase font-bold">Team Size</span>
              <span className="font-bold text-black text-[11px] truncate block">{event.teamSize}</span>
            </div>
            <div className="bg-white p-1.5 border border-black shadow-[1.5px_1.5px_0px_#000]">
              <span className="text-[9px] text-neutral-600 block uppercase font-bold">Scheduled Time</span>
              <span className="font-bold text-black text-[11px] truncate block">{event.slotTime}</span>
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

        {/* NAVIGATION TABS (LIGHT EDITORIAL - NO SCROLLBAR ARROWS) */}
        <div className="flex border-b-2 border-black bg-[#EFECE6] px-3 sm:px-4 gap-1 flex-shrink-0 overflow-x-auto text-xs font-mono scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'rules'
                ? 'border-black text-black bg-white -mb-[2px] border-t border-x'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            📜 Rules & Protocol
          </button>
          <button
            onClick={() => setActiveTab('rounds')}
            className={`py-2 px-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'rounds'
                ? 'border-black text-black bg-white -mb-[2px] border-t border-x'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            ⚡ Rounds & Stages
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`py-2 px-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'prizes'
                ? 'border-black text-black bg-white -mb-[2px] border-t border-x'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            🏆 Prize Laurels
          </button>
          <button
            onClick={() => setActiveTab('judging')}
            className={`py-2 px-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap text-xs ${
              activeTab === 'judging'
                ? 'border-black text-black bg-white -mb-[2px] border-t border-x'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            ⚖️ Adjudication
          </button>
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

          {activeTab === 'rounds' && (
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

          {activeTab === 'prizes' && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                Official Laurels & Rewards:
              </h4>
              {config.prizes.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-black shadow-[2px_2px_0px_#000] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <span className="text-xs font-mono font-bold text-neutral-600 block uppercase tracking-wider">
                        {p.place}
                      </span>
                      <span className="text-xs font-bold text-black font-sans">
                        {p.reward}
                      </span>
                    </div>
                  </div>
                  <span
                    className="font-mono text-[10px] font-bold px-2 py-0.5 border border-black"
                    style={{ backgroundColor: `${config.accentColor}20`, color: '#000' }}
                  >
                    CONFIRMED
                  </span>
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
