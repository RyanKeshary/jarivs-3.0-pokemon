'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer id="contact" className="w-full bg-[#1B1E4A] border-t border-[#AFAEA2] text-[#E9E6DA] py-14 px-4 sm:px-6 select-none">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Ledger Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#AFAEA2]/30">
          
          {/* Col 1: Tech Fest Wordmark & Metadata */}
          <div className="space-y-3">
            <span className="font-serif text-2xl font-bold text-[#D21319] uppercase block tracking-tight">
              INDIGO TECH FEST
            </span>
            <span className="label-editorial text-[9px] block text-[#AFAEA2]">
              JARVIS 3.0 · MMXXVI
            </span>
            <p className="font-grotesk text-xs text-[#AFAEA2] leading-relaxed">
              An editorial natural-history convocation of software engineering, robotics, and algorithmic design.
            </p>
          </div>

          {/* Col 2: Organisers & Venue */}
          <div>
            <span className="label-editorial text-[10px] block mb-3 text-[#AFAEA2]">
              ORGANISERS & LOCATION
            </span>
            <ul className="space-y-1.5 text-xs text-[#E9E6DA] font-mono">
              <li>Organised by: [CLUB/COLLEGE]</li>
              <li>Technical Student Council</li>
              <li>Venue: [VENUE]</li>
              <li>SLRTCE Campus, Mumbai</li>
              <li>Dates: 16 - 17 October 2026</li>
            </ul>
          </div>

          {/* Col 3: Direct Inquiries / Contact */}
          <div>
            <span className="label-editorial text-[10px] block mb-3 text-[#AFAEA2]">
              CONTACT & INQUIRIES
            </span>
            <ul className="space-y-1.5 text-xs font-mono">
              <li>
                <span className="text-[#AFAEA2]">Email: </span>
                <a href="mailto:fest@slrtce.in" className="hover:text-[#D21319] underline">
                  fest@slrtce.in
                </a>
              </li>
              <li>
                <span className="text-[#AFAEA2]">Admin: </span>
                <a href="mailto:shrey.sleeps@gmail.com" className="hover:text-[#D21319] underline">
                  shrey.sleeps@gmail.com
                </a>
              </li>
              <li>
                <span className="text-[#AFAEA2]">Desk: </span>
                <span>+91 98200 00000 / +91 98300 00000</span>
              </li>
              <li>
                <span className="text-[#AFAEA2]">Hours: </span>
                <span>08:30 AM - 06:00 PM IST</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Socials as Plain Text Links */}
          <div>
            <span className="label-editorial text-[10px] block mb-3 text-[#AFAEA2]">
              SOCIAL CHRONICLES
            </span>
            <div className="flex flex-col space-y-2 text-xs font-mono text-[#E9E6DA]">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#D21319]">
                [ GITHUB ARCHIVE ]
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#D21319]">
                [ INSTAGRAM FEED ]
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#D21319]">
                [ LINKEDIN DISPATCH ]
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-[#D21319]">
                [ DISCORD COUNCIL ]
              </a>
              <Link href="/admin" className="hover:text-[#D21319] pt-2 border-t border-[#AFAEA2]/20 text-[#AFAEA2]">
                [ MASTER CONSOLE / ADMIN ]
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#AFAEA2] gap-4">
          <div>
            <span>© MMXXVI INDIGO TECH FEST · JARVIS 3.0 · ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>NATURAL HISTORY PRINT CODEX</span>
            <span>·</span>
            <span>SLRTCE CAMPUS</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
