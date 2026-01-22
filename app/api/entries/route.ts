import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET all entries for current user
export async function GET(req: NextRequest) {
  try {
    console.log('[GET /api/entries] Starting request...');
    
    const userName = req.headers.get('x-user-name');
    console.log('[GET /api/entries] User name from header:', userName);
    
    if (!userName) {
      console.error('[GET /api/entries] No user name provided');
      return NextResponse.json({ error: 'User name required' }, { status: 400 });
    }

    console.log('[GET /api/entries] Executing SQL query...');
    const { rows } = await sql`
      SELECT * FROM entries 
      WHERE user_name = ${userName}
      ORDER BY created_at DESC
    `;
    
    console.log('[GET /api/entries] Query successful, rows:', rows.length);

    const entries = rows.map(row => ({
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
      analysis: row.analysis,
      userName: row.user_name,
    }));

    console.log('[GET /api/entries] Returning', entries.length, 'entries');
    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('[GET /api/entries] ERROR:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      name: error.name,
      fullError: JSON.stringify(error, null, 2)
    });
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}

// POST new entry
export async function POST(req: NextRequest) {
  try {
    console.log('[POST /api/entries] Starting request...');
    
    const entry = await req.json();
    console.log('[POST /api/entries] Entry data:', {
      id: entry.id,
      userName: entry.userName,
      text: entry.text?.substring(0, 50),
      createdAt: entry.createdAt,
      type: entry.analysis?.type
    });
    
    console.log('[POST /api/entries] Executing INSERT...');
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

    console.log('[POST /api/entries] Entry saved successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST /api/entries] ERROR:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      name: error.name,
      fullError: JSON.stringify(error, null, 2)
    });
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}

// PUT update entry
export async function PUT(req: NextRequest) {
  try {
    console.log('[PUT /api/entries] Starting request...');
    
    const { id, ...updateData } = await req.json();
    console.log('[PUT /api/entries] Update data:', {
      id,
      text: updateData.text?.substring(0, 50),
      type: updateData.analysis?.type
    });
    
    console.log('[PUT /api/entries] Executing UPDATE...');
    await sql`
      UPDATE entries 
      SET 
        text = ${updateData.text},
        created_at = ${updateData.createdAt},
        entry_type = ${updateData.analysis?.type || 'FOOD'},
        analysis = ${JSON.stringify(updateData.analysis)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    console.log('[PUT /api/entries] Entry updated successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/entries] ERROR:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      fullError: JSON.stringify(error, null, 2)
    });
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}

// DELETE entry
export async function DELETE(req: NextRequest) {
  try {
    console.log('[DELETE /api/entries] Starting request...');
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('[DELETE /api/entries] Entry ID:', id);
    
    if (!id) {
      console.error('[DELETE /api/entries] No ID provided');
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    console.log('[DELETE /api/entries] Executing DELETE...');
    const result = await sql`DELETE FROM entries WHERE id = ${id}`;

    console.log('[DELETE /api/entries] Entry deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/entries] ERROR:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      fullError: JSON.stringify(error, null, 2)
    });
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}
