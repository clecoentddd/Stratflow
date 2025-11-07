"use client";
import { useEffect, useState } from 'react';
import { getKanbanBoardForTeam } from '../../initiative-kanban-status-mapped-projection/kanbanProjection';
import type { KanbanBoardItem } from '../../initiative-kanban-status-mapped-projection/types';

type KanbanBoardState = {
  ToDo: KanbanBoardItem[];
  Doing: KanbanBoardItem[];
  Done: KanbanBoardItem[];
};

export function useKanbanBoard(teamId: string): KanbanBoardState {
  const [board, setBoard] = useState<KanbanBoardState>({ ToDo: [], Doing: [], Done: [] });

  useEffect(() => {
    const items = getKanbanBoardForTeam(teamId);
    console.log('[KANBAN DEBUG] Items from getKanbanBoardForTeam:', items);
    setBoard({
      ToDo: items.filter((i: KanbanBoardItem) => {
        const match = i.status === 'ToDo';
        if (match) console.log('[KANBAN DEBUG] ToDo item:', i);
        return match;
      }),
      Doing: items.filter((i: KanbanBoardItem) => {
        const match = i.status === 'Doing';
        if (match) console.log('[KANBAN DEBUG] Doing item:', i);
        return match;
      }),
      Done: items.filter((i: KanbanBoardItem) => {
        const match = i.status === 'Done';
        if (match) console.log('[KANBAN DEBUG] Done item:', i);
        return match;
      }),
    });
  }, [teamId]);

  return board;
}
