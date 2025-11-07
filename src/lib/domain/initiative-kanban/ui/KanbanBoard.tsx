import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import styles from './kanban.module.css';
import { useKanbanBoard } from './useKanbanBoard';
import type { KanbanBoardItem } from '../../initiative-kanban-status-mapped-projection/types';

export function KanbanBoard({ teamId }: { teamId: string }) {
  console.log('[KANBAN BOARD] 🎨 UI Slice: KanbanBoard component rendered for teamId:', teamId);
  console.log('[KANBAN BOARD] 🔗 UI Slice: Component only knows about teamId, delegates data fetching to useKanbanBoard hook');

  const board = useKanbanBoard(teamId);
  console.log('[KANBAN BOARD] 📊 UI Slice: useKanbanBoard returned:', {
    hasToDo: !!board.ToDo,
    hasDoing: !!board.Doing,
    hasDone: !!board.Done,
    loading: board.loading,
    ToDoCount: board.ToDo?.length || 0,
    DoingCount: board.Doing?.length || 0,
    DoneCount: board.Done?.length || 0
  });

  // Map KanbanBoardItem to KanbanColumn item shape
  const mapItem = (item: KanbanBoardItem) => ({
    id: item.itemId,
    title: item.text || item.name,
    initiativeName: item.name,
    itemId: item.itemId,
    initiativeId: item.initiativeId,
  });

  if (board.loading) {
    console.log('[KANBAN BOARD] ⏳ UI Slice: Showing loading state while API call completes');
    return (
      <div className={styles.kanbanBoard}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Loading kanban board...
        </div>
      </div>
    );
  }

  console.log('[KANBAN BOARD] ✅ UI Slice: Rendering kanban board with data from API');
  return (
    <div className={styles.kanbanBoard}>
      <div style={{ marginBottom: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Items: ToDo ({board.ToDo.length}) | Doing ({board.Doing.length}) | Done ({board.Done.length})
        </div>
        <a
          href="http://localhost:9002/monitoring?view=kanban"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            border: '1px solid #3b82f6',
            borderRadius: '0.375rem',
            backgroundColor: 'transparent',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          View All Teams Kanban →
        </a>
      </div>
      <KanbanColumn
        title="To Do"
        status="ToDo"
        items={board.ToDo.map(mapItem)}
      />
      <KanbanColumn
        title="Doing"
        status="Doing"
        items={board.Doing.map(mapItem)}
      />
      <KanbanColumn
        title="Done"
        status="Done"
        items={board.Done.map(mapItem)}
      />
    </div>
  );
}
