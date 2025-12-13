import { registerProjectionHandler } from '@/lib/db/event-store';
import {
  queryItems,
  queryEligibleInitiatives,
} from '@/lib/domain/initiatives-catalog/projection';
import type {
  EnrichedKanbanElement,
  KanbanBoardData,
  KanbanColumnDefinition,
  KanbanProjection,
  KanbanProjectionEntry,
} from '../types';
import {
  ACTIVE_STRATEGY_STATES,
  buildBoardMetadata,
  buildStrategySwimlanes,
} from './kanban-board-helpers';

const initiativeItemProjection: KanbanProjection = {};
const initiativeItemMoveTable: any[] = [];

const ITEM_COLUMNS: KanbanColumnDefinition[] = [
  { id: 'new', status: 'NEW', title: 'New', description: 'Recently created' },
  { id: 'in_progress', status: 'IN_PROGRESS', title: 'In Progress', description: 'Getting a sense of moving' },
  { id: 'done', status: 'DONE', title: 'Done', description: 'Completed' },
];

registerProjectionHandler('ElementMoved', (event: any) => {
  if (event.type !== 'ElementMoved') return;
  if (event.payload?.elementType !== 'initiative-item') return;

  const { elementId, toStatus, elementType } = event.payload;

  console.log('[KANBAN ITEMS PROJECTION] Processing ElementMoved event:', {
    aggregateId: event.aggregateId,
    elementId,
    fromStatus: initiativeItemProjection[elementId]?.status,
    toStatus,
    timestamp: event.timestamp,
  });

  const existing = initiativeItemProjection[elementId];
  console.log('[KANBAN ITEMS PROJECTION] Current snapshot before move:', {
    elementId,
    existing: existing || null,
  });

  if (existing) {
    const prevStatus = existing.status;
    initiativeItemProjection[elementId].status = toStatus;
    initiativeItemProjection[elementId].updatedAt = event.timestamp;
    console.log('[KANBAN ITEMS PROJECTION] Updated element status:', { elementId, prevStatus, toStatus });
    console.log('[KANBAN ITEMS PROJECTION] Projection after move:', JSON.stringify(initiativeItemProjection[elementId], null, 2));

    initiativeItemMoveTable.push({
      elementId,
      fromStatus: prevStatus,
      toStatus,
      elementType,
      movedAt: event.timestamp,
    });
    console.log('[KANBAN ITEMS PROJECTION] Mock DB INSERT (initiativeItemMoveTable):', initiativeItemMoveTable[initiativeItemMoveTable.length - 1]);
  } else {
    console.warn('[KANBAN ITEMS PROJECTION] Element not found, creating fallback entry:', elementId);
    initiativeItemProjection[elementId] = {
      type: elementType,
      status: toStatus,
      boardId: event.metadata?.boardId,
      teamId: event.metadata?.teamId,
      addedAt: event.metadata?.addedAt || event.timestamp,
      updatedAt: event.timestamp,
    };
    console.log('[KANBAN ITEMS PROJECTION] Fallback entry created:', JSON.stringify(initiativeItemProjection[elementId], null, 2));
  }
});

registerProjectionHandler('InitiativeItemAddedToKanban', (event: any) => {
  if (event.type !== 'InitiativeItemAddedToKanban') return;

  const { itemId, initiativeId, initialStatus, boardId } = event.payload ?? {};
  if (!itemId) {
    console.warn('[KANBAN ITEMS PROJECTION] Missing itemId in event payload');
    return;
  }

  const teamId = event.metadata?.teamId;
  const elementId = itemId.startsWith('item-') ? itemId : `item-${itemId}`;

  initiativeItemProjection[elementId] = {
    type: 'initiative-item',
    status: initialStatus,
    boardId,
    addedAt: event.timestamp,
    updatedAt: event.timestamp,
    teamId,
  };

  console.log('[KANBAN ITEMS PROJECTION] Added element to projection:', { elementId, itemId, initiativeId, initialStatus, teamId });
});

