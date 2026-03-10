/**
 * src/app/api/admin/login/route.ts
 *
 * Next.js Route Handler — mirrors `adminLoginHandler` from lib/adminRoutes.ts.
 * This is the real endpoint the frontend calls: POST /api/admin/login
 *
 * Relationship to Fastify adminRoutes:
 *   Fastify: app.post("/admin/login", adminLoginHandler)  → port 4000
 *   Next.js: POST /api/admin/login  (this file)          → same host as UI
 *
 * The login logic is identical in both.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Hardcoded admin credentials ──────────────────────────────────
const ADMIN_EMAIL    = 'admin@cbrixi.com';
const ADMIN_PASSWORD = 'Cbrixisuperadmin';
// In production, replace with a JWT signed with a secret key.
const ADMIN_TOKEN    = 'cbrixi-super-admin-token-2026';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: true,
          token: ADMIN_TOKEN,
          admin: { email: ADMIN_EMAIL, name: 'CBRIXI Admin' },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Invalid admin credentials.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Bad request.' },
      { status: 400 }
    );
  }
}
