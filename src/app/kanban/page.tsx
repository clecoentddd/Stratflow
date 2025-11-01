import { KanbanPage } from "@/lib/domain/kanban/ui/KanbanPage";
import { queryEligibleInitiatives, getAllTeams } from '@/lib/domain/initiatives-catalog/projection';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Server-side: read projections and pass into the client component as props
  const allInitiatives = queryEligibleInitiatives();
  const teams = getAllTeams();

  // Server-side diagnostic log — helps confirm that projections were read
  try {
    console.log(`Server Kanban: read ${allInitiatives.length} initiatives and ${teams.length} teams`);
    console.log('Server Kanban: sample initiative ids=', allInitiatives.slice(0,5).map(i => i.id));
  } catch (e) {
    // ignore logging failures in environments that don't support console
  }

  // Group initiatives by teamId for easy lookup in the client
  const initiativesByTeam: Record<string, any[]> = {};
  for (const i of allInitiatives) {
    (initiativesByTeam[i.teamId] ||= []).push(i);
  }

  return <KanbanPage initialTeams={teams} initialInitiativesByTeam={initiativesByTeam} />;
}
