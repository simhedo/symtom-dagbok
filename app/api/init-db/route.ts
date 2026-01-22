import { NextResponse } from 'next/server';
import { initDb } from '@/lib/storage-postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error: any) {
    console.error('Database init error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