export function queryInitiativeItemsKanbanBoard(params: { companyId?: string }): KanbanBoardData {
  const columns = ITEM_COLUMNS;
  const metadata = buildBoardMetadata('Initiative Items');
  const { companyId } = params;

  if (!companyId) {
    return { columns, swimlanes: [], elements: [], metadata };
  }

  const swimlanes = buildStrategySwimlanes(companyId);
  const projection = getKanbanInitiativeItemProjection();
  const initiatives = queryEligibleInitiatives({ companyId });
  const initiativeLookup = new Map(initiatives.map(initiative => [initiative.id, initiative]));
  const items = queryItems({ strategyStates: ACTIVE_STRATEGY_STATES, companyId });

  const elements: EnrichedKanbanElement[] = items.map(item => {
    const elementId = item.id?.startsWith?.('item-') ? item.id : `item-${item.id}`;
    const projectionEntry = projection[elementId] || projection[item.id];
    const initiative = item.initiativeId ? initiativeLookup.get(item.initiativeId) : undefined;

    return {
      id: elementId,
      type: 'initiative-item',
      status: projectionEntry?.status || mapItemStatusToColumn(item.status),
      title: item.text,
      swimlaneId: item.strategyId,
      description: initiative?.name,
      tags: [] as string[],
      metadata: {
        itemId: item.id,
        initiativeId: item.initiativeId,
        strategyId: item.strategyId,
        stepKey: item.stepKey,
        teamId: projectionEntry?.teamId || item.teamId,
        teamName: initiative?.teamName,
        teamLevel: initiative?.teamLevel,
        strategyName: initiative?.strategyName,
        strategyState: initiative?.strategyState,
      },
    } satisfies EnrichedKanbanElement;
  });

  return {
    columns,
    swimlanes,
    elements,
    metadata,
  };
}

export function getKanbanInitiativeItemProjection(): KanbanProjection {
  return { ...initiativeItemProjection };
}

export function getInitiativeItemStatus(elementId: string): KanbanProjectionEntry | undefined {
  return initiativeItemProjection[elementId];
}

export function getInitiativeItemsByBoard(boardId?: string): KanbanProjection {
  if (!boardId) return getKanbanInitiativeItemProjection();

  const filtered: KanbanProjection = {};
  for (const [elementId, entry] of Object.entries(initiativeItemProjection)) {
    if (entry.boardId === boardId) {
      filtered[elementId] = entry;
    }
  }
  return filtered;
}

export function getInitiativeItemsByTeam(teamId: string): KanbanProjection {
  const filtered: KanbanProjection = {};
  for (const [elementId, entry] of Object.entries(initiativeItemProjection)) {
    if (entry.teamId === teamId) {
      filtered[elementId] = entry;
    }
  }
  return filtered;
}

export async function rebuildKanbanInitiativeItemProjection(): Promise<void> {
  console.log('[KANBAN ITEMS PROJECTION] Rebuilding initiative-item projection');

  Object.keys(initiativeItemProjection).forEach(key => delete initiativeItemProjection[key]);

  const { _getAllEvents } = await import('@/lib/db/event-store');
  const allEvents = await _getAllEvents();

  console.log('[KANBAN ITEMS PROJECTION] Replaying events:', allEvents.length);
  for (const event of allEvents) {
    if (event.type === 'InitiativeItemAddedToKanban') {
      const { itemId, initiativeId, initialStatus, boardId } = event.payload ?? {};
      if (!itemId) {
        console.warn('[KANBAN ITEMS PROJECTION] [REPLAY] Missing itemId in event payload');
        continue;
      }
      const teamId = event.metadata?.teamId;
      const elementId = itemId.startsWith('item-') ? itemId : `item-${itemId}`;
      initiativeItemProjection[elementId] = {
        type: 'initiative-item',
        status: initialStatus,
        boardId,
        teamId,
        addedAt: event.timestamp,
        updatedAt: event.timestamp,
      };
      console.log('[KANBAN ITEMS PROJECTION] [REPLAY] Added element:', elementId, initialStatus, 'initiativeId:', initiativeId);
    }
    if (event.type === 'ElementMoved' && event.payload?.elementType === 'initiative-item') {
      const { elementId, toStatus } = event.payload;
      if (elementId && toStatus && initiativeItemProjection[elementId]) {
        const prevStatus = initiativeItemProjection[elementId].status;
        initiativeItemProjection[elementId].status = toStatus;
        initiativeItemProjection[elementId].updatedAt = event.timestamp;
        console.log('[KANBAN ITEMS PROJECTION] [REPLAY] Moved element:', elementId, prevStatus, '->', toStatus);
      } else {
        console.warn('[KANBAN ITEMS PROJECTION] [REPLAY] Missing element for move:', elementId);
      }
    }
  }

  console.log('[KANBAN ITEMS PROJECTION] Rebuild complete. Entries:', Object.keys(initiativeItemProjection).length);
}

function mapItemStatusToColumn(status: string): string {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'todo':
      return 'NEW';
    case 'doing':
      return 'IN_PROGRESS';
    case 'done':
      return 'DONE';
    default:
      return status ? status.toUpperCase() : 'NEW';
  }
}
