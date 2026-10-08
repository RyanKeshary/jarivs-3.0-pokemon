'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowUp, 
  MapPin, 
  Mail, 
  Calendar, 
  Shield, 
  Sparkles, 
  ExternalLink, 
  MessageSquare, 
  Clock, 
  Building2,
  Lock,
  ChevronRight
} from 'lucide-react';

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
      }
    }
  };

  return (
    <footer id="contact" className="relative z-20 w-full bg-[#0A0D1F] border-t-2 border-[#D21319]/40 text-slate-200 select-none overflow-hidden">
      
      {/* Subtle Ambient Background Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(210,19,25,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.1),transparent_50%)] pointer-events-none" />

      {/* Top Banner: Quick Summary & Back to Top */}
      <div className="border-b border-white/10 bg-[#0F142E]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D21319] shadow-[0_0_10px_#D21319] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-slate-300 font-bold">
              INDIGO TECH FEST · JARVIS 3.0 · SLRTCE CAMPUS
            </span>
            <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono bg-emerald-950/70 border border-emerald-600/60 rounded text-emerald-400 font-bold">
              OCTOBER 16–17, 2026
            </span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer group"
            title="Return to stage top"
          >
            <span>BACK TO TOP</span>
            <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform text-[#D21319]" />
          </button>
        </div>
      </div>

      {/* Main 4-Column Directory Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Col 1: Festival Identity & Lore */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 bg-[#D21319] rounded-sm shadow-sm" />
              <span className="font-serif text-2xl font-black text-white tracking-tight uppercase">
                INDIGO TECH FEST
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/40 border border-red-800/40 rounded text-[11px] font-mono text-red-300 font-bold">
              <Sparkles size={12} className="text-[#D21319]" />
              <span>JARVIS 3.0 · MMXXVI EDITION</span>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-sans">
              An annual inter-collegiate technology symposium hosted by Shree L. R. Tiwari College of Engineering. 
              Featuring six disciplines of robotics, autonomous machines, parametric CAD, and algorithmic craft.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">Complimentary Entry</span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">Verified Certificates</span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">Cash Prizes</span>
            </div>
          </div>

          {/* Col 2: The Seven Disciplines */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-[#D21319]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                FESTIVAL DISCIPLINES
              </span>
            </div>

            <ul className="space-y-2 text-xs font-sans text-slate-400">
              <li>
                <button
                  onClick={() => scrollToSection('events')}
                  className="hover:text-white flex items-center justify-between w-full text-left transition-colors cursor-pointer group"
                >
                  <span className="group-hover:text-white">Build-asor (24h Hardware & Systems)</span>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-[#D21319] transition-colors" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('events')}
                  className="hover:text-white flex items-center justify-between w-full text-left transition-colors cursor-pointer group"
                >
                  <span className="group-hover:text-white">Cad-Mander (Parametric CAD Modeling)</span>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-[#D21319] transition-colors" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('events')}
                  className="hover:text-white flex items-center justify-between w-full text-left transition-colors cursor-pointer group"
                >
                  <span className="group-hover:text-white">Quiz-tle (Speed Technical Tournament)</span>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-[#D21319] transition-colors" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('events')}
                  className="hover:text-white flex items-center justify-between w-full text-left transition-colors cursor-pointer group"
                >
                  <span className="group-hover:text-white">PID-geotto (Autonomous Robotics Track)</span>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-[#D21319] transition-colors" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('events')}
                  className="hover:text-white flex items-center justify-between w-full text-left transition-colors cursor-pointer group"
                >
                  <span className="group-hover:text-white">Snorreelax (Short Reel Documentary)</span>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-[#D21319] transition-colors" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('events')}
                  className="hover:text-white flex items-center justify-between w-full text-left transition-colors cursor-pointer group"
                >
                  <span className="group-hover:text-white">Project Exhibition (Hardware & Software)</span>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-[#D21319] transition-colors" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation & Codex Operations */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={14} className="text-[#D21319]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                NAVIGATION & CODEX
              </span>
            </div>

            <ul className="space-y-2 text-xs font-sans text-slate-400">
              <li>
                <button
                  onClick={() => scrollToSection('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Stage Overview & Live Countdown
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('events')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Disciplines Ledger & Rules
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('announcements')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Central Bulletins</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('timeline')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Two-Day Fest Schedule
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('how-to-join')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Candidate Enlistment Protocol
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Frequently Asked Inquiries
                </button>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5"
                >
                  <span>Technical Helplines & Contacts</span>
                  <span>→</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-white/10">
                <Link
                  href="/admin"
                  className="text-slate-400 hover:text-[#D21319] transition-colors flex items-center gap-1.5 font-mono text-[11px]"
                >
                  <Lock size={11} />
                  <span>Admin & Master Console</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Venue & Official Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} className="text-[#D21319]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                VENUE & CONTACT
              </span>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#D21319] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-sans">Shree L. R. Tiwari College of Engineering</strong>
                  <span>Kanakia Park, Near GCC Club, Mira Road (East), Thane, Maharashtra 401107</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Clock size={14} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span>Festival Hours: 08:30 AM – 06:00 PM IST</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Mail size={14} className="text-[#D21319] shrink-0" />
                <a
                  href="mailto:fest@slrtce.in"
                  className="hover:text-white underline transition-colors"
                >
                  fest@slrtce.in
                </a>
              </div>
            </div>

            {/* Official WhatsApp Community Button */}
            <div className="pt-2">
              <a
                href="https://chat.whatsapp.com/B5eqtUDwxiWALkV1hH9pbv"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                <MessageSquare size={14} />
                <span>Join Official WhatsApp</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

        </div>

        {/* Academic Accreditation and Host Line */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-3">
          <div>
            <span>ORGANISED BY: </span>
            <strong className="text-slate-400">Department of Computer Engineering & IT</strong>
            <span className="hidden sm:inline"> in association with the </span>
            <span className="text-slate-400">Technical Student Council</span>
          </div>

          <div className="flex items-center gap-3">
            <span>AICTE APPROVED</span>
            <span>·</span>
            <span>UNIVERSITY OF MUMBAI</span>
            <span>·</span>
            <span>ISO 9001:2015</span>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} INDIGO TECH FEST · JARVIS 3.0. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SYSTEMS OPERATIONAL</span>
            </span>
            <span>·</span>
            <span>ACADEMIC INTEGRITY CODE ENFORCED</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
