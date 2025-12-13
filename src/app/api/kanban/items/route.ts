import { NextRequest, NextResponse } from 'next/server';
import { waitForEventStore } from '@/lib/db/event-store';
import { queryInitiativeItemsKanbanBoard } from '@/lib/domain/unified-kanban/projection/kanban-initiative-item-projection';
import { resolveCompanyId } from '../_shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await waitForEventStore();

  const companyId = await resolveCompanyId(request.nextUrl.searchParams);
  const board = queryInitiativeItemsKanbanBoard({ companyId });

  return NextResponse.json(board);
}
