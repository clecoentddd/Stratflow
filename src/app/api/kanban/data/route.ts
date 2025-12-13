import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    error: 'Legacy endpoint. Use /api/kanban/initiatives or /api/kanban/items.',
  }, { status: 410 });
}