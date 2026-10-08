'use client';

import React, { useRef, useState, useEffect } from 'react';

const MANIFESTO_TEXT = [
  "We assemble beneath the midnight vault to measure human intuition against algorithmic architecture.",
  "Here, software and autonomous machines are drafted not in haste, but with the deliberate care of classical engravings.",
  "Two days of computational trials, mechanical precision, and collaborative discipline await those who take the field."
];

export function FestManifesto() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far through the section the viewport is
      const totalDist = rect.height + windowHeight;
      const currentDist = windowHeight - rect.top;
      const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Split all 3 sentences into words for the progressive grey -> paper transition
  const allWords = MANIFESTO_TEXT.join(" ").split(" ");
  const activeWordThreshold = Math.floor(scrollProgress * allWords.length * 1.3);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative w-full py-20 sm:py-32 bg-[#121435] border-y border-[#AFAEA2]/30 select-none overflow-hidden"
    >
      {/* Editorial Decorative Ribbon Axis on Left */}
      <div className="absolute left-6 sm:left-12 top-0 bottom-0 w-[1px] bg-[#AFAEA2]/20">
        <div
          className="w-[2px] bg-[#D21319] transition-all duration-100 -ml-[0.5px]"
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-12 pl-12 sm:pl-20 relative z-10">
        
        {/* Section Plate Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="w-2.5 h-2.5 bg-[#D21319] border border-[#E9E6DA]" />
          <span className="label-editorial text-xs text-[#AFAEA2]">
            PLATE II · THE FEST MANIFESTO
          </span>
          <span className="h-[1px] flex-1 bg-[#AFAEA2]/30" />
        </div>

        {/* 3-Sentence Manifesto in Large Serif Type with Scroll Word Illumination */}
        <div className="font-serif text-2xl sm:text-4xl md:text-5xl leading-snug sm:leading-relaxed tracking-tight">
          {MANIFESTO_TEXT.map((sentence, sIdx) => {
            const sentenceWords = sentence.split(" ");
            let cumulativeWordsBefore = 0;
            for (let i = 0; i < sIdx; i++) {
              cumulativeWordsBefore += MANIFESTO_TEXT[i].split(" ").length;
            }

            return (
              <p key={sIdx} className="mb-6 sm:mb-8 last:mb-0">
                {sentenceWords.map((word, wIdx) => {
                  const globalIndex = cumulativeWordsBefore + wIdx;
                  const isLit = globalIndex <= activeWordThreshold;

                  return (
                    <span
                      key={wIdx}
                      className={`inline-block mr-[0.3em] transition-colors duration-200 ${
                        isLit
                          ? 'text-[#E9E6DA] font-semibold'
                          : 'text-[#AFAEA2]/40 font-normal'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>

        {/* Marginalia Annotation */}
        <div className="mt-12 pt-6 border-t border-[#AFAEA2]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-[#AFAEA2] gap-2">
          <span>JARVIS 3.0 · SLRTCE</span>
          <span>DISCIPLINE: ARTIFICIAL LOGIC, ROBOTICS & CREATIVE CODE</span>
        </div>

      </div>
    </section>
  );
}
