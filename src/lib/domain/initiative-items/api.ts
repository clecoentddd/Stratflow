import { getTeamsProjection } from '@/lib/db/projections';

export type InitiativeItemQueryResult = {
  id: string;
  text: string;
  status?: 'todo' | 'doing' | 'done';
  initiativeId: string;
  stepKey: string;
  teamId: string;
  strategyId: string;
};

/**
 * Query all initiative items across all teams
 * This aggregates items from all team dashboards
 */
export async function queryInitiativeItems(): Promise<InitiativeItemQueryResult[]> {
  const teams = await getTeamsProjection();
  const allItems: InitiativeItemQueryResult[] = [];

  for (const team of teams) {
    // Navigate through the team dashboard structure
    for (const strategy of team.dashboard.strategies) {
      for (const initiative of strategy.initiatives) {
        for (const step of initiative.steps) {
          for (const item of step.items) {
            allItems.push({
              id: item.id,
              text: item.text,
              status: item.status || 'todo',
              initiativeId: initiative.id,
              stepKey: step.key,
              teamId: team.id,
              strategyId: strategy.id,
            });
          }
        }
      }
    }
  }

  return allItems;
}

/**
 * Query initiative items for a specific team
 */
export async function queryInitiativeItemsByTeam(teamId: string): Promise<InitiativeItemQueryResult[]> {
  const teams = await getTeamsProjection();
  const team = teams.find((t: any) => t.id === teamId);

  if (!team) {
    return [];
  }

  const items: InitiativeItemQueryResult[] = [];

  for (const strategy of team.dashboard.strategies) {
    for (const initiative of strategy.initiatives) {
      for (const step of initiative.steps) {
        for (const item of step.items) {
          items.push({
            id: item.id,
            text: item.text,
            status: item.status || 'todo',
            initiativeId: initiative.id,
            stepKey: step.key,
            teamId: team.id,
            strategyId: strategy.id,
          });
        }
      }
    }
  }

  return items;
}