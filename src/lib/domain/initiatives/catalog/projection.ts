import { registerProjectionHandler } from '@/lib/db/event-store';

export type InitiativeCatalogRow = {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  strategyId: string;
  strategyName?: string;
  strategyState?: 'Draft' | 'Active' | 'Closed' | 'Obsolete' | 'Deleted';
  deletedAt?: string | null;
};

const getTable = (): Map<string, InitiativeCatalogRow> => {
  if (!(global as any)._initiativeCatalog) {
    (global as any)._initiativeCatalog = new Map<string, InitiativeCatalogRow>();
  }
  return (global as any)._initiativeCatalog as Map<string, InitiativeCatalogRow>;
};

export const resetInitiativeCatalogProjection = () => {
  (global as any)._initiativeCatalog = new Map<string, InitiativeCatalogRow>();
};

function onInitiativeCreated(e: any) {
  const table = getTable();
  const id = e.payload?.template?.id;
  if (!id) return;
  const row: InitiativeCatalogRow = {
    id,
    name: e.payload?.template?.name || id,
    teamId: e.aggregateId,
    strategyId: e.payload?.strategyId,
    strategyName: undefined,
    strategyState: 'Draft',
    deletedAt: null,
  };
  table.set(id, row);
}

function onInitiativeUpdated(e: any) {
  const table = getTable();
  const id = e.payload?.initiativeId;
  const row = id ? table.get(id) : undefined;
  if (!row) return;
  if (typeof e.payload?.name === 'string' && e.payload?.name.length) {
    row.name = e.payload.name;
  }
  table.set(id, row);
}

function onInitiativeDeleted(e: any) {
  const table = getTable();
  const id = e.payload?.initiativeId;
  const row = id ? table.get(id) : undefined;
  if (!row) return;
  row.deletedAt = e.timestamp || new Date().toISOString();
  table.set(id, row);
}

function onStrategyCreated(e: any) {
  // default state for new strategy is Draft; update rows if any exist already
  const table = getTable();
  for (const r of table.values()) {
    if (r.strategyId === e.payload?.strategyId) {
      if (e.payload?.description) r.strategyName = e.payload.description;
      r.strategyState = 'Draft';
    }
  }
}

function onStrategyUpdated(e: any) {
  const table = getTable();
  for (const r of table.values()) {
    if (r.strategyId === e.payload?.strategyId) {
      if (e.payload?.state) r.strategyState = e.payload.state;
      if (typeof e.payload?.description === 'string') r.strategyName = e.payload.description;
    }
  }
}

function onTeamCreated(e: any) {
  const table = getTable();
  for (const r of table.values()) {
    if (r.teamId === e.payload?.id) {
      if (e.payload?.name) r.teamName = e.payload.name;
    }
  }
}

function onTeamUpdated(e: any) {
  const table = getTable();
  for (const r of table.values()) {
    if (r.teamId === e.aggregateId || r.teamId === e.payload?.id) {
      if (e.payload?.name) r.teamName = e.payload.name;
    }
  }
}

// Registration
registerProjectionHandler('InitiativeCreated', onInitiativeCreated);
registerProjectionHandler('InitiativeUpdated', onInitiativeUpdated);
registerProjectionHandler('InitiativeDeleted', onInitiativeDeleted);
registerProjectionHandler('StrategyCreated', onStrategyCreated);
registerProjectionHandler('StrategyUpdated', onStrategyUpdated);
registerProjectionHandler('TeamCreated', onTeamCreated);
registerProjectionHandler('TeamUpdated', onTeamUpdated);

// Queries
export const queryEligibleInitiatives = (opts?: { states?: Array<'Draft'|'Active'> }) => {
  const table = getTable();
  const rows = Array.from(table.values()).filter(r => !r.deletedAt);
  if (opts?.states && opts.states.length) {
    return rows.filter(r => r.strategyState && opts.states!.includes(r.strategyState as any));
  }
  return rows;
};
