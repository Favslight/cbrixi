import { NextRequest, NextResponse } from 'next/server';

// ── Hardcoded admin credentials ───────────────────────────────────
const ADMIN_EMAIL    = 'admin@cbrixi.com';
const ADMIN_PASSWORD = 'Cbrixisuperadmin';

// Must match the JWT_SECRET used by the Fastify backend's requireAdmin middleware
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforusers';

// ── Sign a real JWT using the built-in Web Crypto API (no extra packages needed)
async function signJwt(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${body}`),
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${header}.${body}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Sign a real JWT so the Fastify requireAdmin middleware can verify it
      const token = await signJwt(
        { id: 'admin', email: ADMIN_EMAIL, role: 'admin' },
        JWT_SECRET,
      );

      return NextResponse.json(
        {
          success: true,
          token,
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
