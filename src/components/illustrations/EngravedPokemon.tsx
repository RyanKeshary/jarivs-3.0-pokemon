'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type PokemonKey = 'phoenix' | 'pikachu' | 'psyduck' | 'snorlax' | 'jigglypuff' | 'gengar' | 'eevee';

interface PokemonProps {
  className?: string;
  animateIdle?: boolean;
  size?: number | string;
}

// 1. PHOENIX (Majestic crown engraving with active celestial loop)
export function EngravedPhoenix({ className = '', animateIdle = true, size = 160 }: PokemonProps) {
  return (
    <motion.div
      animate={animateIdle ? { translateY: [0, -4, 0] } : {}}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        {/* Crown Crest & Sun Halo Rays */}
        <motion.g
          animate={animateIdle ? { rotate: [0, 360] } : {}}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '100px 40px' }}
        >
          <circle cx="100" cy="40" r="28" stroke="#AFAEA2" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.65" />
        </motion.g>

        {/* Crown Crest Radiance Rays */}
        <motion.path
          animate={animateIdle ? { opacity: [0.65, 1, 0.65], scale: [0.98, 1.05, 0.98] } : {}}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '100px 12px' }}
          d="M100 12 L100 2 M100 12 L88 4 M100 12 L112 4 M100 12 L78 9 M100 12 L122 9"
          stroke="#D21319"
          strokeWidth="1.2"
          strokeLinecap="square"
        />
        
        {/* Phoenix Head and Beak */}
        <path d="M100 16 C95 24 93 30 96 36 C99 42 101 42 104 36 C107 30 105 24 100 16 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.4" />
        <path d="M96 26 L88 28 L95 30 Z" fill="#D21319" stroke="#D21319" strokeWidth="0.8" />
        <circle cx="98" cy="27" r="1.2" fill="#E9E6DA" />
        
        {/* Crest plumes */}
        <path d="M99 18 C92 12 84 14 78 18 C83 19 89 18 95 20" stroke="#D21319" strokeWidth="1" />
        <path d="M101 18 C108 12 116 14 122 18 C117 19 111 18 105 20" stroke="#D21319" strokeWidth="1" />

        {/* Majestic Sweeping Wings (Engraved Feather Hatching) */}
        {/* Left Wing with smooth flap */}
        <motion.g
          animate={animateIdle ? { rotate: [0, -3.8, 0], scaleY: [1, 1.035, 1] } : {}}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '93px 38px' }}
        >
          <path d="M93 38 C75 32 40 38 18 64 C28 66 38 65 48 60 C32 72 24 88 16 102 C28 98 42 90 54 80 C40 96 34 114 30 128 C45 116 62 100 76 82 C84 94 90 106 93 118" stroke="#AFAEA2" strokeWidth="1.4" fill="none" />
          <path d="M35 66 L55 64 M30 76 L60 70 M25 88 L68 78 M35 104 L74 88 M45 116 L80 96" stroke="#AFAEA2" strokeWidth="0.7" opacity="0.75" />
        </motion.g>

        {/* Right Wing with smooth flap */}
        <motion.g
          animate={animateIdle ? { rotate: [0, 3.8, 0], scaleY: [1, 1.035, 1] } : {}}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '107px 38px' }}
        >
          <path d="M107 38 C125 32 160 38 182 64 C172 66 162 65 152 60 C168 72 176 88 184 102 C172 98 158 90 146 80 C160 96 166 114 170 128 C155 116 138 100 124 82 C116 94 110 106 107 118" stroke="#AFAEA2" strokeWidth="1.4" fill="none" />
          <path d="M165 66 L145 64 M170 76 L140 70 M175 88 L132 78 M165 104 L126 88 M155 116 L120 96" stroke="#AFAEA2" strokeWidth="0.7" opacity="0.75" />
        </motion.g>

        {/* Central Body & Torso */}
        <path d="M93 38 C90 55 92 78 95 104 C98 108 102 108 105 104 C108 78 110 55 107 38 Z" fill="#121435" stroke="#AFAEA2" strokeWidth="1.3" />
        <path d="M96 52 L104 52 M95 62 L105 62 M96 74 L104 74 M97 86 L103 86" stroke="#AFAEA2" strokeWidth="0.8" opacity="0.7" />

        {/* Flowing Tail Feathers with Ribbon Ties & wave motion */}
        <motion.g
          animate={animateIdle ? { rotate: [-2.5, 2.5, -2.5] } : {}}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '97px 106px' }}
        >
          <path d="M97 106 C92 124 80 142 65 154" stroke="#D21319" strokeWidth="1.5" />
          <circle cx="65" cy="154" r="2.5" fill="#D21319" />
        </motion.g>

        <motion.g
          animate={animateIdle ? { scaleY: [1, 1.06, 1] } : {}}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '100px 108px' }}
        >
          <path d="M100 108 C100 128 100 144 100 158" stroke="#D21319" strokeWidth="1.5" />
          <circle cx="100" cy="158" r="2.5" fill="#D21319" />
        </motion.g>

        <motion.g
          animate={animateIdle ? { rotate: [2.5, -2.5, 2.5] } : {}}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '103px 106px' }}
        >
          <path d="M103 106 C108 124 120 142 135 154" stroke="#D21319" strokeWidth="1.5" />
          <circle cx="135" cy="154" r="2.5" fill="#D21319" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

