import type { TagInitiativeWithRiskCommand, RemoveTagFromInitiativeCommand } from './command';
import type { TagAddedEvent, TagRemovedEvent } from './events';
import { saveEvents } from '../../db/event-store';

export class TagAnInitiativeWithARiskCommandHandler {
  static async handleTagInitiativeWithRisk(command: TagInitiativeWithRiskCommand): Promise<TagAddedEvent> {
    // Look up radar name for event
    let radarName = '';
    try {
      const { getRadarItemById } = await import('../radar-tags-projection/projection');
      const radarItem = await getRadarItemById(command.radarItemId);
      radarName = radarItem?.name || '';
      console.log('[TagAnInitiativeWithARiskCommandHandler] Found radar item:', radarItem);
    } catch (err) {
      console.error('[TagAnInitiativeWithARiskCommandHandler] Error looking up radar item:', err);
    }
    const event: TagAddedEvent = {
      type: 'TagAdded',
      entity: 'initiative',
      aggregateId: command.initiativeId,
      timestamp: new Date().toISOString(),
      payload: {
        radarItemId: command.radarItemId,
        radarName,
      },
    };
    console.log('[TagAnInitiativeWithARiskCommandHandler] Emitting TagAddedEvent:', event);
    await saveEvents([event]);
    return event;
  }

  static async handleRemoveTagFromInitiative(command: RemoveTagFromInitiativeCommand): Promise<TagRemovedEvent> {
    const event: TagRemovedEvent = {
      type: 'TagRemoved',
      entity: 'initiative',
      aggregateId: command.initiativeId,
      timestamp: new Date().toISOString(),
      payload: {
        radarItemId: command.radarItemId,
      },
    };
  console.log('[TagAnInitiativeWithARiskCommandHandler] Emitting TagRemovedEvent:', event);
  await saveEvents([event]);
  return event;
  }
}
