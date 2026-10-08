'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  MessageSquare, 
  ArrowLeft, 
  Mail, 
  MapPin, 
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
}

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

const LINE_2_SUPPORT: ContactPerson[] = [
  {
    name: 'INDRESH SURESH',
    role: 'Takniki Helpline',
    phone: '+91 93244 74812',
    rawPhone: '+919324474812',
  },
  {
    name: 'ADITYA PARAB',
    role: 'Takniki Helpline',
    phone: '+91 87675 77969',
    rawPhone: '+918767577969',
  },
  {
    name: 'VAIBHAV DUBEY',
    role: 'Takniki Helpline',
    phone: '+91 81698 25915',
    rawPhone: '+918169825915',
  },
];

const LINE_3_SUPPORT: ContactPerson[] = [
  {
    name: 'RYAN KESHARY',
    role: 'Takniki Helpline',
    phone: '+91 93726 02311',
    rawPhone: '+919372602311',
  },
  {
    name: 'SHLOK KAMBLE',
    role: 'Takniki Helpline',
    phone: '+91 95948 30819',
    rawPhone: '+919594830819',
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
        className="bg-[#1A1F3F]/85 hover:bg-[#20274E] border border-white/15 hover:border-[#D21319]/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-[0_6px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(210,19,25,0.25)] group"
      >
        {/* Top Header Row: Role Badge & Quick Call Action */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                person.isLead
                  ? 'bg-[#D21319] text-white shadow-xs'
                  : 'bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              {person.role}
            </span>

            <a
              href={`tel:${person.rawPhone}`}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#D21319] text-white flex items-center justify-center transition-colors cursor-pointer"
              title={`Call ${person.name}`}
            >
              <Phone size={13} />
            </a>
          </div>

          {/* Person Name */}
          <h2 className="font-sans text-base sm:text-lg font-black text-white uppercase tracking-tight group-hover:text-white transition-colors">
            {person.name}
          </h2>
        </div>

        {/* Minimalist Phone & Quick Chat Block */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
            <a
              href={`tel:${person.rawPhone}`}
              className="font-mono text-xs sm:text-[13px] font-bold text-[#E9E6DA] hover:text-[#D21319] transition-colors cursor-pointer truncate"
            >
              {person.phone}
            </a>

            <button
              type="button"
              onClick={() => handleCopy(person.phone)}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
              title="Copy number"
            >
              {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>

          <a
            href={`https://wa.me/${person.rawPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <MessageSquare size={12} />
            <span>Chat on WhatsApp</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#161A35] text-[#FAF8F5] font-sans flex flex-col antialiased selection:bg-[#D21319] selection:text-white relative overflow-x-hidden">
      
      {/* Ambient background glow accents matching Landing Page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D21319]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* 1. TOP RETRO UTILITY HEADER */}
      <header className="sticky top-0 z-30 bg-[#161A35]/95 backdrop-blur-md border-b border-white/10 shadow-xs relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-[#D21319] hover:text-white border border-white/20 text-xs font-mono font-bold uppercase transition-all rounded-lg active:scale-95 cursor-pointer text-slate-200"
          >
            <ArrowLeft size={14} />
            <span>RETURN TO ARENA</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D21319] rounded-xs shadow-xs" />
            <span className="font-serif text-lg font-black tracking-tight text-white uppercase">
              INDIGO TECH FEST
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono bg-[#D21319] text-white px-2 py-0.5 rounded-xs font-bold">
              JARVIS 3.0
            </span>
          </div>
        </div>
      </header>

      {/* 2. HERO / CURATORIAL NOTICE SECTION */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full relative z-10">
        
        {/* Curatorial Header */}
        <div className="border-b border-white/10 pb-6 mb-8 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2.5">
            <span className="bg-[#D21319] text-white font-mono text-[11px] px-2.5 py-0.5 font-bold uppercase tracking-widest inline-block rounded-xs shadow-xs">
              TECHNICAL HELPLINE
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold hidden sm:inline">
              · 24/7 PARTICIPANT DESK
            </span>
          </div>

          <h1 className="font-sans text-3xl sm:text-5xl text-white uppercase font-black tracking-tight leading-tight mb-3">
            OFFICIAL HELPLINE &amp; DIRECTORY
          </h1>

          <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Need urgent assistance with festival discipline enrollments, schedule clash clarifications, squad tokens, or hardware setup? 
            Connect directly with the appointed technical heads and student coordinators below.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              DESK ACTIVE (08:30 AM – 06:00 PM IST)
            </span>
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
              SLRTCE CAMPUS, MUMBAI
            </span>
          </div>
        </div>

        {/* 3. CONTACT DIRECTORY - 3 MINIMALIST TIERS */}
        <div className="space-y-6 mb-12">
          
          {/* TIER 1: PRESIDENT & TECHNICAL COORDINATOR (2 CARDS BESIDE EACH OTHER) */}
          <div>
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2.5 px-1">
              CORE LEADERSHIP
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
              {LINE_1_LEADS.map(renderContactCard)}
            </div>
          </div>

          {/* TIER 2: INDRESH, ADITYA, VAIBHAV (3 CARDS IN SECOND LINE) */}
          <div>
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2.5 px-1">
              TAKNIKI HELPLINE DESK
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {LINE_2_SUPPORT.map(renderContactCard)}
            </div>
          </div>

          {/* TIER 3: RYAN KESHARY & SHLOK KAMBLE (2 CARDS IN THIRD LINE) */}
          <div>
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2.5 px-1">
              SYSTEMS &amp; INFRASTRUCTURE HELPLINE
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              {LINE_3_SUPPORT.map(renderContactCard)}
            </div>
          </div>

        </div>

        {/* 4. COMPREHENSIVE VENUE & GENERAL DISPATCH BOX (Dark Theme) */}
        <div className="border border-white/15 bg-[#1A1F3F]/60 backdrop-blur-md p-5 sm:p-8 rounded-xl shadow-xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Campus Address */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={15} className="text-[#D21319]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  PHYSICAL VENUE
                </h3>
              </div>
              <strong className="block text-xs sm:text-sm font-bold text-white font-sans">
                Shree L. R. Tiwari College of Engineering
              </strong>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Kanakia Park, Near GCC Club, Mira Road (East), Thane, Maharashtra 401107
              </p>
            </div>

            {/* Electronic Inquiries */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={15} className="text-[#D21319]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  ELECTRONIC INQUIRIES
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Official festival mailbox for sponsorship and campus delegations:
              </p>
              <a
                href="mailto:fest@slrtce.in"
                className="font-mono text-xs font-bold text-white underline hover:text-[#D21319] transition-colors block"
              >
                fest@slrtce.in
              </a>
            </div>

            {/* Official WhatsApp Community */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={15} className="text-emerald-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  OFFICIAL COMMUNITY
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Join the official festival announcement feed for live schedule updates:
              </p>
              <a
                href="https://chat.whatsapp.com/B5eqtUDwxiWALkV1hH9pbv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                <span>Join WhatsApp Group</span>
                <ExternalLink size={11} />
              </a>
            </div>

          </div>
        </div>

      </main>

      {/* 5. SLIM VALID FOOTER */}
      <Footer />

    </div>
  );
}
