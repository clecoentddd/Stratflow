import { queryItems } from '@/lib/domain/initiatives-catalog/projection';
import { waitForEventStore } from '@/lib/db/event-store';

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
export async function queryInitiativeItems(companyId?: string): Promise<InitiativeItemQueryResult[]> {
  await waitForEventStore();
  const items = queryItems({ companyId });
  return items.map(item => ({
    id: item.id,
    text: item.text,
    status: (item.status as any) || 'todo',
    initiativeId: item.initiativeId,
    stepKey: item.stepKey || '',
    teamId: item.teamId,
    strategyId: item.strategyId,
  }));
}

/**
 * Query initiative items for a specific team
 */
export async function queryInitiativeItemsByTeam(teamId: string): Promise<InitiativeItemQueryResult[]> {
  await waitForEventStore();
  const items = queryItems({ teamId });
  return items.map(item => ({
    id: item.id,
    text: item.text,
    status: (item.status as any) || 'todo',
    initiativeId: item.initiativeId,
    stepKey: item.stepKey || '',
    teamId: item.teamId,
    strategyId: item.strategyId,
  }));
}