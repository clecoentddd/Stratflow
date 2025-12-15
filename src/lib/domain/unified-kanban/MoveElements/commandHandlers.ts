import type { MoveElementCommand } from './commands';
import type { ElementMovedEvent } from '../events';
import { saveEvents, waitForEventStore } from '@/lib/db/event-store';
import { getKanbanInitiativesProjection } from '../projection/kanban-initiatives-projection';
import { getKanbanInitiativeItemProjection } from '../projection/kanban-initiative-item-projection';
import { resolveInitiativeContext, resolveInitiativeItemContext, resolveTenantForTeam } from '@/lib/domain/tenant/tenant-context';

// Handle element move - updates kanban projection only
export async function handleMoveElement(command: MoveElementCommand): Promise<void> {
  console.log('[UNIFIED KANBAN] Handling MoveElement command:', command);

  await waitForEventStore();

  const { elementId, toStatus, elementType } = command;

  const projection = elementType === 'initiative'
    ? getKanbanInitiativesProjection()
    : getKanbanInitiativeItemProjection();

  const existing = projection[elementId];

  if (existing) {
    console.log('[UNIFIED KANBAN] Projection lookup:', {
      elementId,
      currentStatus: existing.status,
      boardId: existing.boardId,
      updatedAt: existing.updatedAt,
    });
  } else {
    console.warn('[UNIFIED KANBAN] Projection lookup: element not found, will treat as first move', {
      elementId,
      toStatus,
    });
  }

  if (existing && existing.status === toStatus) {
    console.warn('[UNIFIED KANBAN] Move ignored: element already in target status', {
      elementId,
      toStatus,
    });
    return;
  }

  // Build the new event structure
  const eventMetadata: Record<string, any> = {};
  if (existing?.boardId) eventMetadata.boardId = existing.boardId;
  if (!eventMetadata.boardId && command.boardId) eventMetadata.boardId = command.boardId;
  if (existing?.teamId) eventMetadata.teamId = existing.teamId;
  if (existing?.addedAt) eventMetadata.addedAt = existing.addedAt;

  if (!eventMetadata.teamId && elementType === 'initiative' && elementId.startsWith('initiative-')) {
    const initiativeId = elementId.replace('initiative-', '');
    const context = await resolveInitiativeContext(initiativeId);
    if (context) {
      eventMetadata.teamId = context.teamId;
      if (!eventMetadata.boardId) {
        eventMetadata.boardId = context.strategyId;
      }
      if (!eventMetadata.initiativeId) {
        eventMetadata.initiativeId = initiativeId;
      }
    }
  }

  if (!eventMetadata.teamId && elementType === 'initiative-item') {
    const itemContext = await resolveInitiativeItemContext(elementId);
    if (itemContext) {
      eventMetadata.teamId = itemContext.teamId;
      if (!eventMetadata.boardId) {
        eventMetadata.boardId = itemContext.teamId;
      }
      if (!eventMetadata.initiativeId) {
        eventMetadata.initiativeId = itemContext.initiativeId;
      }
    }
  }

  let tenantId = eventMetadata.teamId ? await resolveTenantForTeam(eventMetadata.teamId) : null;

  if (!tenantId && elementType === 'initiative' && typeof eventMetadata.initiativeId === 'string') {
    const context = await resolveInitiativeContext(eventMetadata.initiativeId);
    if (context) {
      tenantId = context.tenantId;
      if (!eventMetadata.teamId) {
        eventMetadata.teamId = context.teamId;
      }
    }
  }

  if (!tenantId && elementType === 'initiative-item') {
    const itemContext = await resolveInitiativeItemContext(elementId);
    if (itemContext) {
      console.log('[UNIFIED KANBAN] resolveInitiativeItemContext result', itemContext);
      tenantId = itemContext.tenantId;
      if (!eventMetadata.teamId) {
        eventMetadata.teamId = itemContext.teamId;
      }
      if (!eventMetadata.initiativeId) {
        eventMetadata.initiativeId = itemContext.initiativeId;
      }
      if (!tenantId && itemContext.teamId) {
        tenantId = await resolveTenantForTeam(itemContext.teamId);
      }
    }
  }

  if (!tenantId) {
    const { _getAllEvents } = await import('@/lib/db/event-store');
    const allEvents = await _getAllEvents();
    const normalize = (value: string) => (value.startsWith('item-') ? value : `item-${value}`);
    const targetId = normalize(elementId);
    const origin = allEvents.find(event => {
      if (event.type !== 'InitiativeItemCreated') return false;
      const payloadId = (event as any).payload?.itemId;
      return typeof payloadId === 'string' && normalize(payloadId) === targetId;
    }) as any;

    if (origin) {
      const derivedTeamId = origin.aggregateId;
      const derivedInitiativeId = origin.payload?.initiativeId;
      const derivedTenantId = origin.tenantId;

      if (!eventMetadata.teamId && derivedTeamId) {
        eventMetadata.teamId = derivedTeamId;
      }
      if (!eventMetadata.initiativeId && derivedInitiativeId) {
        eventMetadata.initiativeId = derivedInitiativeId;
      }

      if (derivedTenantId) {
        tenantId = derivedTenantId;
      } else if (derivedTeamId) {
        tenantId = await resolveTenantForTeam(derivedTeamId);
      }
    }
  }

  if (!tenantId) {
    throw new Error(`[UNIFIED KANBAN] Unable to resolve tenant for move event: ${elementType} ${elementId}`);
  }

  const event: ElementMovedEvent = {
    type: 'ElementMoved',
    entity: elementType, // 'initiative' or 'item'
    aggregateId: elementId, // or use a boardId if you have one
    timestamp: new Date().toISOString(),
    tenantId,
    payload: {
      elementId,
      elementType,
      toStatus,
      tags: ['kanban'],
    },
    metadata: {
      fromStatus: command.fromStatus,
      ...eventMetadata,
    },
  };

  console.log('[UNIFIED KANBAN] Prepared ElementMoved event payload:', event);
  await saveEvents([event]);
  console.log('[UNIFIED KANBAN] ElementMoved event persisted successfully for', elementId);
}