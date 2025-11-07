
import { saveEvents } from '@/lib/db/event-store';
import type { MapItemKanbanStatusCommand } from './commands';
import type { ItemKanbanStatusMappedEvent } from '@/lib/domain/initiative-kanban-status-mapped-event/events';


export async function handleMapItemKanbanStatusCommand(
  command: MapItemKanbanStatusCommand
): Promise<ItemKanbanStatusMappedEvent> {
  const { teamId, initiativeId, itemId, status } = command.payload;
  const event: ItemKanbanStatusMappedEvent = {
    type: 'ItemKanbanStatusMapped',
    payload: { status },
    metadata: { teamId, initiativeId, itemId },
    timestamp: new Date().toISOString(),
    aggregateId: itemId,
    entity: 'kanban-item',
  };
  await saveEvents([event]);
  return event;
}
