import React from 'react';
import { KanbanCard } from './KanbanCard';
import styles from './kanban.module.css';

interface KanbanColumnProps {
  title: string;
  status: 'ToDo' | 'Doing' | 'Done';
  items: { id: string; title: string; initiativeName: string; itemId: string; initiativeId: string }[];
  onCardDrop?: (itemId: string, initiativeId: string, status: 'ToDo' | 'Doing' | 'Done') => void;
}

export function KanbanColumn({ title, status, items, onCardDrop }: KanbanColumnProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    const initiativeId = e.dataTransfer.getData('initiativeId');
    if (itemId && initiativeId && onCardDrop) {
      onCardDrop(itemId, initiativeId, status);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  return (
    <div className={styles.kanbanColumn} onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className={styles.kanbanColumnHeader}>{title}</div>
      {items.map(item => (
        <KanbanCard
          key={item.id}
          title={item.title}
          initiativeName={item.initiativeName}
          itemId={item.itemId}
          initiativeId={item.initiativeId}
          onDragStart={(e, dragItemId, dragInitiativeId) => {
            e.dataTransfer.setData('itemId', dragItemId);
            e.dataTransfer.setData('initiativeId', dragInitiativeId);
          }}
        />
      ))}
    </div>
  );
}
