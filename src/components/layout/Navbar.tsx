import { useEffect, useState } from 'react';

import { Art } from '../ui/Art';
import { ButtonLink } from '../ui/Button';
import { pokedexClose, pokedexOpen } from '../../lib/assets';
import type { NavbarContent } from '../../lib/content';

interface NavbarProps {
  content: NavbarContent;
}

/**
 * Fixed navbar: logo, section anchors, Register / Login.
 *
 * The logo is a Pokeball-style Pokedex that swaps to its open state on hover,
 * which is the only piece of interaction on the bar and the one place the art
 * is worth spending bytes on (both files are ~5KB AVIF).
 *
 * `aria-current` marks the section being viewed so the links are not just
 * colour-coded decoration.
 */
export function Navbar({ content }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // Solid background once the hero is behind us, so links stay readable.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the anchor for whichever section is currently in view.
  useEffect(() => {
    const ids = content.links
      .map((link) => link.href)
      .filter((href) => href.startsWith('#'))
      .map((href) => href.slice(1));

    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      // A band across the upper third of the viewport: "the section I am in".
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [content.links]);

  // Collapse the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${
        scrolled ? 'border-b border-white/10 bg-ink-900/85 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        {/* ---------------- logo ---------------- */}
        <a
          href="#top"
          className="group flex shrink-0 items-center gap-3"
          aria-label="Kanto League, back to top"
        >
          <span className="relative h-11 w-8 shrink-0">
            <Art
              asset={pokedexClose}
              alt=""
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0"
            />
            <Art
              asset={pokedexOpen}
              alt=""
              className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-pixel text-[0.6rem] tracking-[0.15em] text-shell-50">
              KANTO LEAGUE
            </span>
            <span className="mt-1 text-[0.65rem] font-semibold tracking-wide text-shell-400">
              Jarvis Hackathon 3.0
            </span>
          </span>
        </a>

        {/* ---------------- desktop links ---------------- */}
        <ul className="hidden items-center gap-1 md:flex">
          {content.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={active === link.href ? 'true' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === link.href
                    ? 'bg-ball-500/20 text-shell-50'
                    : 'text-shell-200/75 hover:text-shell-50'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ---------------- auth buttons ---------------- */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <ButtonLink to="/auth?mode=login" variant="ghost" className="px-5 py-2.5">
            {content.login_label}
          </ButtonLink>
          <ButtonLink to="/auth" className="px-5 py-2.5">
            {content.register_label}
          </ButtonLink>
        </div>

        {/* ---------------- mobile toggle ---------------- */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-shell-100/25 text-shell-100 transition hover:border-shell-100/60 md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            {open ? (
              <>
                <path d="M4 4l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M3 5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 9h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* ---------------- mobile menu ---------------- */}
      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-white/10 bg-ink-900/97 px-5 pt-4 pb-6 backdrop-blur-md md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {content.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 font-pixel text-[0.6rem] tracking-[0.15em] text-shell-200/85 uppercase transition hover:bg-white/5 hover:text-shell-50"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2.5">
            <ButtonLink to="/auth" className="w-full">
              {content.register_label}
            </ButtonLink>
            <ButtonLink to="/auth?mode=login" variant="secondary" className="w-full">
              {content.login_label}
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
