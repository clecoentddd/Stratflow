import React from 'react';
import styles from './kanban.module.css';

interface KanbanCardProps {
  title: string;
  initiativeName: string;
  itemId: string;
  initiativeId: string;
  onDragStart?: (e: React.DragEvent, itemId: string, initiativeId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function KanbanCard({ title, initiativeName, itemId, initiativeId, onDragStart, onDragEnd }: KanbanCardProps) {
  return (
    <div
      className={styles.kanbanCard}
      draggable
      onDragStart={e => onDragStart && onDragStart(e, itemId, initiativeId)}
      onDragEnd={onDragEnd}
    >
      <div className={styles.kanbanCardTitle}>{title}</div>
      <div className={styles.kanbanCardInitiative}>{initiativeName}</div>
    </div>
  );
}
