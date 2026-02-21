// linkInitiativesCommandHandler.ts
import type { LinkInitiativesCommand } from './LinkInitiativesCommand';
import type { InitiativeLinkedEvent } from './events';

// Strict event-store only handler
export async function linkInitiativesCommandHandler(cmd: LinkInitiativesCommand): Promise<{ events: InitiativeLinkedEvent[]; errors: string[] }> {
  const errors: string[] = [];
  const events: InitiativeLinkedEvent[] = [];

  // Get all events from the event store
  const { _getAllEvents } = await import('../../db/event-store');
  const allEvents = await _getAllEvents();

  // Helper to extract context for an initiative from the event log
  function getInitiativeContext(initiativeId: string) {
    // Find the most recent InitiativeCreated event for this initiativeId
    const created = allEvents.find(ev => ev.type === 'InitiativeCreated' && ev.metadata && ev.metadata.initiativeId === initiativeId);
    if (!created) return null;
    // Extract teamId, strategyId, etc. from the event
    const teamId = created.aggregateId;
    // Try to get teamLevel from TeamCreated event for this team
    let teamLevel = 0;
    const teamCreated = allEvents.find(ev => ev.type === 'TeamCreated' && ev.aggregateId === teamId && ev.payload && typeof ev.payload.level === 'number');
    if (teamCreated && teamCreated.payload && typeof teamCreated.payload === 'object' && 'level' in teamCreated.payload) {
      teamLevel = (teamCreated.payload as any).level;
    }
    const tenantId = (teamCreated?.payload as any)?.companyId || (created as any).tenantId;
    const strategyId = (created.payload as any).strategyId;
    const strategyState = 'Draft'; // Default, unless you want to replay StrategyUpdated
    return { teamId, teamLevel, strategyId, strategyState, tenantId };
  }

  // Existence check (event-store driven)
  const fromCtx = getInitiativeContext(cmd.fromInitiativeId);
  if (!fromCtx) {
    errors.push('Source initiative does not exist');
    return { events, errors };
  }
  for (const toId of cmd.toInitiativeIds) {
    if (!getInitiativeContext(toId)) {
      errors.push(`Target initiative ${toId} does not exist`);
    }
  }
  if (errors.length) return { events, errors };

  for (const toId of cmd.toInitiativeIds) {
    if (toId === cmd.fromInitiativeId) continue;
    const toCtx = getInitiativeContext(toId);
    if (!toCtx) continue;

    // CRITICAL: Both initiatives must have tenantId
    if (!fromCtx.tenantId || !toCtx.tenantId) {
      errors.push(`Missing tenant information for initiative linking`);
      console.warn('[TENANT-ISOLATION] Missing tenantId', {
        from: cmd.fromInitiativeId,
        to: toId,
        fromTenantId: fromCtx.tenantId,
        toTenantId: toCtx.tenantId
      });
      continue;
    }

    // CRITICAL: Both initiatives must belong to SAME tenant
    if (fromCtx.tenantId !== toCtx.tenantId) {
      errors.push(`Cannot link initiatives across different tenants/companies (${fromCtx.tenantId} → ${toCtx.tenantId})`);
      console.error('[TENANT-ISOLATION] Cross-tenant linking attempt blocked', {
        from: cmd.fromInitiativeId,
        to: toId,
        fromTenantId: fromCtx.tenantId,
        toTenantId: toCtx.tenantId,
        requestedBy: cmd.requestedBy
      });
      continue;
    }

    const tenantId = fromCtx.tenantId;

    const ev: InitiativeLinkedEvent = {
      type: 'InitiativeLinked',
      entity: 'team',
      aggregateId: fromCtx.teamId,
      timestamp: new Date().toISOString(),
      tenantId,
      payload: {
        fromInitiativeId: cmd.fromInitiativeId,
        toInitiativeId: toId,
        fromStrategyId: fromCtx.strategyId,
        toStrategyId: toCtx.strategyId,
        fromTeamId: fromCtx.teamId,
        toTeamId: toCtx.teamId,
        fromTeamLevel: fromCtx.teamLevel,
        toTeamLevel: toCtx.teamLevel,
        createdBy: cmd.requestedBy,
      },
    };
    events.push(ev);
  }
  if (!events.length) errors.push('No valid targets');
  return { events, errors };
}
