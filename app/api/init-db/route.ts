import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[init-db] Starting database initialization...');
    
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
    console.log('[init-db] Users table ready');

    // Add email and password columns if they don't exist
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`;
      console.log('[init-db] Users columns added');
    } catch (e) {
      console.log('[init-db] Users columns already exist');
    }

    // Check if entries table exists with old schema
    const tableCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'entries'
    `;
    
    const columns = tableCheck.rows.map(r => r.column_name);
    const hasOldSchema = columns.includes('user_name') && !columns.includes('user_id');
    
    if (hasOldSchema) {
      console.log('[init-db] OLD SCHEMA DETECTED - Migrating to user_id...');
      
      // Drop old entries table (WARNING: This deletes all data!)
      await sql`DROP TABLE IF EXISTS entries CASCADE`;
      console.log('[init-db] Old entries table dropped');
    }

    // Create entries table with new schema
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        entry_type VARCHAR(20) NOT NULL,
        analysis JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('[init-db] Entries table created with user_id');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    console.log('[init-db] Indexes created');

    // Create plans table (MVP for habit tracking / trials)
    await sql`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        metrics JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status)`;
    console.log('[init-db] Plans table ready');

    // Create plan_habits table
    await sql`
      CREATE TABLE IF NOT EXISTS plan_habits (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        notes TEXT,
        target_per_day INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_plan_habits_plan_id ON plan_habits(plan_id)`;
    console.log('[init-db] Plan habits table ready');

    // Create adherence_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS adherence_logs (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        habit_id INTEGER NOT NULL REFERENCES plan_habits(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        done BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (habit_id, log_date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_adherence_plan_id ON adherence_logs(plan_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_adherence_log_date ON adherence_logs(log_date)`;
    console.log('[init-db] Adherence logs table ready');

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully with secure schema + plans',
      migrated: hasOldSchema
    });
  } catch (error: any) {
    console.error('[init-db] ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message, detail: error.detail },
      { status: 500 }
    );
  }
}
