import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[GET /api/health] Starting health check...');
    
    // Check database connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('[GET /api/health] Database connection OK, time:', result.rows[0].current_time);
    
    // Check if tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'entries')
    `;
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log('[GET /api/health] Existing tables:', existingTables);
    
    // Count entries
    let entryCount = 0;
    if (existingTables.includes('entries')) {
      const countResult = await sql`SELECT COUNT(*) as count FROM entries`;
      entryCount = parseInt(countResult.rows[0].count);
      console.log('[GET /api/health] Total entries:', entryCount);
    }
    
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tables: existingTables,
        tablesExpected: ['users', 'entries'],
        tablesOk: existingTables.length === 2,
        entryCount
      },
      environment: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        nodeEnv: process.env.NODE_ENV
      }
    };
    
    console.log('[GET /api/health] Health check complete:', status);
    
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('[GET /api/health] ERROR:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      fullError: JSON.stringify(error, null, 2)
    });
    
    return NextResponse.json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail
      },
      environment: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
