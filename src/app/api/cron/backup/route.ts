import { NextResponse } from 'next/server';
import { triggerLiveBackup } from '@/app/actions/backup';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await triggerLiveBackup();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST() {
  const result = await triggerLiveBackup();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
