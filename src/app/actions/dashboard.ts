'use server';

import { createClient } from '@/lib/supabase/server';
import { sql, createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type {
  Profile,
  Team,
  SocialLink,
  Announcement,
  StatusUpdate,
  ProblemStatement,
  Submission,
  EventSettings,
} from '@/lib/database.types';

// Helper to get authenticated user
async function getAuthUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Not authenticated');
  }
  return { supabase, user: data.user };
}

// 1. Fetch complete dashboard data
export async function getDashboardData() {
  const { user } = await getAuthUser();

  // Run initial independent queries in parallel
  const [profileRows, socialLinksRows, memberRows, announcementsRows, problemStatementsRows, settingsRows] = await Promise.all([
    sql`SELECT * FROM public.profiles WHERE id = ${user.id}`,
    sql`SELECT * FROM public.social_links WHERE user_id = ${user.id} ORDER BY created_at ASC`,
    sql`
      SELECT tm.*, t.team_id as team_code, t.name as team_name, t.join_code, t.created_by, t.created_at, t.updated_at
      FROM public.team_members tm
      JOIN public.teams t ON tm.team_id = t.id
      WHERE tm.user_id = ${user.id}
    `,
    sql`SELECT * FROM public.announcements ORDER BY created_at DESC LIMIT 10`,
    sql`SELECT * FROM public.problem_statements WHERE is_visible = true ORDER BY created_at ASC`,
    sql`SELECT * FROM public.event_settings WHERE id = 1`,
  ]);

  const profile = (profileRows[0] || null) as unknown as Profile | null;
  const socialLinks = socialLinksRows as unknown as SocialLink[];
  const announcements = announcementsRows as unknown as Announcement[];
  const problemStatements = problemStatementsRows as unknown as ProblemStatement[];
  const eventSettings = (settingsRows[0] || null) as unknown as EventSettings;

  let team: Team | null = null;
  let teamMembers: any[] = [];
  let submissions: Submission[] = [];

  if (memberRows.length > 0) {
    const m = memberRows[0];
    team = {
      id: m.team_id,
      team_id: m.team_code,
      name: m.team_name,
      join_code: m.join_code,
      created_by: m.created_by,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  }

  // Fetch team members, submissions, and status updates in parallel
  const [tmRows, subRows, statusUpdatesRows] = await Promise.all([
    team?.id
      ? sql`
          SELECT tm.user_id, tm.joined_at, p.trainer_id, p.full_name, p.avatar_url, p.email, p.phones
          FROM public.team_members tm
          JOIN public.profiles p ON tm.user_id = p.id
          WHERE tm.team_id = ${team.id}
          ORDER BY tm.joined_at ASC
        `
      : Promise.resolve([]),
    team?.id
      ? sql`
          SELECT * FROM public.submissions 
          WHERE team_id = ${team.id} 
          ORDER BY version DESC
        `
      : Promise.resolve([]),
    sql`
      SELECT * FROM public.status_updates 
      WHERE user_id = ${user.id} OR (${team?.id ? sql`team_id = ${team.id}` : sql`false`})
      ORDER BY created_at DESC LIMIT 10
    `,
  ]);

  teamMembers = tmRows as unknown as any[];
  submissions = subRows as unknown as Submission[];
  const statusUpdates = statusUpdatesRows as unknown as StatusUpdate[];

  return {
    profile,
    socialLinks,
    team,
    teamMembers,
    submissions,
    announcements,
    statusUpdates,
    problemStatements,
    eventSettings,
  };
}

// 2. Update Profile
export async function updateProfile(formData: {
  fullName: string;
  avatarUrl?: string;
  phones?: string[];
}) {
  const { user } = await getAuthUser();

  await sql`
    UPDATE public.profiles
    SET 
      full_name = ${formData.fullName.trim()},
      avatar_url = ${formData.avatarUrl || '/assets/placeholders/monitor.png'},
      phones = ${formData.phones || []},
      updated_at = NOW()
    WHERE id = ${user.id}
  `;

  revalidatePath('/dashboard');
  return { success: true };
}

// 3. Add Social Link (max 3 enforced)
export async function addSocialLink(label: string, url: string) {
  const { user } = await getAuthUser();

  const countRows = await sql`
    SELECT COUNT(*) FROM public.social_links WHERE user_id = ${user.id}
  `;
  if (parseInt(countRows[0].count) >= 3) {
    throw new Error('Maximum of 3 social links allowed.');
  }

  await sql`
    INSERT INTO public.social_links (user_id, label, url)
    VALUES (${user.id}, ${label.trim()}, ${url.trim()})
  `;

  revalidatePath('/dashboard');
  return { success: true };
}

// 4. Delete Social Link
export async function deleteSocialLink(id: string) {
  const { user } = await getAuthUser();

  await sql`
    DELETE FROM public.social_links WHERE id = ${id} AND user_id = ${user.id}
  `;

  revalidatePath('/dashboard');
  return { success: true };
}

// 5. Create Team
export async function createTeam(teamName: string) {
  const { user } = await getAuthUser();

  // Check if user is already in a team
  const existing = await sql`
    SELECT * FROM public.team_members WHERE user_id = ${user.id}
  `;
  if (existing.length > 0) {
    throw new Error('You are already part of a team.');
  }

  // Generate unique Team ID and join code
  const teamIdResult = await sql`SELECT public.generate_team_id() as team_id`;
  const teamCode = teamIdResult[0].team_id;
  const joinCode = 'POKE-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const newTeam = await sql`
    INSERT INTO public.teams (team_id, name, created_by, join_code)
    VALUES (${teamCode}, ${teamName.trim()}, ${user.id}, ${joinCode})
    RETURNING id
  `;

  const teamId = newTeam[0].id;

  // Add creator as first team member
  await sql`
    INSERT INTO public.team_members (team_id, user_id)
    VALUES (${teamId}, ${user.id})
  `;

  // Post welcome status update
  await sql`
    INSERT INTO public.status_updates (team_id, user_id, title, message, status)
    VALUES (
      ${teamId},
      ${user.id},
      'Team Formed',
      ${'Squad ' + teamName.trim() + ' registered in Kento League!'},
      'success'
    )
  `;

  revalidatePath('/dashboard');
  return { success: true, teamId };
}

// 6. Join Team via Join Code or Team ID
export async function joinTeam(code: string) {
  const { user } = await getAuthUser();

  const existing = await sql`
    SELECT * FROM public.team_members WHERE user_id = ${user.id}
  `;
  if (existing.length > 0) {
    throw new Error('You are already part of a team.');
  }

  const cleanCode = code.trim().toUpperCase();

  const teamRows = await sql`
    SELECT * FROM public.teams 
    WHERE UPPER(join_code) = ${cleanCode} OR UPPER(team_id) = ${cleanCode}
  `;

  if (teamRows.length === 0) {
    throw new Error('No team found with this Join Code or Team ID.');
  }

  const targetTeam = teamRows[0];

  // Insert member (trigger enforces max_team_size)
  try {
    await sql`
      INSERT INTO public.team_members (team_id, user_id)
      VALUES (${targetTeam.id}, ${user.id})
    `;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to join team');
  }

  revalidatePath('/dashboard');
  return { success: true };
}

// 7. Leave or Disband Team
export async function leaveTeam() {
  const { user } = await getAuthUser();

  const memberRows = await sql`
    SELECT * FROM public.team_members WHERE user_id = ${user.id}
  `;
  if (memberRows.length === 0) {
    throw new Error('You are not in any team.');
  }

  const teamId = memberRows[0].team_id;
  const teamRows = await sql`SELECT * FROM public.teams WHERE id = ${teamId}`;
  const team = teamRows[0];

  if (team.created_by === user.id) {
    // Team Leader disbands the team
    await sql`DELETE FROM public.teams WHERE id = ${teamId}`;
  } else {
    // Normal member leaves
    await sql`DELETE FROM public.team_members WHERE team_id = ${teamId} AND user_id = ${user.id}`;
  }

  revalidatePath('/dashboard');
  return { success: true };
}

// 8. Upload Submission
export async function uploadSubmission(formData: FormData) {
  const { user, supabase } = await getAuthUser();

  // Check deadline
  const settingsRows = await sql`SELECT deadline FROM public.event_settings WHERE id = 1`;
  if (settingsRows.length > 0) {
    const deadline = new Date(settingsRows[0].deadline);
    if (new Date() > deadline) {
      throw new Error('Submission deadline has passed. Submissions are locked.');
    }
  }

  // Get user team
  const memberRows = await sql`SELECT team_id FROM public.team_members WHERE user_id = ${user.id}`;
  if (memberRows.length === 0) {
    throw new Error('You must be in a team to submit.');
  }
  const teamId = memberRows[0].team_id;

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided.');
  }

  // Enforce 50MB max limit
  if (file.size > 52428800) {
    throw new Error('File size exceeds the 50MB hackathon limit.');
  }

  const rawFileName = file.name || 'submission.pdf';
  const ext = rawFileName.split('.').pop()?.toLowerCase();
  if (!['pdf', 'ppt', 'pptx'].includes(ext || '')) {
    throw new Error('Only PDF, PPT, or PPTX presentation decks are accepted.');
  }

  // Map MIME types precisely to match Supabase storage allowed formats
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
  };
  const contentType = mimeMap[ext || ''] || file.type || 'application/octet-stream';

  // Sanitize filename preserving letters, numbers, dashes, underscores
  const lastDot = rawFileName.lastIndexOf('.');
  const baseName = (lastDot !== -1 ? rawFileName.substring(0, lastDot) : rawFileName)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  const cleanFileName = `${baseName}.${ext}`;
  const storagePath = `${teamId}/deck_${Date.now()}_${cleanFileName}`;

  // Upload to submissions bucket
  const fileBytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(storagePath, Buffer.from(fileBytes), {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload error: ${uploadError.message}`);
  }

  // Insert or update submission row
  const insertResult = await sql`
    INSERT INTO public.submissions (
      team_id,
      file_path,
      file_name,
      ppt_url,
      deck_mime_type,
      deck_size_bytes,
      status,
      submitted_at,
      uploaded_at
    )
    VALUES (
      ${teamId},
      ${storagePath},
      ${cleanFileName},
      ${storagePath},
      ${contentType},
      ${file.size},
      'submitted'::submission_status,
      NOW(),
      NOW()
    )
    ON CONFLICT (team_id) DO UPDATE SET
      file_path = EXCLUDED.file_path,
      file_name = EXCLUDED.file_name,
      ppt_url = EXCLUDED.ppt_url,
      deck_mime_type = EXCLUDED.deck_mime_type,
      deck_size_bytes = EXCLUDED.deck_size_bytes,
      status = 'submitted'::submission_status,
      submitted_at = NOW(),
      updated_at = NOW()
    RETURNING version
  `;

  const finalVersion = insertResult[0]?.version || 1;

  // Status update
  await sql`
    INSERT INTO public.status_updates (team_id, user_id, title, message, status)
    VALUES (${teamId}, ${user.id}, 'Submission Deck Uploaded', ${'Version ' + finalVersion + ' (' + cleanFileName + ') submitted successfully.'}, 'success')
  `;

  revalidatePath('/dashboard');
  return { success: true, version: finalVersion, fileName: cleanFileName };
}

