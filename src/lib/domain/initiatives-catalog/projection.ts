import { registerProjectionHandler } from '@/lib/db/event-store';

export type InitiativeCatalogRow = {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  teamLevel?: number;
  strategyId: string;
  strategyName?: string;
  strategyState?: 'Draft' | 'Active' | 'Closed' | 'Obsolete' | 'Deleted';
  deletedAt?: string | null;
  status?: string;
};

export type InitiativeItemRow = {
  id: string;
  text: string;
  initiativeId: string;
  strategyId: string;
  teamId: string;
  status: string;
  stepKey?: string;
};

export const getTable = (): Map<string, InitiativeCatalogRow> => {
  if (!(global as any)._initiativeCatalog) {
    (global as any)._initiativeCatalog = new Map<string, InitiativeCatalogRow>();
  }
  return (global as any)._initiativeCatalog as Map<string, InitiativeCatalogRow>;
};

export const getItemTable = (): Map<string, InitiativeItemRow> => {
  if (!(global as any)._initiativeCatalog_items) {
    (global as any)._initiativeCatalog_items = new Map<string, InitiativeItemRow>();
  }
  return (global as any)._initiativeCatalog_items as Map<string, InitiativeItemRow>;
};

// Keep a lightweight in-memory team metadata cache so we can enrich initiatives
// even if TeamCreated happened before InitiativeCreated (common during seeding)
type TeamMeta = { name?: string; level?: number; companyId?: string };
const getTeamMeta = (): Map<string, TeamMeta> => {
  if (!(global as any)._initiativeCatalog_teamMeta) {
    (global as any)._initiativeCatalog_teamMeta = new Map<string, TeamMeta>();
  }
  return (global as any)._initiativeCatalog_teamMeta as Map<string, TeamMeta>;
};

// Keep a lightweight in-memory strategy cache to ensure new initiatives inherit the correct strategy state
type StrategyMeta = { name?: string; state?: 'Draft' | 'Active' | 'Closed' | 'Obsolete' | 'Deleted'; teamId?: string };
const getStrategyMeta = (): Map<string, StrategyMeta> => {
  if (!(global as any)._initiativeCatalog_strategyMeta) {
    (global as any)._initiativeCatalog_strategyMeta = new Map<string, StrategyMeta>();
  }
  return (global as any)._initiativeCatalog_strategyMeta as Map<string, StrategyMeta>;
};

export const resetInitiativeCatalogProjection = () => {
  (global as any)._initiativeCatalog = new Map<string, InitiativeCatalogRow>();
  (global as any)._initiativeCatalog_strategyMeta = new Map<string, StrategyMeta>();
  (global as any)._initiativeCatalog_items = new Map<string, InitiativeItemRow>();
};

function onInitiativeCreated(e: any) {
  console.log('Processing InitiativeCreated event:', e);
  const table = getTable();
  const id = e.metadata?.initiativeId;
  
  if (!id) {
    console.warn('Received InitiativeCreated event without an ID:', e);
    return;
  }
  
  const teamId = e.aggregateId;
  if (!teamId) {
    console.warn('Received InitiativeCreated event without a team ID:', e);
    return;
  }
  
  const teamMeta = getTeamMeta().get(teamId);
  console.log(`Team metadata for ${teamId}:`, teamMeta);
  
  const initiativeName = e.payload?.name || `Initiative ${id}`;
  // Some event producers may include a team level directly on the initiative
  // payload (for example during seeding or cross-aggregate operations). Prefer
  // an explicit level on the event if present, otherwise fall back to the
  // cached team metadata.
  const levelFromEvent =
    typeof e.payload?.level === 'number'
      ? e.payload.level
      : typeof e.payload?.teamLevel === 'number'
      ? e.payload.teamLevel
      : undefined;

  const strategyId = e.payload?.strategyId || `strategy-${teamId}`;
  const strategyMeta = getStrategyMeta().get(strategyId);
  
  console.log(`[Projection] InitiativeCreated: ${id}, Strategy: ${strategyId}, Meta State: ${strategyMeta?.state}`);

  const row: InitiativeCatalogRow = {
    id,
    name: initiativeName,
    teamId,
    teamName: teamMeta?.name,
    teamLevel: typeof levelFromEvent === 'number' ? levelFromEvent : typeof teamMeta?.level === 'number' ? teamMeta.level : undefined,
    strategyId: strategyId,
    strategyName: e.payload?.strategyName || strategyMeta?.name || `Strategy for ${teamId}`,
    strategyState: strategyMeta?.state || 'Draft',
    deletedAt: null,
    status: 'NEW',
  };
  
  console.log('Creating initiative row:', row);
  table.set(id, row);
  
  // Also ensure the team exists in our team metadata
  const teamMetaMap = getTeamMeta();
  if (!teamMetaMap.has(teamId)) {
    console.log(`Adding team ${teamId} to team metadata`);
    teamMetaMap.set(teamId, {
      name: teamMeta?.name || `Team ${teamId}`,
      level: teamMeta?.level || 0
    });
  }

  // Ensure strategy exists in meta (implicit creation)
  const strategyMetaMap = getStrategyMeta();
  if (!strategyMetaMap.has(strategyId)) {
    console.log(`[Projection] Implicitly creating strategy meta for ${strategyId}`);
    strategyMetaMap.set(strategyId, {
      name: e.payload?.strategyName || `Strategy for ${teamId}`,
      state: 'Draft', // Default to Draft so it shows up in queries
      teamId: teamId
    });
  }
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
  const meta = getStrategyMeta();
  const strategyId = e.payload?.strategyId;
  const teamId = e.aggregateId;
  
  if (strategyId) {
    meta.set(strategyId, {
      name: e.payload?.description,
      state: 'Draft',
      teamId
    });
  }

  for (const r of table.values()) {
    if (r.strategyId === strategyId) {
      if (e.payload?.description) r.strategyName = e.payload.description;
      r.strategyState = 'Draft';
    }
  }
}

