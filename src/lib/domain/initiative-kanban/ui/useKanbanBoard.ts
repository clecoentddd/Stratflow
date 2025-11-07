"use client";
import { useEffect, useState } from 'react';
import type { KanbanBoardItem } from '../../initiative-kanban-status-mapped-projection/types';

type KanbanBoardState = {
  ToDo: KanbanBoardItem[];
  Doing: KanbanBoardItem[];
  Done: KanbanBoardItem[];
};

type KanbanBoardResult = KanbanBoardState & { loading: boolean };

export function useKanbanBoard(teamId: string): KanbanBoardResult {
  const [board, setBoard] = useState<KanbanBoardState>({ ToDo: [], Doing: [], Done: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[KANBAN UI] ===== STARTING KANBAN BOARD LOAD =====');
    console.log('[KANBAN UI] Team ID:', teamId);
    console.log('[KANBAN UI] 🔄 UI Slice: Calling API endpoint (proper decoupling)');

    const loadBoard = async () => {
      console.log('[KANBAN UI] Setting loading to true');
      setLoading(true);

      try {
        console.log('[KANBAN UI] 📡 Making API call to /api/initiative-kanban-status-mapped-projection/team/', teamId);
        const response = await fetch(`/api/initiative-kanban-status-mapped-projection/team/${teamId}`);

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const items: KanbanBoardItem[] = await response.json();
        console.log('[KANBAN UI] ✅ API call successful, received items:', items);
        console.log('[KANBAN UI] Items array length:', items.length);
        console.log('[KANBAN UI] Items details:', JSON.stringify(items, null, 2));

        console.log('[KANBAN UI] Filtering items by status...');
        const toDoItems = items.filter((i: KanbanBoardItem) => {
          const match = i.status === 'ToDo';
          console.log(`[KANBAN UI] Item ${i.itemId}: status="${i.status}" matches ToDo=${match}`);
          return match;
        });

        const doingItems = items.filter((i: KanbanBoardItem) => {
          const match = i.status === 'Doing';
          console.log(`[KANBAN UI] Item ${i.itemId}: status="${i.status}" matches Doing=${match}`);
          return match;
        });

        const doneItems = items.filter((i: KanbanBoardItem) => {
          const match = i.status === 'Done';
          console.log(`[KANBAN UI] Item ${i.itemId}: status="${i.status}" matches Done=${match}`);
          return match;
        });

        console.log('[KANBAN UI] Filtered results:');
        console.log('[KANBAN UI] - ToDo items:', toDoItems.length);
        console.log('[KANBAN UI] - Doing items:', doingItems.length);
        console.log('[KANBAN UI] - Done items:', doneItems.length);

        const newBoard = {
          ToDo: toDoItems,
          Doing: doingItems,
          Done: doneItems,
        };

        console.log('[KANBAN UI] Setting board state:', newBoard);
        setBoard(newBoard);

        console.log('[KANBAN UI] ✅ Board state updated successfully');
        console.log('[KANBAN UI] 🎯 UI Slice: Successfully loaded data via API (decoupling maintained)');
      } catch (error) {
        console.error('[KANBAN UI] ❌ Error loading kanban board:', error);
        console.error('[KANBAN UI] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('[KANBAN UI] 🚨 UI Slice: API call failed - check projection slice');
      } finally {
        console.log('[KANBAN UI] Setting loading to false');
        setLoading(false);
        console.log('[KANBAN UI] ===== KANBAN BOARD LOAD COMPLETE =====');
      }
    };

    loadBoard();
  }, [teamId]);

  return { ...board, loading };
}
