import { registerProjectionHandler } from '@/lib/db/event-store';
import { queryEligibleInitiatives } from '@/lib/domain/initiatives-catalog/projection';
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

const initiativeProjection: KanbanProjection = {};
const initiativeMoveTable: any[] = [];

const INITIATIVE_COLUMNS: KanbanColumnDefinition[] = [
  { id: 'new', status: 'NEW', title: 'New', description: 'Use the radar as input' },
  { id: 'diagnosis', status: 'Diagnosis', title: 'Diagnosis', description: 'What is the challenge?', color: '#F3E8FF' },
  { id: 'overall_approach', status: 'Overall Approach', title: 'Overall Approach', description: 'How do we deal with it?', color: '#F3E8FF' },
  { id: 'coherent_actions', status: 'Coherent Actions', title: 'Coherent Actions', description: 'What steps do we take?', color: '#F3E8FF' },
  { id: 'proximate_objectives', status: 'Proximate Objectives', title: 'Proximate Objectives', description: 'What are the targets?', color: '#F3E8FF' },
  { id: 'decide', status: 'Decide', title: 'Decide', description: 'Commit to the strategy' },
  { id: 'active', status: 'Active', title: 'In Progress', description: 'Getting a sense of moving' },
  { id: 'closed', status: 'Closed', title: 'Completed', description: 'Successfully finished' },
];

registerProjectionHandler('ElementMoved', (event: any) => {
  if (event.type !== 'ElementMoved') return;
  if (event.payload?.elementType !== 'initiative') return;

  const { elementId, toStatus, elementType } = event.payload;

  console.log('[KANBAN INITIATIVES PROJECTION] Processing ElementMoved event:', {
    aggregateId: event.aggregateId,
    elementId,
    fromStatus: initiativeProjection[elementId]?.status,
    toStatus,
    timestamp: event.timestamp,
  });

  const existing = initiativeProjection[elementId];
  console.log('[KANBAN INITIATIVES PROJECTION] Current snapshot before move:', {
    elementId,
    existing: existing || null,
  });

  if (existing) {
    const prevStatus = existing.status;
    initiativeProjection[elementId].status = toStatus;
    initiativeProjection[elementId].updatedAt = event.timestamp;
    console.log('[KANBAN INITIATIVES PROJECTION] Updated element status:', { elementId, prevStatus, toStatus });
    console.log('[KANBAN INITIATIVES PROJECTION] Projection after move:', JSON.stringify(initiativeProjection[elementId], null, 2));

    initiativeMoveTable.push({
      elementId,
      fromStatus: prevStatus,
      toStatus,
      elementType,
      movedAt: event.timestamp,
    });
    console.log('[KANBAN INITIATIVES PROJECTION] Mock DB INSERT (initiativeMoveTable):', initiativeMoveTable[initiativeMoveTable.length - 1]);
  } else {
    console.warn('[KANBAN INITIATIVES PROJECTION] Element not found, creating fallback entry:', elementId);
    initiativeProjection[elementId] = {
      type: elementType,
      status: toStatus,
      boardId: event.metadata?.boardId,
      teamId: event.metadata?.teamId,
      addedAt: event.metadata?.addedAt || event.timestamp,
      updatedAt: event.timestamp,
    };
    console.log('[KANBAN INITIATIVES PROJECTION] Fallback entry created:', JSON.stringify(initiativeProjection[elementId], null, 2));
  }
});

registerProjectionHandler('InitiativeAddedToKanban', (event: any) => {
  if (event.type !== 'InitiativeAddedToKanban') return;

  const { initiativeId, initialStatus, boardId } = event.payload ?? {};
  if (!initiativeId) {
    console.warn('[KANBAN INITIATIVES PROJECTION] Missing initiativeId in event payload');
    return;
  }
  const teamId = event.metadata?.teamId;
  const elementId = `initiative-${initiativeId}`;

  initiativeProjection[elementId] = {
    type: 'initiative',
    status: initialStatus,
    boardId,
    addedAt: event.timestamp,
    updatedAt: event.timestamp,
    teamId,
  };

  console.log('[KANBAN INITIATIVES PROJECTION] Added element to projection:', { elementId, initiativeId, initialStatus, teamId });
});

