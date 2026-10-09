'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Play, X, Volume2, VolumeX } from 'lucide-react';

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

  return (
    <footer id="contact-footer" className="relative z-20 w-full bg-[#FAF8F5] text-black border-t-2 border-black select-none">
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        
        {/* 3 Neo-Brutalist Cards Grid (Minimalist & scaled-down on mobile, expansive on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 mb-2.5 sm:mb-4">
          
          {/* ========================================================
              BOX 1: FESTIVAL BRAND & SYMPOSIUM
             ======================================================== */}
          <div className="bg-white border sm:border-2 border-black shadow-[2px_2px_0px_#000] sm:shadow-[4px_4px_0px_#000] p-3 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <img
                  src="/logo.png"
                  alt="Indigo Tech Fest Logo"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] object-contain shrink-0"
                />
                <div>
                  <div className="inline-block bg-black text-white px-2 sm:px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#D21319] sm:shadow-[2px_2px_0px_#D21319]">
                    INDIGO TECH FEST
                  </div>
                  <div className="font-mono text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                    SPECTRUM OF INNOVATION · JARVIS 3.0
                  </div>
                </div>
              </div>

              <p className="font-sans text-[11px] sm:text-xs text-slate-700 leading-snug sm:leading-relaxed">
                The flagship annual technical symposium organized by the <strong>Department of Computer Engineering &amp; IT</strong> in association with the <strong>Technical Student Council</strong> at Shree L. R. Tiwari College of Engineering, Mumbai.
              </p>
            </div>
          </div>

          {/* ========================================================
              BOX 2: PAGES (NAV BUTTONS)
             ======================================================== */}
          <div className="bg-white border sm:border-2 border-black shadow-[2px_2px_0px_#000] sm:shadow-[4px_4px_0px_#000] p-3 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="inline-block bg-black text-white px-2 sm:px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 sm:mb-2.5">
                PAGES
              </div>

              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="py-1 px-1.5 sm:px-2 bg-white hover:bg-black hover:text-white border border-black text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] text-center cursor-pointer block truncate"
                >
                  HOME
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('events')}
                  className="py-1 px-1.5 sm:px-2 bg-white hover:bg-black hover:text-white border border-black text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] text-center cursor-pointer block truncate"
                >
                  7 DISCIPLINES
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('announcements')}
                  className="py-1 px-1.5 sm:px-2 bg-white hover:bg-black hover:text-white border border-black text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] text-center cursor-pointer block truncate"
                >
                  NOTICES
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('schedule')}
                  className="py-1 px-1.5 sm:px-2 bg-white hover:bg-black hover:text-white border border-black text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] text-center cursor-pointer block truncate"
                >
                  SCHEDULE
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('join')}
                  className="py-1 px-1.5 sm:px-2 bg-white hover:bg-black hover:text-white border border-black text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] text-center cursor-pointer block truncate"
                >
                  HOW TO ENLIST
                </button>

                <Link
                  href="/contact"
                  className="py-1 px-1.5 sm:px-2 bg-white hover:bg-black hover:text-white border border-black text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] text-center cursor-pointer block truncate"
                >
                  CONTACT DESKS
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================
              BOX 3: EMERGENCY HELPLINE & EASTER EGG VIDEO
             ======================================================== */}
          <div className="bg-white border sm:border-2 border-black shadow-[2px_2px_0px_#000] sm:shadow-[4px_4px_0px_#000] p-3 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="inline-block bg-black text-white px-2 sm:px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 sm:mb-2.5">
                EMERGENCY HELPLINE
              </div>

              {/* Emergency Contacts List */}
              <div className="space-y-0.5 sm:space-y-1 font-mono text-[10px] sm:text-xs">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-bold">Tech Coord (Manthan Joshi):</span>
                  <a href="tel:+919004327565" className="text-black font-bold underline hover:text-[#D21319]">
                    +91 90043 27565
                  </a>
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-bold">President (Shreyash Chaturvedi):</span>
                  <a href="tel:+917304167033" className="text-black font-bold underline hover:text-[#D21319]">
                    +91 73041 67033
                  </a>
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-bold">Takniki Desk:</span>
                  <a href="tel:+919372602311" className="text-black font-bold underline hover:text-[#D21319]">
                    +91 93726 02311
                  </a>
                </div>
              </div>
            </div>

            {/* EASTER EGG VIDEO BLOCK */}
            <div className="pt-2 sm:pt-2.5 mt-1.5 sm:mt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="w-full py-1 sm:py-1.5 px-2 sm:px-2.5 bg-[#FAF8F5] hover:bg-black hover:text-white border border-black text-[10px] sm:text-[11px] font-mono font-bold flex items-center justify-between shadow-[1.5px_1.5px_0px_#000] sm:shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer group"
                title="Click to view Festival Archive Reel"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black text-white group-hover:bg-[#D21319] flex items-center justify-center rounded-xs transition-colors">
                    <Play size={8} className="fill-current ml-0.5" />
                  </div>
                  <span className="uppercase tracking-wider">ARCHIVAL LOGS</span>
                </div>
                <span className="text-[8.5px] sm:text-[9px] bg-black text-white group-hover:bg-[#D21319] px-1 py-0.2 rounded-xs transition-colors">
                  PLAY ➔
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Slim return to top without copyright box */}
        <div className="border-t border-black/20 pt-1.5 sm:pt-2 flex justify-end">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-black hover:bg-[#D21319] text-white font-mono text-[9px] sm:text-[10px] font-bold uppercase transition-colors shadow-[1.5px_1.5px_0px_#000] sm:shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <span>RETURN TO TOP</span>
            <ArrowUp size={10} />
          </button>
        </div>

      </div>

      {/* ========================================================
          EASTER EGG VIDEO PLAYER MODAL
         ======================================================== */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-black border-2 border-white shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-2.5 bg-[#161A35] border-b border-white/20 flex items-center justify-between text-white font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D21319] animate-pulse" />
                <span className="font-bold tracking-wider uppercase">FESTIVAL ARCHIVAL REEL</span>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Video Player Area */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src="/media/gemini_generated_video.mp4"
                autoPlay
                controls
                muted={isMuted}
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Controls / Footer */}
            <div className="p-2 bg-[#0F1226] border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-slate-400">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
                </button>
                <span>SOURCE: GEMINI ARCHIVE REEL</span>
              </div>

              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="px-2.5 py-1 bg-white hover:bg-[#D21319] text-black hover:text-white font-bold uppercase transition-colors rounded-xs text-[10px]"
              >
                CLOSE [ESC]
              </button>
            </div>

          </div>
        </div>
      )}

    </footer>
  );
}