function onStrategyUpdated(e: any) {
  const table = getTable();
  const meta = getStrategyMeta();
  const strategyId = e.payload?.strategyId;

  console.log(`[Projection] StrategyUpdated: ${strategyId}`, e.payload);

  if (strategyId) {
    const current = meta.get(strategyId) || {};
    const newState = e.payload?.state || current.state;
    console.log(`[Projection] Updating strategy meta for ${strategyId}. Old state: ${current.state}, New state: ${newState}`);
    
    meta.set(strategyId, {
      name: typeof e.payload?.description === 'string' ? e.payload.description : current.name,
      state: newState,
      teamId: current.teamId || e.aggregateId
    });
  }

  for (const r of table.values()) {
    if (r.strategyId === strategyId) {
      if (e.payload?.state) {
        console.log(`[Projection] Updating existing initiative ${r.id} strategy state to ${e.payload.state}`);
        r.strategyState = e.payload.state;
      }
      if (typeof e.payload?.description === 'string') r.strategyName = e.payload.description;
    }
  }

  // If strategy is archived/closed/deleted, we might want to clean up items or mark them
  if (e.payload?.state && ['Closed', 'Obsolete', 'Deleted'].includes(e.payload.state)) {
    const itemTable = getItemTable();
    for (const [itemId, item] of itemTable.entries()) {
      if (item.strategyId === strategyId) {
        // Option 1: Delete them from the projection so they disappear from Kanban
        itemTable.delete(itemId);
      }
    }
  }
}

function onTeamCreated(e: any) {
  const table = getTable();
  const meta = getTeamMeta();
  meta.set(e.payload?.id, { name: e.payload?.name, level: e.payload?.level, companyId: e.payload?.companyId });
  for (const r of table.values()) {
    if (r.teamId === e.payload?.id) {
      if (e.payload?.name) r.teamName = e.payload.name;
      if (typeof e.payload?.level === 'number') r.teamLevel = e.payload.level;
    }
  }
}

function onTeamUpdated(e: any) {
  const table = getTable();
  const meta = getTeamMeta();
  const teamId = e.aggregateId || e.payload?.id;
  if (teamId) {
    const prev = meta.get(teamId) || {};
    meta.set(teamId, { 
      name: e.payload?.name ?? prev.name, 
      level: (typeof e.payload?.level === 'number' ? e.payload.level : prev.level),
      companyId: prev.companyId // Preserve companyId
    });
  }
  for (const r of table.values()) {
    if (r.teamId === e.aggregateId || r.teamId === e.payload?.id) {
      if (e.payload?.name) r.teamName = e.payload.name;
      if (typeof e.payload?.level === 'number') r.teamLevel = e.payload.level;
    }
  }
}

function onInitiativeItemAdded(e: any) {
  const table = getItemTable();
  const id = e.metadata?.itemId;
  if (!id) return;
  
  const initiativeId = e.metadata?.initiativeId;
  const teamId = e.metadata?.teamId || e.aggregateId;
  
  const initiativeTable = getTable();
  const initiative = initiativeTable.get(initiativeId);
  const strategyId = initiative?.strategyId || `strategy-${teamId}`;
  
  const row: InitiativeItemRow = {
    id,
    text: e.payload?.item?.text || 'New Item',
    initiativeId,
    strategyId,
    teamId,
    status: e.payload?.item?.status || 'todo',
    stepKey: e.payload?.stepKey
  };
  table.set(id, row);
}

function onInitiativeItemUpdated(e: any) {
  const table = getItemTable();
  const id = e.metadata?.itemId;
  if (!id) return;
  
  const row = table.get(id);
  if (row) {
    if (e.payload?.text) row.text = e.payload.text;
    if (e.payload?.status) row.status = e.payload.status;
    table.set(id, row);
  }
}

