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
import { buildBoardMetadata } from './kanban-board-helpers';

type ItemRecord = ReturnType<typeof queryItems>[number];
type InitiativeRecord = ReturnType<typeof queryEligibleInitiatives>[number];
type NormalizedItem = {
  elementId: string;
  item: ItemRecord;
  initiative?: InitiativeRecord;
  entry?: KanbanProjectionEntry;
  normalizedStepKey: string;
};

function resolveTimestamp(value?: string | null): string {
  if (value) return value;
  return new Date(0).toISOString();
}

const initiativeItemProjection: KanbanProjection = {};
const initiativeItemMoveTable: any[] = [];

function populateItemMetadata(elementId: string) {
  const entry = initiativeItemProjection[elementId];
  if (!entry) return;

  const normalizedId = elementId.startsWith('item-') ? elementId : `item-${elementId}`;
  const items = queryItems();
  const item = items.find(candidate => {
    const candidateId = candidate.id?.startsWith?.('item-') ? candidate.id : `item-${candidate.id}`;
    return candidateId === normalizedId;
  });

  if (item) {
    if (!entry.name) entry.name = item.text || `Item ${normalizedId}`;
    if (!entry.teamId && item.teamId) entry.teamId = item.teamId;
  }
}

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
    if (!initiativeItemProjection[elementId].name) populateItemMetadata(elementId);
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
    populateItemMetadata(elementId);
    console.log('[KANBAN ITEMS PROJECTION] Fallback entry created:', JSON.stringify(initiativeItemProjection[elementId], null, 2));
  }
});

export function queryInitiativeItemsKanbanBoard(params: { companyId?: string }): KanbanBoardData {
  const columns = ITEM_COLUMNS;
  const metadata = buildBoardMetadata('Initiative Items');
  const { companyId } = params;

  console.log('DEBUG_KNB queryInitiativeItemsKanbanBoard:start', {
    companyId,
  });

  if (!companyId) {
    console.log('DEBUG_KNB queryInitiativeItemsKanbanBoard:missingCompany', {
      companyId,
    });
    return { columns, swimlanes: [], elements: [], metadata };
  }

  const projection = getKanbanInitiativeItemProjection();
  const rawItems = queryItems({ companyId });
  const initiatives = queryEligibleInitiatives({ companyId });
  const initiativeLookup = new Map<string, InitiativeRecord>(initiatives.map(initiative => [initiative.id, initiative]));

  const normalizedItems = rawItems.reduce<NormalizedItem[]>((acc, item) => {
    const elementId = item.id?.startsWith?.('item-') ? item.id : `item-${item.id}`;
    if (!elementId) return acc;

    const projectionEntry = projection[elementId] || (item.id ? projection[item.id] : undefined);
    const initiative = item.initiativeId ? initiativeLookup.get(item.initiativeId) : undefined;

    acc.push({
      elementId,
      item,
      initiative,
      entry: projectionEntry,
      normalizedStepKey: (item.stepKey || '')
        .toString()
        .toLowerCase()
        .replace(/[^a-z]/g, ''),
    });
    return acc;
  }, []);

  const sortedEntries = [...normalizedItems].sort((a, b) => {
    if (a.normalizedStepKey === b.normalizedStepKey) {
      return (a.item.text || '').localeCompare(b.item.text || '');
    }
    if (!a.normalizedStepKey) return 1;
    if (!b.normalizedStepKey) return -1;
    return a.normalizedStepKey.localeCompare(b.normalizedStepKey);
  });

  const swimlaneInitiativeIds = new Set(sortedEntries.map(entry => entry.item.initiativeId).filter(Boolean));
  const swimlanes = Array.from(swimlaneInitiativeIds)
    .map(id => (id ? initiativeLookup.get(id) : undefined))
    .filter((initiative): initiative is any => Boolean(initiative))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .map(initiative => ({
      id: initiative.id,
      title: initiative.name || 'Untitled Initiative',
      color: '#e2e8f0',
      teamId: initiative.teamId,
      teamName: initiative.teamName,
      teamLevel: initiative.teamLevel,
      state: initiative.status,
      parentId: initiative.strategyId,
      parentTitle: initiative.strategyName,
      parentState: initiative.strategyState,
    }));

  const elements: EnrichedKanbanElement[] = sortedEntries.map(({ elementId, entry, item, initiative, normalizedStepKey }) => {
    const tags = normalizedStepKey ? [normalizedStepKey] : [];
    const status = entry?.status ?? 'NEW';

    return {
      id: elementId,
      type: 'initiative-item',
      status,
      title: item.text || entry?.name || 'Untitled Item',
      swimlaneId: item.initiativeId,
      description: initiative?.name,
      tags,
      metadata: {
        initiativeId: item.initiativeId,
        initiativeName: initiative?.name,
        strategyId: item.strategyId,
        strategyName: initiative?.strategyName,
        strategyState: initiative?.strategyState,
        itemId: item.id,
        stepKey: item.stepKey,
        teamId: entry?.teamId || item.teamId || initiative?.teamId,
        teamName: initiative?.teamName,
        teamLevel: initiative?.teamLevel,
        createdAt: entry?.addedAt ?? resolveTimestamp((item as any)?.createdAt),
        updatedAt: entry?.updatedAt ?? resolveTimestamp((item as any)?.updatedAt),
      },
    } satisfies EnrichedKanbanElement;
  });

  console.log('DEBUG_KNB queryInitiativeItemsKanbanBoard:data', {
    companyId,
    projectionSize: Object.keys(projection).length,
    matchedEntries: sortedEntries.length,
    catalogItems: rawItems.length,
    catalogInitiatives: initiatives.length,
    swimlanes: swimlanes.length,
  });

  console.log('DEBUG_KNB queryInitiativeItemsKanbanBoard:result', {
    companyId,
    elements: elements.length,
    projectionSize: Object.keys(projection).length,
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
    if (event.type === 'ElementMoved' && event.payload?.elementType === 'initiative-item') {
      const { elementId, toStatus } = event.payload;
      if (elementId && toStatus && initiativeItemProjection[elementId]) {
        const prevStatus = initiativeItemProjection[elementId].status;
        initiativeItemProjection[elementId].status = toStatus;
        initiativeItemProjection[elementId].updatedAt = event.timestamp;
        if (!initiativeItemProjection[elementId].name) populateItemMetadata(elementId);
        console.log('[KANBAN ITEMS PROJECTION] [REPLAY] Moved element:', elementId, prevStatus, '->', toStatus);
      } else {
        console.warn('[KANBAN ITEMS PROJECTION] [REPLAY] Missing element for move:', elementId);
      }
    }
  }

  console.log('[KANBAN ITEMS PROJECTION] Rebuild complete. Entries:', Object.keys(initiativeItemProjection).length);
}
