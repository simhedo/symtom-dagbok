import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register new user
export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    
    console.log('[POST /api/auth] Register attempt for:', email);
    
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password and name required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await sql`
      INSERT INTO users (name, email, password, created_at)
      VALUES (${name}, ${email}, ${hashedPassword}, CURRENT_TIMESTAMP)
      RETURNING id, name, email
    `;
    
    const user = result.rows[0];
    console.log('[POST /api/auth] User registered successfully:', email);
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    return NextResponse.json({ 
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error: any) {
    console.error('[POST /api/auth] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Login
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    
    console.log('[GET /api/auth] Login attempt for:', email);
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const result = await sql`
      SELECT id, name, email, password 
      FROM users 
      WHERE email = ${email}
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log('[GET /api/auth] Login successful:', email);
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    return NextResponse.json({ 
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error: any) {
    console.error('[GET /api/auth] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
