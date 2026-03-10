/**
 * In-memory product store for the admin dashboard.
 * In production, replace with a real database (e.g. Prisma + PostgreSQL).
 */

import { NextRequest, NextResponse } from 'next/server';
import { products, Product } from '@/lib/productsStore';

const ADMIN_TOKEN = 'cbrixi-super-admin-token-2026';

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${ADMIN_TOKEN}`;
}

// GET /api/admin/products — list all products
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true, products }, { status: 200 });
}

// POST /api/admin/products — create a new product
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json() as Omit<Product, 'id' | 'createdAt' | 'gradient'>;
    const gradients = [
      'from-blue-500/20 to-purple-500/20',
      'from-purple-500/20 to-pink-500/20',
      'from-cyan-500/20 to-blue-500/20',
      'from-emerald-500/20 to-cyan-500/20',
      'from-orange-500/20 to-red-500/20',
      'from-fuchsia-500/20 to-purple-500/20',
    ];
    const newProduct: Product = {
      ...body,
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    products.push(newProduct);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Bad request.' }, { status: 400 });
  }
}

// DELETE /api/admin/products — delete by id (passed as ?id=xxx)
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }
  products.splice(idx, 1);
  return NextResponse.json({ success: true }, { status: 200 });
}
