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

// GET /api/plans - list user's plans with habits (active first)
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plansResult = await sql`
    SELECT * FROM plans WHERE user_id = ${user.userId} ORDER BY status DESC, start_date DESC
  `;

  let habitsByPlan: Record<number, any[]> = {};
  if (plansResult.rows.length) {
    const habitsResult = await sql`
      SELECT h.* FROM plan_habits h
      JOIN plans p ON p.id = h.plan_id
      WHERE p.user_id = ${user.userId}
    `;
    habitsByPlan = habitsResult.rows.reduce((acc: Record<number, any[]>, h: any) => {
      acc[h.plan_id] = acc[h.plan_id] || [];
      acc[h.plan_id].push({ id: h.id, name: h.name, notes: h.notes, targetPerDay: h.target_per_day });
      return acc;
    }, {});
  }

  const payload = plansResult.rows.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    startDate: p.start_date,
    endDate: p.end_date,
    status: p.status,
    habits: habitsByPlan[p.id] || []
  }));

  return NextResponse.json(payload);
}

// POST /api/plans - create plan with habits
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, startDate, endDate, habits } = body as {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    habits: { name: string; notes?: string; targetPerDay?: number }[];
  };

  if (!title || !startDate) {
    return NextResponse.json({ error: 'Missing title or startDate' }, { status: 400 });
  }

  const planResult = await sql`
    INSERT INTO plans (user_id, title, description, start_date, end_date, status)
    VALUES (${user.userId}, ${title}, ${description || null}, ${startDate}, ${endDate || null}, 'active')
    RETURNING id
  `;
  const planId = planResult.rows[0].id as number;

  if (Array.isArray(habits) && habits.length) {
    for (const h of habits) {
      await sql`
        INSERT INTO plan_habits (plan_id, name, notes, target_per_day)
        VALUES (${planId}, ${h.name}, ${h.notes || null}, ${h.targetPerDay || 1})
      `;
    }
  }

  return NextResponse.json({ success: true, planId });
}

// PUT /api/plans - update status or details
export async function PUT(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, title, description, startDate, endDate, status } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // ensure plan belongs to user
  const check = await sql`SELECT user_id FROM plans WHERE id = ${id}`;
  if (!check.rows.length || check.rows[0].user_id !== user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await sql`
    UPDATE plans SET
      title = ${title ?? check.rows[0].title},
      description = ${description ?? null},
      start_date = ${startDate ?? check.rows[0].start_date},
      end_date = ${endDate ?? null},
      status = ${status ?? check.rows[0].status}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}

// DELETE /api/plans?id=123
export async function DELETE(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await sql`DELETE FROM plans WHERE id = ${id} AND user_id = ${user.userId}`;
  return NextResponse.json({ success: true });
}
