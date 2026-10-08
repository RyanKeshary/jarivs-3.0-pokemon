'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Phone, X, Play, Volume2, VolumeX } from 'lucide-react';

export function Footer() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = `/#${id}`;
      }
    }
  };

  const disciplines = [
    { name: 'BUILD-ASOR', tag: 'HACKATHON' },
    { name: 'CAD-MANDER', tag: 'CAD' },
    { name: 'QUIZ-TLE', tag: 'QUIZ' },
    { name: 'PID-GEOTTO', tag: 'ROBOTICS' },
    { name: 'SNORREELAX', tag: 'REELS' },
    { name: 'EXHIBITION', tag: 'PROJECTS' },
  ];

  return (
    <footer id="contact-footer" className="relative z-20 w-full bg-[#FAF8F5] text-black border-t-4 border-black select-none">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* 3 Neo-Brutalist Slim Cards Grid (Exact reference style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* ========================================================
              BOX 1: FESTIVAL BRAND & AFFILIATION
             ======================================================== */}
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 flex flex-col justify-between">
            <div>
              {/* Black Box Pill Title */}
              <div className="inline-block bg-black text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0px_#D21319]">
                INDIGO TECH FEST
              </div>
              
              <div className="font-mono text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-3">
                SPECTRUM OF INNOVATION · JARVIS 3.0
              </div>

              <p className="font-sans text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                The flagship annual technical symposium organized by the <strong>Department of Computer Engineering & IT</strong> in association with the <strong>Technical Student Council</strong> at Shree L. R. Tiwari College of Engineering, Mumbai.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-black text-[11px] font-mono text-slate-600 space-y-1">
              <div>Thakur Educational Campus / SLRTCE, Mira Road East, Mumbai 401107</div>
              <div className="font-bold text-black">
                Autonomous · AICTE Approved · NAAC &apos;A+&apos; Grade · Affiliated to Mumbai University
              </div>
            </div>
          </div>

          {/* ========================================================
              BOX 2: PAGES (NAV BUTTONS FROM NAVBAR)
             ======================================================== */}
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 flex flex-col justify-between">
            <div>
              <div className="inline-block bg-black text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-wider mb-3">
                PAGES
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="w-full py-2 px-3 bg-white hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] text-center cursor-pointer block"
                >
                  HOME
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('events')}
                  className="w-full py-2 px-3 bg-white hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] text-center cursor-pointer block"
                >
                  THE 7 DISCIPLINES
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('announcements')}
                  className="w-full py-2 px-3 bg-white hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] text-center cursor-pointer block"
                >
                  NOTICES &amp; BULLETINS
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('timeline')}
                  className="w-full py-2 px-3 bg-white hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] text-center cursor-pointer block"
                >
                  EVENT SCHEDULE
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-to-join')}
                  className="w-full py-2 px-3 bg-white hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] text-center cursor-pointer block"
                >
                  HOW TO ENLIST
                </button>

                <Link
                  href="/contact"
                  className="w-full py-2 px-3 bg-white hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] text-center cursor-pointer block"
                >
                  CONTACT DESKS
                </Link>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-black text-[10px] font-mono text-slate-500 text-center">
              FAST NAVIGATION CODEX
            </div>
          </div>

          {/* ========================================================
              BOX 3: DISCIPLINES CHIPS, EMERGENCY CONTACT & EASTER EGG
             ======================================================== */}
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 flex flex-col justify-between">
            <div>
              <div className="inline-block bg-black text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-wider mb-3">
                6 DISCIPLINES &amp; EMERGENCY
              </div>

              {/* Chips Grid */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {disciplines.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => scrollToSection('events')}
                    className="p-1 text-center bg-white hover:bg-black hover:text-white border border-black font-mono text-[9px] font-bold uppercase transition-colors cursor-pointer truncate"
                    title={d.name}
                  >
                    {d.name}
                  </button>
                ))}
              </div>

              {/* Emergency Contacts Section */}
              <div className="border-t border-black pt-3 space-y-1.5 font-mono text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  EMERGENCY HELPLINE
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">President (Shreyash):</span>
                  <a href="tel:+917304167033" className="text-black font-bold underline hover:text-[#D21319]">
                    +91 73041 67033
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Tech Coord (Manthan):</span>
                  <a href="tel:+919004327565" className="text-black font-bold underline hover:text-[#D21319]">
                    +91 90043 27565
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Takniki Desk:</span>
                  <a href="tel:+918767577969" className="text-black font-bold underline hover:text-[#D21319]">
                    +91 87675 77969
                  </a>
                </div>
              </div>
            </div>

            {/* THE SPECIAL EASTER EGG VIDEO BLOCK (Looks normal, plays gemini_generated_video.mp4 on click) */}
            <div className="pt-3 mt-3 border-t border-black">
              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="w-full py-2.5 px-3 bg-[#FAF8F5] hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold flex items-center justify-between shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer group"
                title="Click to view Festival Archive Reel"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-black text-white group-hover:bg-[#D21319] flex items-center justify-center rounded-xs transition-colors">
                    <Play size={11} className="fill-current ml-0.5" />
                  </div>
                  <span className="uppercase tracking-wider">ARCHIVAL LOGS // MMXXVI</span>
                </div>
                <span className="text-[10px] bg-black text-white group-hover:bg-[#D21319] px-1.5 py-0.5 rounded-xs transition-colors">
                  RECORD ➔
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Return to Top */}
        <div className="border-t-2 border-black pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="border-2 border-black px-3.5 py-1.5 bg-white shadow-[3px_3px_0px_#000] font-bold text-black text-center sm:text-left">
            &copy; 2004&ndash;2026 Indigo Techfest &amp; Technical Council. SLRTCE Mumbai.
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-[#D21319] text-white font-bold uppercase transition-colors shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            <span>RETURN TO TOP</span>
            <ArrowUp size={14} />
          </button>
        </div>

      </div>

      {/* ========================================================
          EASTER EGG VIDEO PLAYER MODAL
         ======================================================== */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-black border-4 border-white shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-3 bg-[#161A35] border-b border-white/20 flex items-center justify-between text-white font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D21319] animate-pulse" />
                <span className="font-bold uppercase tracking-wider">
                  CLASSIFIED FESTIVAL ARCHIVE · INDIGO TECH FEST
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="p-1 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors cursor-pointer"
                  title="Close archive video"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Video Canvas */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src="/media/gemini_generated_video.mp4"
                autoPlay
                controls
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 bg-black border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Source: gemini_generated_video // Codex Archive</span>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="px-3 py-1 bg-white text-black font-bold text-xs hover:bg-[#D21319] hover:text-white transition-colors cursor-pointer"
              >
                Close Archive
              </button>
            </div>

          </div>
        </div>
      )}

    </footer>
  );
}