// 2. SNORLAX (Breathes: gentle scaleY)
export function EngravedSnorlax({ className = '', animateIdle = true, size = 110 }: PokemonProps) {
  return (
    <motion.div
      animate={animateIdle ? { scaleY: [1, 1.04, 1], translateY: [0, -1.5, 0] } : {}}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block origin-bottom ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Massive Body Silhouette */}
        <ellipse cx="60" cy="74" rx="42" ry="36" fill="#121435" stroke="#AFAEA2" strokeWidth="1.4" />
        
        {/* Belly Cream Oval */}
        <ellipse cx="60" cy="76" rx="28" ry="24" stroke="#AFAEA2" strokeWidth="1.1" strokeDasharray="3 2" />
        {/* Engraved Belly Hatching */}
        <path d="M48 68 L72 68 M45 74 L75 74 M47 80 L73 80 M51 86 L69 86" stroke="#AFAEA2" strokeWidth="0.7" opacity="0.6" />

        {/* Head */}
        <path d="M38 42 C38 28 48 20 60 20 C72 20 82 28 82 42 C82 48 76 54 60 54 C44 54 38 48 38 42 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.4" />
        {/* Pointy Ears */}
        <path d="M42 26 L34 12 L48 20 Z" fill="#121435" stroke="#AFAEA2" strokeWidth="1.2" />
        <path d="M78 26 L86 12 L72 20 Z" fill="#121435" stroke="#AFAEA2" strokeWidth="1.2" />

        {/* Closed Content Sleeping Eyes & Fangs */}
        <path d="M48 36 Q54 40 56 36" stroke="#AFAEA2" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M64 36 Q66 40 72 36" stroke="#AFAEA2" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M57 44 Q60 46 63 44" stroke="#AFAEA2" strokeWidth="1" strokeLinecap="round" />
        <path d="M54 43 L54 40 M66 43 L66 40" stroke="#E9E6DA" strokeWidth="1" />

        {/* Round Feet */}
        <ellipse cx="32" cy="100" rx="14" ry="10" fill="#121435" stroke="#AFAEA2" strokeWidth="1.3" />
        <ellipse cx="88" cy="100" rx="14" ry="10" fill="#121435" stroke="#AFAEA2" strokeWidth="1.3" />
        <circle cx="32" cy="100" r="5" stroke="#AFAEA2" strokeWidth="0.8" />
        <circle cx="88" cy="100" r="5" stroke="#AFAEA2" strokeWidth="0.8" />

        {/* Crimson Ribbon band over foot */}
        <path d="M22 96 C30 94 40 98 42 102" stroke="#D21319" strokeWidth="1.2" />
      </svg>
    </motion.div>
  );
}

