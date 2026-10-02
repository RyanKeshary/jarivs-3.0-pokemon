import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait after the element enters the viewport. */
  delay?: number;
  /** Stagger children instead of animating the wrapper as one block. */
  stagger?: boolean;
  as?: 'div' | 'section' | 'ul' | 'ol' | 'li' | 'article' | 'header' | 'footer';
}

/**
 * Scroll-triggered entrance.
 *
 * Only `opacity` and `y` are animated, both of which are composited on the GPU -
 * no layout or paint work per frame, which is what keeps a long scrolling page
 * smooth on a mid-range phone.
 *
 * `once: true` means the animation never replays, so scrolling back up does not
 * re-trigger work.
 *
 * Under `prefers-reduced-motion` the wrapper renders with no animation at all
 * rather than a fast fade: reduced-motion users should get the content, not a
 * stripped-down version of the effect.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  stagger = false,
  as = 'div',
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay,
        // A slight overshoot-free ease-out reads as "settling" rather than
        // "bouncing", which suits the game UI.
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: stagger ? 0.08 : 0,
      },
    },
  };

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-72px 0px -72px 0px' }}
    >
      {children}
    </MotionTag>
  );
}

/** Child variant for use inside a `stagger` <Reveal>. */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/** Convenience wrapper so callers do not import the raw variants object. */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'span';
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const MotionTag = motion[as];
  return (
    <MotionTag className={className} variants={revealItem}>
      {children}
    </MotionTag>
  );
}
