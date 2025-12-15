import { getTeamByIdProjection, getTeamsProjection } from '@/lib/domain/teams/projection';
import type { Team } from '@/lib/types';

type Maybe<T> = T | null;

export type TeamContext = {
  tenantId: string;
  team: Team;
};

export const resolveTeamContext = async (teamId: string): Promise<Maybe<TeamContext>> => {
  const team = await getTeamByIdProjection(teamId);
  if (!team) {
    console.warn('[TENANT] resolveTeamContext unable to find team', { teamId });
    return null;
  }

  if (!team.companyId) {
    console.warn('[TENANT] resolveTeamContext team missing companyId', { teamId });
    return null;
  }

  return {
    tenantId: team.companyId,
    team,
  };
};

export const resolveTenantForTeam = async (teamId: string): Promise<Maybe<string>> => {
  const context = await resolveTeamContext(teamId);
  return context?.tenantId ?? null;
};

export type InitiativeContext = {
  tenantId: string;
  teamId: string;
  teamLevel: number;
  strategyId: string;
  strategyState?: string;
};

export const resolveInitiativeContext = async (initiativeId: string): Promise<Maybe<InitiativeContext>> => {
  const teams = await getTeamsProjection();
  for (const team of teams) {
    for (const strategy of team.dashboard.strategies) {
      const initiative = strategy.initiatives.find(i => i.id === initiativeId);
      if (initiative) {
        if (!team.companyId) {
          return null;
        }

        return {
          tenantId: team.companyId,
          teamId: team.id,
          teamLevel: team.level,
          strategyId: strategy.id,
          strategyState: strategy.state,
        };
      }
    }
  }
  return null;
};

export type InitiativeItemContext = {
  tenantId: string;
  teamId: string;
  initiativeId: string;
  itemId: string;
};

const normalizeItemCandidates = (rawId: string): string[] => {
  const candidates = new Set<string>();
  candidates.add(rawId);

  const stripPrefix = (value: string, prefix: string) =>
    value.startsWith(prefix) ? value.slice(prefix.length) : value;

  const withoutItemPrefix = stripPrefix(rawId, 'item-');
  candidates.add(withoutItemPrefix);
  const withoutDoublePrefix = stripPrefix(rawId, 'item-item-');
  candidates.add(withoutDoublePrefix);

  candidates.add(`item-${rawId}`);
  candidates.add(`item-${withoutItemPrefix}`);
  candidates.add(`item-${withoutDoublePrefix}`);

  return Array.from(candidates).filter(Boolean);
};

export const resolveInitiativeItemContext = async (elementId: string): Promise<Maybe<InitiativeItemContext>> => {
  const { queryItems } = await import('@/lib/domain/initiatives-catalog/projection');
  const items = queryItems();
  const candidates = normalizeItemCandidates(elementId);
  console.log('[TENANT] resolveInitiativeItemContext candidates', { elementId, candidates });

  const match = items.find(item => {
    if (!item.id) return false;
    const itemCandidates = normalizeItemCandidates(item.id);
    return itemCandidates.some(candidate => candidates.includes(candidate));
  });

  console.log('[TENANT] resolveInitiativeItemContext match', match ? { id: match.id, teamId: match.teamId, initiativeId: match.initiativeId } : null);

  if (!match) {
    return null;
  }

  const initiativeContext = await resolveInitiativeContext(match.initiativeId);
  if (!initiativeContext) {
    console.warn('[TENANT] resolveInitiativeItemContext unable to resolve initiative context', {
      itemId: match.id,
      initiativeId: match.initiativeId,
    });
    return null;
  }

  return {
    tenantId: initiativeContext.tenantId,
    teamId: match.teamId ?? initiativeContext.teamId,
    initiativeId: match.initiativeId,
    itemId: match.id,
  };
};