function onInitiativeItemDeleted(e: any) {
  const table = getItemTable();
  const id = e.metadata?.itemId;
  if (id) {
    table.delete(id);
  }
}

function onElementMoved(e: any) {
  console.log(`[InitiativesCatalog] Processing ElementMoved: ${e.payload?.elementId} to ${e.payload?.toStatus}`);
  if (e.payload?.elementType === 'initiative') {
    const table = getTable();
    // elementId is typically "initiative-{id}"
    const id = e.payload?.elementId?.replace(/^initiative-/, '');
    const row = id ? table.get(id) : undefined;
    
    if (!row) {
      console.warn(`[Projection] ElementMoved: Initiative ${id} not found in catalog. Available IDs: ${Array.from(table.keys()).join(', ')}`);
      return;
    }
    
    console.log(`[Projection] Updating status for initiative ${id} to ${e.payload.toStatus}`);
    row.status = e.payload.toStatus;
    table.set(id, row);
  } else if (e.payload?.elementType === 'item' || e.payload?.elementType === 'initiative-item') {
    const table = getItemTable();
    const id = e.payload?.elementId?.replace(/^item-/, '');
    const row = id ? table.get(id) : undefined;
    
    if (row) {
      row.status = e.payload.toStatus;
      table.set(id, row);
    }
  }
}

// Registration
registerProjectionHandler('InitiativeCreated', onInitiativeCreated);
registerProjectionHandler('InitiativeUpdated', onInitiativeUpdated);
registerProjectionHandler('InitiativeDeleted', onInitiativeDeleted);
registerProjectionHandler('InitiativeItemAdded', onInitiativeItemAdded);
registerProjectionHandler('InitiativeItemUpdated', onInitiativeItemUpdated);
registerProjectionHandler('InitiativeItemDeleted', onInitiativeItemDeleted);
registerProjectionHandler('StrategyCreated', onStrategyCreated);
registerProjectionHandler('StrategyUpdated', onStrategyUpdated);
registerProjectionHandler('TeamCreated', onTeamCreated);
export const queryEligibleInitiatives = (opts?: { states?: Array<'Draft'|'Active'>, companyId?: string }) => {
  const table = getTable();
  let rows = Array.from(table.values()).filter(r => !r.deletedAt);
  
  if (opts?.companyId) {
    const teamMeta = getTeamMeta();
    rows = rows.filter(r => {
      const meta = teamMeta.get(r.teamId);
      return meta?.companyId === opts.companyId;
    });
  }

  if (opts?.states && opts.states.length) {
    return rows.filter(r => r.strategyState && opts.states!.includes(r.strategyState as any));
  }
  return rows;
};

export function getAllTeams() {
  const teamsMap = new Map<string, { id: string; name?: string; level?: number; companyId?: string }>();
  
  // 1. Start with team meta (source of truth for team details)
  const meta = getTeamMeta();
  for (const [id, data] of meta.entries()) {
    teamsMap.set(id, { id, name: data.name, level: data.level, companyId: data.companyId });
  }

  // 2. Supplement with catalog data (in case some teams are only implicitly defined in initiatives)
  const table = getTable();
  for (const row of table.values()) {
    if (!teamsMap.has(row.teamId)) {
      teamsMap.set(row.teamId, { id: row.teamId, name: row.teamName || row.teamId, level: row.teamLevel });
    }
  }
  
  return Array.from(teamsMap.values());
}

export const queryStrategies = (opts?: { states?: Array<'Draft'|'Active'>, teamId?: string }) => {
  const meta = getStrategyMeta();
  let strategies = Array.from(meta.entries()).map(([id, data]) => ({
    id,
    ...data
  }));
  
  if (opts?.teamId) {
    strategies = strategies.filter(s => s.teamId === opts.teamId);
  }
  
  if (opts?.states && opts.states.length) {
    return strategies.filter(s => s.state && opts.states!.includes(s.state as any));
  }
  return strategies;
};
export const queryItems = (opts?: { teamId?: string, strategyStates?: Array<'Draft'|'Active'|'Closed'|'Obsolete'|'Deleted'>, companyId?: string }) => {
  const table = getItemTable();
  let items = Array.from(table.values());
  
  if (opts?.companyId) {
    const teamMeta = getTeamMeta();
    items = items.filter(i => {
      const meta = teamMeta.get(i.teamId);
      return meta?.companyId === opts.companyId;
    });
  }
  
  if (opts?.teamId) {
    items = items.filter(i => i.teamId === opts.teamId);
  }

  if (opts?.strategyStates && opts.strategyStates.length) {
    const strategyMeta = getStrategyMeta();
    items = items.filter(i => {
      const meta = strategyMeta.get(i.strategyId);
      return meta?.state && opts.strategyStates!.includes(meta.state as any);
    });
  }
  
  return items;
};


