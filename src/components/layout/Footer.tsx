'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

export function Footer() {

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
                Jarvis 3.0 brought to you by the love bearing Student Council and Takniki desk at slrtce. all we want from you, is to enjoy yourself 🫶🏻
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

    </footer>
  );
}
