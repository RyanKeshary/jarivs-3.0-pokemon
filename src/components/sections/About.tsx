import { PokeballCard } from '../ui/PokeballCard';
import { Reveal, RevealItem } from '../ui/Reveal';
import { SectionShell } from '../ui/SectionShell';
import { EditMe, MaybeEditMe } from '../ui/EditMe';
import type { AboutContent } from '../../lib/content';

/**
 * "What is Jarvis?" - not a normal hackathon, the combined-force concept, and
 * the gym leaders you have to defeat. Rendered as a row of Pokeball cards.
 *
 * The card list, titles and body copy all come from content_blocks, so an
 * organiser can rewrite this section without touching the code.
 */
export function About({ content }: { content: AboutContent }) {
  return (
    <SectionShell id="about" eyebrow={content.eyebrow} heading={content.heading}>
      {content.lede ? (
        <Reveal className="mx-auto -mt-4 max-w-2xl text-center">
          {content.lede.startsWith('[EDIT ME]') ? (
            <EditMe>{content.lede}</EditMe>
          ) : (
            <p className="text-base leading-relaxed text-pretty text-shell-200/80">{content.lede}</p>
          )}
        </Reveal>
      ) : null}

      {content.cards.length === 0 ? (
        // An empty table is a legitimate state - the organiser simply has not
        // written the cards yet. Say so rather than rendering a blank gap.
        <Reveal className="mx-auto max-w-xl">
          <div className="rounded-card border border-dashed border-white/15 bg-ink-800/40 p-8 text-center">
            <p className="text-sm text-shell-400">
              No cards have been published for this section yet.
            </p>
            <p className="mt-3 text-xs text-shell-600">
              Add rows to the <code className="text-shell-400">landing.about</code> content
              block to fill it in.
            </p>
          </div>
        </Reveal>
      ) : (
        <Reveal stagger className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {content.cards.map((card, index) => (
            <RevealItem key={card.id}>
              <PokeballCard title={card.title} index={index} className="h-full">
                {card.body ? (
                  card.body.startsWith('[EDIT ME]') ? (
                    <EditMe>{card.body}</EditMe>
                  ) : (
                    <p className="leading-relaxed">{card.body}</p>
                  )
                ) : null}

                {card.items.length > 0 ? (
                  <ul className="mt-5 space-y-3 border-t border-white/10 pt-5">
                    {card.items.map((item) => (
                      <li key={item.label} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ball-500"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-shell-50">
                            <MaybeEditMe value={item.label} />
                          </span>
                          <span className="mt-0.5 block text-sm text-shell-200/70">
                            <MaybeEditMe value={item.detail} />
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </PokeballCard>
            </RevealItem>
          ))}
        </Reveal>
      )}
    </SectionShell>
  );
}