// 9. Get Signed URL for Participant Deck Preview / Download
export async function getDeckDownloadUrl(storagePath: string) {
  const { user, supabase } = await getAuthUser();

  const pathTeamId = storagePath.split('/')[0];

  // Verify user is team member or staff
  const isMember = await sql`
    SELECT 1 FROM public.team_members 
    WHERE team_id = ${pathTeamId} AND user_id = ${user.id}
  `;

  if (isMember.length === 0) {
    const profileRows = await sql`SELECT role FROM public.profiles WHERE id = ${user.id}`;
    const role = profileRows[0]?.role;
    const isStaff =
      role === 'admin' ||
      role === 'master' ||
      role === 'manager' ||
      user.email === 'ryankeshary@gmail.com' ||
      user.email === 'shrey.sleeps@gmail.com';

    if (!isStaff) {
      throw new Error('Unauthorized to view this deck.');
    }
  }

  const { data, error } = await supabase.storage
    .from('submissions')
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    throw new Error('Failed to generate download URL: ' + (error?.message || 'Unknown error'));
  }

  return { signedUrl: data.signedUrl };
}

// 7. Trainer Password Change
export async function changeUserPassword(newPassword: string) {
  const { user } = await getAuthUser();

  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const cleanPassword = newPassword.trim();

  // 1. Direct PostgreSQL update with pgcrypto bcrypt
  await sql`
    UPDATE auth.users
    SET encrypted_password = crypt(${cleanPassword}, gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE id = ${user.id}::uuid
  `;

  // 2. Also attempt Supabase Auth client synchronization
  try {
    const supabase = await createClient();
    await supabase.auth.updateUser({ password: cleanPassword });
  } catch (err) {
    // direct DB update with pgcrypto already executed
  }

  return { success: true };
}

// 8. Upload Trainer Avatar / Profile Photo
export async function uploadTrainerAvatar(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  const file = formData.get('file') as File | null;
  const targetUserId = (formData.get('targetUserId') as string) || user.id;

  if (!file) {
    throw new Error('No photo file provided');
  }

  // Validate mime type
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Invalid image type. Please upload a PNG, JPEG, WEBP, or AVIF image.');
  }

  // Validate size: max 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Photo must be less than 5MB.');
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const ext = ['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(rawExt) ? rawExt : 'png';
  // Use authenticated user's id for storage folder path to comply with avatars RLS policy
  const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: file.type || 'image/png',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  const isSelf = targetUserId === user.id;
  if (!isSelf) {
    const adminCheck = await sql`SELECT public.is_staff() as staff`;
    if (!adminCheck[0]?.staff) {
      throw new Error('Unauthorized to update another trainer photo.');
    }
  }

  await sql`
    UPDATE public.profiles
    SET avatar_url = ${publicUrl}, updated_at = NOW()
    WHERE id = ${targetUserId}::uuid
  `;

  revalidatePath('/dashboard');
  revalidatePath('/admin');

  return { success: true, avatar_url: publicUrl };
}
