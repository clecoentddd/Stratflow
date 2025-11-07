import { getTeamsProjection } from '@/lib/db/projections';
import type { Team, Strategy, Initiative, InitiativeItem } from '@/lib/types';

export type KanbanItem = {
  id: string;
  text: string;
  status: 'todo' | 'doing' | 'done';
  initiativeId: string;
  initiativeName: string;
  strategyId: string;
  strategyDescription: string;
  stepKey: string;
  stepTitle: string;
};

export type TeamKanbanProjection = {
  teamId: string;
  teamName: string;
  items: KanbanItem[];
};

/**
 * Get all initiative items for a specific team, formatted for Kanban view
 * Includes items from Draft and Active strategies only
 */
export const getTeamKanbanProjection = async (teamId: string): Promise<TeamKanbanProjection> => {
  const teams = await getTeamsProjection();
  
  const team = teams.find((t: Team) => t.id === teamId);
  if (!team) {
    return {
      teamId,
      teamName: 'Unknown Team',
      items: []
    };
  }

  const items: KanbanItem[] = [];

  // Get team strategies (Draft and Active only)
  const teamStrategies = team.dashboard.strategies?.filter((s: any) =>
    s.state === 'Draft' || s.state === 'Active'
  ) || [];

  // Extract all initiative items from all strategies
  teamStrategies.forEach((strategy: Strategy) => {
    strategy.initiatives.forEach((initiative: Initiative) => {
      initiative.steps.forEach((step) => {
        step.items.forEach((item: InitiativeItem) => {
          items.push({
            id: item.id,
            text: item.text,
            status: item.status || 'todo', // Default to 'todo' if no status
            initiativeId: initiative.id,
            initiativeName: initiative.name,
            strategyId: strategy.id,
            strategyDescription: strategy.description,
            stepKey: step.key,
            stepTitle: step.title
          });
        });
      });
    });
  });

  return {
    teamId: team.id,
    teamName: team.name,
    items
  };
};

export default getTeamKanbanProjection;