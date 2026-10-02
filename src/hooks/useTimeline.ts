import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { CONTENT_QUERY_OPTIONS, queryKeys } from './useEventConfig';
import type { TimelineEventRow } from '../lib/database.types';
import { supabase } from '../lib/supabase';

/**
 * The route map. Ordered in the database by (sort_order, starts_at) rather than
 * in the client, so an admin can reorder stops from the dashboard.
 *
 * NULLS FIRST on starts_at means a stop with no confirmed time yet still appears
 * in the right place - it just renders a "[EDIT ME]" instead of a date.
 */
export function useTimeline(): UseQueryResult<TimelineEventRow[]> {
  return useQuery<TimelineEventRow[]>({
    queryKey: queryKeys.timeline,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('starts_at', { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
    ...CONTENT_QUERY_OPTIONS,
  });
}
