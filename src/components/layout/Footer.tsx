import { Art } from '../ui/Art';
import { EditMe, MaybeEditMe } from '../ui/EditMe';
import { pokedexClose } from '../../lib/assets';
import type { FooterContent } from '../../lib/content';

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  github: 'GitHub',
  x: 'X',
  twitter: 'X',
  discord: 'Discord',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
};

/**
 * Footer: organisers, links, socials, contact, copyright.
 *
 * All of it comes from `landing.footer`. A link whose href is not absolute is
 * dropped by the parser in lib/content.ts, so a bad paste cannot turn into a
 * javascript: link.
 */
export function Footer({ content }: { content: FooterContent }) {
  const hasContact = Boolean(content.contact_email || content.contact_phone);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-ink-950/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* ---------------- organisers ---------------- */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <Art asset={pokedexClose} alt="" className="h-12 w-9 select-none" />
              <span className="font-pixel text-[0.58rem] tracking-[0.15em] text-shell-50">
                KANTO LEAGUE
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-shell-200/75">
              <MaybeEditMe value={content.organised_by} />
            </p>
          </div>

          {/* ---------------- links ---------------- */}
          {content.links.length > 0 ? (
            <nav aria-label="Footer">
              <h2 className="font-pixel text-[0.52rem] tracking-[0.25em] text-shell-400 uppercase">
                Links
              </h2>
              <ul className="mt-4 space-y-2.5">
                {content.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-shell-200/75 underline-offset-4 transition hover:text-shell-50 hover:underline"
                    >
                      <MaybeEditMe value={link.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {/* ---------------- socials ---------------- */}
          {content.socials.length > 0 ? (
            <div>
              <h2 className="font-pixel text-[0.52rem] tracking-[0.25em] text-shell-400 uppercase">
                Follow
              </h2>
              <ul className="mt-4 space-y-2.5">
                {content.socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-shell-200/75 underline-offset-4 transition hover:text-shell-50 hover:underline"
                    >
                      {socialLabel(social.platform)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* ---------------- contact ---------------- */}
          <div>
            <h2 className="font-pixel text-[0.52rem] tracking-[0.25em] text-shell-400 uppercase">
              Contact
            </h2>
            {hasContact ? (
              <ul className="mt-4 space-y-2.5 text-sm text-shell-200/75">
                {content.contact_email ? (
                  <li>
                    <a
                      href={`mailto:${content.contact_email}`}
                      className="underline-offset-4 transition hover:text-shell-50 hover:underline"
                    >
                      {content.contact_email}
                    </a>
                  </li>
                ) : null}
                {content.contact_phone ? (
                  <li>
                    <a
                      href={`tel:${content.contact_phone.replace(/\s+/g, '')}`}
                      className="underline-offset-4 transition hover:text-shell-50 hover:underline"
                    >
                      {content.contact_phone}
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : (
              <div className="mt-4 space-y-2">
                <EditMe>Contact email</EditMe>
                <EditMe>Contact number</EditMe>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- copyright ---------------- */}
        <div className="mt-12 border-t border-white/10 pt-6">
          {content.copyright ? (
            <MaybeEditMe value={content.copyright} />
          ) : (
            <p className="text-xs text-shell-600">
              <MaybeEditMe value={`© ${year} Kanto League. All rights reserved.`} />
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

/** Turns "instagram" into "Instagram" and leaves anything unknown untouched. */
function socialLabel(platform: string): string {
  const key = platform
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/^\[editme\]/, '')
    .trim();
  return SOCIAL_LABELS[key] ?? platform;
}
