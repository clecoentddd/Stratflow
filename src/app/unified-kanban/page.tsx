import { InitiativesKanban } from '@/components/kanban/initiatives-kanban';
import { InitiativeItemsKanban } from '@/components/kanban/initiative-items-kanban';
import { queryEligibleInitiatives } from '@/lib/domain/initiatives-catalog/projection';
import { queryInitiativeItems } from '@/lib/domain/initiative-items/api';

export const dynamic = 'force-dynamic';

interface UnifiedKanbanPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UnifiedKanbanPage({ searchParams }: UnifiedKanbanPageProps) {
  const params = await searchParams;
  const type = (params.type as string) || 'items';
  const teamId = params.teamId as string;

  let initialData: any[] = [];

  if (type === 'initiatives') {
    initialData = queryEligibleInitiatives();
  } else {
    initialData = await queryInitiativeItems();
    if (teamId) {
      initialData = initialData.filter(item => item.teamId === teamId);
    }
  }

  return (
    <div className="unified-kanban-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Unified Kanban Board</h1>

        <div className="flex gap-4 mb-4">
          <a
            href="/unified-kanban?type=items"
            className={`px-4 py-2 rounded ${type === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Initiative Items
          </a>
          <a
            href="/unified-kanban?type=initiatives"
            className={`px-4 py-2 rounded ${type === 'initiatives' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Initiatives
          </a>
        </div>

        {teamId && (
          <p className="text-sm text-gray-600">Filtered by team: {teamId}</p>
        )}
      </div>

      <div className="kanban-container">
        {type === 'initiatives' ? (
          <InitiativesKanban initialData={initialData} teamId={teamId} />
        ) : (
          <InitiativeItemsKanban initialData={initialData} teamId={teamId} />
        )}
      </div>
    </div>
  );
}