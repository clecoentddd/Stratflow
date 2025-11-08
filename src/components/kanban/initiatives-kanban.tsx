'use client';

import React, { useState, useEffect } from 'react';
import { KanbanBoard } from '@/lib/domain/unified-kanban/ui';
import type { KanbanBoardData } from '@/lib/domain/unified-kanban/types';

interface InitiativesKanbanProps {
  initialData?: any[];
  teamId?: string;
}

export function InitiativesKanban({ initialData = [], teamId }: InitiativesKanbanProps) {
  const [data, setData] = useState<KanbanBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'initiatives',
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
        title: item.name || item.id,
        description: item.description || '',
        status: item.status || 'NEW',
        type: 'initiative' as const,
        metadata: {
          teamId: item.teamId,
          teamName: item.teamName,
          strategyId: item.strategyId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
        tags: item.strategyName ? [item.strategyName] : [],
      }));
      const columns = [
        { id: 'NEW', title: 'NEW', status: 'NEW', description: '' },
        { id: 'STRATEGIC_THINKING', title: 'STRATEGIC THINKING', status: 'STRATEGIC_THINKING', description: '' },
        { id: 'DECISIVENESS', title: 'DECISIVENESS', status: 'DECISIVENESS', description: '' },
        { id: 'IMPLEMENTING', title: 'IMPLEMENTING', status: 'IMPLEMENTING', description: '' },
        { id: 'CLOSED', title: 'CLOSED', status: 'CLOSED', description: '' },
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
    <div className="initiatives-kanban">
      <h2>Initiatives Kanban {teamId && `(Team: ${teamId})`}</h2>
      <KanbanBoard
        data={data}
        onMoveElement={handleMoveElement}
        className="initiatives-kanban-board"
      />
    </div>
  );
}