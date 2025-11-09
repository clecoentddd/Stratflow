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

  // Group teams by level
  const teamsByLevel: Record<number, { teamId: string; teamName: string; elements: EnrichedKanbanElement[] }[]> = {};
  for (const element of data.elements) {
    const teamId = element.metadata?.teamId || 'unknown';
    const teamName = element.metadata?.teamName || 'Unknown Team';
    const teamLevel = element.metadata?.teamLevel ?? 0;
    if (!teamsByLevel[teamLevel]) teamsByLevel[teamLevel] = [];
    let team = teamsByLevel[teamLevel].find(t => t.teamId === teamId);
    if (!team) {
      team = { teamId, teamName, elements: [] };
      teamsByLevel[teamLevel].push(team);
    }
    team.elements.push(element);
  }
  const sortedLevels = Object.keys(teamsByLevel).map(Number).sort((a, b) => a - b);
  const dragState = getDragState();



  // Set CSS variable for column count
  const columnCount = data.columns.length;
  return (
    <div className={`${styles.kanbanBoard} ${className}`}
      style={{ ['--kanban-column-count' as any]: columnCount }}>
      {/* Fixed column headers */}
      <div className={styles.columns} style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fff' }}>
        {data.columns.map((column: KanbanColumnDefinition) => (
          <div key={column.id} className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>{column.title}</h3>
            {column.description && <p className={styles.columnDescription}>{column.description}</p>}
          </div>
        ))}
      </div>
      {/* Grouped by level */}
      <div>
        {sortedLevels.map(level => (
          <div key={level} style={{ marginBottom: 40 }}>
            <div style={{ fontWeight: 700, fontSize: 20, margin: '24px 0 12px 0', color: '#3b82f6', letterSpacing: 1 }}>
              Level {level}
            </div>
            {teamsByLevel[level]
              .sort((a, b) => a.teamName.localeCompare(b.teamName))
              .map(team => (
                <div key={team.teamId} className={styles.swimlane} style={{ marginBottom: 16, borderLeft: '4px solid #3b82f6', borderRadius: 6, background: '#f9fafb' }}>
                  <div className={styles.swimlaneHeaderRow} style={{ fontWeight: 600, fontSize: 16, color: '#0f172a', background: '#e0e7ef', padding: '6px 0 6px 12px', borderRadius: '6px 6px 0 0' }}>
                    {team.teamName}
                  </div>
                  <div className={styles.columns}>
                    {data.columns.map((column: KanbanColumnDefinition) => (
                      <KanbanColumn
                        key={column.id}
                        column={column}
                        elements={team.elements.filter(e => e.status === column.status)}
                        isDragOver={dragState.dragOverColumn === column.status}
                        onDragStart={handleDragStart}
                        onDragOver={(e) => handleDragOver(e, column.status)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.status)}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
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
      <div className={styles.columnCount} style={{ textAlign: 'right', fontSize: 12, color: '#888', marginBottom: 4 }}>
        {elements.length > 0 ? `${elements.length} item${elements.length > 1 ? 's' : ''}` : ''}
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