import type { ReactNode } from 'react';

import { EDIT_ME } from '../../lib/content';

interface EditMeProps {
  children?: ReactNode;
  /** Rendered as a block (p) or inline (span). Defaults to block. */
  inline?: boolean;
  className?: string;
}

/**
 * Marks content the organiser has not supplied yet.
 *
 * Anything stored as the literal "[EDIT ME]" (or NULL, which the callers convert
 * to this) is rendered with a dashed amber outline so it is obvious on a phone
 * and in a screenshot, and impossible to mistake for finished copy. It is a
 * development aid, not a user-facing state - once real copy lands the marker
 * disappears because the value stops matching.
 */
export function EditMe({ children = EDIT_ME, inline = false, className = '' }: EditMeProps) {
  const base =
    'rounded-md border border-dashed border-gold-400/70 bg-gold-400/10 text-gold-400 ' +
    'font-pixel text-[0.6rem] leading-relaxed';

  if (inline) {
    return <span className={`${base} inline-block px-1.5 py-0.5 align-middle ${className}`}>{children}</span>;
  }

  return <span className={`${base} block px-2 py-1.5 ${className}`}>{children}</span>;
}

/**
 * Renders `value`, or the [EDIT ME] marker when it is blank or unconfirmed.
 * This is the single place that decision is made.
 */
export function MaybeEditMe({
  value,
  className,
}: {
  value: string | number | null | undefined;
  className?: string;
}) {
  if (value === null || value === undefined) return <EditMe className={className} />;
  const text = String(value).trim();
  if (text === '' || text.startsWith(EDIT_ME)) return <EditMe className={className} />;
  return <>{text}</>;
}
