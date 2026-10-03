import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check submission deadline
    const settingsRows = await sql`SELECT deadline FROM public.event_settings WHERE id = 1`;
    if (settingsRows.length > 0) {
      const deadline = new Date(settingsRows[0].deadline);
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'Submission deadline has passed. Submissions are locked.' },
          { status: 403 }
        );
      }
    }

    // Get user's team
    const memberRows = await sql`SELECT team_id FROM public.team_members WHERE user_id = ${user.id}`;
    if (memberRows.length === 0) {
      return NextResponse.json(
        { error: 'You must be in a team to submit.' },
        { status: 400 }
      );
    }
    const teamId = memberRows[0].team_id;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Enforce 50MB max limit
    if (file.size > 52428800) {
      return NextResponse.json(
        { error: 'File size exceeds the 50MB hackathon limit.' },
        { status: 400 }
      );
    }

    const rawFileName = file.name || 'submission.pdf';
    const ext = rawFileName.split('.').pop()?.toLowerCase();
    if (!['pdf', 'ppt', 'pptx'].includes(ext || '')) {
      return NextResponse.json(
        { error: 'Only PDF, PPT, or PPTX presentation decks are accepted.' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: `Storage error: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Insert or update submission record
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

    // Status update log
    await sql`
      INSERT INTO public.status_updates (team_id, user_id, title, message, status)
      VALUES (${teamId}, ${user.id}, 'Submission Deck Uploaded', ${'Version ' + finalVersion + ' (' + cleanFileName + ') submitted successfully.'}, 'success')
    `;

    revalidatePath('/dashboard');
    revalidatePath('/admin');

    return NextResponse.json({ success: true, version: finalVersion });
  } catch (err: any) {
    console.error('API submission upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
