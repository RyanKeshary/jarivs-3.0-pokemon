'use server';

import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Helper to verify admin or master authorization
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized: login required');
  }

  const profileRows = await sql`SELECT * FROM public.profiles WHERE id = ${user.id}`;
  const profile = profileRows[0];
  if (!profile || (profile.role !== 'admin' && profile.role !== 'master')) {
    throw new Error('Forbidden: Admin access required');
  }

  return { user, profile, isMaster: profile.role === 'master' };
}

// Log action to audit_log
async function logAudit(actorId: string, actorEmail: string, action: string, targetType: string, targetId: string, details: any = {}) {
  try {
    await sql`
      INSERT INTO public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
      VALUES (${actorId}, ${actorEmail}, ${action}, ${targetType}, ${targetId}, ${JSON.stringify(details)}::jsonb)
    `;
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// 1. Fetch Complete Admin Data
export async function getAdminData() {
  const { user, profile, isMaster } = await requireAdmin();

  // Metrics
  const participantCount = await sql`SELECT COUNT(*) FROM public.profiles`;
  const teamCount = await sql`SELECT COUNT(*) FROM public.teams`;
  const submissionCount = await sql`SELECT COUNT(*) FROM public.submissions`;

  // Participants with team details
  const participants = await sql`
    SELECT 
      p.id, 
      p.trainer_id, 
      p.full_name, 
      p.email, 
      p.role, 
      p.phones, 
      p.avatar_url, 
      p.created_at,
      t.id as team_uuid,
      t.name as team_name,
      t.team_id as team_code
    FROM public.profiles p
    LEFT JOIN public.team_members tm ON p.id = tm.user_id
    LEFT JOIN public.teams t ON tm.team_id = t.id
    ORDER BY p.created_at DESC
  `;

  // Teams with members and submissions
  const teams = await sql`
    SELECT 
      t.id, 
      t.team_id, 
      t.name, 
      t.join_code, 
      t.created_at, 
      t.created_by,
      p.full_name as leader_name,
      p.email as leader_email,
      (SELECT COUNT(*) FROM public.team_members tm WHERE tm.team_id = t.id) as member_count,
      (
        SELECT json_agg(json_build_object(
          'id', sub.id, 
          'version', sub.version, 
          'ppt_url', sub.ppt_url, 
          'submitted_at', sub.submitted_at, 
          'status', sub.status
        ))
        FROM public.submissions sub 
        WHERE sub.team_id = t.id
      ) as submissions_list
    FROM public.teams t
    JOIN public.profiles p ON t.created_by = p.id
    ORDER BY t.created_at DESC
  `;

  // Problem Statements
  const problemStatements = await sql`
    SELECT * FROM public.problem_statements ORDER BY created_at DESC
  `;

  // Announcements
  const announcements = await sql`
    SELECT * FROM public.announcements ORDER BY created_at DESC
  `;

  // Status updates
  const statusUpdates = await sql`
    SELECT su.*, t.name as team_name, p.full_name as author_name
    FROM public.status_updates su
    LEFT JOIN public.teams t ON su.team_id = t.id
    LEFT JOIN public.profiles p ON su.user_id = p.id
    ORDER BY su.created_at DESC LIMIT 50
  `;

  // Event settings
  const eventSettingsRows = await sql`SELECT * FROM public.event_settings WHERE id = 1`;
  const eventSettings = eventSettingsRows[0];

  // Master Allowlist & Admins (for Master tab)
  const masterAllowlist = isMaster ? await sql`SELECT * FROM public.master_allowlist ORDER BY created_at DESC` : [];
  const admins = await sql`
    SELECT id, trainer_id, full_name, email, role, created_at 
    FROM public.profiles 
    WHERE role = 'admin' OR role = 'master'
    ORDER BY created_at ASC
  `;

  // Audit Log
  const auditLogs = await sql`
    SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 100
  `;

  return {
    currentRole: profile.role,
    userEmail: user.email,
    currentUserId: user.id,
    isMaster,
    metrics: {
      totalParticipants: parseInt(participantCount[0].count),
      totalTeams: parseInt(teamCount[0].count),
      totalSubmissions: parseInt(submissionCount[0].count),
    },
    participants,
    teams,
    problemStatements,
    announcements,
    statusUpdates,
    eventSettings,
    masterAllowlist,
    admins,
    auditLogs,
  };
}

// 2. Problem Statement Management
export async function upsertProblemStatement(data: {
  id?: string;
  title: string;
  description: string;
  file_url?: string;
  is_visible: boolean;
}) {
  const { user } = await requireAdmin();

  let id = data.id;
  if (id) {
    await sql`
      UPDATE public.problem_statements
      SET 
        title = ${data.title.trim()},
        description = ${data.description.trim()},
        file_url = ${data.file_url || null},
        is_visible = ${data.is_visible},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    await logAudit(user.id, user.email || '', 'UPDATE_PROBLEM_STATEMENT', 'problem_statements', id, data);
  } else {
    const res = await sql`
      INSERT INTO public.problem_statements (title, description, file_url, is_visible)
      VALUES (${data.title.trim()}, ${data.description.trim()}, ${data.file_url || null}, ${data.is_visible})
      RETURNING id
    `;
    id = res[0].id as string;
    await logAudit(user.id, user.email || '', 'CREATE_PROBLEM_STATEMENT', 'problem_statements', id, data);
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true, id };
}

export async function deleteProblemStatement(id: string) {
  const { user } = await requireAdmin();
  await sql`DELETE FROM public.problem_statements WHERE id = ${id}`;
  await logAudit(user.id, user.email || '', 'DELETE_PROBLEM_STATEMENT', 'problem_statements', id);
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleProblemStatementVisibility(id: string, is_visible: boolean) {
  const { user } = await requireAdmin();
  await sql`UPDATE public.problem_statements SET is_visible = ${is_visible}, updated_at = NOW() WHERE id = ${id}`;
  await logAudit(user.id, user.email || '', 'TOGGLE_PROBLEM_STATEMENT', 'problem_statements', id, { is_visible });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

// 3. Announcements
export async function createAnnouncement(title: string, content: string, priority = 'normal') {
  const { user } = await requireAdmin();
  const res = await sql`
    INSERT INTO public.announcements (title, content, priority, created_by)
    VALUES (${title.trim()}, ${content.trim()}, ${priority}, ${user.id})
    RETURNING id
  `;
  await logAudit(user.id, user.email || '', 'CREATE_ANNOUNCEMENT', 'announcements', res[0].id as string, { title, priority });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const { user } = await requireAdmin();
  await sql`DELETE FROM public.announcements WHERE id = ${id}`;
  await logAudit(user.id, user.email || '', 'DELETE_ANNOUNCEMENT', 'announcements', id);
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

// 4. Status Updates
export async function createStatusUpdate(teamId: string | null, title: string, message: string, status = 'info') {
  const { user } = await requireAdmin();
  const res = await sql`
    INSERT INTO public.status_updates (team_id, user_id, title, message, status)
    VALUES (${teamId || null}, ${user.id}, ${title.trim()}, ${message.trim()}, ${status})
    RETURNING id
  `;
  await logAudit(user.id, user.email || '', 'CREATE_STATUS_UPDATE', 'status_updates', res[0].id as string, { teamId, title, status });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

// 5. Update Event Settings
export async function updateEventSettings(formData: {
  name: string;
  tagline: string;
  countdownTarget: string;
  deadline: string;
  registrationDeadline: string;
  brochureUrl?: string;
  pptTemplateUrl?: string;
  landingContent: any;
}) {
  const { user } = await requireAdmin();

  await sql`
    UPDATE public.event_settings
    SET 
      name = ${formData.name.trim()},
      tagline = ${formData.tagline.trim()},
      countdown_target = ${formData.countdownTarget},
      deadline = ${formData.deadline},
      registration_deadline = ${formData.registrationDeadline},
      brochure_url = ${formData.brochureUrl || '/assets/placeholders/brochure.pdf'},
      ppt_template_url = ${formData.pptTemplateUrl || '/assets/placeholders/template.pptx'},
      landing_content = ${JSON.stringify(formData.landingContent)}::jsonb,
      updated_at = NOW()
    WHERE id = 1
  `;

  await logAudit(user.id, user.email || '', 'UPDATE_EVENT_SETTINGS', 'event_settings', '1', formData);
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { success: true };
}

// 6. Master Only: Promote / Demote Admin
export async function promoteToAdmin(targetEmail: string) {
  const { user, isMaster } = await requireAdmin();
  if (!isMaster) throw new Error('Only Master can promote trainers to Admin');

  const cleanEmail = targetEmail.trim().toLowerCase();
  const res = await sql`
    UPDATE public.profiles
    SET role = 'admin', updated_at = NOW()
    WHERE LOWER(email) = ${cleanEmail}
    RETURNING id, full_name
  `;

  if (res.length === 0) {
    throw new Error('Trainer with this email not found.');
  }

  // Set default password password@67 for promoted admin
  await sql`
    UPDATE auth.users
    SET encrypted_password = crypt('password@67', gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE LOWER(email) = ${cleanEmail}
  `;

  await logAudit(user.id, user.email || '', 'PROMOTE_ADMIN', 'profiles', res[0].id as string, { email: cleanEmail, defaultPassword: 'password@67' });
  revalidatePath('/admin');
  return { success: true, name: res[0].full_name };
}

export async function demoteAdmin(targetId: string) {
  const { user, isMaster } = await requireAdmin();
  if (!isMaster) throw new Error('Only Master can demote Admins');

  await sql`
    UPDATE public.profiles
    SET role = 'participant', updated_at = NOW()
    WHERE id = ${targetId} AND role = 'admin'
  `;

  await logAudit(user.id, user.email || '', 'DEMOTE_ADMIN', 'profiles', targetId);
  revalidatePath('/admin');
  return { success: true };
}

// 7. Get Signed URL for Submission Preview
export async function getSubmissionSignedUrl(storagePath: string) {
  const supabase = await createClient();
  await requireAdmin();

  const { data, error } = await supabase.storage
    .from('submissions')
    .createSignedUrl(storagePath, 3600);

  if (error || !data) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return { signedUrl: data.signedUrl };
}

// 8. Admin Self Password Change
export async function changeAdminPassword(newPassword: string) {
  const { user } = await requireAdmin();

  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('Password must be at least 6 characters long.');
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

  await logAudit(user.id, user.email || '', 'CHANGE_ADMIN_PASSWORD', 'auth.users', user.id);
  revalidatePath('/admin');
  return { success: true };
}

// 9. Master Reset Admin Password to default password@67
export async function resetAdminPassword(targetUserId: string) {
  const { user, isMaster } = await requireAdmin();
  if (!isMaster) throw new Error('Only Master can reset admin credentials');

  await sql`
    UPDATE auth.users
    SET encrypted_password = crypt('password@67', gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE id = ${targetUserId}::uuid
  `;

  await logAudit(user.id, user.email || '', 'RESET_ADMIN_PASSWORD', 'auth.users', targetUserId, {
    defaultPassword: 'password@67'
  });
  revalidatePath('/admin');
  return { success: true };
}
