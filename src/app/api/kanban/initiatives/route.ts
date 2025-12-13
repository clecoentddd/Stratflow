import { NextRequest, NextResponse } from 'next/server';
import { waitForEventStore } from '@/lib/db/event-store';
import { queryInitiativesKanbanBoard } from '@/lib/domain/unified-kanban/projection/kanban-initiatives-projection';
import { resolveCompanyId } from '../_shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await waitForEventStore();

  const companyId = await resolveCompanyId(request.nextUrl.searchParams);
  const board = queryInitiativesKanbanBoard({ companyId });

  return NextResponse.json(board);
}