// 3. JIGGLYPUFF (Sways: rotate -3 to 3 deg)
export function EngravedJigglypuff({ className = '', animateIdle = true, size = 95 }: PokemonProps) {
  return (
    <motion.div
      animate={animateIdle ? { rotate: [-3.5, 3.5, -3.5], translateY: [0, -2, 0] } : {}}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block origin-bottom ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Round Body Sphere */}
        <circle cx="50" cy="54" r="32" fill="#121435" stroke="#AFAEA2" strokeWidth="1.4" />
        
        {/* Pointed Cat Ears */}
        <path d="M28 32 L20 14 L38 24 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.2" />
        <path d="M72 32 L80 14 L62 24 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.2" />
        <path d="M26 26 L23 18 L33 24" stroke="#D21319" strokeWidth="1" />
        <path d="M74 26 L77 18 L67 24" stroke="#D21319" strokeWidth="1" />

        {/* Forehead Swirl Tuft */}
        <path d="M46 36 C42 28 50 20 58 24 C64 28 62 36 50 38 C42 40 40 46 45 48" stroke="#AFAEA2" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* Large Engraved Expressive Eyes */}
        <circle cx="38" cy="52" r="9" stroke="#AFAEA2" strokeWidth="1.3" fill="#1B1E4A" />
        <circle cx="62" cy="52" r="9" stroke="#AFAEA2" strokeWidth="1.3" fill="#1B1E4A" />
        <circle cx="36" cy="50" r="4" fill="#E9E6DA" />
        <circle cx="60" cy="50" r="4" fill="#E9E6DA" />
        <circle cx="41" cy="55" r="1.5" fill="#AFAEA2" />
        <circle cx="65" cy="55" r="1.5" fill="#AFAEA2" />

        {/* Tiny Singing Mouth */}
        <path d="M47 67 Q50 71 53 67" stroke="#AFAEA2" strokeWidth="1.2" strokeLinecap="round" />

        {/* Small Stubb Feet */}
        <ellipse cx="36" cy="86" rx="8" ry="5" fill="#121435" stroke="#AFAEA2" strokeWidth="1.2" />
        <ellipse cx="64" cy="86" rx="8" ry="5" fill="#121435" stroke="#AFAEA2" strokeWidth="1.2" />

        {/* Engraved Shadow Stippling */}
        <path d="M30 68 L32 72 M34 66 L36 74 M68 68 L66 72 M64 66 L62 74" stroke="#AFAEA2" strokeWidth="0.75" />
      </svg>
    </motion.div>
  );
}

