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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const targetUserId = (formData.get('targetUserId') as string) || user.id;

    if (!file) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
    }

    // Validate MIME type
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Please upload a PNG, JPEG, WEBP, or AVIF image.' },
        { status: 400 }
      );
    }

    // Validate size: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Photo must be less than 5MB.' },
        { status: 400 }
      );
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const ext = ['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(rawExt) ? rawExt : 'png';
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
      return NextResponse.json(
        { error: `Storage error: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    const isSelf = targetUserId === user.id;
    if (!isSelf) {
      const adminCheck = await sql`SELECT public.is_staff() as staff`;
      if (!adminCheck[0]?.staff) {
        return NextResponse.json(
          { error: 'Unauthorized to update another trainer photo.' },
          { status: 403 }
        );
      }
    }

    await sql`
      UPDATE public.profiles
      SET avatar_url = ${publicUrl}, updated_at = NOW()
      WHERE id = ${targetUserId}::uuid
    `;

    revalidatePath('/dashboard');
    revalidatePath('/admin');

    return NextResponse.json({ success: true, avatar_url: publicUrl });
  } catch (err: any) {
    console.error('API avatar upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
