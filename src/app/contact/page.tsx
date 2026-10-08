'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  MessageSquare, 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
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
  category: 'core' | 'technical' | 'support';
}

const CONTACTS: ContactPerson[] = [
  {
    name: 'SHREYASH',
    role: 'President',
    phone: '+91 73041 67033',
    rawPhone: '+917304167033',
    category: 'core',
  },
  {
    name: 'MANTHAN JOSHI',
    role: 'Technical Coordinator',
    phone: '+91 90043 27565',
    rawPhone: '+919004327565',
    category: 'technical',
  },
  {
    name: 'ADITYA',
    role: 'Takniki Helpline',
    phone: '+91 87675 77969',
    rawPhone: '+918767577969',
    category: 'support',
  },
  {
    name: 'INDRESH',
    role: 'Takniki Helpline',
    phone: '+91 93244 74812',
    rawPhone: '+919324474812',
    category: 'support',
  },
  {
    name: 'RYAN',
    role: 'Takniki Helpline',
    phone: '+91 93726 02311',
    rawPhone: '+919372602311',
    category: 'support',
  },
  {
    name: 'SHLOK',
    role: 'Takniki Helpline',
    phone: '+91 95948 30819',
    rawPhone: '+919594830819',
    category: 'support',
  },
  {
    name: 'VAIBHAV',
    role: 'Takniki Helpline',
    phone: '+91 81698 25915',
    rawPhone: '+918169825915',
    category: 'support',
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

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans flex flex-col antialiased selection:bg-[#D21319] selection:text-white">
      
      {/* 1. TOP RETRO UTILITY HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-black shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F5] hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>RETURN TO ARENA</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D21319] rounded-xs shadow-xs" />
            <span className="font-serif text-lg font-black tracking-tight text-black uppercase">
              INDIGO TECH FEST
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-xs font-bold">
              JARVIS 3.0
            </span>
          </div>
        </div>
      </header>

      {/* 2. HERO / CURATORIAL NOTICE SECTION */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        
        {/* Curatorial Header */}
        <div className="border-b-2 border-black pb-8 mb-10">
          <div className="flex items-center gap-2 mb-3">
            {/* The exact black pill badge from reference image */}
            <span className="bg-black text-white font-mono text-xs px-3 py-1 font-bold uppercase tracking-widest inline-block shadow-[2px_2px_0px_#D21319]">
              TECHNICAL HELPLINE
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold hidden sm:inline">
              · 24/7 PARTICIPANT DESK
            </span>
          </div>

          <h1 className="font-sans text-3xl sm:text-5xl md:text-6xl text-black uppercase font-black tracking-tight leading-tight mb-4">
            OFFICIAL HELPLINE & DIRECTORY
          </h1>

          <p className="font-sans text-sm sm:text-base text-slate-700 max-w-3xl leading-relaxed">
            Need urgent assistance with festival discipline enrollments, schedule clash clarifications, squad tokens, or hardware setup? 
            Connect directly with the appointed technical heads and student coordinators below.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DESK ACTIVE (08:30 AM – 06:00 PM IST)
            </span>
            <span className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700">
              SLRTCE CAMPUS, MUMBAI
            </span>
          </div>
        </div>

        {/* 3. THE 6 CONTACT CARDS (EXACT VISUAL SPEC FROM REFERENCE IMAGE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {CONTACTS.map((person) => {
            const isCopied = copiedPhone === person.phone;

            return (
              <div
                key={person.name}
                className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] hover:shadow-[8px_8px_0px_#D21319] transition-all p-6 sm:p-7 flex flex-col justify-between group"
              >
                {/* Top Row: Square Black Phone Icon Button & "CALL →" */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    {/* Phone icon inside solid black square */}
                    <a
                      href={`tel:${person.rawPhone}`}
                      className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-xs hover:bg-[#D21319] transition-colors shadow-2xs cursor-pointer"
                      title={`Call ${person.name}`}
                    >
                      <Phone size={17} />
                    </a>

                    {/* CALL -> link */}
                    <a
                      href={`tel:${person.rawPhone}`}
                      className="font-mono text-xs font-bold text-black uppercase tracking-wider hover:text-[#D21319] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>CALL</span>
                      <span>→</span>
                    </a>
                  </div>

                  {/* Name in Large Bold Uppercase Type */}
                  <h2 className="font-sans text-2xl font-black text-black uppercase tracking-tight mb-1 group-hover:text-[#D21319] transition-colors">
                    {person.name}
                  </h2>

                  {/* Designation / Role */}
                  <p className="font-sans text-xs text-slate-500 font-medium mb-6">
                    {person.role}
                  </p>
                </div>

                {/* Bottom Box: Phone Box with Direct Click-to-Call & WhatsApp */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="border border-black bg-[#FAF8F5] p-3 flex items-center justify-between hover:bg-[#F3EFEA] transition-colors">
                    <a
                      href={`tel:${person.rawPhone}`}
                      className="flex items-center gap-2.5 font-mono text-xs sm:text-sm font-bold text-black hover:text-[#D21319] transition-colors cursor-pointer"
                    >
                      <Phone size={14} className="text-black shrink-0" />
                      <span>{person.phone}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(person.phone)}
                      className="p-1 text-slate-500 hover:text-black transition-colors cursor-pointer"
                      title="Copy phone number"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Quick WhatsApp Action Button */}
                  <a
                    href={`https://wa.me/${person.rawPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare size={12} />
                    <span>Chat on WhatsApp</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. COMPREHENSIVE VENUE & GENERAL DISPATCH BOX */}
        <div className="border-2 border-black bg-white p-6 sm:p-10 shadow-[6px_6px_0px_#000] mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Campus Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-[#D21319]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                  PHYSICAL VENUE
                </h3>
              </div>
              <strong className="block text-sm font-bold text-black font-sans">
                Shree L. R. Tiwari College of Engineering
              </strong>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Kanakia Park, Near GCC Club, Mira Road (East), Thane, Maharashtra 401107
              </p>
            </div>

            {/* Electronic Inquiries */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={16} className="text-[#D21319]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                  ELECTRONIC INQUIRIES
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Official festival mailbox for sponsorship, campus delegations, and formal petitions:
              </p>
              <a
                href="mailto:fest@slrtce.in"
                className="font-mono text-xs font-bold text-black underline hover:text-[#D21319] transition-colors block"
              >
                fest@slrtce.in
              </a>
            </div>

            {/* Official WhatsApp Community */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={16} className="text-emerald-600" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                  OFFICIAL COMMUNITY
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-sans">
                Join the official festival announcement feed for live schedule updates & announcements:
              </p>
              <a
                href="https://chat.whatsapp.com/B5eqtUDwxiWALkV1hH9pbv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xs transition-colors shadow-2xs"
              >
                <span>Join WhatsApp Group</span>
                <ExternalLink size={12} />
              </a>
            </div>

          </div>
        </div>

      </main>

      {/* 5. VALID FOOTER */}
      <Footer />

    </div>
  );
}
