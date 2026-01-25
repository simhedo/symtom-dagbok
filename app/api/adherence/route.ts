import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(req: NextRequest): { userId: number; email: string } | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch {
    return null;
  }
}

// POST /api/adherence - log a habit done/not done for a date
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, habitId, date, done } = await req.json() as { planId: number; habitId: number; date: string; done: boolean };

  // verify plan belongs to user
  const planCheck = await sql`SELECT user_id FROM plans WHERE id = ${planId}`;
  if (!planCheck.rows.length || planCheck.rows[0].user_id !== user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await sql`
    INSERT INTO adherence_logs (plan_id, habit_id, log_date, done)
    VALUES (${planId}, ${habitId}, ${date}, ${done})
    ON CONFLICT (habit_id, log_date)
    DO UPDATE SET done = EXCLUDED.done
  `;

  return NextResponse.json({ success: true });
}

// GET /api/adherence?planId=123&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const planId = Number(searchParams.get('planId'));
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!planId || !from || !to) {
    return NextResponse.json({ error: 'Missing planId/from/to' }, { status: 400 });
  }

  const planCheck = await sql`SELECT user_id FROM plans WHERE id = ${planId}`;
  if (!planCheck.rows.length || planCheck.rows[0].user_id !== user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { rows } = await sql`
    SELECT habit_id, log_date, done FROM adherence_logs
    WHERE plan_id = ${planId} AND log_date BETWEEN ${from} AND ${to}
    ORDER BY log_date ASC
  `;

  return NextResponse.json(rows.map(r => ({ habitId: r.habit_id, date: r.log_date, done: r.done })));
}