// 4. GENGAR (Peeks: gentle translateY & shadow glint)
export function EngravedGengar({ className = '', animateIdle = true, size = 100 }: PokemonProps) {
  return (
    <motion.div
      animate={animateIdle ? { translateY: [0, -3.5, 0], scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block origin-bottom ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Spiky Ghost Outline */}
        <path
          d="M24 38 L16 18 L32 26 L42 16 L50 24 L58 16 L68 26 L84 18 L76 38 C84 46 88 58 86 70 C84 84 72 92 50 92 C28 92 16 84 14 70 C12 58 16 46 24 38 Z"
          fill="#121435"
          stroke="#AFAEA2"
          strokeWidth="1.4"
        />

        {/* Menacing Slanted Engraved Eyes in Crimson */}
        <path d="M30 46 L42 50 L32 54 Z" fill="#D21319" stroke="#D21319" strokeWidth="1" />
        <path d="M70 46 L58 50 L68 54 Z" fill="#D21319" stroke="#D21319" strokeWidth="1" />
        <circle cx="36" cy="50" r="1.2" fill="#E9E6DA" />
        <circle cx="64" cy="50" r="1.2" fill="#E9E6DA" />

        {/* Broad Grinning Serrated Teeth */}
        <path d="M26 64 Q50 82 74 64" stroke="#AFAEA2" strokeWidth="1.4" fill="none" />
        <path d="M28 65 Q50 72 72 65" stroke="#AFAEA2" strokeWidth="1" fill="none" />
        {/* Teeth Vertical Hatching */}
        <path d="M35 66 L35 70 M42 67 L42 74 M50 68 L50 76 M58 67 L58 74 M65 66 L65 70" stroke="#AFAEA2" strokeWidth="0.9" />

        {/* Arms peeking out */}
        <path d="M14 60 C8 62 8 68 14 70" stroke="#AFAEA2" strokeWidth="1.2" />
        <path d="M86 60 C92 62 92 68 86 70" stroke="#AFAEA2" strokeWidth="1.2" />

        {/* Hatching shadows */}
        <path d="M46 84 L54 84 M43 87 L57 87" stroke="#AFAEA2" strokeWidth="0.8" opacity="0.7" />
      </svg>
    </motion.div>
  );
}

// 5. PIKACHU (Waves: paw / ear twitch)
export function EngravedPikachu({ className = '', animateIdle = true, size = 100 }: PokemonProps) {
  return (
    <motion.div
      animate={animateIdle ? { rotate: [-2, 2, -2], translateY: [0, -2, 0] } : {}}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block origin-bottom ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Ears with Black-Tipped Engraved Hatching */}
        <path d="M36 30 L18 8 L30 26 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.3" />
        <path d="M22 14 L18 8 L27 12 Z" fill="#AFAEA2" />
        <motion.g
          animate={animateIdle ? { rotate: [0, 8, 0] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="origin-[64px_28px]"
        >
          <path d="M64 28 L82 8 L70 26 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.3" />
          <path d="M78 14 L82 8 L73 12 Z" fill="#AFAEA2" />
        </motion.g>

        {/* Head and Chubby Cheeks */}
        <ellipse cx="50" cy="46" rx="24" ry="20" fill="#121435" stroke="#AFAEA2" strokeWidth="1.4" />
        
        {/* Rosy Cheeks in Crimson */}
        <circle cx="34" cy="52" r="5" stroke="#D21319" strokeWidth="1.2" strokeDasharray="2 1" />
        <circle cx="66" cy="52" r="5" stroke="#D21319" strokeWidth="1.2" strokeDasharray="2 1" />

        {/* Engraved Curious Eyes */}
        <circle cx="41" cy="42" r="4" fill="#E9E6DA" stroke="#AFAEA2" strokeWidth="1" />
        <circle cx="42" cy="42" r="2" fill="#1B1E4A" />
        <circle cx="59" cy="42" r="4" fill="#E9E6DA" stroke="#AFAEA2" strokeWidth="1" />
        <circle cx="58" cy="42" r="2" fill="#1B1E4A" />

        {/* Snout & Smile */}
        <polygon points="50,47 48.5,45.5 51.5,45.5" fill="#AFAEA2" />
        <path d="M46 51 Q50 54 54 51" stroke="#AFAEA2" strokeWidth="1.1" strokeLinecap="round" />

        {/* Body */}
        <path d="M34 58 C30 68 32 84 50 84 C68 84 70 68 66 58 Z" fill="#121435" stroke="#AFAEA2" strokeWidth="1.3" />

        {/* Waving Right Paw */}
        <motion.path
          animate={animateIdle ? { rotate: [-10, 15, -10] } : {}}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="origin-[64px_62px]"
          d="M62 62 C70 58 76 50 74 46 C70 46 64 54 60 58"
          stroke="#AFAEA2"
          strokeWidth="1.3"
          fill="#1B1E4A"
        />

        {/* Left Paw resting */}
        <path d="M38 62 C32 64 28 66 32 70 C36 70 38 66 40 64" stroke="#AFAEA2" strokeWidth="1.2" fill="#1B1E4A" />

        {/* Lightning Bolt Tail */}
        <path d="M28 76 L16 70 L22 62 L12 56 L18 42 L26 48 L22 56 L30 62" stroke="#AFAEA2" strokeWidth="1.3" fill="none" />
      </svg>
    </motion.div>
  );
}

// 6. PSYDUCK (Scratches head: tilt & paw motion)
export function EngravedPsyduck({ className = '', animateIdle = true, size = 100 }: PokemonProps) {
  return (
    <motion.div
      animate={animateIdle ? { rotate: [-4, 4, -4], translateY: [0, -1, 0] } : {}}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block origin-bottom ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Three Hair Strands on Head */}
        <path d="M50 20 L48 8 M50 20 L51 6 M50 20 L55 9" stroke="#AFAEA2" strokeWidth="1.2" strokeLinecap="round" />

        {/* Rounded Head */}
        <circle cx="50" cy="38" r="19" fill="#121435" stroke="#AFAEA2" strokeWidth="1.4" />

        {/* Perplexed Staring Blank Eyes */}
        <circle cx="41" cy="34" r="5" fill="#E9E6DA" stroke="#AFAEA2" strokeWidth="1.2" />
        <circle cx="41" cy="34" r="1.2" fill="#1B1E4A" />
        <circle cx="59" cy="34" r="5" fill="#E9E6DA" stroke="#AFAEA2" strokeWidth="1.2" />
        <circle cx="59" cy="34" r="1.2" fill="#1B1E4A" />

        {/* Flat Bill Platypus Beak */}
        <path d="M38 42 C38 40 62 40 62 42 C66 48 64 56 50 56 C36 56 34 48 38 42 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.3" />
        <circle cx="47" cy="46" r="0.8" fill="#AFAEA2" />
        <circle cx="53" cy="46" r="0.8" fill="#AFAEA2" />

        {/* Paws Holding Head (Scratching Motion) */}
        <motion.path
          animate={animateIdle ? { translateY: [-2, 1, -2] } : {}}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          d="M32 36 C28 32 30 26 36 28 C38 32 36 36 34 38"
          stroke="#AFAEA2"
          strokeWidth="1.3"
          fill="#121435"
        />
        <motion.path
          animate={animateIdle ? { translateY: [1, -2, 1] } : {}}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          d="M68 36 C72 32 70 26 64 28 C62 32 64 36 66 38"
          stroke="#AFAEA2"
          strokeWidth="1.3"
          fill="#121435"
        />

        {/* Body and Webbed Feet */}
        <ellipse cx="50" cy="72" rx="20" ry="17" fill="#121435" stroke="#AFAEA2" strokeWidth="1.4" />
        <path d="M36 88 L30 92 L42 92 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.1" />
        <path d="M64 88 L58 92 L70 92 Z" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.1" />

        {/* Subtle ribbon loop */}
        <path d="M42 62 C48 64 52 64 58 62" stroke="#D21319" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}

// 7. EEVEE (Flicks tail: tail wag)
export function EngravedEevee({ className = '', animateIdle = true, size = 100 }: PokemonProps) {
  return (
    <motion.div
      animate={animateIdle ? { rotate: [-1.5, 1.5, -1.5] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block origin-bottom ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Long Hare-like Ears */}
        <path d="M38 32 L14 10 C24 16 32 24 36 30 Z" fill="#121435" stroke="#AFAEA2" strokeWidth="1.3" />
        <path d="M22 16 L28 22" stroke="#D21319" strokeWidth="0.9" />
        <path d="M62 32 L86 10 C76 16 68 24 64 30 Z" fill="#121435" stroke="#AFAEA2" strokeWidth="1.3" />
        <path d="M78 16 L72 22" stroke="#D21319" strokeWidth="0.9" />

        {/* Fluffy Head */}
        <ellipse cx="50" cy="42" rx="18" ry="16" fill="#121435" stroke="#AFAEA2" strokeWidth="1.3" />

        {/* Large Sweet Eyes with Multi-hatch Depth */}
        <ellipse cx="42" cy="40" rx="4" ry="6" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.2" />
        <circle cx="41" cy="38" r="1.8" fill="#E9E6DA" />
        <ellipse cx="58" cy="40" rx="4" ry="6" fill="#1B1E4A" stroke="#AFAEA2" strokeWidth="1.2" />
        <circle cx="57" cy="38" r="1.8" fill="#E9E6DA" />

        {/* Tiny Button Nose & Mouth */}
        <polygon points="50,46 49,45 51,45" fill="#AFAEA2" />
        <path d="M48 48 Q50 50 52 48" stroke="#AFAEA2" strokeWidth="1" strokeLinecap="round" />

        {/* Large Fluffy Fur Collar */}
        <path
          d="M32 54 C26 58 26 66 34 68 C38 72 46 72 50 70 C54 72 62 72 66 68 C74 66 74 58 68 54 C62 58 56 56 50 58 C44 56 38 58 32 54 Z"
          fill="#1B1E4A"
          stroke="#AFAEA2"
          strokeWidth="1.3"
        />

        {/* Body and Front Legs */}
        <path d="M42 68 L40 88 M58 68 L60 88" stroke="#AFAEA2" strokeWidth="1.3" />

        {/* Big Bushy Tail Flicking Wag */}
        <motion.g
          animate={animateIdle ? { rotate: [-8, 8, -8] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="origin-[28px_74px]"
        >
          <path
            d="M28 74 C16 70 8 54 12 40 C18 42 22 48 26 56 C28 50 32 46 36 44 C34 56 32 66 28 74 Z"
            fill="#121435"
            stroke="#AFAEA2"
            strokeWidth="1.3"
          />
          {/* Cream tip line */}
          <path d="M12 44 C18 48 24 50 28 48" stroke="#AFAEA2" strokeWidth="1" strokeDasharray="2 1" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

// Master Pokemon Selector helper
export function PokemonIllustration({
  name,
  className = '',
  animateIdle = true,
  size = 64,
}: {
  name: PokemonKey | string;
  className?: string;
  animateIdle?: boolean;
  size?: number | string;
}) {
  switch (name.toLowerCase()) {
    case 'phoenix':
      return <EngravedPhoenix className={className} size={size} />;
    case 'snorlax':
      return <EngravedSnorlax className={className} animateIdle={animateIdle} size={size} />;
    case 'jigglypuff':
      return <EngravedJigglypuff className={className} animateIdle={animateIdle} size={size} />;
    case 'gengar':
      return <EngravedGengar className={className} animateIdle={animateIdle} size={size} />;
    case 'pikachu':
      return <EngravedPikachu className={className} animateIdle={animateIdle} size={size} />;
    case 'psyduck':
      return <EngravedPsyduck className={className} animateIdle={animateIdle} size={size} />;
    case 'eevee':
      return <EngravedEevee className={className} animateIdle={animateIdle} size={size} />;
    default:
      return <EngravedPikachu className={className} animateIdle={animateIdle} size={size} />;
  }
}
