import { GameMenuRow } from '../ui/GameMenuRow';
import { Reveal, RevealItem } from '../ui/Reveal';
import { SectionShell } from '../ui/SectionShell';
import { EditMe } from '../ui/EditMe';
import type { EventConfigRow } from '../../lib/database.types';
import type { EventDetailItem, EventDetailsContent } from '../../lib/content';
import { daysBetween, formatIstDateTime } from '../../lib/time';

/**
 * Event details, laid out as an in-game menu.
 *
 * Each row declares either a `source` (an event_config column) or its own
 * free-text `value`. Resolving the source here rather than storing the value in
 * the content block means a date is only ever typed once - change it in
 * event_config and every mention of it on the page follows.
 */
export function EventDetails({
  content,
  event,
  now,
}: {
  content: EventDetailsContent;
  event: EventConfigRow;
  now: number;
}) {
  return (
    <SectionShell
      id="details"
      eyebrow={content.eyebrow}
      heading={content.heading}
      className="relative"
    >
      <div aria-hidden="true" className="bg-hatch absolute inset-0 -z-10 rounded-card opacity-40" />

      {content.items.length === 0 ? (
        <Reveal className="mx-auto max-w-xl">
          <div className="rounded-card border border-dashed border-white/15 bg-ink-800/40 p-8 text-center">
            <p className="text-sm text-shell-400">No detail rows have been published yet.</p>
            <p className="mt-3 text-xs text-shell-600">
              Add rows to the <code className="text-shell-400">landing.event_details</code>{' '}
              content block to fill this menu in.
            </p>
          </div>
        </Reveal>
      ) : (
        <Reveal stagger as="ul" className="mx-auto flex max-w-3xl flex-col gap-3">
          {content.items.map((item) => (
            <RevealItem key={item.id} as="div">
              <MenuRow item={item} event={event} now={now} />
            </RevealItem>
          ))}
        </Reveal>
      )}
    </SectionShell>
  );
}

function MenuRow({
  item,
  event,
  now,
}: {
  item: EventDetailItem;
  event: EventConfigRow;
  now: number;
}) {
  const resolved = resolveValue(item, event);
  const valueNode = resolved.confirmed ? (
    resolved.text
  ) : (
    <EditMe>{resolved.hint}</EditMe>
  );

  // Highlight the deadline only while it is genuinely close, so the emphasis
  // means something.
  const daysLeft = daysBetween(event.registration_deadline, now);
  const urgent = item.source === 'registration_deadline' && daysLeft !== null && daysLeft <= 7;

  return (
    <GameMenuRow
      title={item.title}
      value={valueNode}
      blurb={item.blurb ?? undefined}
      tone={urgent ? 'urgent' : item.source === 'venue' ? 'muted' : 'default'}
    />
  );
}

interface Resolved {
  confirmed: boolean;
  text: string;
  /** What to print inside the [EDIT ME] box, e.g. "venue not set". */
  hint: string;
}

function resolveValue(item: EventDetailItem, event: EventConfigRow): Resolved {
  switch (item.source) {
    case 'event_starts_at': {
      const text = formatIstDateTime(event.event_starts_at);
      return text
        ? { confirmed: true, text, hint: 'start time not set' }
        : { confirmed: false, text: '', hint: 'start time not set' };
    }

    case 'registration_deadline': {
      const text = formatIstDateTime(event.registration_deadline);
      return text
        ? { confirmed: true, text, hint: 'deadline not set' }
        : { confirmed: false, text: '', hint: 'deadline not set' };
    }

    case 'venue': {
      // NULL means unconfirmed, which is why the column is nullable.
      return event.venue
        ? { confirmed: true, text: event.venue, hint: 'venue not set' }
        : { confirmed: false, text: '', hint: 'venue not set' };
    }

    case 'team_size': {
      if (event.team_size_min === null || event.team_size_max === null) {
        return { confirmed: false, text: '', hint: 'team size not set' };
      }
      const text =
        event.team_size_min === event.team_size_max
          ? `${event.team_size_min} members`
          : `${event.team_size_min}–${event.team_size_max} members`;
      return { confirmed: true, text, hint: 'team size not set' };
    }

    default: {
      // Free-text row (prizes, rules). The organiser may legitimately leave a
      // value as the literal marker, which is why that is checked here too.
      const raw = item.value?.trim() ?? '';
      if (raw === '' || raw.startsWith('[EDIT ME]')) {
        return { confirmed: false, text: '', hint: raw || `${item.title} not written yet` };
      }
      return { confirmed: true, text: raw, hint: `${item.title} not written yet` };
    }
  }
}
