/**
 * Public API for products — accessible without authentication.
 * Returns all products for display on the marketplace.
 */

import { NextRequest, NextResponse } from 'next/server';

// Import the products array from the shared store
import { products } from '@/lib/productsStore';

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, products }, { status: 200 });
}