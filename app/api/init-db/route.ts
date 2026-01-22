import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add email and password columns if they don't exist (for existing tables)
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`;
    } catch (e) {
      console.log('Columns might already exist, continuing...');
    }

    // Create entries table
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id VARCHAR(50) PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        entry_type VARCHAR(20) NOT NULL,
        analysis JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_entries_user_name ON entries(user_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error: any) {
    console.error('Database init error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
