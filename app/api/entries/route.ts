import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token and get user
function verifyToken(req: NextRequest): { userId: number; email: string } | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET all entries for current user (secure - only user's own entries)
export async function GET(req: NextRequest) {
  try {
    console.log('[GET /api/entries] Starting request...');
    
    const user = verifyToken(req);
    if (!user) {
      console.error('[GET /api/entries] No valid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GET /api/entries] User ID from token:', user.userId);
    
    const { rows } = await sql`
      SELECT * FROM entries 
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
    `;
    
    console.log('[GET /api/entries] Query successful, rows:', rows.length);

    const entries = rows.map(row => ({
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
      analysis: row.analysis,
      userId: row.user_id,
    }));

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('[GET /api/entries] ERROR:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return NextResponse.json({ 
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}

// POST new entry (secure - saves with authenticated user's ID)
export async function POST(req: NextRequest) {
  try {
    console.log('[POST /api/entries] Starting request...');
    
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const entry = await req.json();
    console.log('[POST /api/entries] Entry data:', {
      id: entry.id,
      userId: user.userId,
      type: entry.analysis?.type
    });
    
    await sql`
      INSERT INTO entries (id, user_id, text, created_at, entry_type, analysis)
      VALUES (
        ${entry.id},
        ${user.userId},
        ${entry.text},
        ${entry.createdAt},
        ${entry.analysis?.type || 'FOOD'},
        ${JSON.stringify(entry.analysis)}
      )
    `;

    console.log('[POST /api/entries] Entry saved successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST /api/entries] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update entry (secure - only updates user's own entries)
export async function PUT(req: NextRequest) {
  try {
    console.log('[PUT /api/entries] Starting request...');
    
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id, ...updateData } = await req.json();
    
    // Verify entry belongs to user
    const checkResult = await sql`SELECT user_id FROM entries WHERE id = ${id}`;
    if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== user.userId) {
      console.error('[PUT /api/entries] Unauthorized update attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await sql`
      UPDATE entries 
      SET 
        text = ${updateData.text},
        created_at = ${updateData.createdAt},
        entry_type = ${updateData.analysis?.type || 'FOOD'},
        analysis = ${JSON.stringify(updateData.analysis)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${user.userId}
    `;

    console.log('[PUT /api/entries] Entry updated successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/entries] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE entry (secure - only deletes user's own entries)
export async function DELETE(req: NextRequest) {
  try {
    console.log('[DELETE /api/entries] Starting request...');
    
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    // Only delete if entry belongs to user
    await sql`DELETE FROM entries WHERE id = ${id} AND user_id = ${user.userId}`;

    console.log('[DELETE /api/entries] Entry deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/entries] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
