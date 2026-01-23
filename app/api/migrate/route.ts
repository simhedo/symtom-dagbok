import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[migrate] Starting FORCED migration...');
    
    // FORCE DROP old entries table
    console.log('[migrate] Dropping old entries table...');
    await sql`DROP TABLE IF EXISTS entries CASCADE`;
    console.log('[migrate] Old table dropped');
    
    // Ensure users table has email and password
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`;
    } catch (e) {
      console.log('[migrate] User columns already exist');
    }
    
    // Create NEW entries table with user_id
    console.log('[migrate] Creating new entries table with user_id...');
    await sql`
      CREATE TABLE entries (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        entry_type VARCHAR(20) NOT NULL,
        analysis JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('[migrate] New table created');
    
    // Create indexes
    await sql`CREATE INDEX idx_entries_created_at ON entries(created_at DESC)`;
    await sql`CREATE INDEX idx_entries_user_id ON entries(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    console.log('[migrate] Indexes created');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration complete! Old entries table dropped, new table with user_id created.',
      warning: 'All old entries have been deleted.'
    });
  } catch (error: any) {
    console.error('[migrate] ERROR:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        detail: error.detail,
        hint: error.hint
      },
      { status: 500 }
    );
  }
}
