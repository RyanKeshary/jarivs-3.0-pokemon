'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  MessageSquare, 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

interface ContactPerson {
  name: string;
  role: string;
  phone: string;
  rawPhone: string;
  isLead?: boolean;
  isTakniki?: boolean;
}

// ROW 1: CORE LEADERSHIP (Manthan & Shreyash)
const LINE_1_LEADS: ContactPerson[] = [
  {
    name: 'MANTHAN JOSHI',
    role: 'Technical Coordinator',
    phone: '+91 90043 27565',
    rawPhone: '+919004327565',
    isLead: true,
  },
  {
    name: 'SHREYASH CHATURVEDI',
    role: 'President',
    phone: '+91 73041 67033',
    rawPhone: '+917304167033',
    isLead: true,
  },
];

// ROW 2: RYAN, SHLOK, AND ADITYA (Takniki Desk for Ryan & Shlok only)
const LINE_2_SUPPORT: ContactPerson[] = [
  {
    name: 'RYAN KESHARY',
    role: 'Takniki Desk',
    phone: '+91 93726 02311',
    rawPhone: '+919372602311',
    isTakniki: true,
  },
  {
    name: 'SHLOK KAMBLE',
    role: 'Takniki Desk',
    phone: '+91 95948 30819',
    rawPhone: '+919594830819',
    isTakniki: true,
  },
  {
    name: 'ADITYA PARAB',
    role: 'Student Coordinator',
    phone: '+91 87675 77969',
    rawPhone: '+918767577969',
  },
];

// ROW 3: INDRESH AND VAIBHAV (Student Coordinator roles)
const LINE_3_SUPPORT: ContactPerson[] = [
  {
    name: 'INDRESH SURESH',
    role: 'Student Coordinator',
    phone: '+91 93244 74812',
    rawPhone: '+919324474812',
  },
  {
    name: 'VAIBHAV DUBEY',
    role: 'Student Coordinator',
    phone: '+91 81698 25915',
    rawPhone: '+918169825915',
  },
];

