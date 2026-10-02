/**
 * Typed shapes for the `content_blocks` JSON, plus runtime parsers.
 *
 * Why parse instead of cast: this JSON is edited by hand in the Supabase
 * dashboard. A typo ("eyebow" instead of "eyebrow") must not blank out a whole
 * section, and a missing key must not crash the render. Every parser here
 * returns a complete, valid object - falling back to a neutral default - so a
 * component can always render.
 *
 * The [EDIT ME] convention: values we have not been told are stored as the
 * literal string "[EDIT ME]" (or NULL for dates). `isUnconfirmed` detects both
 * so the UI can style them as outstanding work rather than as real content.
 */

import type { Json } from './database.types';

export const EDIT_ME = '[EDIT ME]';

/** True for values we still need the organiser to supply. */
export function isUnconfirmed(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return Number.isNaN(value);
  const trimmed = value.trim();
  return trimmed === '' || trimmed.startsWith(EDIT_ME);
}

/* -------------------------------------------------------------------------- */
/* Coercion helpers                                                             */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Keeps only well-formed link entries so a bad row cannot break the navbar. */
function asLinks(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = asRecord(entry);
      return { label: asString(row.label), href: asString(row.href) };
    })
    .filter((link) => link.label !== '' && link.href !== '');
}

/** Same idea as asLinks, for `{ label, detail }` pairs. */
function asListItems(value: unknown): { label: string; detail: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = asRecord(entry);
      return { label: asString(row.label), detail: asString(row.detail) };
    })
    .filter((item) => item.label !== '' || item.detail !== '');
}

/* -------------------------------------------------------------------------- */
/* landing.navbar                                                               */
/* -------------------------------------------------------------------------- */

export interface NavbarContent {
  links: { label: string; href: string }[];
  login_label: string;
  register_label: string;
}

export const NAVBAR_FALLBACK: NavbarContent = {
  links: [
    { label: 'About', href: '#about' },
    { label: 'Event Details', href: '#details' },
    { label: 'Route', href: '#route' },
  ],
  login_label: 'Login',
  register_label: 'Register',
};

export function parseNavbar(value: Json | undefined): NavbarContent {
  const row = asRecord(value);
  return {
    links: asLinks(row.links),
    login_label: asString(row.login_label, NAVBAR_FALLBACK.login_label),
    register_label: asString(row.register_label, NAVBAR_FALLBACK.register_label),
  };
}

/* -------------------------------------------------------------------------- */
/* landing.hero                                                                 */
/* -------------------------------------------------------------------------- */

export interface HeroContent {
  kicker: string;
  primary_cta_label: string;
  secondary_cta_label: string;
  scroll_hint: string;
}

export const HERO_FALLBACK: HeroContent = {
  kicker: EDIT_ME,
  primary_cta_label: 'Register for the event',
  secondary_cta_label: 'View the route',
  scroll_hint: 'Scroll to begin your journey',
};

export function parseHero(value: Json | undefined): HeroContent {
  const row = asRecord(value);
  return {
    kicker: asString(row.kicker, HERO_FALLBACK.kicker),
    primary_cta_label: asString(row.primary_cta_label, HERO_FALLBACK.primary_cta_label),
    secondary_cta_label: asString(row.secondary_cta_label, HERO_FALLBACK.secondary_cta_label),
    scroll_hint: asString(row.scroll_hint, HERO_FALLBACK.scroll_hint),
  };
}

/* -------------------------------------------------------------------------- */
/* landing.about                                                                */
/* -------------------------------------------------------------------------- */

export interface AboutListItem {
  label: string;
  detail: string;
}

export interface AboutCard {
  id: string;
  title: string;
  body: string;
  items: AboutListItem[];
}

export interface AboutContent {
  eyebrow: string;
  heading: string;
  lede: string;
  cards: AboutCard[];
}

export const ABOUT_FALLBACK: AboutContent = {
  eyebrow: 'About',
  heading: 'Not a normal hackathon.',
  lede: '',
  cards: [],
};

export function parseAbout(value: Json | undefined): AboutContent {
  const row = asRecord(value);
  const cards = Array.isArray(row.cards)
    ? row.cards.map((entry, index) => {
        const card = asRecord(entry);
        return {
          id: asString(card.id, `card-${index}`),
          title: asString(card.title),
          body: asString(card.body),
          items: asListItems(card.items),
        };
      })
    : [];

  return {
    eyebrow: asString(row.eyebrow, ABOUT_FALLBACK.eyebrow),
    heading: asString(row.heading, ABOUT_FALLBACK.heading),
    lede: asString(row.lede, ABOUT_FALLBACK.lede),
    cards,
  };
}

/* -------------------------------------------------------------------------- */
/* landing.event_details                                                        */
/* -------------------------------------------------------------------------- */

/**
 * `source` names an event_config column instead of hardcoding the value, so a
 * date or a venue is only ever typed in one place. `null` means the item carries
 * its own free-text `value` (prizes, rules).
 */
export type EventDetailSource =
  | 'event_starts_at'
  | 'registration_deadline'
  | 'venue'
  | 'team_size'
  | null;

