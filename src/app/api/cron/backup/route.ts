import { NextResponse } from 'next/server';
import { triggerLiveBackup } from '@/app/actions/backup';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Automated backup schedule is disabled.' },
    { status: 200 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Automated backup schedule is disabled.' },
    { status: 200 }
  );
}
