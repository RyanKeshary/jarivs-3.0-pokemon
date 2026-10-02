import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from './useEventConfig';
import { REALTIME_TABLES } from '../lib/database.types';
import { supabase } from '../lib/supabase';

/**
 * Realtime change events arrive keyed by table name, but the query keys are
 * named after the hooks. Mapping them explicitly (rather than deriving the key
 * from the table string) keeps a typo from silently invalidating nothing.
 */
const QUERY_KEY_BY_TABLE = {
  event_config: queryKeys.eventConfig,
  content_blocks: queryKeys.contentBlocks,
  timeline_events: queryKeys.timeline,
} as const satisfies Record<(typeof REALTIME_TABLES)[number], readonly unknown[]>;

/**
 * Pushes database edits to every open tab with no refresh.
 *
 * This is what makes the countdown live: an admin changes `countdown_target` in
 * the Supabase dashboard, Postgres emits a change, and every visitor's page
 * refetches. The subscription works for signed-out visitors too because
 * migration 0004 grants anon SELECT on these three tables and Realtime honours
 * RLS.
 *
 * We invalidate rather than write the payload into the cache. An UPDATE can
 * touch any column, and re-reading one small row is cheap enough that the
 * simpler, harder-to-get-wrong path wins.
 */
export function useLandingRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('landing-content', {
      config: { broadcast: { self: false } },
    });

    for (const table of REALTIME_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEY_BY_TABLE[table] });
        },
      );
    }

    channel.subscribe();

    return () => {
      // removeChannel is async; it detaches the socket and unsubscribes the
      // handlers so a remount does not leave a listener behind.
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
