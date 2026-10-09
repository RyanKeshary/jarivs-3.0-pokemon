'use server';

import { createClient } from '@/lib/supabase/server';
import { sql, createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Helper to verify admin or master authorization
// Helper to verify authorization (Coordinator, Admin, Manager, or Master)
export async function requireCoordinatorOrAdmin(userOverride?: any) {
  let user = userOverride;
  if (!user) {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error || !authUser) {
      throw new Error('Unauthorized: login required');
    }
    user = authUser;
  }

  const userEmail = (user.email || '').toLowerCase().trim();

  let profileRows: any[] = [];
  try {
    profileRows = await sql`SELECT * FROM public.profiles WHERE id = ${user.id}::uuid`;
  } catch {
    try {
      profileRows = await sql`SELECT * FROM public.profiles WHERE id = ${user.id}`;
    } catch {}
  }
  let profile = profileRows[0];
  
  // STRICT RULE: ONLY ryankeshary@gmail.com and shrey.sleeps@gmail.com are masters
  const isMasterUser = userEmail === 'ryankeshary@gmail.com' || userEmail === 'shrey.sleeps@gmail.com';

  // Fallback to lookup by email if profile was not found by id
  if (!profile && userEmail) {
    try {
      const byEmail = await sql`SELECT * FROM public.profiles WHERE LOWER(email) = ${userEmail}`;
      profile = byEmail[0];
    } catch {}
  }

  if (!profile && isMasterUser && user.email) {
    profile = { id: user.id, email: user.email, role: 'master', full_name: 'Master Organizer' };
  }

  // Also check auth user metadata for role if profile row is missing or role is not set
  const metaRole = user.user_metadata?.role;
  const effectiveRole = profile?.role || metaRole || (isMasterUser ? 'master' : null);

  const isCoordinator = effectiveRole === 'coordinator';
  const isManager = effectiveRole === 'manager';
  const isAdmin = effectiveRole === 'admin' || isMasterUser;
  const isMaster = isMasterUser || effectiveRole === 'master';

  const isAuthorized = isMaster || isAdmin || isManager || isCoordinator;

  if (!isAuthorized) {
    throw new Error('Forbidden: Console access required');
  }

  return {
    user,
    profile: profile || { id: user.id, email: user.email, role: effectiveRole || (isMaster ? 'master' : isCoordinator ? 'coordinator' : 'admin') },
    isCoordinator,
    isManager,
    isAdmin,
    isMaster
  };
}

// Helper to verify Admin, Manager, or Master authorization (blocks coordinators from sensitive management)
export async function requireAdminOrManager(userOverride?: any) {
  const auth = await requireCoordinatorOrAdmin(userOverride);
  if (auth.isCoordinator) {
    throw new Error('Forbidden: Requires Administrator or Manager privileges.');
  }
  return auth;
}

// Backward-compatible alias for existing functions
const requireAdmin = requireAdminOrManager;

// Dedicated server actions for admin auth
export async function adminLoginAction(email: string, password: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const supabase = await createClient();
    let { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error || !data?.user) {
      // Auto-heal check: if user is an authorized staff member whose password matches crypt in auth.users
      const authUserCheck = await sql`
        SELECT u.id, u.email, u.instance_id, u.role, u.aud, (u.encrypted_password = crypt(${cleanPassword}, u.encrypted_password)) as password_matches
        FROM auth.users u
        JOIN public.profiles p ON p.id = u.id OR LOWER(p.email) = LOWER(u.email)
        WHERE LOWER(u.email) = ${cleanEmail}
        LIMIT 1
      `;

      if (authUserCheck.length > 0 && authUserCheck[0].password_matches) {
        const uId = authUserCheck[0].id;
        // Fix instance_id, aud, role, and identities
        await sql`
          UPDATE auth.users
          SET instance_id = '00000000-0000-0000-0000-000000000000',
              aud = 'authenticated',
              role = 'authenticated',
              email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
              confirmation_token = '',
              recovery_token = '',
              email_change_token_new = '',
              email_change = '',
              phone_change = '',
              phone_change_token = '',
              reauthentication_token = '',
              email_change_token_current = '',
              email_change_confirm_status = 0,
              is_sso_user = false,
              is_anonymous = false,
              raw_app_meta_data = ${sql.json({ provider: 'email', providers: ['email'] })},
              updated_at = NOW()
          WHERE id = ${uId}::uuid
        `;

        const existingIdentities = await sql`
          SELECT id FROM auth.identities WHERE user_id = ${uId}::uuid
        `;
        if (existingIdentities.length === 0) {
          const identityData = {
            sub: uId,
            email: cleanEmail,
            email_verified: true,
            phone_verified: false,
          };
          await sql`
            INSERT INTO auth.identities (
              id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), ${uId}, ${uId}::uuid, ${sql.json(identityData)}, 'email', null, NOW(), NOW()
            )
          `;
        }

        // Retry authentication
        const retry = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (retry.data?.user) {
          data = retry.data;
          error = null;
        }
      }
    }

    if (error || !data?.user) {
      return { success: false, error: error?.message || 'Authentication failed' };
    }

    // Pass data.user directly so we do not hit uncommitted cookies in the same action context
    const festData = await getFestAdminData(data.user);
    return { success: true, data: festData };
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication error' };
  }
}

export async function adminLogoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    // ignore
  }
  return { success: true };
}


