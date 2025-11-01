import { KanbanPage } from "@/lib/domain/kanban/ui/KanbanPage";
import { queryEligibleInitiatives, getAllTeams } from '@/lib/domain/initiatives-catalog/projection';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Server-side: read projections and pass into the client component as props
  const allInitiatives = queryEligibleInitiatives();
  const teams = getAllTeams();

  // (no debug logs) teams retrieved from the catalog projection are used below

  // Sort teams so that level 0 appears on top, then by level (ascending), then by name
  teams.sort((a: any, b: any) => {
    const aLevel = typeof a.level === 'number' ? a.level : Infinity;
    const bLevel = typeof b.level === 'number' ? b.level : Infinity;
    // level 0 special-case: put at top
    if (aLevel === 0 && bLevel !== 0) return -1;
    if (bLevel === 0 && aLevel !== 0) return 1;
    if (aLevel !== bLevel) return aLevel - bLevel;
    const aName = (a.name || a.id || '').toString();
    const bName = (b.name || b.id || '').toString();
    return aName.localeCompare(bName);
  });

  // (no debug logs) - server will not print debug info here

  // Group initiatives by teamId for easy lookup in the client
  const initiativesByTeam: Record<string, any[]> = {};
  for (const i of allInitiatives) {
    (initiativesByTeam[i.teamId] ||= []).push(i);
  }

  // no debug logs

  return <KanbanPage initialTeams={teams} initialInitiativesByTeam={initiativesByTeam} />;
}
