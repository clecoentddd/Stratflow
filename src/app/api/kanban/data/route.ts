import { NextRequest, NextResponse } from 'next/server';
import { getKanbanProjection } from '@/lib/domain/unified-kanban/projection/projection';
import { rebuildKanbanProjection } from '@/lib/domain/unified-kanban/projection/projection';
import { queryEligibleInitiatives } from '@/lib/domain/initiatives-catalog/projection';
import { queryInitiativeItems } from '@/lib/domain/initiative-items/api';

import { getTeamByIdProjection } from '@/lib/domain/teams/projection/index';
import type { EnrichedKanbanElement, KanbanColumnDefinition, KanbanBoardData } from '@/lib/domain/unified-kanban/types';

// Column definitions for different kanban types
const INITIATIVE_COLUMNS: KanbanColumnDefinition[] = [
  { id: 'new', status: 'NEW', title: 'New', description: 'Use the radar as input' },
  { id: 'draft', status: 'Draft', title: 'Strategic Thinking', description: 'Diagnosis is key, make the initiative concrete' },
  { id: 'active', status: 'Active', title: 'In Progress', description: 'Getting a sense of moving' },
  { id: 'closed', status: 'Closed', title: 'Completed', description: 'Successfully finished' },
];

const ITEM_COLUMNS: KanbanColumnDefinition[] = [
  { id: 'new', status: 'NEW', title: 'New', description: 'Recently created' },
  { id: 'in_progress', status: 'IN_PROGRESS', title: 'In Progress', description: 'Getting a sense of moving' },
  { id: 'done', status: 'DONE', title: 'Done', description: 'Completed' },
];

// Lookup tables for domain data
async function getInitiativeLookup(): Promise<Record<string, any>> {
  const initiatives = await queryEligibleInitiatives();
  const lookup: Record<string, any> = {};
  initiatives.forEach(initiative => {
    lookup[initiative.id] = initiative;
  });
  return lookup;
}

async function getItemLookup(): Promise<Record<string, any>> {
  const items = await queryInitiativeItems();
  const lookup: Record<string, any> = {};
  items.forEach(item => {
    // items may already include the 'item-' prefix on their id; keep the full id
    lookup[item.id] = item;
  });
  return lookup;
}

async function enrichElement(
  elementId: string,
  projectionEntry: any,
  initiativeLookup: Record<string, any>,
  itemLookup: Record<string, any>
): Promise<EnrichedKanbanElement> {
  // elementId is constructed as `${prefix}-${id}` where id itself may already
  // contain a prefix (e.g. initiative-initiative-draft-1 or item-item-<uuid>).
  // Normalize by checking known prefixes and taking the remainder as the id.
  if (elementId.startsWith('initiative-')) {
    const id = elementId.substring('initiative-'.length);
    const initiative = initiativeLookup[id] || initiativeLookup[`initiative-${id}`] || initiativeLookup[id.replace(/^initiative-/, '')];
    const teamId = projectionEntry.teamId || initiative?.teamId || '';
    let teamName = '';
    let teamLevel: number | undefined = undefined;
    if (teamId) {
      const team = await getTeamByIdProjection(teamId);
      if (team) {
        teamName = team.name;
        teamLevel = team.level;
      }
    }
    return {
      id: elementId,
      type: 'initiative',
      status: projectionEntry.status,
      title: initiative?.name || 'Unknown Initiative',
      description: `Strategy: ${initiative?.strategyName || 'Unknown'}`,
      metadata: {
        initiativeId: id,
        teamId,
        teamName,
        teamLevel,
        strategyId: initiative?.strategyId || '',
        createdAt: projectionEntry.addedAt,
        updatedAt: projectionEntry.updatedAt,
      },
    };
  }

  if (elementId.startsWith('item-')) {
    const id = elementId.substring('item-'.length);
    const item = itemLookup[id] || itemLookup[`item-${id}`] || itemLookup[id.replace(/^item-/, '')];
    const teamId = item?.teamId || '';
    let teamName = '';
    let teamLevel: number | undefined = undefined;
    if (teamId) {
      const team = await getTeamByIdProjection(teamId);
      if (team) {
        teamName = team.name;
        teamLevel = team.level;
      }
    }
    return {
      id: elementId,
      type: 'initiative-item',
      status: projectionEntry.status,
      title: item?.text || item?.name || 'Unknown Item',
      description: `Initiative: ${item?.initiativeId || 'Unknown'}`,
      metadata: {
        itemId: id,
        initiativeId: item?.initiativeId || '',
        teamId,
        teamName,
        teamLevel,
        stepKey: item?.stepKey || 'actions',
        createdAt: projectionEntry.addedAt,
        updatedAt: projectionEntry.updatedAt,
      },
    };
  }

  throw new Error(`Unknown element id format: ${elementId}`);
}

export async function GET(request: NextRequest) {
  // Always rebuild the projection from the event log before serving data
  await rebuildKanbanProjection();
  console.log('[KANBAN API] Projection rebuilt from event log before responding');
  try {
    const { searchParams } = new URL(request.url);
    const boardType = searchParams.get('type') || 'items'; // 'initiatives' or 'items'
    const boardId = searchParams.get('boardId'); // optional board filter


    console.log('[KANBAN API] Fetching kanban data:', { boardType, boardId });

    // Get kanban projection
    const projection = getKanbanProjection();
    console.log('[KANBAN API] Raw projection:', JSON.stringify(projection, null, 2));

    // Normalize requested board type values and map to projection entry types
    const requestedType = (boardType || 'items').toLowerCase();
    // Decide which projection entry.type values are allowed for this board request
    const allowedEntryType = requestedType === 'initiatives' ? 'initiative' : 'initiative-item';

    // Filter by boardId and by entry.type
    let filteredProjection: Record<string, any> = {};
    for (const [elementId, entry] of Object.entries(projection)) {
      if (boardId && entry.boardId !== boardId) continue;
      if (entry.type !== allowedEntryType) continue;
      filteredProjection[elementId] = entry;
    }
    console.log('[KANBAN API] Filtered projection:', JSON.stringify(filteredProjection, null, 2));

    // Get lookup tables
    const [initiativeLookup, itemLookup] = await Promise.all([
      getInitiativeLookup(),
      getItemLookup(),
    ]);

    // Enrich elements and filter by board type
    const enrichedElements: EnrichedKanbanElement[] = [];
    for (const [elementId, entry] of Object.entries(filteredProjection)) {
      try {
        const enriched = await enrichElement(elementId, entry, initiativeLookup, itemLookup);
        // Filter elements based on board type
        const shouldInclude = boardType === 'initiatives' 
          ? enriched.type === 'initiative' 
          : enriched.type === 'initiative-item';
        if (shouldInclude) {
          enrichedElements.push(enriched);
        }
      } catch (error) {
        console.warn(`[KANBAN API] Failed to enrich element ${elementId}:`, error);
      }
    }

    // Determine columns based on board type
    const columns = boardType === 'initiatives' ? INITIATIVE_COLUMNS : ITEM_COLUMNS;

    const boardData: KanbanBoardData = {
      columns,
      elements: enrichedElements,
      metadata: {
        title: `${boardType === 'initiatives' ? 'Initiatives' : 'Items'} Kanban`,
        description: `Kanban board for ${boardType}`,
        lastUpdated: new Date().toISOString(),
      },
    };

    console.log(`[KANBAN API] Returning ${enrichedElements.length} elements`);
    return NextResponse.json(boardData);

  } catch (error) {
    console.error('[KANBAN API] Error fetching kanban data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kanban data' },
      { status: 500 }
    );
  }
}