// Log action to audit_log
async function logAudit(actorId: string, actorEmail: string, action: string, targetType: string, targetId: string, details: any = {}) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeTargetId = targetId && isUuid.test(targetId) ? targetId : null;
    const safeActorId = actorId && isUuid.test(actorId) ? actorId : null;
    const enrichedDetails = {
      ...(details || {}),
      ...(safeTargetId === null && targetId ? { rawTargetId: targetId } : {}),
      ...(safeActorId === null && actorId ? { rawActorId: actorId } : {})
    };

    if (safeActorId && safeTargetId) {
      await sql`
        INSERT INTO public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
        VALUES (${safeActorId}::uuid, ${actorEmail}, ${action}, ${targetType}, ${safeTargetId}::uuid, ${sql.json(enrichedDetails)})
      `;
    } else if (safeActorId && !safeTargetId) {
      await sql`
        INSERT INTO public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
        VALUES (${safeActorId}::uuid, ${actorEmail}, ${action}, ${targetType}, NULL, ${sql.json(enrichedDetails)})
      `;
    } else if (!safeActorId && safeTargetId) {
      await sql`
        INSERT INTO public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
        VALUES (NULL, ${actorEmail}, ${action}, ${targetType}, ${safeTargetId}::uuid, ${sql.json(enrichedDetails)})
      `;
    } else {
      await sql`
        INSERT INTO public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
        VALUES (NULL, ${actorEmail}, ${action}, ${targetType}, NULL, ${sql.json(enrichedDetails)})
      `;
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// 1. Fetch Complete Admin Data
export async function getAdminData(userOverride?: any) {
  const { user, profile, isMaster } = await requireAdmin(userOverride);

  // Run all independent queries concurrently in a single batch
  const [
    counts,
    participants,
    teams,
    problemStatements,
    announcements,
    statusUpdates,
    eventSettingsRows,
    masterAllowlist,
    admins,
    auditLogs,
  ] = await Promise.all([
    sql`
      SELECT 
        (SELECT COUNT(*) FROM public.profiles)::int as participant_count,
        (SELECT COUNT(*) FROM public.teams)::int as team_count,
        (SELECT COUNT(*) FROM public.submissions)::int as submission_count
    `,
    sql`
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
    `,
    sql`
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
    `,
    sql`SELECT * FROM public.problem_statements ORDER BY created_at DESC`,
    sql`SELECT * FROM public.announcements ORDER BY created_at DESC`,
    sql`
      SELECT su.*, t.name as team_name, p.full_name as author_name
      FROM public.status_updates su
      LEFT JOIN public.teams t ON su.team_id = t.id
      LEFT JOIN public.profiles p ON su.user_id = p.id
      ORDER BY su.created_at DESC LIMIT 50
    `,
    sql`SELECT * FROM public.event_settings WHERE id = 1`,
    isMaster ? sql`SELECT * FROM public.master_allowlist ORDER BY created_at DESC` : Promise.resolve([]),
    sql`
      SELECT id, trainer_id, full_name, email, role::text as role, created_at 
      FROM public.profiles 
      WHERE role::text = 'admin' OR role::text = 'master'
      ORDER BY created_at ASC
    `,
    sql`SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 100`,
  ]);

  const eventSettings = eventSettingsRows[0];

  return {
    currentRole: profile.role,
    userEmail: user.email,
    currentUserId: user.id,
    isMaster,
    metrics: {
      totalParticipants: Number(counts[0]?.participant_count || 0),
      totalTeams: Number(counts[0]?.team_count || 0),
      totalSubmissions: Number(counts[0]?.submission_count || 0),
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
    WHERE id = ${targetId} AND role::text = 'admin'
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
  const { user, isAdmin } = await requireAdmin();

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

  try {
    const userEmail = (user.email || '').toLowerCase().trim();
    await sql`
      INSERT INTO public.master_credentials (email, full_name, role, current_password, updated_at)
      VALUES (${userEmail}, ${user.user_metadata?.full_name || userEmail}, ${isAdmin ? 'admin' : 'coordinator'}, ${cleanPassword}, NOW())
      ON CONFLICT (email) DO UPDATE SET current_password = EXCLUDED.current_password, updated_at = NOW()
    `;
  } catch (e) {}

  await logAudit(user.id, user.email || '', 'CHANGE_ADMIN_PASSWORD', 'auth.users', user.id);
  revalidatePath('/admin');
  return { success: true };
}

// 9. Master / Admin Set or Reset Admin Password
export async function resetAdminPassword(targetUserId: string, customPassword?: string) {
  const { user } = await requireAdminOrManager();

  const appliedPassword = (customPassword && customPassword.trim().length >= 6)
    ? customPassword.trim()
    : 'password@67';

  await sql`
    UPDATE auth.users
    SET encrypted_password = crypt(${appliedPassword}, gen_salt('bf', 10)),
        instance_id = '00000000-0000-0000-0000-000000000000',
        aud = 'authenticated',
        role = 'authenticated',
        updated_at = NOW()
    WHERE id = ${targetUserId}::uuid
  `;

  const targetUserRows = await sql`SELECT email FROM auth.users WHERE id = ${targetUserId}::uuid`;
  const targetEmail = targetUserRows[0]?.email || '';
  if (targetEmail) {
    const existingIdentities = await sql`SELECT id FROM auth.identities WHERE user_id = ${targetUserId}::uuid`;
    if (existingIdentities.length === 0) {
      await sql`
        INSERT INTO auth.identities (
          id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${targetUserId}, ${targetUserId}::uuid, ${sql.json({ sub: targetUserId, email: targetEmail, email_verified: true, phone_verified: false })}, 'email', null, NOW(), NOW()
        )
      `;
    }

    try {
      await sql`
        INSERT INTO public.master_credentials (email, full_name, role, current_password, updated_at)
        VALUES (${targetEmail.toLowerCase().trim()}, 'Admin Officer', 'admin', ${appliedPassword}, NOW())
        ON CONFLICT (email) DO UPDATE SET current_password = EXCLUDED.current_password, updated_at = NOW()
      `;
    } catch (e) {}
  }

  await logAudit(user.id, user.email || '', 'CHANGE_ADMIN_PASSWORD', 'auth.users', targetUserId, {
    email: targetEmail,
    newPassword: appliedPassword
  });
  revalidatePath('/admin');
  return { success: true, newPassword: appliedPassword, email: targetEmail };
}

// 9b. Batch Reset Passwords for All Admins, All Coordinators, All Participants, or All Accounts
export async function adminResetBatchPasswords(
  scope: 'all_admins' | 'all_coordinators' | 'all_staff' | 'all_participants' | 'all_users',
  customPassword?: string
) {
  const { user, isMaster } = await requireAdminOrManager();

  const appliedPassword =
    customPassword && customPassword.trim().length >= 6
      ? customPassword.trim()
      : 'password@67';

  let targetUsers: { id: string; email: string; full_name?: string; role?: string }[] = [];

  if (scope === 'all_admins') {
    const profileAdmins = await sql`
      SELECT id, email, full_name, role::text as role 
      FROM public.profiles 
      WHERE role::text = 'admin' OR role::text = 'master'
    `;
    const authAdmins = await sql`
      SELECT id, email, raw_user_meta_data->>'full_name' as full_name, 'admin' as role
      FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    `;
    const seen = new Set<string>();
    for (const u of [...profileAdmins, ...authAdmins]) {
      const row = u as any;
      if (row.id && row.email && !seen.has(row.id)) {
        seen.add(row.id);
        targetUsers.push({
          id: String(row.id),
          email: String(row.email).toLowerCase().trim(),
          full_name: row.full_name ? String(row.full_name) : undefined,
          role: row.role ? String(row.role) : undefined,
        });
      }
    }
  } else if (scope === 'all_coordinators') {
    const coords = await sql`
      SELECT id, email, full_name, role::text as role 
      FROM public.profiles 
      WHERE role::text = 'coordinator'
    `;
    targetUsers = coords.map((c: any) => ({
      id: String(c.id),
      email: String(c.email).toLowerCase().trim(),
      full_name: c.full_name ? String(c.full_name) : undefined,
      role: c.role ? String(c.role) : undefined,
    }));
  } else if (scope === 'all_staff') {
    const profileStaff = await sql`
      SELECT id, email, full_name, role::text as role 
      FROM public.profiles 
      WHERE role::text = 'admin' OR role::text = 'master' OR role::text = 'coordinator'
    `;
    const seen = new Set<string>();
    for (const u of profileStaff) {
      const row = u as any;
      if (row.id && row.email && !seen.has(row.id)) {
        seen.add(row.id);
        targetUsers.push({
          id: String(row.id),
          email: String(row.email).toLowerCase().trim(),
          full_name: row.full_name ? String(row.full_name) : undefined,
          role: row.role ? String(row.role) : undefined,
        });
      }
    }
  } else if (scope === 'all_participants') {
    if (!isMaster) {
      throw new Error('Forbidden: Only Master Administrators can batch reset participant passwords.');
    }
    const regParticipants = await sql`
      SELECT id, email, full_name
      FROM public.fest_registrations
    `;
    const profileParticipants = await sql`
      SELECT id, email, full_name
      FROM public.profiles
      WHERE role::text = 'participant'
    `;
    const seen = new Set<string>();
    for (const u of [...regParticipants, ...profileParticipants]) {
      const row = u as any;
      const cleanEmail = (row.email || '').toLowerCase().trim();
      if (cleanEmail && !seen.has(cleanEmail)) {
        seen.add(cleanEmail);
        targetUsers.push({
          id: String(row.id),
          email: cleanEmail,
          full_name: row.full_name ? String(row.full_name) : undefined,
          role: 'participant',
        });
      }
    }
  } else if (scope === 'all_users') {
    if (!isMaster) {
      throw new Error('Forbidden: Only Master Administrators can batch reset all account passwords.');
    }
    const allProfiles = await sql`SELECT id, email, full_name, role::text as role FROM public.profiles`;
    const allRegs = await sql`SELECT id, email, full_name FROM public.fest_registrations`;
    const seen = new Set<string>();
    for (const p of allProfiles) {
      const cleanEmail = (p.email || '').toLowerCase().trim();
      if (cleanEmail && !seen.has(cleanEmail)) {
        seen.add(cleanEmail);
        targetUsers.push({
          id: String(p.id),
          email: cleanEmail,
          full_name: p.full_name ? String(p.full_name) : undefined,
          role: p.role || 'user',
        });
      }
    }
    for (const r of allRegs) {
      const cleanEmail = (r.email || '').toLowerCase().trim();
      if (cleanEmail && !seen.has(cleanEmail)) {
        seen.add(cleanEmail);
        targetUsers.push({
          id: String(r.id),
          email: cleanEmail,
          full_name: r.full_name ? String(r.full_name) : undefined,
          role: 'participant',
        });
      }
    }
  }

  if (targetUsers.length === 0) {
    return {
      success: false,
      error: `No accounts found for target scope (${scope}).`,
    };
  }

  for (const tUser of targetUsers) {
    try {
      await sql`
        UPDATE auth.users
        SET encrypted_password = crypt(${appliedPassword}, gen_salt('bf', 10)),
            instance_id = '00000000-0000-0000-0000-000000000000',
            aud = 'authenticated',
            role = 'authenticated',
            updated_at = NOW()
        WHERE LOWER(email) = ${tUser.email} OR id = ${tUser.id}::uuid
      `;
    } catch {}

    try {
      await sql`
        INSERT INTO public.master_credentials (email, full_name, role, current_password, updated_at)
        VALUES (${tUser.email}, ${tUser.full_name || tUser.email}, ${tUser.role || 'user'}, ${appliedPassword}, NOW())
        ON CONFLICT (email) DO UPDATE SET current_password = EXCLUDED.current_password, updated_at = NOW()
      `;
    } catch {}
  }

  await logAudit(
    user.id,
    user.email || '',
    'BATCH_PASSWORD_RESET',
    'auth.users',
    user.id,
    {
      scope,
      newPassword: appliedPassword,
      count: targetUsers.length,
      emails: targetUsers.map((u) => u.email),
    }
  );

  revalidatePath('/admin');
  return {
    success: true,
    newPassword: appliedPassword,
    count: targetUsers.length,
    scope,
    emails: targetUsers.map((u) => u.email),
  };
}

export async function adminResetAllAdminsPassword(customPassword?: string) {
  return adminResetBatchPasswords('all_admins', customPassword);
}

export async function adminResetAllCoordinatorsPassword(customPassword?: string) {
  return adminResetBatchPasswords('all_coordinators', customPassword);
}

export async function adminResetAllParticipantsPassword(customPassword?: string) {
  return adminResetBatchPasswords('all_participants', customPassword);
}

export async function adminResetEveryonePassword(customPassword?: string) {
  return adminResetBatchPasswords('all_users', customPassword);
}

// 9c. Master Reset Password for ANY Individual Account (Admin, Coordinator, or Participant)
export async function masterResetUserPassword(targetEmail: string, customPassword?: string) {
  const { user, isMaster } = await requireAdmin();
  if (!isMaster) {
    throw new Error('Forbidden: Only Master Administrators can change arbitrary user credentials.');
  }

  const cleanEmail = targetEmail.trim().toLowerCase();
  const appliedPassword = (customPassword && customPassword.trim().length >= 6)
    ? customPassword.trim()
    : 'password@67';

  // 1. Update in auth.users
  try {
    await sql`
      UPDATE auth.users
      SET encrypted_password = crypt(${appliedPassword}, gen_salt('bf', 10)),
          updated_at = NOW()
      WHERE LOWER(email) = ${cleanEmail}
    `;
    try {
      const adminClient = createAdminClient();
      const authUser = await sql`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail}`;
      if (authUser.length > 0) {
        await adminClient.auth.admin.updateUserById(authUser[0].id, { password: appliedPassword });
      }
    } catch {}
  } catch (e) {
    console.error('Error updating auth user password:', e);
  }

  // 2. Upsert in public.master_credentials
  try {
    const profile = await sql`SELECT full_name, role::text as role FROM public.profiles WHERE LOWER(email) = ${cleanEmail}`;
    const reg = await sql`SELECT full_name FROM public.fest_registrations WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;
    const fullName = profile[0]?.full_name || reg[0]?.full_name || cleanEmail.split('@')[0];
    const role = profile[0]?.role || (reg.length > 0 ? 'participant' : 'user');

    await sql`
      INSERT INTO public.master_credentials (email, full_name, role, current_password, updated_at)
      VALUES (${cleanEmail}, ${fullName}, ${role}, ${appliedPassword}, NOW())
      ON CONFLICT (email) DO UPDATE SET current_password = EXCLUDED.current_password, updated_at = NOW()
    `;
  } catch (e) {
    console.error('Error upserting master_credentials:', e);
  }

  await logAudit(user.id, user.email || '', 'MASTER_RESET_PASSWORD', 'master_credentials', cleanEmail, { newPassword: appliedPassword });
  revalidatePath('/admin');
  return { success: true, email: cleanEmail, newPassword: appliedPassword };
}

// 10. Master Appoint New Administrator with default password password@67
export async function masterAddAdmin(email: string, fullName: string) {
  const { user, isMaster } = await requireAdmin();
  if (!isMaster) {
    throw new Error('Forbidden: Only Master Administrators can appoint new admin officers.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid administrator email address.');
  }

  const defaultPassword = 'password@67';
  let targetUserId: string | null = null;

  const existing = await sql`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail}`;
  if (existing.length > 0) {
    targetUserId = existing[0].id;
    await sql`
      UPDATE auth.users
      SET encrypted_password = crypt(${defaultPassword}, gen_salt('bf', 10)),
          instance_id = '00000000-0000-0000-0000-000000000000',
          aud = 'authenticated',
          role = 'authenticated',
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          confirmation_token = '',
          recovery_token = '',
          email_change_token_new = '',
          email_change = '',
          phone_change = '',
          phone_change_token = '',
          reauthentication_token = '',
          email_change_token_current = '',
          email_change_confirm_status = 0,
          is_sso_user = false,
          is_anonymous = false,
          raw_app_meta_data = ${sql.json({ provider: 'email', providers: ['email'] })},
          raw_user_meta_data = ${sql.json({ sub: targetUserId, email: cleanEmail, full_name: cleanName, role: 'admin' })},
          updated_at = NOW()
      WHERE id = ${targetUserId}::uuid
    `;
  } else {
    targetUserId = crypto.randomUUID();
    const userMeta = {
      sub: targetUserId,
      email: cleanEmail,
      full_name: cleanName,
      role: 'admin',
    };

    await sql`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change, phone_change,
        phone_change_token, reauthentication_token, email_change_token_current, email_change_confirm_status,
        is_sso_user, is_anonymous, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        ${targetUserId}::uuid,
        'authenticated',
        'authenticated',
        ${cleanEmail},
        crypt(${defaultPassword}, gen_salt('bf', 10)),
        NOW(),
        '', '', '', '', '', '', '', '', 0,
        false, false,
        ${sql.json({ provider: 'email', providers: ['email'] })},
        ${sql.json(userMeta)},
        NOW(),
        NOW()
      )
    `;
  }

  // Ensure entry exists in auth.identities
  const existingIdentities = await sql`
    SELECT id FROM auth.identities WHERE user_id = ${targetUserId}::uuid
  `;
  if (existingIdentities.length === 0) {
    const identityData = {
      sub: targetUserId,
      email: cleanEmail,
      email_verified: true,
      phone_verified: false,
    };
    await sql`
      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${targetUserId}, ${targetUserId}::uuid, ${sql.json(identityData)}, 'email', null, NOW(), NOW()
      )
    `;
  }

  // Upsert into public.profiles with role 'admin'
  await sql`
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (${targetUserId}::uuid, ${cleanEmail}, ${cleanName}, 'admin')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = 'admin'
  `;

  try {
    await sql`
      INSERT INTO public.master_credentials (email, full_name, role, current_password, updated_at)
      VALUES (${cleanEmail}, ${cleanName}, 'admin', ${defaultPassword}, NOW())
      ON CONFLICT (email) DO UPDATE SET current_password = EXCLUDED.current_password, updated_at = NOW()
    `;
  } catch {}

  await logAudit(user.id, user.email || '', 'MASTER_APPOINT_ADMIN', 'profiles', targetUserId as string, {
    appointedEmail: cleanEmail,
    defaultPassword: 'password@67',
  });

  revalidatePath('/admin');
  return { success: true, userId: targetUserId };
}

// 11. Master Revoke Administrator Privileges
export async function masterRemoveAdmin(targetAdminId: string) {
  const { user, isMaster } = await requireAdmin();
  if (!isMaster) {
    throw new Error('Forbidden: Only Master Administrators can revoke admin credentials.');
  }

  const targetRows = await sql`SELECT email FROM public.profiles WHERE id = ${targetAdminId}::uuid`;
  const targetEmail = (targetRows[0]?.email || '').toLowerCase();

  const MASTER_EMAILS = ['ryankeshary@gmail.com', 'shrey.sleeps@gmail.com'];
  if (MASTER_EMAILS.includes(targetEmail)) {
    throw new Error('Action Prohibited: Cannot revoke access for a Master Administrator.');
  }

  // Remove or demote from public.profiles
  await sql`DELETE FROM public.profiles WHERE id = ${targetAdminId}::uuid`;

  // Remove from auth.users
  try {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(targetAdminId);
  } catch (e) {
    await sql`DELETE FROM auth.users WHERE id = ${targetAdminId}::uuid`;
  }

  await logAudit(user.id, user.email || '', 'MASTER_REVOKE_ADMIN', 'profiles', targetAdminId, {
    revokedEmail: targetEmail,
  });

  revalidatePath('/admin');
  return { success: true };
}

// =============================================================================
// COORDINATOR MANAGEMENT (Admins & Managers)
// =============================================================================

export async function adminAddCoordinator(email: string, fullName: string, password?: string) {
  try {
    const { user, profile } = await requireAdminOrManager();

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim() || 'Gate Coordinator';
    const assignedPassword = password?.trim() || 'password@67';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please provide a valid coordinator email address.' };
    }

    const MASTER_EMAILS = ['ryankeshary@gmail.com', 'shrey.sleeps@gmail.com'];
    if (MASTER_EMAILS.includes(cleanEmail)) {
      return { success: false, error: 'Action Prohibited: Cannot alter role of a Master Administrator.' };
    }

    let targetUserId: string | null = null;

    // Check if user already exists in auth.users
    const existingUsers = await sql`
      SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail}
    `;

    if (existingUsers.length > 0) {
      targetUserId = existingUsers[0].id;
      // Update encrypted password and metadata in auth.users
      await sql`
        UPDATE auth.users
        SET encrypted_password = crypt(${assignedPassword}, gen_salt('bf', 10)),
            raw_user_meta_data = jsonb_build_object('full_name', ${cleanName}, 'role', 'coordinator'),
            updated_at = NOW()
        WHERE id = ${targetUserId}::uuid
      `;
      // Ensure entry exists in auth.identities
      const existingIdentities = await sql`
        SELECT id FROM auth.identities WHERE user_id = ${targetUserId}::uuid
      `;
      if (existingIdentities.length === 0) {
        const identityData = {
          sub: targetUserId,
          email: cleanEmail,
          email_verified: true,
          phone_verified: false
        };
        await sql`
          INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${targetUserId}, ${targetUserId}::uuid, ${sql.json(identityData)}, 'email', null, NOW(), NOW()
          )
        `;
      }
    } else {
      // Create new user in auth.users directly via SQL (100% reliable with Supabase auth)
      targetUserId = crypto.randomUUID();
      const userMeta = {
        sub: targetUserId,
        email: cleanEmail,
        full_name: cleanName,
        role: 'coordinator'
      };

      await sql`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          confirmation_token, recovery_token, email_change_token_new, email_change, phone_change,
          phone_change_token, reauthentication_token, email_change_token_current, email_change_confirm_status,
          is_sso_user, is_anonymous, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          ${targetUserId}::uuid,
          'authenticated',
          'authenticated',
          ${cleanEmail},
          crypt(${assignedPassword}, gen_salt('bf', 10)),
          NOW(),
          '', '', '', '', '', '', '', '', 0,
          false, false,
          ${sql.json({ provider: 'email', providers: ['email'] })},
          ${sql.json(userMeta)},
          NOW(),
          NOW()
        )
      `;

      const identityData = {
        sub: targetUserId,
        email: cleanEmail,
        email_verified: true,
        phone_verified: false
      };

      await sql`
        INSERT INTO auth.identities (
          id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${targetUserId}, ${targetUserId}::uuid, ${sql.json(identityData)}, 'email', null, NOW(), NOW()
        )
      `;
    }

    if (!targetUserId) {
      return { success: false, error: 'Failed to resolve coordinator user identifier.' };
    }

    // Upsert into public.profiles with role = 'coordinator'
    await sql`
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (${targetUserId}::uuid, ${cleanEmail}, ${cleanName}, 'coordinator')
      ON CONFLICT (id) DO UPDATE SET
        role = 'coordinator',
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email
    `;

    await sql`
      UPDATE public.profiles
      SET role = 'coordinator', full_name = ${cleanName}
      WHERE LOWER(email) = ${cleanEmail}
    `;

    try {
      await sql`
        INSERT INTO public.master_credentials (email, full_name, role, current_password, updated_at)
        VALUES (${cleanEmail}, ${cleanName}, 'coordinator', ${assignedPassword}, NOW())
        ON CONFLICT (email) DO UPDATE SET current_password = EXCLUDED.current_password, updated_at = NOW()
      `;
    } catch {}

    await logAudit(user.id, user.email || '', 'ADD_COORDINATOR', 'profiles', targetUserId, {
      appointedEmail: cleanEmail,
      appointedName: cleanName,
      appointedByRole: profile.role,
      defaultPassword: assignedPassword,
    });

    revalidatePath('/admin');
    return { success: true, coordinatorId: targetUserId };
  } catch (err: any) {
    console.error('adminAddCoordinator error:', err);
    return { success: false, error: err.message || 'Error configuring coordinator authentication.' };
  }
}

export async function adminRemoveCoordinator(coordinatorId: string) {
  try {
    const { user } = await requireAdminOrManager();

    const targetRows = await sql`
      SELECT id, email, role, full_name FROM public.profiles WHERE id = ${coordinatorId}::uuid
    `;
    if (targetRows.length === 0) {
      return { success: false, error: 'Coordinator profile record not found.' };
    }

    const target = targetRows[0];
    const targetEmail = (target.email || '').toLowerCase().trim();

    const MASTER_EMAILS = ['ryankeshary@gmail.com', 'shrey.sleeps@gmail.com'];
    if (MASTER_EMAILS.includes(targetEmail)) {
      return { success: false, error: 'Action Prohibited: Cannot alter role of Master Administrator.' };
    }

    if (target.role !== 'coordinator') {
      return { success: false, error: 'Action Prohibited: Target user does not hold a coordinator role.' };
    }

    await sql`DELETE FROM public.profiles WHERE id = ${coordinatorId}::uuid`;
    try {
      await sql`DELETE FROM auth.identities WHERE user_id = ${coordinatorId}::uuid`;
    } catch (e) {}
    try {
      await sql`DELETE FROM auth.users WHERE id = ${coordinatorId}::uuid`;
    } catch (e) {}

    await logAudit(user.id, user.email || '', 'REMOVE_COORDINATOR', 'profiles', coordinatorId, {
      removedEmail: targetEmail,
      removedName: target.full_name,
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error('adminRemoveCoordinator error:', err);
    return { success: false, error: err.message || 'Error removing coordinator.' };
  }
}

export async function adminResetCoordinatorPassword(coordinatorId: string, customPassword?: string) {
  try {
    const { user } = await requireAdminOrManager();

    const targetRows = await sql`
      SELECT id, email, role FROM public.profiles WHERE id = ${coordinatorId}::uuid
    `;
    if (targetRows.length === 0) return { success: false, error: 'Coordinator not found.' };
    if (targetRows[0].role !== 'coordinator') return { success: false, error: 'Target user is not a coordinator.' };

    const appliedPassword = (customPassword && customPassword.trim().length >= 6)
      ? customPassword.trim()
      : 'password@67';

    await sql`
      UPDATE auth.users
      SET encrypted_password = crypt(${appliedPassword}, gen_salt('bf', 10)),
          instance_id = '00000000-0000-0000-0000-000000000000',
          aud = 'authenticated',
          role = 'authenticated',
          updated_at = NOW()
      WHERE id = ${coordinatorId}::uuid
    `;

    const targetEmail = targetRows[0].email;
    const existingIdentities = await sql`SELECT id FROM auth.identities WHERE user_id = ${coordinatorId}::uuid`;
    if (existingIdentities.length === 0) {
      await sql`
        INSERT INTO auth.identities (
          id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${coordinatorId}, ${coordinatorId}::uuid, ${sql.json({ sub: coordinatorId, email: targetEmail, email_verified: true, phone_verified: false })}, 'email', null, NOW(), NOW()
        )
      `;
    }

    try {
      await sql`
        INSERT INTO public.master_credentials (email, full_name, role, current_password, updated_at)
        VALUES (${targetEmail.toLowerCase().trim()}, 'Gate Coordinator', 'coordinator', ${appliedPassword}, NOW())
        ON CONFLICT (email) DO UPDATE SET current_password = EXCLUDED.current_password, updated_at = NOW()
      `;
    } catch {}

    await logAudit(user.id, user.email || '', 'CHANGE_COORDINATOR_PASSWORD', 'profiles', coordinatorId, {
      email: targetEmail,
      newPassword: appliedPassword
    });

    return { success: true, newPassword: appliedPassword, email: targetEmail };
  } catch (err: any) {
    console.error('adminResetCoordinatorPassword error:', err);
    return { success: false, error: err.message || 'Error updating coordinator credentials.' };
  }
}

export async function adminCheckInSquad(teamId: string) {
  const { user, isCoordinator } = await requireCoordinatorOrAdmin();
  await sql`UPDATE public.fest_registrations SET status = 'Checked In' WHERE team_id = ${teamId}`;
  await logAudit(user.id, user.email || '', isCoordinator ? 'COORDINATOR_SQUAD_CHECKIN' : 'SQUAD_CHECKIN', 'fest_teams', teamId, { status: 'Checked In' });
  revalidatePath('/admin');
  return { success: true };
}

// =============================================================================
// INDIGO TECH FEST SPECIFIC ADMIN SUITE
// =============================================================================

export async function getFestAdminData(userOverride?: any) {
  const { user, profile, isCoordinator, isMaster } = await requireCoordinatorOrAdmin(userOverride);

  // 1. Coordinators receive strictly the data required for the check-in scanner
  if (isCoordinator) {
    const [registrations, teams, events] = await Promise.all([
      sql`
        SELECT 
          fr.id,
          fr.team_id,
          fr.team_code,
          fr.is_leader,
          fr.full_name,
          fr.email,
          fr.phone,
          fr.college,
          fr.department,
          fr.year_of_study,
          fr.college_id,
          fr.reference_id,
          fr.division,
          fr.roll_no,
          fr.status,
          fr.created_at,
          ft.name as team_name,
          ft.event_ids,
          ft.is_locked,
          ft.is_waitlist
        FROM public.fest_registrations fr
        JOIN public.fest_teams ft ON fr.team_id = ft.id
        ORDER BY fr.created_at DESC
      `,
      sql`SELECT id, code, name, event_ids FROM public.fest_teams ORDER BY created_at DESC`,
      sql`SELECT id, name, day_label, slot_time FROM public.fest_events ORDER BY created_at ASC`,
    ]);

    return {
      currentUser: {
        id: user.id,
        email: user.email,
        role: 'coordinator',
        isMaster: false,
      },
      metrics: {
        totalParticipants: registrations.length,
        totalTeams: teams.length,
        waitlistCount: 0,
        incompleteTeamsCount: 0,
      },
      timelineData: [],
      perEventStats: [],
      registrations,
      teams,
      events,
      announcements: [],
      auditLogs: [],
      adminUsers: [],
      coordinators: [],
    };
  }

  // 2. Administrators, Managers, and Masters receive the full suite including coordinators roster
  const [
    registrations,
    teams,
    events,
    announcements,
    auditLogs,
    adminUsers,
    coordinators,
  ] = await Promise.all([
    sql`
      SELECT 
        fr.id,
        fr.team_id,
        fr.team_code,
        fr.is_leader,
        fr.full_name,
        fr.email,
        fr.phone,
        fr.college,
        fr.department,
        fr.year_of_study,
        fr.college_id,
        fr.reference_id,
        fr.division,
        fr.roll_no,
        fr.status,
        fr.created_at,
        ft.name as team_name,
        ft.event_ids,
        ft.is_locked,
        ft.is_waitlist
      FROM public.fest_registrations fr
      JOIN public.fest_teams ft ON fr.team_id = ft.id
      ORDER BY fr.created_at DESC
    `,
    sql`
      SELECT 
        ft.*,
        (SELECT COUNT(*)::int FROM public.fest_registrations fr WHERE fr.team_id = ft.id) as member_count,
        (SELECT fr.full_name FROM public.fest_registrations fr WHERE fr.team_id = ft.id AND fr.is_leader = true LIMIT 1) as leader_name
      FROM public.fest_teams ft
      ORDER BY ft.created_at DESC
    `,
    sql`SELECT * FROM public.fest_events ORDER BY created_at ASC`,
    sql`SELECT * FROM public.fest_announcements ORDER BY created_at DESC`,
    sql`SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 50`,
    sql`
      SELECT id, email, full_name, role::text as role, created_at
      FROM public.profiles
      WHERE role::text IN ('admin', 'manager', 'master') OR LOWER(email) IN ('ryankeshary@gmail.com', 'shrey.sleeps@gmail.com')
      ORDER BY created_at ASC
    `,
    sql`
      SELECT id, email, full_name, role::text as role, created_at
      FROM public.profiles
      WHERE role::text = 'coordinator'
      ORDER BY created_at DESC
    `,
  ]);

  // Derived metrics
  const totalParticipants = registrations.length;
  const totalTeams = teams.length;
  const waitlistCount = teams.filter((t: any) => t.is_waitlist).length;

  // Incomplete teams: teams with member_count below min_team_size of their events
  const incompleteTeams = teams.filter((t: any) => {
    const teamEventIds: string[] = t.event_ids || [];
    const minRequired = teamEventIds.length > 0
      ? Math.max(...events.filter((e: any) => teamEventIds.includes(e.id)).map((e: any) => e.min_team_size || 1))
      : 1;
    return (t.member_count || 0) < minRequired;
  });

  // Per-event statistics
  const perEventStats = events.map((ev: any) => {
    const teamsInEvent = teams.filter((t: any) => (t.event_ids || []).includes(ev.id));
    const participantsInEvent = registrations.filter((r: any) => (r.event_ids || []).includes(ev.id));
    return {
      id: ev.id,
      name: ev.name,
      day: ev.day_label,
      teamCount: teamsInEvent.length,
      participantCount: participantsInEvent.length,
      capacity: ev.capacity,
      percentage: Math.min(100, Math.round((teamsInEvent.length / (ev.capacity || 50)) * 100)),
      isOpen: ev.is_open,
    };
  });

  // Registrations over time (grouped by day for theme line chart)
  const timelineMap: Record<string, number> = {};
  for (const reg of registrations) {
    const dateStr = new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timelineMap[dateStr] = (timelineMap[dateStr] || 0) + 1;
  }
  const timelineData = Object.entries(timelineMap).map(([date, count]) => ({ date, count }));

  // STRICT PRIVACY: Hide ryankeshary as master/admin from non-master admins
  const userEmail = (user.email || '').toLowerCase();
  const visibleAdminUsers = (adminUsers || []).filter((a: any) => {
    if (a.email?.toLowerCase() === 'ryankeshary@gmail.com') {
      return userEmail === 'ryankeshary@gmail.com' || isMaster;
    }
    return true;
  });

  let masterCredentials: any[] = [];
  if (isMaster) {
    try {
      masterCredentials = await fetchAllMasterCredentials(adminUsers, coordinators, registrations);
    } catch (e) {
      console.error('Failed to fetch master credentials:', e);
    }
  }

  return {
    currentUser: {
      id: user.id,
      email: user.email,
      role: profile.role,
      isMaster,
    },
    metrics: {
      totalParticipants,
      totalTeams,
      waitlistCount,
      incompleteTeamsCount: incompleteTeams.length,
    },
    timelineData,
    perEventStats,
    registrations,
    teams,
    events,
    announcements,
    auditLogs,
    adminUsers: visibleAdminUsers,
    coordinators: coordinators || [],
    masterCredentials,
  };
}

// Universal Master Credentials Sync & Vault Fetcher
export async function fetchAllMasterCredentials(
  adminUsers: any[] = [],
  coordinators: any[] = [],
  registrations: any[] = []
) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.master_credentials (
        email TEXT PRIMARY KEY,
        user_id UUID,
        full_name TEXT,
        role TEXT,
        current_password TEXT NOT NULL DEFAULT 'password@67',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch {}

  const rows = await sql`
    SELECT email, full_name, role, current_password, updated_at
    FROM public.master_credentials
  `;
  const credMap = new Map<string, any>();
  for (const r of rows) {
    credMap.set(r.email.toLowerCase(), r);
  }

  const missingToInsert: Array<{ email: string; full_name: string; role: string; current_password: string }> = [];

  for (const a of adminUsers) {
    const email = (a.email || '').toLowerCase().trim();
    if (!email) continue;
    if (!credMap.has(email)) {
      const item = {
        email,
        full_name: a.full_name || 'Admin Officer',
        role: a.role || 'admin',
        current_password: 'password@67',
      };
      credMap.set(email, item);
      missingToInsert.push(item);
    }
  }

  for (const c of coordinators) {
    const email = (c.email || '').toLowerCase().trim();
    if (!email) continue;
    if (!credMap.has(email)) {
      const item = {
        email,
        full_name: c.full_name || 'Gate Coordinator',
        role: 'coordinator',
        current_password: 'password@67',
      };
      credMap.set(email, item);
      missingToInsert.push(item);
    }
  }

  for (const reg of registrations) {
    const email = (reg.email || '').toLowerCase().trim();
    if (!email) continue;
    if (!credMap.has(email)) {
      const item = {
        email,
        full_name: reg.full_name || 'Participant',
        role: 'participant',
        current_password: 'TrainerPass2026!',
      };
      credMap.set(email, item);
      missingToInsert.push(item);
    }
  }

  if (missingToInsert.length > 0) {
    for (const m of missingToInsert) {
      try {
        await sql`
          INSERT INTO public.master_credentials (email, full_name, role, current_password)
          VALUES (${m.email}, ${m.full_name}, ${m.role}, ${m.current_password})
          ON CONFLICT (email) DO NOTHING
        `;
      } catch {}
    }
  }

  return Array.from(credMap.values());
}

export async function getMasterCredentials() {
  const { isMaster } = await requireAdmin();
  if (!isMaster) {
    throw new Error('Forbidden: Only Master Administrators can access credentials vault.');
  }
  const [adminUsers, coordinators, registrations] = await Promise.all([
    sql`SELECT id, email, full_name, role::text as role FROM public.profiles WHERE role::text IN ('admin', 'manager', 'master') OR LOWER(email) IN ('ryankeshary@gmail.com', 'shrey.sleeps@gmail.com')`,
    sql`SELECT id, email, full_name, role::text as role FROM public.profiles WHERE role::text = 'coordinator'`,
    sql`SELECT id, email, full_name FROM public.fest_registrations`,
  ]);
  return fetchAllMasterCredentials(adminUsers, coordinators, registrations);
}

// Admin Participant Actions
export async function adminUpdateParticipantStatus(id: string, status: string) {
  const { user, isCoordinator } = await requireCoordinatorOrAdmin();
  if (isCoordinator && status !== 'Checked In' && status !== 'Confirmed') {
    throw new Error('Coordinators are strictly authorized to perform attendee check-in.');
  }
  await sql`UPDATE public.fest_registrations SET status = ${status} WHERE id = ${id}`;
  await logAudit(user.id, user.email || '', isCoordinator ? 'COORDINATOR_CHECKIN' : 'UPDATE_PARTICIPANT_STATUS', 'fest_registrations', id, { status });
  revalidatePath('/admin');
  return { success: true };
}

export async function adminUpdateParticipantDetails(id: string, data: {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  yearOfStudy: string;
  collegeId?: string;
  division?: string;
  rollNo?: string;
  referenceId?: string;
  status: string;
}) {
  const { user } = await requireAdmin();
  const refId = data.referenceId || data.collegeId || null;
  await sql`
    UPDATE public.fest_registrations
    SET 
      full_name = ${data.fullName.trim()},
      email = ${data.email.trim().toLowerCase()},
      phone = ${data.phone.trim()},
      college = ${data.college.trim()},
      department = ${data.department.trim()},
      year_of_study = ${data.yearOfStudy.trim()},
      college_id = ${refId ? refId.trim() : null},
      reference_id = ${refId ? refId.trim() : null},
      division = ${data.division ? data.division.trim().toUpperCase() : null},
      roll_no = ${data.rollNo ? data.rollNo.trim() : null},
      status = ${data.status}
    WHERE id = ${id}
  `;
  await logAudit(user.id, user.email || '', 'UPDATE_PARTICIPANT_DETAILS', 'fest_registrations', id, data);
  revalidatePath('/admin');
  return { success: true };
}

export async function adminBulkUpdateStatus(ids: string[], status: string) {
  try {
    const { user, isCoordinator } = await requireCoordinatorOrAdmin();
    if (isCoordinator && status !== 'Checked In' && status !== 'Confirmed') {
      return { success: false, error: 'Coordinators are authorized for attendee check-in only.' };
    }
    await sql`UPDATE public.fest_registrations SET status = ${status} WHERE id = ANY(${ids}::uuid[])`;
    await logAudit(user.id, user.email || '', isCoordinator ? 'COORDINATOR_BULK_CHECKIN' : 'BULK_UPDATE_STATUS', 'fest_registrations', '', { count: ids.length, status });
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error('adminBulkUpdateStatus error:', err);
    return { success: false, error: err.message || 'Failed to update candidate status.' };
  }
}

export async function adminDeleteParticipant(id: string) {
  try {
    const { user, isMaster } = await requireAdmin();
    if (!isMaster) {
      return { success: false, error: 'Action Prohibited: Only Master Administrators can delete registration members.' };
    }

    // 1. Fetch participant record
    const participantRows = await sql`
      SELECT * FROM public.fest_registrations WHERE id = ${id}::uuid
    `;
    if (participantRows.length === 0) {
      return { success: false, error: 'Candidate registration not found.' };
    }

    const participant = participantRows[0];
    const participantEmail = (participant.email || '').trim().toLowerCase();
    const participantPhone = (participant.phone || '').trim();
    const teamId = participant.team_id;
    const isLeader = Boolean(participant.is_leader);

    // Safeguard: Protect master administrators from deletion
    const MASTER_EMAILS = ['ryankeshary@gmail.com', 'shrey.sleeps@gmail.com'];
    if (MASTER_EMAILS.includes(participantEmail)) {
      return { success: false, error: 'Action Prohibited: Cannot delete a Master Administrator record.' };
    }

    // 2. Delete from public.fest_registrations
    await sql`DELETE FROM public.fest_registrations WHERE id = ${id}::uuid`;

    // 3. Handle squad / team integrity
    let teamDeleted = false;
    let newLeaderEmail: string | null = null;
    if (teamId) {
      const remainingMembers = await sql`
        SELECT id, email, full_name, is_leader FROM public.fest_registrations WHERE team_id = ${teamId}::uuid ORDER BY created_at ASC
      `;

      if (remainingMembers.length === 0) {
        // Team has no remaining members, clean up orphan team
        await sql`DELETE FROM public.fest_teams WHERE id = ${teamId}::uuid`;
        teamDeleted = true;
      } else if (isLeader) {
        // Promote first remaining squad member to squad captain
        const nextLeader = remainingMembers[0];
        await sql`UPDATE public.fest_registrations SET is_leader = true WHERE id = ${nextLeader.id}::uuid`;
        await sql`UPDATE public.fest_teams SET leader_email = ${nextLeader.email} WHERE id = ${teamId}::uuid`;
        newLeaderEmail = nextLeader.email;
      }
    }

    // 4. Delete Supabase Auth user & profile records
    let authUserId: string | null = null;
    try {
      const authUserRows = await sql`
        SELECT id FROM auth.users WHERE LOWER(email) = ${participantEmail}
      `;
      if (authUserRows.length > 0) {
        authUserId = authUserRows[0].id;
        try {
          await sql`DELETE FROM auth.identities WHERE user_id = ${authUserId}::uuid`;
        } catch (e) {}
        try {
          await sql`DELETE FROM auth.users WHERE id = ${authUserId}::uuid`;
        } catch (e) {}
      }
    } catch (authErr) {
      console.error('Error deleting auth user:', authErr);
    }

    // 5. Delete profile record
    try {
      if (authUserId) {
        await sql`DELETE FROM public.profiles WHERE id = ${authUserId}::uuid OR LOWER(email) = ${participantEmail}`;
      } else {
        await sql`DELETE FROM public.profiles WHERE LOWER(email) = ${participantEmail}`;
      }
    } catch (profErr) {
      console.error('Error deleting profile:', profErr);
    }

    // 6. Delete legacy tables entries (registrations, team_members)
    try {
      await sql`DELETE FROM public.registrations WHERE LOWER(email) = ${participantEmail}`;
      if (authUserId) {
        await sql`DELETE FROM public.team_members WHERE user_id = ${authUserId}::uuid`;
      }
    } catch (legacyErr) {
      // non-fatal
    }

    // 7. Audit Log
    await logAudit(
      user.id,
      user.email || '',
      'DELETE_PARTICIPANT_PERMANENT',
      'fest_registrations',
      id,
      {
        deletedName: participant.full_name,
        deletedEmail: participantEmail,
        deletedPhone: participantPhone,
        teamId,
        teamCode: participant.team_code,
        teamDeleted,
        promotedLeader: newLeaderEmail,
      }
    );

    // 8. Cache revalidation
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath('/register');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('adminDeleteParticipant error:', err);
    return { success: false, error: err.message || 'Error occurred while deleting candidate.' };
  }
}

export async function adminBulkDeleteParticipants(ids: string[]) {
  try {
    const { user, isMaster } = await requireAdmin();
    if (!isMaster) {
      return { success: false, error: 'Action Prohibited: Only Master Administrators can delete registration members.' };
    }
    if (!ids || ids.length === 0) return { success: true, count: 0 };

    let count = 0;
    for (const id of ids) {
      try {
        const res = await adminDeleteParticipant(id);
        if (res.success) count++;
      } catch (err) {
        console.error(`Failed to delete candidate ${id}:`, err);
      }
    }

    await logAudit(
      user.id,
      user.email || '',
      'BULK_DELETE_PARTICIPANTS',
      'fest_registrations',
      '',
      { requestedCount: ids.length, deletedCount: count }
    );

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath('/register');
    revalidatePath('/');

    return { success: true, count };
  } catch (err: any) {
    console.error('adminBulkDeleteParticipants error:', err);
    return { success: false, error: err.message || 'Error during bulk deletion.' };
  }
}

export async function adminDeleteUserByEmail(email: string) {
  try {
    const { user } = await requireAdmin();
    const cleanEmail = email.trim().toLowerCase();

    const MASTER_EMAILS = ['ryankeshary@gmail.com', 'shrey.sleeps@gmail.com'];
    if (MASTER_EMAILS.includes(cleanEmail)) {
      return { success: false, error: 'Action Prohibited: Cannot delete a Master Administrator record.' };
    }

    // Find all fest registrations for this email
    const regRows = await sql`
      SELECT id FROM public.fest_registrations WHERE LOWER(email) = ${cleanEmail}
    `;
    for (const reg of regRows) {
      await adminDeleteParticipant(reg.id);
    }

    // Clean auth and profiles directly
    const authUserRows = await sql`SELECT id FROM auth.users WHERE LOWER(email) = ${cleanEmail}`;
    const authUserId = authUserRows[0]?.id;
    if (authUserId) {
      try {
        await sql`DELETE FROM auth.identities WHERE user_id = ${authUserId}::uuid`;
      } catch (e) {}
      try {
        await sql`DELETE FROM auth.users WHERE id = ${authUserId}::uuid`;
      } catch (e) {}
      try {
        await sql`DELETE FROM public.profiles WHERE id = ${authUserId}::uuid`;
      } catch (e) {}
    }
    try {
      await sql`DELETE FROM public.profiles WHERE LOWER(email) = ${cleanEmail}`;
      await sql`DELETE FROM public.registrations WHERE LOWER(email) = ${cleanEmail}`;
    } catch (e) {}

    await logAudit(user.id, user.email || '', 'DELETE_USER_BY_EMAIL', 'profiles', '', { email: cleanEmail });

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath('/register');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('adminDeleteUserByEmail error:', err);
    return { success: false, error: err.message || 'Error deleting user by email.' };
  }
}



export async function adminCreateManualParticipant(data: {
  teamId?: string;
  teamCode?: string;
  eventId?: string;
  isLeader: boolean;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  yearOfStudy: string;
  collegeId?: string;
  division?: string;
  rollNo?: string;
  referenceId?: string;
  status: string;
}) {
  const { user } = await requireAdmin();
  const cleanEmail = (data.email || '').trim().toLowerCase();
  const rawPhone = (data.phone || '').trim();
  const phoneDigits = rawPhone.replace(/\D/g, '');
  const phone10 = phoneDigits.slice(-10);
  const cleanRefId = (data.referenceId || data.collegeId || '').trim().toLowerCase();

  let targetTeamId = data.teamId;
  let targetTeamCode = data.teamCode || 'ON-SPOT';
  let targetTeamEvents: string[] = [];

  if (targetTeamId) {
    const targetTeam = await sql`SELECT id, code, event_ids FROM public.fest_teams WHERE id = ${targetTeamId}`;
    if (targetTeam.length === 0) {
      throw new Error('Selected target squad does not exist.');
    }
    targetTeamEvents = targetTeam[0].event_ids || [];
    targetTeamCode = targetTeam[0].code;
  } else {
    const chosenEvent = data.eventId || 'project-exhibition';
    targetTeamEvents = [chosenEvent];
  }

  // Enforce Max 2 Events Rule across all enrollments with multi-factor matching
  const existingRecords = await sql`
    SELECT ft.name as team_name, ft.code as team_code, ft.event_ids
    FROM public.fest_registrations fr
    JOIN public.fest_teams ft ON fr.team_id = ft.id
    WHERE (
      (${cleanEmail} != '' AND LOWER(TRIM(fr.email)) = ${cleanEmail})
      OR (${phone10.length >= 10} AND RIGHT(REGEXP_REPLACE(fr.phone, '\\D', '', 'g'), 10) = ${phone10})
      OR (${cleanRefId} != '' AND (
        LOWER(TRIM(COALESCE(fr.reference_id, ''))) = ${cleanRefId}
        OR LOWER(TRIM(COALESCE(fr.college_id, ''))) = ${cleanRefId}
      ))
    )
  `;

  const enrolledEvents = new Set<string>();
  existingRecords.forEach((r: any) => {
    (r.event_ids || []).forEach((e: string) => enrolledEvents.add(e));
  });

  // 1. Participant is already at maximum limit (2 events)
  if (enrolledEvents.size >= 2) {
    throw new Error(
      `Disqualification Rule: This participant is already enrolled in 2 events (${Array.from(enrolledEvents).join(', ')}). Maximum limit is strictly 2 events (2 means 2).`
    );
  }

  // 2. Prevent enrolling in the exact same event multiple times
  const duplicateEvents = targetTeamEvents.filter((e) => enrolledEvents.has(e));
  if (duplicateEvents.length > 0) {
    throw new Error(
      `Disqualification Rule: Participant is already enrolled in "${duplicateEvents.join(', ')}". Multiple registrations for the same event are not permitted.`
    );
  }

  // 3. Combined total events must never exceed 2
  const combinedEvents = new Set([...enrolledEvents, ...targetTeamEvents]);
  if (combinedEvents.size > 2) {
    throw new Error(
      `Disqualification Rule: Adding ${targetTeamEvents.length} event(s) would result in ${combinedEvents.size} total events (${Array.from(combinedEvents).join(', ')}). A participant can participate in a maximum of 2 events in total (2 means 2).`
    );
  }

  if (!targetTeamId) {
    // Create an on-spot team
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `JRV-${randomSuffix}`;
    const chosenEvent = data.eventId || 'project-exhibition';
    const newTeam = await sql`
      INSERT INTO public.fest_teams (code, name, event_ids, leader_email, leader_token, status)
      VALUES (${code}, ${data.fullName.trim() + ' On-Spot'}, ARRAY[${chosenEvent}], ${cleanEmail}, gen_random_uuid()::text, 'Confirmed')
      RETURNING id, code;
    `;
    targetTeamId = newTeam[0].id;
    targetTeamCode = newTeam[0].code;
  }

  const teamIdToInsert = targetTeamId || '';
  const teamCodeToInsert = targetTeamCode || 'ON-SPOT';
  const refId = data.referenceId || data.collegeId || null;
  const phoneToInsert = phone10.length === 10 ? phone10 : rawPhone;

  await sql`
    INSERT INTO public.fest_registrations (
      team_id, team_code, is_leader, full_name, email, phone, college, department, year_of_study, college_id, reference_id, division, roll_no, status
    ) VALUES (
      ${teamIdToInsert}, ${teamCodeToInsert}, ${Boolean(data.isLeader)}, ${data.fullName.trim()}, ${cleanEmail},
      ${phoneToInsert}, ${data.college.trim()}, ${data.department.trim()}, ${data.yearOfStudy.trim()},
      ${refId ? refId.trim() : null}, ${refId ? refId.trim() : null},
      ${data.division ? data.division.trim().toUpperCase() : null},
      ${data.rollNo ? data.rollNo.trim() : null},
      ${data.status || 'Confirmed'}
    )
  `;

  await logAudit(user.id, user.email || '', 'MANUAL_ON_SPOT_REGISTRATION', 'fest_registrations', teamIdToInsert, data);
  revalidatePath('/admin');
  return { success: true };
}

// Admin Team Actions
export async function adminUpdateTeam(teamId: string, data: {
  name?: string;
  code?: string;
  eventIds?: string[];
  isLocked?: boolean;
  isWaitlist?: boolean;
  status?: string;
}) {
  const { user } = await requireAdmin();
  
  if (data.name) {
    await sql`UPDATE public.fest_teams SET name = ${data.name.trim()} WHERE id = ${teamId}`;
  }
  if (data.code) {
    const cleanCode = data.code.trim().toUpperCase();
    await sql`UPDATE public.fest_teams SET code = ${cleanCode} WHERE id = ${teamId}`;
    await sql`UPDATE public.fest_registrations SET team_code = ${cleanCode} WHERE team_id = ${teamId}`;
  }
  if (data.eventIds) {
    await sql`UPDATE public.fest_teams SET event_ids = ${data.eventIds} WHERE id = ${teamId}`;
  }
  if (typeof data.isLocked === 'boolean') {
    await sql`UPDATE public.fest_teams SET is_locked = ${data.isLocked} WHERE id = ${teamId}`;
  }
  if (typeof data.isWaitlist === 'boolean') {
    await sql`UPDATE public.fest_teams SET is_waitlist = ${data.isWaitlist} WHERE id = ${teamId}`;
  }
  if (data.status) {
    await sql`UPDATE public.fest_teams SET status = ${data.status} WHERE id = ${teamId}`;
  }

  await logAudit(user.id, user.email || '', 'UPDATE_FEST_TEAM', 'fest_teams', teamId, data);
  revalidatePath('/admin');
  return { success: true };
}

export async function adminDeleteTeam(teamId: string) {
  const { user, isMaster } = await requireAdmin();
  if (!isMaster) {
    throw new Error('Action Prohibited: Only Master Administrators can delete team registrations.');
  }
  await sql`UPDATE public.fest_registrations SET team_id = NULL, team_code = NULL WHERE team_id = ${teamId}::uuid`;
  await sql`DELETE FROM public.fest_teams WHERE id = ${teamId}`;
  await logAudit(user.id, user.email || '', 'DELETE_FEST_TEAM', 'fest_teams', teamId);
  revalidatePath('/admin');
  return { success: true };
}

export async function adminChangeTeamLeader(teamId: string, newLeaderId: string) {
  const { user } = await requireAdmin();
  await sql`UPDATE public.fest_registrations SET is_leader = false WHERE team_id = ${teamId}`;
  await sql`UPDATE public.fest_registrations SET is_leader = true WHERE id = ${newLeaderId} AND team_id = ${teamId}`;
  const leaderInfo = await sql`SELECT email FROM public.fest_registrations WHERE id = ${newLeaderId}`;
  if (leaderInfo.length > 0) {
    await sql`UPDATE public.fest_teams SET leader_email = ${leaderInfo[0].email} WHERE id = ${teamId}`;
  }
  await logAudit(user.id, user.email || '', 'CHANGE_TEAM_LEADER', 'fest_teams', teamId, { newLeaderId });
  revalidatePath('/admin');
  return { success: true };
}

export async function adminMoveMember(memberId: string, targetTeamId: string) {
  const { user } = await requireAdmin();
  const target = await sql`SELECT code FROM public.fest_teams WHERE id = ${targetTeamId}`;
  if (target.length === 0) throw new Error('Target squad does not exist.');

  await sql`
    UPDATE public.fest_registrations
    SET team_id = ${targetTeamId}, team_code = ${target[0].code}, is_leader = false
    WHERE id = ${memberId}
  `;

  await logAudit(user.id, user.email || '', 'MOVE_MEMBER', 'fest_registrations', memberId, { targetTeamId, code: target[0].code });
  revalidatePath('/admin');
  return { success: true };
}

// Admin Event Settings Action
export async function adminUpdateEvent(id: string, data: {
  name?: string;
  description?: string;
  day_label?: string;
  slot_time?: string;
  min_team_size?: number;
  max_team_size?: number;
  fee?: string;
  capacity?: number;
  deadline?: string;
  is_open?: boolean;
}) {
  const { user } = await requireAdmin();
  if (data.name !== undefined) await sql`UPDATE public.fest_events SET name = ${data.name} WHERE id = ${id}`;
  if (data.description !== undefined) await sql`UPDATE public.fest_events SET description = ${data.description} WHERE id = ${id}`;
  if (data.day_label !== undefined) await sql`UPDATE public.fest_events SET day_label = ${data.day_label} WHERE id = ${id}`;
  if (data.slot_time !== undefined) await sql`UPDATE public.fest_events SET slot_time = ${data.slot_time} WHERE id = ${id}`;
  if (data.min_team_size !== undefined) await sql`UPDATE public.fest_events SET min_team_size = ${data.min_team_size} WHERE id = ${id}`;
  if (data.max_team_size !== undefined) await sql`UPDATE public.fest_events SET max_team_size = ${data.max_team_size} WHERE id = ${id}`;
  if (data.fee !== undefined) await sql`UPDATE public.fest_events SET fee = ${data.fee} WHERE id = ${id}`;
  if (data.capacity !== undefined) await sql`UPDATE public.fest_events SET capacity = ${data.capacity} WHERE id = ${id}`;
  if (data.deadline !== undefined) await sql`UPDATE public.fest_events SET deadline = ${data.deadline ? data.deadline : null} WHERE id = ${id}`;
  if (data.is_open !== undefined) await sql`UPDATE public.fest_events SET is_open = ${data.is_open} WHERE id = ${id}`;
  await logAudit(user.id, user.email || '', 'UPDATE_FEST_EVENT', 'fest_events', id, data);
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

// Admin Announcements
export async function adminPostFestAnnouncement(title: string, content: string) {
  const { user } = await requireAdmin();
  const res = await sql`
    INSERT INTO public.fest_announcements (title, content, is_active)
    VALUES (${title.trim()}, ${content.trim()}, true)
    RETURNING id, title, content, is_active, created_at
  `;
  try {
    await sql`
      INSERT INTO public.announcements (id, title, content, priority, created_by)
      VALUES (${res[0].id}, ${title.trim()}, ${content.trim()}, 'normal', ${user.id})
    `;
  } catch (e) {
    // non-fatal if table schema differs
  }
  await logAudit(user.id, user.email || '', 'POST_FEST_ANNOUNCEMENT', 'fest_announcements', res[0].id as string, { title });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true, announcement: res[0] };
}

export async function adminDeleteFestAnnouncement(id: string) {
  const { user } = await requireAdmin();
  await sql`DELETE FROM public.fest_announcements WHERE id = ${id}`;
  try {
    await sql`DELETE FROM public.announcements WHERE id = ${id}`;
  } catch (e) {}
  await logAudit(user.id, user.email || '', 'DELETE_FEST_ANNOUNCEMENT', 'fest_announcements', id);
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true, deletedId: id };
}

