/**
 * Hand-written typings for the tables this app reads.
 *
 * These mirror supabase/migrations/*.sql. There is no codegen step on purpose:
 * the schema is small and stable, and a checked-in file is easier to review in a
 * pull request than a generated one. If you change a column, change it here too.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'trainer' | 'admin' | 'manager';
export type SubmissionStatus = 'draft' | 'submitted' | 'locked';

/** Singleton row. `id` is pinned to 1 by a CHECK constraint. */
export type EventConfigRow = {
  id: 1;
  event_name: string;
  tagline: string;
  event_starts_at: string;
  countdown_target: string;
  registration_deadline: string;
  registration_open: boolean;
  /** NULL until confirmed - the UI renders the [EDIT ME] marker. */
  venue: string | null;
  team_size_min: number | null;
  team_size_max: number | null;
  /** NULL until confirmed. The countdown cannot enter "ended" without it. */
  event_ends_at: string | null;
  updated_at: string;
  updated_by: string | null;
}

export type ContentBlockRow = {
  key: string;
  value: Json;
  updated_at: string;
  updated_by: string | null;
}

export type TimelineEventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  location: string | null;
  sort_order: number;
  is_highlight: boolean;
  created_at: string;
  updated_at: string;
}

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  roll_no: string | null;
  year: string | null;
  branch: string | null;
  role: UserRole;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TeamRow = {
  id: string;
  name: string;
  join_code: string;
  leader_id: string | null;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export type SubmissionRow = {
  id: string;
  team_id: string;
  title: string;
  abstract: string | null;
  deck_path: string;
  deck_file_name: string;
  deck_mime_type: string;
  deck_size_bytes: number;
  status: SubmissionStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Audit log row - every admin/manager action is recorded here. */
export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_id: string | null;
  target_type: string | null;
  details: Json | null;
  created_at: string;
}

/**
 * The shape supabase-js requires for a `Database` generic.
 *
 * `Relationships` is not optional. If a table omits it, the whole type stops
 * satisfying GenericSchema and TypeScript silently falls back to `any`-ish
 * types - which is how `rpc()` ends up rejecting valid arguments. Tables with
 * no foreign keys we care about declare an empty array.
 */
interface Table<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Row>,
  Relationships extends { foreignKeyName: string; columns: string[]; referencedRelation: string; referencedColumns: string[] }[] = [],
> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
}

export interface Database {
  public: {
    Tables: {
      event_config: Table<EventConfigRow>;
      content_blocks: Table<ContentBlockRow>;
      timeline_events: Table<TimelineEventRow>;
      profiles: Table<
        ProfileRow,
        Partial<ProfileRow>,
        Partial<ProfileRow>,
        [{ foreignKeyName: 'profiles_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] }]
      >;
      teams: Table<TeamRow>;
      submissions: Table<
        SubmissionRow,
        Partial<SubmissionRow>,
        Partial<SubmissionRow>,
        [{ foreignKeyName: 'submissions_team_id_fkey'; columns: ['team_id']; referencedRelation: 'teams'; referencedColumns: ['id'] }]
      >;
      audit_log: Table<AuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_registration_email_allowed: { Args: { p_email: string }; Returns: boolean };
      join_team: { Args: { p_code: string }; Returns: string };
      leave_team: { Args: Record<string, never>; Returns: undefined };
      create_team: { Args: { p_name: string; p_max_members?: number }; Returns: string };
      insert_audit_log: { Args: { p_action: string; p_target_id?: string; p_target_type?: string; p_details?: Json }; Returns: void };
    };
    Enums: {
      user_role: UserRole;
      submission_status: SubmissionStatus;
    };
  };
}

/** Tables the landing page subscribes to over Realtime. */
export const REALTIME_TABLES = ['event_config', 'timeline_events', 'content_blocks'] as const;

/** Tables that also have realtime subscription support (Phase 2+3). */
export const FULL_REALTIME_TABLES = [
  'event_config',
  'timeline_events',
  'content_blocks',
  'announcements',
  'problem_statements',
  'resources',
  'teams',
  'team_members',
  'submissions',
  'profiles',
] as const;