export interface EventDetailItem {
  id: string;
  title: string;
  source: EventDetailSource;
  value: string | null;
  blurb: string | null;
}

export interface EventDetailsContent {
  eyebrow: string;
  heading: string;
  items: EventDetailItem[];
}

export const EVENT_DETAILS_FALLBACK: EventDetailsContent = {
  eyebrow: 'Event Details',
  heading: 'Starter Menu',
  items: [],
};

const DETAIL_SOURCES = new Set<EventDetailSource>([
  'event_starts_at',
  'registration_deadline',
  'venue',
  'team_size',
]);

export function parseEventDetails(value: Json | undefined): EventDetailsContent {
  const row = asRecord(value);
  const items = Array.isArray(row.items)
    ? row.items.map((entry, index) => {
        const item = asRecord(entry);
        const rawSource = asString(item.source) as EventDetailSource;
        return {
          id: asString(item.id, `detail-${index}`),
          title: asString(item.title),
          // An unrecognised source would silently render the wrong value, so it
          // falls back to free text instead.
          source: DETAIL_SOURCES.has(rawSource) ? rawSource : null,
          value: typeof item.value === 'string' ? item.value : null,
          blurb: typeof item.blurb === 'string' ? item.blurb : null,
        };
      })
    : [];

  return {
    eyebrow: asString(row.eyebrow, EVENT_DETAILS_FALLBACK.eyebrow),
    heading: asString(row.heading, EVENT_DETAILS_FALLBACK.heading),
    items,
  };
}

/* -------------------------------------------------------------------------- */
/* landing.timeline                                                             */
/* -------------------------------------------------------------------------- */

export interface TimelineContent {
  eyebrow: string;
  heading: string;
}

export const TIMELINE_FALLBACK: TimelineContent = {
  eyebrow: 'Timeline',
  heading: 'Your route to the badge',
};

export function parseTimeline(value: Json | undefined): TimelineContent {
  const row = asRecord(value);
  return {
    eyebrow: asString(row.eyebrow, TIMELINE_FALLBACK.eyebrow),
    heading: asString(row.heading, TIMELINE_FALLBACK.heading),
  };
}

/* -------------------------------------------------------------------------- */
/* landing.final_cta                                                            */
/* -------------------------------------------------------------------------- */

export interface FinalCtaContent {
  heading: string;
  body: string;
  primary_cta_label: string;
}

export const FINAL_CTA_FALLBACK: FinalCtaContent = {
  heading: 'Your journey begins',
  body: '',
  primary_cta_label: 'Register for the event',
};

export function parseFinalCta(value: Json | undefined): FinalCtaContent {
  const row = asRecord(value);
  return {
    heading: asString(row.heading, FINAL_CTA_FALLBACK.heading),
    body: asString(row.body, FINAL_CTA_FALLBACK.body),
    primary_cta_label: asString(row.primary_cta_label, FINAL_CTA_FALLBACK.primary_cta_label),
  };
}

/* -------------------------------------------------------------------------- */
/* landing.footer                                                               */
/* -------------------------------------------------------------------------- */

export interface FooterContent {
  organised_by: string;
  contact_email: string;
  contact_phone: string;
  copyright: string;
  links: { label: string; href: string }[];
  socials: { platform: string; url: string }[];
}

export const FOOTER_FALLBACK: FooterContent = {
  organised_by: '',
  contact_email: '',
  contact_phone: '',
  copyright: '',
  links: [],
  socials: [],
};

/** Social URLs are only usable if they are absolute, so `javascript:` cannot sneak in. */
function isSafeHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
}

export function parseFooter(value: Json | undefined): FooterContent {
  const row = asRecord(value);
  return {
    organised_by: asString(row.organised_by),
    contact_email: asString(row.contact_email),
    contact_phone: asString(row.contact_phone),
    copyright: asString(row.copyright),
    links: asLinks(row.links),
    socials: asLinks(row.socials)
      .filter((social) => isSafeHref(social.href))
      .map((social) => ({ platform: social.label, url: social.href })),
  };
}

/** The set of block keys the landing page reads. */
export const CONTENT_KEYS = [
  'landing.navbar',
  'landing.hero',
  'landing.about',
  'landing.event_details',
  'landing.timeline',
  'landing.final_cta',
  'landing.footer',
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];

/** Narrow `content_blocks.value` to the specific block's parser. */
export type BlockMap = {
  'landing.navbar': NavbarContent;
  'landing.hero': HeroContent;
  'landing.about': AboutContent;
  'landing.event_details': EventDetailsContent;
  'landing.timeline': TimelineContent;
  'landing.final_cta': FinalCtaContent;
  'landing.footer': FooterContent;
};

export const PARSERS: { [K in ContentKey]: (value: Json | undefined) => BlockMap[K] } = {
  'landing.navbar': parseNavbar,
  'landing.hero': parseHero,
  'landing.about': parseAbout,
  'landing.event_details': parseEventDetails,
  'landing.timeline': parseTimeline,
  'landing.final_cta': parseFinalCta,
  'landing.footer': parseFooter,
};
