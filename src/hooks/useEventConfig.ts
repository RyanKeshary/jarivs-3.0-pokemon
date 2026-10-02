import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { EventConfigRow } from '../lib/database.types';

/** Query keys live here so the realtime invalidation and the fetch cannot drift. */
export const queryKeys = {
  eventConfig: ['event_config'] as const,
  contentBlocks: ['content_blocks'] as const,
  timeline: ['timeline_events'] as const,
  profile: (userId: string) => ['profile', userId] as const,
};

export const CONTENT_QUERY_OPTIONS = {
  // Content only changes when an organiser edits it, and the realtime
  // subscription below pushes those changes immediately. A short staleTime
  // covers the case where the socket is blocked.
  staleTime: 60_000,
  gcTime: 10 * 60_000,
  retry: 2,
} as const;

/**
 * The single event row. `id = 1` is enforced by a CHECK constraint, so `.single()`
 * either returns the one row or throws - there is no "not found yet" state to
 * design for.
 */
export function useEventConfig(): UseQueryResult<EventConfigRow> {
  return useQuery<EventConfigRow>({
    queryKey: queryKeys.eventConfig,
    queryFn: async () => {
      const { data, error } = await supabase.from('event_config').select('*').eq('id', 1).single();
      if (error) throw error;
      return data;
    },
    ...CONTENT_QUERY_OPTIONS,
  });
}
