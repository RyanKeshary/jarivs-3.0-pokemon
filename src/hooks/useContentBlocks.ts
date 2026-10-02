import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { CONTENT_QUERY_OPTIONS, queryKeys } from './useEventConfig';
import { PARSERS, type BlockMap } from '../lib/content';
import type { ContentBlockRow } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type LoadedBlocks = BlockMap;

/**
 * Fetches every landing-page copy block in one round trip and runs each through
 * its parser.
 *
 * The parsers always return a complete object, so consumers can read
 * `blocks['landing.hero'].kicker` without a null check - even if the row is
 * missing entirely or someone saved malformed JSON.
 */
export function useContentBlocks(): UseQueryResult<LoadedBlocks> {
  return useQuery<LoadedBlocks>({
    queryKey: queryKeys.contentBlocks,
    queryFn: async () => {
      const { data, error } = await supabase.from('content_blocks').select('key,value');
      if (error) throw error;

      const rows = (data ?? []) as Pick<ContentBlockRow, 'key' | 'value'>[];
      const byKey = new Map(rows.map((row) => [row.key, row.value]));

      // One assignment per key rather than a loop, so the compiler checks that
      // every key's parser returns that key's type. A loop would need an
      // assertion and would happily drift out of sync with a new block.
      return {
        'landing.navbar': PARSERS['landing.navbar'](byKey.get('landing.navbar')),
        'landing.hero': PARSERS['landing.hero'](byKey.get('landing.hero')),
        'landing.about': PARSERS['landing.about'](byKey.get('landing.about')),
        'landing.event_details': PARSERS['landing.event_details'](
          byKey.get('landing.event_details'),
        ),
        'landing.timeline': PARSERS['landing.timeline'](byKey.get('landing.timeline')),
        'landing.final_cta': PARSERS['landing.final_cta'](byKey.get('landing.final_cta')),
        'landing.footer': PARSERS['landing.footer'](byKey.get('landing.footer')),
      };
    },
    ...CONTENT_QUERY_OPTIONS,
  });
}
