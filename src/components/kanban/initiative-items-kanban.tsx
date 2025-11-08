'use client';

import React, { useState, useEffect } from 'react';
import { KanbanBoard } from '@/lib/domain/unified-kanban/ui';
import type { KanbanBoardData } from '@/lib/domain/unified-kanban/types';

interface InitiativeItemsKanbanProps {
  initialData?: any[];
  teamId?: string;
}

export function InitiativeItemsKanban({ initialData = [], teamId }: InitiativeItemsKanbanProps) {
  const [data, setData] = useState<KanbanBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'initiative-item',
        ...(teamId && { boardId: teamId }),
      });
      const response = await fetch(`/api/kanban/data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch kanban data');
      const kanbanData = await response.json();
      setData(kanbanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveElement = async (elementId: string, fromStatus: string, toStatus: string) => {
    // For now, just update local state without API call, like the existing /kanban
    if (data) {
      const updatedElements = data.elements.map(el =>
        el.id === elementId ? { ...el, status: toStatus } : el
      );
      setData({ ...data, elements: updatedElements });
    }
  };

  useEffect(() => {
    if (initialData.length > 0) {
      // Transform initialData to KanbanBoardData format
      const elements = initialData.map(item => ({
        id: item.id,
        title: item.text || item.id,
        description: '',
        status: item.status || 'todo',
        type: 'initiative-item' as const,
        metadata: {
          teamId: item.teamId,
          initiativeId: item.initiativeId,
          strategyId: item.strategyId,
          stepKey: item.stepKey,
          itemId: item.id,
        },
        tags: [],
      }));
      const columns = [
        { id: 'todo', title: 'TODO', status: 'todo', description: '' },
        { id: 'doing', title: 'DOING', status: 'doing', description: '' },
        { id: 'done', title: 'DONE', status: 'done', description: '' },
      ];
      setData({ columns, elements });
      setLoading(false);
    } else {
      fetchData();
    }
  }, [initialData, teamId]);

  if (loading) {
    return <div className="kanban-loading">Loading kanban...</div>;
  }

  if (error) {
    return <div className="kanban-error">Error: {error}</div>;
  }

  if (!data) {
    return <div className="kanban-empty">No data available</div>;
  }

  return (
    <div className="initiative-items-kanban">
      <h2>Initiative Items Kanban {teamId && `(Team: ${teamId})`}</h2>
      <KanbanBoard
        data={data}
        onMoveElement={handleMoveElement}
        className="initiative-items-kanban-board"
      />
    </div>
  );
}