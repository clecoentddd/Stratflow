
import { registerProjectionHandler } from '@/lib/db/event-store';
import type { TagAddedEvent, TagRemovedEvent } from './events';
import type { AllEvents } from '@/lib/db/event-store';

// DB table: initiativeId -> Set of radarItemIds
export type InitiativeTagsProjection = Map<string, Set<string>>;

export const getTable = (): InitiativeTagsProjection => {
  if (!(global as any)._initiativeTagsProjection) {
    (global as any)._initiativeTagsProjection = new Map<string, Set<string>>();
  }
  return (global as any)._initiativeTagsProjection as InitiativeTagsProjection;
};

export const resetTagsProjection = () => {
  (global as any)._initiativeTagsProjection = new Map<string, Set<string>>();
};

function onTagAdded(event: AllEvents) {
  if (event.type !== 'TagAdded' || event.entity !== 'initiative') return;
  const table = getTable();
  const { aggregateId: initiativeId, payload } = event;
  if (!table.has(initiativeId)) table.set(initiativeId, new Set());
  table.get(initiativeId)!.add(payload.radarItemId);
}

function onTagRemoved(event: AllEvents) {
  if (event.type !== 'TagRemoved' || event.entity !== 'initiative') return;
  const table = getTable();
  const { aggregateId: initiativeId, payload } = event;
  if (!table.has(initiativeId)) return;
  table.get(initiativeId)!.delete(payload.radarItemId);
  if (table.get(initiativeId)!.size === 0) table.delete(initiativeId);
}

export function getTagsForInitiative(initiativeId: string): string[] {
  const table = getTable();
  return Array.from(table.get(initiativeId) || []);
}

export function queryAllTags() {
  const table = getTable();
  return Array.from(table.entries()).map(([initiativeId, radarItemIds]) => ({
    initiativeId,
    radarItemIds: Array.from(radarItemIds),
  }));
}

registerProjectionHandler('TagAdded', onTagAdded);
registerProjectionHandler('TagRemoved', onTagRemoved);