export default function ContactPage() {
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopy = (phone: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const renderContactCard = (person: ContactPerson) => {
    const isCopied = copiedPhone === person.phone;

    return (
      <div
        key={person.name}
        className="bg-white border-2 border-black rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#D21319] hover:-translate-y-0.5 group"
      >
        {/* Top Header Row: Role Badge & Quick Call Action */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                person.isLead
                  ? 'bg-[#D21319] text-white shadow-[1.5px_1.5px_0px_#000]'
                  : person.isTakniki
                  ? 'bg-black text-white shadow-[1.5px_1.5px_0px_#D21319]'
                  : 'bg-neutral-100 text-neutral-800 border border-black shadow-[1.5px_1.5px_0px_#000]'
              }`}
            >
              {person.role}
            </span>

            <a
              href={`tel:${person.rawPhone}`}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-[#D21319] hover:text-white text-black border border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center transition-all cursor-pointer"
              title={`Call ${person.name}`}
            >
              <Phone size={13} />
            </a>
          </div>

          {/* Person Name */}
          <h2 className="font-sans text-base sm:text-lg font-black text-black uppercase tracking-tight group-hover:text-[#D21319] transition-colors">
            {person.name}
          </h2>
        </div>

        {/* Minimalist Phone & Quick Chat Block */}
        <div className="space-y-2.5 pt-2 border-t border-black/10">
          <div className="bg-[#FAF8F5] border border-black rounded-lg px-3 py-2 flex items-center justify-between shadow-[2px_2px_0px_#000]">
            <a
              href={`tel:${person.rawPhone}`}
              className="font-mono text-xs sm:text-[13px] font-bold text-black hover:text-[#D21319] transition-colors cursor-pointer truncate"
            >
              {person.phone}
            </a>

            <button
              type="button"
              onClick={() => handleCopy(person.phone)}
              className="p-1 text-neutral-500 hover:text-black transition-colors cursor-pointer shrink-0 ml-2"
              title="Copy number"
            >
              {isCopied ? <Check size={14} className="text-emerald-600 font-bold" /> : <Copy size={13} />}
            </button>
          </div>

          <a
            href={`https://wa.me/${person.rawPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-black rounded-lg shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <MessageSquare size={12} />
            <span>Chat on WhatsApp</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-black font-sans flex flex-col antialiased selection:bg-[#D21319] selection:text-white relative overflow-x-hidden">
      
      {/* Subtle retro dot pattern matching Landing Page */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage: 'radial-gradient(#000000 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* 1. TOP RETRO UTILITY HEADER */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b-2 border-black shadow-xs relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-[#D21319] hover:text-white border border-black text-xs font-mono font-bold uppercase transition-all rounded-lg active:scale-95 cursor-pointer text-black shadow-[2px_2px_0px_#000]"
          >
            <ArrowLeft size={14} />
            <span>RETURN TO ARENA</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D21319] rounded-xs shadow-xs" />
            <span className="font-serif text-lg font-black tracking-tight text-black uppercase">
              INDIGO TECH FEST
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono bg-[#D21319] text-white px-2 py-0.5 rounded-xs font-bold shadow-[1.5px_1.5px_0px_#000]">
              JARVIS 3.0
            </span>
          </div>
        </div>
      </header>

      {/* 2. HERO / CURATORIAL NOTICE SECTION */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full relative z-10">
        
        {/* Curatorial Header */}
        <div className="border-b-2 border-black/10 pb-6 mb-8 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2.5">
            <span className="bg-[#D21319] text-white font-mono text-[11px] px-2.5 py-0.5 font-bold uppercase tracking-widest inline-block rounded-xs shadow-[2px_2px_0px_#000]">
              TECHNICAL HELPLINE
            </span>
            <span className="text-xs font-mono text-neutral-600 font-bold hidden sm:inline">
              · 24/7 PARTICIPANT DESK
            </span>
          </div>

          <h1 className="font-sans text-3xl sm:text-5xl text-black uppercase font-black tracking-tight leading-tight mb-3">
            OFFICIAL HELPLINE &amp; DIRECTORY
          </h1>

          <p className="font-sans text-xs sm:text-sm text-neutral-700 max-w-3xl leading-relaxed">
            Need urgent assistance with festival discipline enrollments, schedule clash clarifications, squad tokens, or hardware setup? 
            Connect directly with the appointed technical heads and student coordinators below.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-600 rounded-lg text-emerald-900 font-bold shadow-[2px_2px_0px_#000]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DESK ACTIVE (08:30 AM – 06:00 PM IST)
            </span>
            <span className="px-3 py-1.5 bg-white border border-black rounded-lg text-neutral-800 shadow-[2px_2px_0px_#000]">
              SLRTCE CAMPUS, MUMBAI
            </span>
          </div>
        </div>

        {/* 3. CONTACT DIRECTORY - 3 TIERS */}
        <div className="space-y-8 mb-12">
          
          {/* TIER 1: PRESIDENT & TECHNICAL COORDINATOR (2 CARDS BESIDE EACH OTHER) */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2 h-2 bg-[#D21319]" />
              <span className="text-xs font-mono text-neutral-700 font-bold uppercase tracking-wider">
                CORE LEADERSHIP
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
              {LINE_1_LEADS.map(renderContactCard)}
            </div>
          </div>

          {/* TIER 2: RYAN, SHLOK, AND ADITYA (3 CARDS IN SECOND LINE) */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2 h-2 bg-black" />
              <span className="text-xs font-mono text-neutral-700 font-bold uppercase tracking-wider">
                TAKNIKI DESK &amp; COORDINATION
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {LINE_2_SUPPORT.map(renderContactCard)}
            </div>
          </div>

          {/* TIER 3: INDRESH AND VAIBHAV (2 CARDS IN THIRD LINE) */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2 h-2 bg-neutral-600" />
              <span className="text-xs font-mono text-neutral-700 font-bold uppercase tracking-wider">
                STUDENT COORDINATORS
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl">
              {LINE_3_SUPPORT.map(renderContactCard)}
            </div>
          </div>

        </div>

      </main>

      {/* 4. SLIM RETRO FOOTER */}
      <Footer />

    </div>
  );
}
