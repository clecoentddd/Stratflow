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
};

export const getTable = (): Map<string, InitiativeCatalogRow> => {
  if (!(global as any)._initiativeCatalog) {
    (global as any)._initiativeCatalog = new Map<string, InitiativeCatalogRow>();
  }
  return (global as any)._initiativeCatalog as Map<string, InitiativeCatalogRow>;
};

// Keep a lightweight in-memory team metadata cache so we can enrich initiatives
// even if TeamCreated happened before InitiativeCreated (common during seeding)
type TeamMeta = { name?: string; level?: number };
const getTeamMeta = (): Map<string, TeamMeta> => {
  if (!(global as any)._initiativeCatalog_teamMeta) {
    (global as any)._initiativeCatalog_teamMeta = new Map<string, TeamMeta>();
  }
  return (global as any)._initiativeCatalog_teamMeta as Map<string, TeamMeta>;
};

export const resetInitiativeCatalogProjection = () => {
  (global as any)._initiativeCatalog = new Map<string, InitiativeCatalogRow>();
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

  const row: InitiativeCatalogRow = {
    id,
    name: initiativeName,
    teamId,
    teamName: teamMeta?.name,
    teamLevel: typeof levelFromEvent === 'number' ? levelFromEvent : typeof teamMeta?.level === 'number' ? teamMeta.level : undefined,
    strategyId: e.payload?.strategyId || `strategy-${teamId}`,
    strategyName: e.payload?.strategyName || `Strategy for ${teamId}`,
    strategyState: 'Draft',
    deletedAt: null,
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
  const meta = getTeamMeta();
  meta.set(e.payload?.id, { name: e.payload?.name, level: e.payload?.level });
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
    meta.set(teamId, { name: e.payload?.name ?? prev.name, level: (typeof e.payload?.level === 'number' ? e.payload.level : prev.level) });
  }
  for (const r of table.values()) {
    if (r.teamId === e.aggregateId || r.teamId === e.payload?.id) {
      if (e.payload?.name) r.teamName = e.payload.name;
      if (typeof e.payload?.level === 'number') r.teamLevel = e.payload.level;
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

export function getAllTeams() {
  // Get all unique teams from the catalog
  const table = getTable();
  const teamsMap = new Map<string, { id: string; name?: string; level?: number }>();
  for (const row of table.values()) {
    if (!teamsMap.has(row.teamId)) {
      teamsMap.set(row.teamId, { id: row.teamId, name: row.teamName || row.teamId, level: row.teamLevel });
    } else {
      const existing = teamsMap.get(row.teamId)!;
      // prefer explicit teamName and teamLevel if available
      if (!existing.name && row.teamName) existing.name = row.teamName;
      if (typeof row.teamLevel === 'number') existing.level = row.teamLevel;
    }
  }
  return Array.from(teamsMap.values());
}


