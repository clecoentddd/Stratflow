import {
  getAllTeams,
  queryStrategies,
} from '@/lib/domain/initiatives-catalog/projection';
import type { KanbanBoardData, KanbanSwimlaneDefinition } from '../types';

export const ACTIVE_STRATEGY_STATES: Array<'Draft' | 'Active'> = ['Draft', 'Active'];

export function buildStrategySwimlanes(companyId: string): KanbanSwimlaneDefinition[] {
  const allTeams = getAllTeams();
  const relevantTeams = allTeams.filter((team: any) => team?.companyId === companyId);
  const teamLookup = new Map(relevantTeams.map((team: any) => [team.id, team]));

  const strategies = queryStrategies({ states: ACTIVE_STRATEGY_STATES });

  return strategies
    .filter((strategy: any) => strategy?.teamId && teamLookup.has(strategy.teamId))
    .map((strategy: any) => {
      const team = strategy.teamId ? teamLookup.get(strategy.teamId) : undefined;
      return {
        id: strategy.id,
        title: strategy.name || 'Untitled Strategy',
        color: '#e2e8f0',
        teamId: strategy.teamId,
        teamName: team?.name,
        teamLevel: team?.level,
        state: strategy.state,
      } satisfies KanbanSwimlaneDefinition;
    });
}

export function buildBoardMetadata(label: string): KanbanBoardData['metadata'] {
  return {
    title: `${label} Kanban`,
    description: `Kanban board for ${label.toLowerCase()}`,
    lastUpdated: new Date().toISOString(),
  };
}
