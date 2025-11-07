import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import styles from './kanban.module.css';
import { useKanbanBoard } from './useKanbanBoard';
import type { KanbanBoardItem } from '../../initiative-kanban-status-mapped-projection/types';

export function KanbanBoard({ teamId }: { teamId: string }) {
  const board = useKanbanBoard(teamId);
  // Map KanbanBoardItem to KanbanColumn item shape
  const mapItem = (item: KanbanBoardItem) => ({
    id: item.itemId,
    title: item.text || item.name,
    initiativeName: item.name,
    itemId: item.itemId,
    initiativeId: item.initiativeId,
  });
  return (
    <div className={styles.kanbanBoard}>
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
