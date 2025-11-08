"use client";
import { KanbanBoard } from '@/lib/domain/unified-kanban/ui/kanban-board';
import React, { useState } from 'react';

export const dynamic = 'force-dynamic';

interface UnifiedKanbanPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function UnifiedKanbanPage({ searchParams }: UnifiedKanbanPageProps) {
  const [boardData, setBoardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeType, setActiveType] = useState<string>('items');
  React.useEffect(() => {
    async function fetchBoard() {
      setLoading(true);
      setError(null);
      try {
        const params = await searchParams;
        const type = (params.type as string) || 'items';
        setActiveType(type);
        const teamId = params.teamId as string;
        const apiUrl = `/api/kanban/data?type=${type}${teamId ? `&boardId=${teamId}` : ''}`;
        const res = await fetch(apiUrl, { cache: 'no-store' });
        const data = await res.json();
        setBoardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchBoard();
  }, [searchParams]);

  // Move handler: POST to move API and refresh board
  const handleMoveElement = async (elementId: string, fromStatus: string, toStatus: string, elementType?: string) => {
    try {
      await fetch('/api/kanban/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementId, fromStatus, toStatus, elementType }),
      });
      // Refresh board after move
      setLoading(true);
      const params = await searchParams;
      const type = (params.type as string) || 'items';
      const teamId = params.teamId as string;
      const apiUrl = `/api/kanban/data?type=${type}${teamId ? `&boardId=${teamId}` : ''}`;
      const res = await fetch(apiUrl, { cache: 'no-store' });
      const data = await res.json();
      setBoardData(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to move element');
    }
  };

  return (
    <div className="unified-kanban-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Unified Kanban Board</h1>
        <div className="flex gap-4 mb-4">
          <a
            href="/unified-kanban?type=items"
            className={`px-4 py-2 rounded ${activeType !== 'initiatives' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Initiative Items
          </a>
          <a
            href="/unified-kanban?type=initiatives"
            className={`px-4 py-2 rounded ${activeType === 'initiatives' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Initiatives
          </a>
        </div>
      </div>
      <div className="kanban-container">
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {boardData && (
          <>
            {console.log('[KANBAN DEBUG] boardData:', boardData)}
            <KanbanBoard
              data={boardData}
              onMoveElement={(elementId, fromStatus, toStatus) => {
                // Find the element in boardData.elements to get its type
                const element = boardData?.elements?.find((el: any) => el.id === elementId);
                const elementType = element?.type;
                return handleMoveElement(elementId, fromStatus, toStatus, elementType);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
