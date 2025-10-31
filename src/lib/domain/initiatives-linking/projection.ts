import type { LinkingEvents } from './events';
import { registerProjectionHandler } from '@/lib/db/event-store';

export type InitiativeLinkRow = {
  id: string; // fromInitiativeId->toInitiativeId
  fromInitiativeId: string;
  toInitiativeId: string;
  fromStrategyId?: string;
  toStrategyId?: string;
  fromTeamId?: string;
  toTeamId?: string;
  fromTeamLevel?: number;
  toTeamLevel?: number;
  createdAt: string;
  deletedAt: string | null;
};

// In-memory table mock
const getTable = (): Map<string, InitiativeLinkRow> => {
  if (!(global as any)._initiativeLinks) {
    (global as any)._initiativeLinks = new Map<string, InitiativeLinkRow>();
  }
  return (global as any)._initiativeLinks as Map<string, InitiativeLinkRow>;
};

const makeId = (fromId: string, toId: string) => `${fromId}__to__${toId}`;

function onLinked(e: any) {
  const table = getTable();
  const id = makeId(e.payload.fromInitiativeId, e.payload.toInitiativeId);
  const row: InitiativeLinkRow = {
    id,
    fromInitiativeId: e.payload.fromInitiativeId,
    toInitiativeId: e.payload.toInitiativeId,
    fromStrategyId: e.payload.fromStrategyId,
    toStrategyId: e.payload.toStrategyId,
    fromTeamId: e.payload.fromTeamId,
    toTeamId: e.payload.toTeamId,
    fromTeamLevel: e.payload.fromTeamLevel,
    toTeamLevel: e.payload.toTeamLevel,
    createdAt: e.timestamp,
    deletedAt: null,
  };
  table.set(id, row);
}

function onUnlinked(e: any) {
  const table = getTable();
  const id = makeId(e.payload.fromInitiativeId, e.payload.toInitiativeId);
  const row = table.get(id);
  if (row) {
    row.deletedAt = e.timestamp;
    table.set(id, row);
  }
}

function onInitiativeDeleted(e: any) {
  const table = getTable();
  for (const row of table.values()) {
    if (row.fromInitiativeId === e.payload.initiativeId || row.toInitiativeId === e.payload.initiativeId) {
      row.deletedAt = e.timestamp;
    }
  }
}

// Registration (synchronous)
registerProjectionHandler('InitiativeLinked', (e) => onLinked(e));
registerProjectionHandler('InitiativeUnlinked', (e) => onUnlinked(e));
registerProjectionHandler('InitiativeDeleted', (e) => onInitiativeDeleted(e));

// Query helpers — used by API/UI
export const queryLinksFrom = (initiativeId: string) => {
  const table = getTable();
  return Array.from(table.values()).filter(r => r.fromInitiativeId === initiativeId && !r.deletedAt);
};

export const queryLinksTo = (initiativeId: string) => {
  const table = getTable();
  return Array.from(table.values()).filter(r => r.toInitiativeId === initiativeId && !r.deletedAt);
};

export const queryAllActiveLinks = () => {
  const table = getTable();
  return Array.from(table.values()).filter(r => !r.deletedAt);
};

export const resetInitiativeLinksProjection = () => {
  (global as any)._initiativeLinks = new Map<string, InitiativeLinkRow>();
};
