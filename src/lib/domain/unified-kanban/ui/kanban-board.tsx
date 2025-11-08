"use client";

import React, { useCallback } from 'react';
import type { KanbanBoardData, EnrichedKanbanElement, KanbanColumnDefinition } from '../types';
import { startDrag, setDragOverColumn, endDrag, getDragState } from '../drag-state';
import styles from './kanban-board.module.css';


export function KanbanBoard({ data, onMoveElement, className = '' }: {
  data: KanbanBoardData;
  onMoveElement: (elementId: string, fromStatus: string, toStatus: string, elementType?: string) => Promise<void>;
  className?: string;
}) {
  const handleDragStart = useCallback((element: EnrichedKanbanElement) => {
    startDrag(element);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    setDragOverColumn(columnStatus);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();

    const dragState = getDragState();
    const { draggedElement } = dragState;
    if (!draggedElement || draggedElement.status === toStatus) {
      endDrag();
      return;
    }

    console.log('[KANBAN UI] Card move initiated:', {
      elementId: draggedElement.id,
      fromStatus: draggedElement.status,
      toStatus,
      elementType: draggedElement.type
    });

    try {
      await onMoveElement(draggedElement.id, draggedElement.status, toStatus, draggedElement.type);
      console.log('[KANBAN UI] Card move API call completed:', {
        elementId: draggedElement.id,
        fromStatus: draggedElement.status,
        toStatus,
        elementType: draggedElement.type
      });
    } catch (error) {
      console.error('[KANBAN UI] Failed to move element:', error);
    }

    endDrag();
  }, [onMoveElement]);

  const getElementsForColumn = useCallback((status: string) => {
    return data.elements.filter((element: EnrichedKanbanElement) => element.status === status);
  }, [data.elements]);

  const dragState = getDragState();

  return (
    <div className={`${styles.kanbanBoard} ${className}`}>
      <div className={styles.columns}>
        {data.columns.map((column: KanbanColumnDefinition) => (
          <KanbanColumn
            key={column.id}
            column={column}
            elements={getElementsForColumn(column.status)}
            isDragOver={dragState.dragOverColumn === column.status}
            onDragStart={handleDragStart}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          />
        ))}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: KanbanColumnDefinition;
  elements: EnrichedKanbanElement[];
  isDragOver: boolean;
  onDragStart: (element: EnrichedKanbanElement) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function KanbanColumn({
  column,
  elements,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}: KanbanColumnProps) {
  return (
    <div
      className={`${styles.column} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>
          {column.title}
          <span className={styles.columnCount}>({elements.length})</span>
        </h3>
        {column.description && (
          <p className={styles.columnDescription}>{column.description}</p>
        )}
      </div>

      <div className={styles.columnContent}>
        {elements.length === 0 ? (
          <div className={styles.emptyColumn}>
            No items
          </div>
        ) : (
          elements.map(element => (
            <KanbanElement
              key={element.id}
              element={element}
              onDragStart={() => onDragStart(element)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanElementProps {
  element: EnrichedKanbanElement;
  onDragStart: () => void;
}

export function KanbanElement({ element, onDragStart }: KanbanElementProps) {
  return (
    <div
      className={styles.element}
      draggable
      onDragStart={onDragStart}
    >
      <div className={styles.elementContent}>
        <div className={styles.elementTitle}>{element.title}</div>
        {element.description && (
          <div className={styles.elementDescription}>{element.description}</div>
        )}
        {element.tags && element.tags.length > 0 && (
          <div className={styles.elementTags}>
            {element.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
        <div className={styles.elementType}>{element.type}</div>
      </div>
    </div>
  );
}