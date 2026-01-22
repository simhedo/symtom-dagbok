import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET all entries for current user
export async function GET(req: NextRequest) {
  try {
    const userName = req.headers.get('x-user-name');
    if (!userName) {
      return NextResponse.json({ error: 'User name required' }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT * FROM entries 
      WHERE user_name = ${userName}
      ORDER BY created_at DESC
    `;

    const entries = rows.map(row => ({
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
      analysis: row.analysis,
      userName: row.user_name,
    }));

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('Error getting entries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new entry
export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();
    
    await sql`
      INSERT INTO entries (id, user_name, text, created_at, entry_type, analysis)
      VALUES (
        ${entry.id},
        ${entry.userName},
        ${entry.text},
        ${entry.createdAt},
        ${entry.analysis?.type || 'FOOD'},
        ${JSON.stringify(entry.analysis)}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update entry
export async function PUT(req: NextRequest) {
  try {
    const { id, ...entry } = await req.json();
    
    await sql`
      UPDATE entries 
      SET 
        text = ${entry.text},
        created_at = ${entry.createdAt},
        entry_type = ${entry.analysis?.type || 'FOOD'},
        analysis = ${JSON.stringify(entry.analysis)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE entry
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    await sql`DELETE FROM entries WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
