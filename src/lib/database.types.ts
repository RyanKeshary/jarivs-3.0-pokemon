export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'participant' | 'admin' | 'master';

export interface Profile {
  id: string;
  trainer_id: string;
  full_name: string;
  avatar_url: string;
  phones: string[];
  role: UserRole;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  user_id: string;
  label: string;
  url: string;
  created_at: string;
}

export interface Team {
  id: string;
  team_id: string;
  name: string;
  created_by: string;
  join_code: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  team_id: string;
  ppt_url: string;
  version: number;
  submitted_at: string;
  status: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_by: string | null;
  created_at: string;
}

export interface StatusUpdate {
  id: string;
  team_id: string;
  user_id: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

export interface LandingContent {
  venue: string;
  prizes: { place: string; amount: string }[];
  tracks: { name: string; desc: string }[];
  rules: string[];
  eligibility: string;
  timeline: { time: string; title: string; desc: string; phase: string }[];
}

export interface EventSettings {
  id: number;
  name: string;
  tagline: string;
  deadline: string;
  countdown_target: string;
  registration_deadline: string;
  min_team_size: number;
  max_team_size: number;
  brochure_url: string;
  ppt_template_url: string;
  landing_content: LandingContent;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Json;
  created_at: string;
}