export function queryInitiativesKanbanBoard(params: { companyId?: string }): KanbanBoardData {
  const columns = INITIATIVE_COLUMNS;
  const metadata = buildBoardMetadata('Initiatives');
  const { companyId } = params;

  if (!companyId) {
    return { columns, swimlanes: [], elements: [], metadata };
  }

  const swimlanes = buildStrategySwimlanes(companyId);
  const projection = getKanbanInitiativesProjection();
  const initiatives = queryEligibleInitiatives({ companyId });
  const elements: EnrichedKanbanElement[] = initiatives
    .filter(initiative => initiative.strategyState === 'Draft' || initiative.strategyState === 'Active')
    .map(initiative => {
      const elementId = `initiative-${initiative.id}`;
      const projectionEntry = projection[elementId];
      const metadata: EnrichedKanbanElement['metadata'] = {
        initiativeId: initiative.id,
        strategyId: initiative.strategyId,
        strategyName: initiative.strategyName,
        strategyState: initiative.strategyState,
        teamId: projectionEntry?.teamId || initiative.teamId,
        teamName: initiative.teamName,
        teamLevel: initiative.teamLevel,
        createdAt: projectionEntry?.addedAt,
        updatedAt: projectionEntry?.updatedAt,
      };

      return {
        id: elementId,
        type: 'initiative',
        status: projectionEntry?.status || initiative.status || 'NEW',
        title: initiative.name,
        swimlaneId: initiative.strategyId,
        description: initiative.strategyName ? `Strategy: ${initiative.strategyName}` : undefined,
        tags: [] as string[],
        metadata,
      } satisfies EnrichedKanbanElement;
    });

  return {
    columns,
    swimlanes,
    elements,
    metadata,
  };
}

export function getKanbanInitiativesProjection(): KanbanProjection {
  return { ...initiativeProjection };
}

export function getInitiativeStatus(elementId: string): KanbanProjectionEntry | undefined {
  return initiativeProjection[elementId];
}

export function getInitiativesByBoard(boardId?: string): KanbanProjection {
  if (!boardId) return getKanbanInitiativesProjection();

  const filtered: KanbanProjection = {};
  for (const [elementId, entry] of Object.entries(initiativeProjection)) {
    if (entry.boardId === boardId) {
      filtered[elementId] = entry;
    }
  }
  return filtered;
}

export function getInitiativesByTeam(teamId: string): KanbanProjection {
  const filtered: KanbanProjection = {};
  for (const [elementId, entry] of Object.entries(initiativeProjection)) {
    if (entry.teamId === teamId) {
      filtered[elementId] = entry;
    }
  }
  return filtered;
}

export async function rebuildKanbanInitiativesProjection(): Promise<void> {
  console.log('[KANBAN INITIATIVES PROJECTION] Rebuilding initiative projection');

  Object.keys(initiativeProjection).forEach(key => delete initiativeProjection[key]);

  const { _getAllEvents } = await import('@/lib/db/event-store');
  const allEvents = await _getAllEvents();

  console.log('[KANBAN INITIATIVES PROJECTION] Replaying events:', allEvents.length);
  for (const event of allEvents) {
    if (event.type === 'InitiativeAddedToKanban') {
      const { initiativeId, initialStatus, boardId } = event.payload ?? {};
      if (!initiativeId) {
        console.warn('[KANBAN INITIATIVES PROJECTION] [REPLAY] Missing initiativeId in event payload');
        continue;
      }
      const teamId = event.metadata?.teamId;
      const elementId = `initiative-${initiativeId}`;
      initiativeProjection[elementId] = {
        type: 'initiative',
        status: initialStatus,
        boardId,
        teamId,
        addedAt: event.timestamp,
        updatedAt: event.timestamp,
      };
      console.log('[KANBAN INITIATIVES PROJECTION] [REPLAY] Added element:', elementId, initialStatus);
    }
    if (event.type === 'ElementMoved' && event.payload?.elementType === 'initiative') {
      const { elementId, toStatus } = event.payload;
      if (elementId && toStatus && initiativeProjection[elementId]) {
        const prevStatus = initiativeProjection[elementId].status;
        initiativeProjection[elementId].status = toStatus;
        initiativeProjection[elementId].updatedAt = event.timestamp;
        console.log('[KANBAN INITIATIVES PROJECTION] [REPLAY] Moved element:', elementId, prevStatus, '->', toStatus);
      } else {
        console.warn('[KANBAN INITIATIVES PROJECTION] [REPLAY] Missing element for move:', elementId);
      }
    }
  }

  console.log('[KANBAN INITIATIVES PROJECTION] Rebuild complete. Entries:', Object.keys(initiativeProjection).length);
}
